// Image Compressor — the only tool this rewrite touches. Fully client-side:
// every file is decoded and re-encoded inside imageCompressWorker.js (a Web
// Worker running jSquash's codecs, see that file's header comment), so no
// image ever leaves this tab. No fetch/XHR call in this file sends image
// bytes, a filename, or any derived metadata anywhere.
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle, Check, Download, ImageOff, Loader2, RefreshCw, Trash2, UploadCloud,
} from "lucide-react";
import { formatBytes } from "../../lib/browserTools";
import { compressImage } from "../../lib/imageCompressor/client";
import "./ImageCompressorWorkspace.css";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_EXT = /\.(jpe?g|png|webp)$/i;
const MAX_FILE_BYTES = 30 * 1024 * 1024; // 30 MB per file
const MAX_MEGAPIXELS = 40_000_000; // guards against multi-GB canvas allocations
const QUALITY_DEBOUNCE_MS = 350;

function sourceFormatFor(file) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpeg"; // jpg/jpeg, and anything else that slipped past validation
}

function extensionFor(mimeType) {
  return mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
}

let uid = 0;
function nextId() { return `img-${++uid}`; }

export function ImageCompressorWorkspace() {
  const [entries, setEntries] = useState([]);
  const [outputFormat, setOutputFormat] = useState("auto");
  const [quality, setQuality] = useState(75);
  const dropzoneInputRef = useRef(null);
  const addMoreInputRef = useRef(null);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const qualityTimerRef = useRef(null);

  // Object URLs (preview + compressed result) only ever live as long as the
  // entry that owns them. Revoke on removal and, as a final sweep, on
  // unmount — nothing here is retained past the point it's needed.
  useEffect(() => () => {
    for (const entry of entriesRef.current) {
      URL.revokeObjectURL(entry.previewUrl);
      if (entry.result) URL.revokeObjectURL(entry.result.url);
    }
  }, []);

  async function runCompression(entry, format, q) {
    setEntries((current) => current.map((item) => (item.id === entry.id ? { ...item, status: "processing", error: "" } : item)));
    try {
      const { blob, mimeType, width, height } = await compressImage(entry.file, { outputFormat: format, quality: q });
      const url = URL.createObjectURL(blob);
      setEntries((current) => current.map((item) => {
        if (item.id !== entry.id) return item;
        if (item.result) URL.revokeObjectURL(item.result.url);
        return {
          ...item,
          status: "done",
          error: "",
          result: { url, size: blob.size, mimeType, width, height },
        };
      }));
    } catch (error) {
      setEntries((current) => current.map((item) => (item.id === entry.id
        ? { ...item, status: "error", error: error?.message || "This image could not be compressed." }
        : item)));
    }
  }

  function validateFile(file) {
    if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXT.test(file.name)) {
      return "Only JPEG, PNG, and WebP images are supported.";
    }
    if (file.size > MAX_FILE_BYTES) {
      return `Files over ${formatBytes(MAX_FILE_BYTES)} aren't supported yet.`;
    }
    return "";
  }

  function addFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const newEntries = [];
    for (const file of files) {
      const validationError = validateFile(file);
      const previewUrl = URL.createObjectURL(file);
      const entry = {
        id: nextId(),
        file,
        previewUrl,
        width: 0,
        height: 0,
        status: validationError ? "error" : "queued",
        error: validationError,
        result: null,
      };
      newEntries.push(entry);

      if (!validationError) {
        const probe = new window.Image();
        probe.onload = () => {
          if (probe.naturalWidth * probe.naturalHeight > MAX_MEGAPIXELS) {
            setEntries((current) => current.map((item) => (item.id === entry.id
              ? { ...item, status: "error", error: "This image's resolution is too high to process in-browser." }
              : item)));
            return;
          }
          setEntries((current) => current.map((item) => (item.id === entry.id
            ? { ...item, width: probe.naturalWidth, height: probe.naturalHeight }
            : item)));
        };
        probe.src = previewUrl;
      }
    }

    setEntries((current) => [...current, ...newEntries]);

    // Kick off compression with the current global defaults. Each file's
    // failure is isolated inside runCompression/catch — one bad file never
    // stops the rest of the batch.
    for (const entry of newEntries) {
      if (entry.status === "queued") {
        runCompression(entry, outputFormat === "auto" ? sourceFormatFor(entry.file) : outputFormat, quality);
      }
    }
  }

  function removeEntry(id) {
    setEntries((current) => {
      const target = current.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        if (target.result) URL.revokeObjectURL(target.result.url);
      }
      return current.filter((item) => item.id !== id);
    });
  }

  function resetAll() {
    for (const entry of entries) {
      URL.revokeObjectURL(entry.previewUrl);
      if (entry.result) URL.revokeObjectURL(entry.result.url);
    }
    setEntries([]);
    if (dropzoneInputRef.current) dropzoneInputRef.current.value = "";
    if (addMoreInputRef.current) addMoreInputRef.current.value = "";
  }

  function recompressAll(nextFormat = outputFormat, nextQuality = quality) {
    for (const entry of entriesRef.current) {
      if (validateFile(entry.file)) continue; // invalid entries (bad type/too large) stay put
      const format = nextFormat === "auto" ? sourceFormatFor(entry.file) : nextFormat;
      runCompression(entry, format, nextQuality);
    }
  }

  function handleFormatChange(next) {
    setOutputFormat(next);
    recompressAll(next, quality);
  }

  function handleQualityChange(next) {
    setQuality(next);
    if (qualityTimerRef.current) window.clearTimeout(qualityTimerRef.current);
    qualityTimerRef.current = window.setTimeout(() => recompressAll(outputFormat, next), QUALITY_DEBOUNCE_MS);
  }

  function downloadEntry(entry) {
    if (!entry.result) return;
    const ext = extensionFor(entry.result.mimeType);
    const base = entry.file.name.replace(/\.[^.]+$/, "");
    const link = document.createElement("a");
    link.href = entry.result.url;
    link.download = `${base}-compressed.${ext}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function downloadAll() {
    const ready = entries.filter((entry) => entry.status === "done" && entry.result);
    ready.forEach((entry, index) => {
      window.setTimeout(() => downloadEntry(entry), index * 220);
    });
  }

  const doneCount = entries.filter((entry) => entry.status === "done").length;
  const showQualityControl = outputFormat !== "png";
  const isEmpty = entries.length === 0;

  return (
    <div className="okr__image-tool okr__compressor">
      {isEmpty ? (
        <label
          className="okr__tool-dropzone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files); }}
        >
          <input
            ref={dropzoneInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            multiple
            onChange={(event) => addFiles(event.target.files)}
          />
          <span className="okr__tool-drop-icon"><UploadCloud size={32} /></span>
          <strong>Choose JPEG, PNG, or WebP images</strong>
          <span>or drag and drop them here — you can select more than one</span>
          <small>Up to 30 MB each · processed on this device, never uploaded</small>
        </label>
      ) : (
        <div className="okr__compressor-body">
          <div className="okr__compressor-settings">
            <label className="okr__field okr__compressor-format">
              <span className="okr__label">Output format</span>
              <select className="okr__input" value={outputFormat} onChange={(event) => handleFormatChange(event.target.value)}>
                <option value="auto">Keep original format</option>
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </label>
            {showQualityControl && (
              <label className="okr__field okr__range-field okr__compressor-quality">
                <span className="okr__label">Quality<strong>{quality}%</strong></span>
                <input
                  type="range"
                  min={30}
                  max={95}
                  value={quality}
                  onChange={(event) => handleQualityChange(Number(event.target.value))}
                />
              </label>
            )}
            {!showQualityControl && (
              <p className="okr__compressor-hint">PNG output is lossless — quality doesn't apply, but file size is still optimized.</p>
            )}
          </div>

          <ul className="okr__compressor-list">
            {entries.map((entry) => (
              <CompressorRow key={entry.id} entry={entry} onDownload={() => downloadEntry(entry)} onRemove={() => removeEntry(entry.id)} />
            ))}
          </ul>

          <div className="okr__tool-actions">
            <label className="okr__btn okr__btn--ghost">
              <input
                ref={addMoreInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                multiple
                onChange={(event) => addFiles(event.target.files)}
                style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
              />
              <UploadCloud size={17} /> Add more images
            </label>
            {doneCount > 1 && (
              <button className="okr__btn okr__btn--ghost" onClick={downloadAll}>
                <Download size={17} /> Download all ({doneCount})
              </button>
            )}
            <button className="okr__btn okr__btn--ghost" onClick={resetAll}>
              <RefreshCw size={17} /> Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CompressorRow({ entry, onDownload, onRemove }) {
  const { file, previewUrl, width, height, status, error, result } = entry;
  const savedPercent = result && file.size > 0
    ? Math.max(0, Math.round((1 - result.size / file.size) * 100))
    : null;

  return (
    <li className="okr__compressor-row" data-status={status}>
      <div className="okr__compressor-thumb">
        {status === "error"
          ? <ImageOff size={22} aria-hidden="true" />
          : <img src={previewUrl} alt="" />}
      </div>

      <div className="okr__compressor-info">
        <p className="okr__compressor-name" title={file.name}>{file.name}</p>
        <p className="okr__compressor-meta">
          {formatBytes(file.size)}{width > 0 && ` · ${width} × ${height}px`}
        </p>

        {status === "processing" && (
          <p className="okr__compressor-status okr__compressor-status--busy">
            <Loader2 className="is-spinning" size={15} /> Compressing…
          </p>
        )}

        {status === "error" && (
          <p className="okr__compressor-status okr__compressor-status--error" role="alert">
            <AlertTriangle size={15} /> {error}
          </p>
        )}

        {status === "done" && result && (
          <div className="okr__compressor-result">
            <p className="okr__compressor-status okr__compressor-status--done">
              <Check size={15} /> {formatBytes(result.size)}
              {savedPercent !== null && (
                <span className="okr__compressor-savings">
                  {savedPercent > 0 ? `−${savedPercent}%` : "no smaller"}
                </span>
              )}
            </p>
            {savedPercent !== null && savedPercent > 0 && (
              <div className="okr__compressor-bar" aria-hidden="true">
                <span className="okr__compressor-bar-before" />
                <span className="okr__compressor-bar-after" style={{ width: `${100 - savedPercent}%` }} />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="okr__compressor-row-actions">
        {status === "done" && result && (
          <button className="okr__btn okr__btn--primary" onClick={onDownload}>
            <Download size={16} /> Download
          </button>
        )}
        <button className="okr__compressor-remove" onClick={onRemove} aria-label={`Remove ${file.name}`}>
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  );
}
