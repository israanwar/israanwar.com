// Image Resizer — isolated workspace for the image-resizer slug only.
// Nothing here is imported by, or imports from, ImageCompressorWorkspace.jsx
// or its worker/client — the two tools are independent siblings.
// Fully client-side: see imageResizeWorker.js's header for the privacy
// note (identical guarantee as the Compressor, verified the same way).
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle, Check, Download, ImageOff, Loader2, RefreshCw, Trash2, UploadCloud,
} from "lucide-react";
import { formatBytes } from "../../lib/browserTools";
import { resizeImage } from "../../lib/imageResizer/client";
import {
  computeDimensions, computeHeightDriven, computeFitWithin, computePercentage, applyPreventUpscale,
} from "../../lib/imageResizer/dimensions";
import "./ImageResizerWorkspace.css";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_EXT = /\.(jpe?g|png|webp)$/i;
const MAX_FILE_BYTES = 30 * 1024 * 1024;
const MAX_MEGAPIXELS = 40_000_000;
const PERCENT_PRESETS = [25, 50, 75];

function sourceFormatFor(file) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpeg";
}

function extensionFor(mimeType) {
  return mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
}

let uid = 0;
function nextId() { return `rsz-${++uid}`; }

export function ImageResizerWorkspace() {
  const [entries, setEntries] = useState([]);
  const [mode, setMode] = useState("dimensions");
  const [dimWidth, setDimWidth] = useState(1920);
  const [dimHeight, setDimHeight] = useState(1080);
  const [lockRatio, setLockRatio] = useState(true);
  const [percent, setPercent] = useState(50);
  const [percentInput, setPercentInput] = useState("50");
  const [fitWidth, setFitWidth] = useState(1920);
  const [fitHeight, setFitHeight] = useState(1080);
  const [preventUpscale, setPreventUpscale] = useState(true);
  const [outputFormat, setOutputFormat] = useState("auto");
  const [quality, setQuality] = useState(82);

  const dropzoneInputRef = useRef(null);
  const addMoreInputRef = useRef(null);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const debounceRef = useRef(null);
  // recomputeAll is recreated every render and closes over that render's
  // mode/percent/dimensions state. Without this indirection, a timeout
  // scheduled inside a click/change handler (below) would still be holding
  // the closure from BEFORE that same handler's setState calls took
  // effect — i.e. every debounced recompute would run one interaction
  // behind the control the user just touched. Mirrors the entriesRef
  // pattern above: keep a ref pointing at the latest recomputeAll and have
  // the timeout call through it, so it always runs with current state.
  const recomputeAllRef = useRef(null);

  useEffect(() => () => {
    for (const entry of entriesRef.current) {
      URL.revokeObjectURL(entry.previewUrl);
      if (entry.result) URL.revokeObjectURL(entry.result.url);
    }
  }, []);

  function targetFor(entry) {
    const sw = entry.sourceWidth;
    const sh = entry.sourceHeight;
    if (!sw || !sh) return null;
    let raw;
    if (mode === "percentage") {
      raw = computePercentage(sw, sh, percent);
      if (!raw) return null;
    } else if (mode === "fitwithin") {
      raw = computeFitWithin(sw, sh, Math.max(1, fitWidth), Math.max(1, fitHeight), !preventUpscale);
      return { ...raw, clamped: false }; // fit-within already respects the toggle internally
    } else {
      raw = computeDimensions(sw, sh, dimWidth, dimHeight, lockRatio);
    }
    return applyPreventUpscale(sw, sh, raw.width, raw.height, preventUpscale);
  }

  async function runResize(entry) {
    const target = targetFor(entry);
    if (!target) return;
    setEntries((current) => current.map((item) => (item.id === entry.id
      ? { ...item, status: "processing", error: "", target }
      : item)));
    try {
      const format = outputFormat === "auto" ? sourceFormatFor(entry.file) : outputFormat;
      const { blob, mimeType, width, height } = await resizeImage(entry.file, {
        targetWidth: target.width,
        targetHeight: target.height,
        outputFormat: format,
        quality,
      });
      const url = URL.createObjectURL(blob);
      setEntries((current) => current.map((item) => {
        if (item.id !== entry.id) return item;
        if (item.result) URL.revokeObjectURL(item.result.url);
        return { ...item, status: "done", error: "", target, result: { url, size: blob.size, mimeType, width, height } };
      }));
    } catch (error) {
      setEntries((current) => current.map((item) => (item.id === entry.id
        ? { ...item, status: "error", error: error?.message || "This image could not be resized.", target }
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
        sourceWidth: 0,
        sourceHeight: 0,
        status: validationError ? "error" : "measuring",
        error: validationError,
        target: null,
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
            ? { ...item, sourceWidth: probe.naturalWidth, sourceHeight: probe.naturalHeight, status: "queued" }
            : item)));
          runResize({ ...entry, sourceWidth: probe.naturalWidth, sourceHeight: probe.naturalHeight });
        };
        probe.onerror = () => {
          setEntries((current) => current.map((item) => (item.id === entry.id
            ? { ...item, status: "error", error: "The source image could not be decoded." }
            : item)));
        };
        probe.src = previewUrl;
      }
    }

    setEntries((current) => [...current, ...newEntries]);
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

  function recomputeAll() {
    for (const entry of entriesRef.current) {
      if (validateFile(entry.file)) continue;
      if (!entry.sourceWidth || !entry.sourceHeight) continue; // still measuring
      runResize(entry);
    }
  }
  recomputeAllRef.current = recomputeAll;

  function scheduleRecompute() {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => recomputeAllRef.current(), 350);
  }

  function onDimWidthChange(value) {
    const width = Math.max(1, Math.round(Number(value) || 1));
    setDimWidth(width);
    if (lockRatio) {
      const first = entriesRef.current.find((e) => e.sourceWidth);
      if (first) setDimHeight(computeDimensions(first.sourceWidth, first.sourceHeight, width, dimHeight, true).height);
    }
    scheduleRecompute();
  }

  function onDimHeightChange(value) {
    const height = Math.max(1, Math.round(Number(value) || 1));
    setDimHeight(height);
    if (lockRatio) {
      const first = entriesRef.current.find((e) => e.sourceWidth);
      if (first) setDimWidth(computeHeightDriven(first.sourceWidth, first.sourceHeight, height).width);
    }
    scheduleRecompute();
  }

  function onPercentChange(nextValue) {
    setPercentInput(nextValue);
    const parsed = Number(nextValue);
    if (Number.isFinite(parsed) && parsed > 0) {
      setPercent(parsed);
      scheduleRecompute();
    }
  }

  function downloadEntry(entry) {
    if (!entry.result) return;
    const ext = extensionFor(entry.result.mimeType);
    const base = entry.file.name.replace(/\.[^.]+$/, "");
    const link = document.createElement("a");
    link.href = entry.result.url;
    link.download = `${base}-resized.${ext}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function downloadAll() {
    const ready = entries.filter((entry) => entry.status === "done" && entry.result);
    ready.forEach((entry, index) => window.setTimeout(() => downloadEntry(entry), index * 220));
  }

  const doneCount = entries.filter((entry) => entry.status === "done").length;
  const showQualityControl = outputFormat !== "png";
  const isEmpty = entries.length === 0;
  const percentInvalid = !(Number(percentInput) > 0);

  return (
    <div className="okr__image-tool okr__resizer">
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
        <div className="okr__resizer-body">
          <div className="okr__resizer-modes" role="tablist" aria-label="Resize mode">
            {[["dimensions", "Dimensions"], ["percentage", "Percentage"], ["fitwithin", "Fit within"]].map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={mode === key}
                className={mode === key ? "is-active" : ""}
                onClick={() => { setMode(key); window.setTimeout(() => recomputeAllRef.current(), 0); }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="okr__resizer-settings">
            {mode === "dimensions" && (
              <div className="okr__field-2col">
                <label className="okr__field">
                  <span className="okr__label">Width (px)</span>
                  <input className="okr__input" type="number" min="1" max="10000" value={dimWidth} onChange={(event) => onDimWidthChange(event.target.value)} />
                </label>
                <label className="okr__field">
                  <span className="okr__label">Height (px)</span>
                  <input className="okr__input" type="number" min="1" max="10000" value={dimHeight} onChange={(event) => onDimHeightChange(event.target.value)} disabled={lockRatio} />
                </label>
              </div>
            )}

            {mode === "percentage" && (
              <div className="okr__resizer-percent">
                <div className="okr__resizer-presets">
                  {PERCENT_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={String(p) === percentInput ? "is-active" : ""}
                      onClick={() => onPercentChange(String(p))}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
                <label className="okr__field okr__resizer-custom-percent">
                  <span className="okr__label">Custom %</span>
                  <input
                    className={`okr__input${percentInvalid ? " has-error" : ""}`}
                    type="number"
                    min="1"
                    max="400"
                    value={percentInput}
                    onChange={(event) => onPercentChange(event.target.value)}
                  />
                </label>
                {percentInvalid && <p className="okr__field-error">Enter a percentage greater than 0.</p>}
              </div>
            )}

            {mode === "fitwithin" && (
              <div className="okr__field-2col">
                <label className="okr__field">
                  <span className="okr__label">Max width (px)</span>
                  <input className="okr__input" type="number" min="1" max="10000" value={fitWidth} onChange={(event) => { setFitWidth(Math.max(1, Math.round(Number(event.target.value) || 1))); scheduleRecompute(); }} />
                </label>
                <label className="okr__field">
                  <span className="okr__label">Max height (px)</span>
                  <input className="okr__input" type="number" min="1" max="10000" value={fitHeight} onChange={(event) => { setFitHeight(Math.max(1, Math.round(Number(event.target.value) || 1))); scheduleRecompute(); }} />
                </label>
              </div>
            )}

            <div className="okr__resizer-toggles">
              {mode === "dimensions" && (
                <label className="okr__tool-check">
                  <input type="checkbox" checked={lockRatio} onChange={(event) => { setLockRatio(event.target.checked); scheduleRecompute(); }} /> Lock aspect ratio
                </label>
              )}
              <label className="okr__tool-check">
                <input type="checkbox" checked={preventUpscale} onChange={(event) => { setPreventUpscale(event.target.checked); scheduleRecompute(); }} /> Prevent upscale
              </label>
            </div>

            <div className="okr__compressor-settings okr__resizer-format-row">
              <label className="okr__field okr__compressor-format">
                <span className="okr__label">Output format</span>
                <select className="okr__input" value={outputFormat} onChange={(event) => { setOutputFormat(event.target.value); window.setTimeout(() => recomputeAllRef.current(), 0); }}>
                  <option value="auto">Keep original format</option>
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </label>
              {showQualityControl ? (
                <label className="okr__field okr__range-field okr__compressor-quality">
                  <span className="okr__label">Quality<strong>{quality}%</strong></span>
                  <input type="range" min={30} max={95} value={quality} onChange={(event) => { setQuality(Number(event.target.value)); scheduleRecompute(); }} />
                </label>
              ) : (
                <p className="okr__compressor-hint">PNG output is lossless — quality doesn't apply.</p>
              )}
            </div>
          </div>

          <ul className="okr__compressor-list">
            {entries.map((entry) => (
              <ResizerRow key={entry.id} entry={entry} onDownload={() => downloadEntry(entry)} onRemove={() => removeEntry(entry.id)} />
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

function ResizerRow({ entry, onDownload, onRemove }) {
  const { file, previewUrl, sourceWidth, sourceHeight, status, error, target, result } = entry;
  const sizeDelta = result && file.size > 0 ? result.size - file.size : null;

  return (
    <li className="okr__compressor-row" data-status={status}>
      <div className="okr__compressor-thumb">
        {status === "error" ? <ImageOff size={22} aria-hidden="true" /> : <img src={previewUrl} alt="" />}
      </div>

      <div className="okr__compressor-info">
        <p className="okr__compressor-name" title={file.name}>{file.name}</p>
        <p className="okr__compressor-meta">
          {formatBytes(file.size)}{sourceWidth > 0 && ` · ${sourceWidth} × ${sourceHeight}px`}
          {target && !result && ` → ${target.width} × ${target.height}px`}
        </p>
        {target?.clamped && status !== "error" && (
          <p className="okr__resizer-clamp-note">Kept at original size — target was larger and Prevent upscale is on.</p>
        )}

        {(status === "processing" || status === "measuring" || status === "queued") && (
          <p className="okr__compressor-status okr__compressor-status--busy">
            <Loader2 className="is-spinning" size={15} /> {status === "measuring" ? "Reading image…" : "Resizing…"}
          </p>
        )}

        {status === "error" && (
          <p className="okr__compressor-status okr__compressor-status--error" role="alert">
            <AlertTriangle size={15} /> {error}
          </p>
        )}

        {status === "done" && result && (
          <p className="okr__compressor-status okr__compressor-status--done">
            <Check size={15} /> {result.width} × {result.height}px · {formatBytes(result.size)}
            {sizeDelta !== null && sizeDelta < 0 && (
              <span className="okr__compressor-savings">−{Math.round((-sizeDelta / file.size) * 100)}%</span>
            )}
          </p>
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
