import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import QRCode from "qrcode";
import {
  ArrowLeft, Check, Clipboard, Download, FileImage, LockKeyhole, RefreshCw,
  ShieldCheck, Sparkles, UploadCloud,
} from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { ImageCompressorWorkspace } from "../../components/tools/ImageCompressorWorkspace";
import { ImageResizerWorkspace } from "../../components/tools/ImageResizerWorkspace";
import { getToolBySlug, TOOLS } from "../../data/toolsCatalog";
import {
  cleanCaption, contrastRatio, copyText, downloadText, escapeHtml, formatBytes,
  hslToHex, normalizeUrl,
} from "../../lib/browserTools";

const IMAGE_CONFIG = {
  "jpg-to-png": { accept: ".jpg,.jpeg,image/jpeg", input: "JPG", mime: "image/png", ext: "png", quality: 1 },
  "png-to-jpg": { accept: ".png,image/png", input: "PNG", mime: "image/jpeg", ext: "jpg", quality: 0.9 },
  "webp-to-jpg": { accept: ".webp,image/webp", input: "WebP", mime: "image/jpeg", ext: "jpg", quality: 0.9 },
  "jpg-to-webp": { accept: ".jpg,.jpeg,image/jpeg", input: "JPG", mime: "image/webp", ext: "webp", quality: 0.86 },
  "svg-to-png": { accept: ".svg,image/svg+xml", input: "SVG", mime: "image/png", ext: "png", quality: 1 },
  "image-compressor": { accept: ".jpg,.jpeg,.webp,image/jpeg,image/webp", input: "JPG or WebP", compress: true },
  "image-resizer": { accept: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp", input: "JPG, PNG or WebP", resize: true },
};

const SOCIAL_SIZES = [
  ["Instagram square", "1080 × 1080", "1:1"],
  ["Instagram portrait", "1080 × 1350", "4:5"],
  ["Instagram story / reel", "1080 × 1920", "9:16"],
  ["LinkedIn post", "1200 × 627", "1.91:1"],
  ["LinkedIn square", "1200 × 1200", "1:1"],
  ["X / Twitter landscape", "1600 × 900", "16:9"],
  ["Facebook landscape", "1200 × 630", "1.91:1"],
  ["YouTube thumbnail", "1280 × 720", "16:9"],
];

export function ToolDetailPage() {
  const { slug } = useParams();
  const tool = getToolBySlug(slug);
  if (!tool) return <Navigate to="/tools" replace />;

  const related = TOOLS.filter((item) => item.categorySlug === tool.categorySlug && item.slug !== tool.slug).slice(0, 4);

  return (
    <main className="okr__tool-detail-page">
      <Seo title={tool.name} description={tool.description} path={`/tools/${tool.slug}`} />
      <section className="okr__section okr__tool-detail-hero">
        <div className="okr__wrap">
          <Link to="/tools" className="okr__tool-back"><ArrowLeft size={16} /> All tools</Link>
          <span className="okr__kicker">// {tool.category}</span>
          <AnimatedHeadline as="h1" text={tool.name} className="okr__hero-title--stagger" assembleLetters />
          <p>{tool.description}</p>
          <div className="okr__tool-privacy-chip"><ShieldCheck size={16} /> Runs locally in your browser</div>
        </div>
      </section>

      <section className="okr__section okr__tool-work-section">
        <div className="okr__wrap">
          <div className="okr__tool-workspace">
            {tool.slug === "image-compressor" ? <ImageCompressorWorkspace />
              : tool.slug === "image-resizer" ? <ImageResizerWorkspace />
              : tool.kind === "image" && <ImageWorkspace tool={tool} />}
            {tool.kind === "generator" && <GeneratorWorkspace tool={tool} />}
            {tool.kind === "reference" && <SocialSizeGuide />}
          </div>

          <div className="okr__tool-explainer">
            <div>
              <span className="okr__tools-overline">HOW IT WORKS</span>
              <AnimatedHeadline as="h2" text="One task. Three clear steps." className="okr__hero-title--stagger" assembleLetters />
            </div>
            <ol>
              <li><span>01</span><div><strong>Provide the input</strong><p>{tool.kind === "image" ? "Choose a supported image from your device." : "Enter the information the tool needs."}</p></div></li>
              <li><span>02</span><div><strong>Process it privately</strong><p>The result is created inside this browser tab—no account or hidden upload.</p></div></li>
              <li><span>03</span><div><strong>Use the result</strong><p>Download the file or copy the generated output immediately.</p></div></li>
            </ol>
          </div>

          {related.length > 0 && (
            <section className="okr__tool-related">
              <div className="okr__tools-section-heading"><div><span className="okr__tools-overline">KEEP WORKING</span><AnimatedHeadline as="h2" text="Related tools" className="okr__hero-title--stagger" assembleLetters /></div></div>
              <div className="okr__tool-related-grid">
                {related.map((item) => <Link key={item.slug} to={`/tools/${item.slug}`}><strong>{item.name}</strong><span>{item.description}</span></Link>)}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function ImageWorkspace({ tool }) {
  const config = IMAGE_CONFIG[tool.slug];
  const inputRef = useRef(null);
  const outputUrlRef = useRef("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [output, setOutput] = useState(null);
  const [quality, setQuality] = useState(82);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 1200, ratio: 1 });
  const [lockRatio, setLockRatio] = useState(true);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
    if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
  }, [preview]);

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
    outputUrlRef.current = "";
    setFile(null); setPreview(""); setOutput(null); setStatus("idle"); setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function chooseFile(selected) {
    setError(""); setOutput(null); setStatus("idle");
    if (!selected) return;
    if (selected.size > 25 * 1024 * 1024) { setError("The maximum file size is 25 MB."); return; }
    const allowed = config.accept.split(",").some((rule) => rule.startsWith(".")
      ? selected.name.toLowerCase().endsWith(rule)
      : selected.type === rule);
    if (!allowed) { setError(`Choose a supported ${config.input} image.`); return; }
    if (preview) URL.revokeObjectURL(preview);
    const nextPreview = URL.createObjectURL(selected);
    setFile(selected); setPreview(nextPreview);
    const image = new window.Image();
    image.onload = () => setDimensions({ width: image.naturalWidth, height: image.naturalHeight, ratio: image.naturalWidth / image.naturalHeight });
    image.src = nextPreview;
  }

  function updateWidth(value) {
    const width = Math.max(1, Math.min(8192, Number(value) || 1));
    setDimensions((current) => ({ ...current, width, height: lockRatio ? Math.max(1, Math.round(width / current.ratio)) : current.height }));
  }

  function updateHeight(value) {
    const height = Math.max(1, Math.min(8192, Number(value) || 1));
    setDimensions((current) => ({ ...current, height, width: lockRatio ? Math.max(1, Math.round(height * current.ratio)) : current.width }));
  }

  async function convert() {
    if (!file || !preview) return;
    setStatus("processing"); setError("");
    try {
      const image = new window.Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = preview; });
      const width = config.resize ? dimensions.width : image.naturalWidth;
      const height = config.resize ? dimensions.height : image.naturalHeight;
      if (width * height > 40_000_000) throw new Error("The output is too large. Keep it below 40 megapixels.");
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const context = canvas.getContext("2d", { alpha: true });
      const sourceMime = file.type === "image/jpg" ? "image/jpeg" : file.type;
      const outputMime = config.compress ? (sourceMime || "image/jpeg") : config.resize ? (sourceMime || "image/png") : config.mime;
      if (outputMime === "image/jpeg") { context.fillStyle = "#ffffff"; context.fillRect(0, 0, width, height); }
      context.drawImage(image, 0, 0, width, height);
      const outputQuality = config.compress ? quality / 100 : config.quality;
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, outputMime, outputQuality));
      if (!blob) throw new Error("This browser could not create the requested format.");
      if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
      const url = URL.createObjectURL(blob);
      outputUrlRef.current = url;
      const fallbackExt = outputMime.split("/")[1].replace("jpeg", "jpg");
      const ext = config.ext || fallbackExt;
      const name = `${file.name.replace(/\.[^.]+$/, "")}-${config.compress ? "compressed" : config.resize ? `${width}x${height}` : "converted"}.${ext}`;
      setOutput({ url, name, size: blob.size, width, height });
      setStatus("done");
    } catch (conversionError) {
      setError(conversionError.message || "The image could not be processed.");
      setStatus("error");
    }
  }

  return (
    <div className="okr__image-tool">
      {!file ? (
        <label
          className="okr__tool-dropzone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files[0]); }}
        >
          <input ref={inputRef} type="file" accept={config.accept} onChange={(event) => chooseFile(event.target.files[0])} />
          <span className="okr__tool-drop-icon"><UploadCloud size={32} /></span>
          <strong>Choose {config.input} {config.input.includes(",") ? "image" : "file"}</strong>
          <span>or drag and drop it here</span>
          <small>Maximum 25 MB · processed locally</small>
        </label>
      ) : (
        <>
          <div className="okr__image-stage">
            <div className="okr__image-preview"><img src={output?.url || preview} alt="Selected preview" /></div>
            <div className="okr__image-controls">
              <span className="okr__tools-overline">SELECTED FILE</span>
              <AnimatedHeadline as="h2" text={file.name} className="okr__hero-title--stagger" assembleLetters />
              <p>{formatBytes(file.size)} · {dimensions.width} × {dimensions.height}px</p>
              {config.compress && <RangeField label="Output quality" value={quality} onChange={setQuality} suffix="%" />}
              {config.resize && (
                <div className="okr__resize-controls">
                  <div className="okr__field-2col">
                    <Field label="Width (px)" type="number" min="1" max="8192" value={dimensions.width} onChange={(event) => updateWidth(event.target.value)} />
                    <Field label="Height (px)" type="number" min="1" max="8192" value={dimensions.height} onChange={(event) => updateHeight(event.target.value)} />
                  </div>
                  <label className="okr__tool-check"><input type="checkbox" checked={lockRatio} onChange={(event) => setLockRatio(event.target.checked)} /><LockKeyhole size={15} /> Lock aspect ratio</label>
                </div>
              )}
              {output && <div className="okr__tool-success"><Check size={17} /><span><strong>Ready to download</strong>{formatBytes(output.size)} · {output.width} × {output.height}px</span></div>}
              {error && <p className="okr__tool-error" role="alert">{error}</p>}
              <div className="okr__tool-actions">
                {output ? <a className="okr__btn okr__btn--primary" href={output.url} download={output.name}><Download size={17} /> Download</a>
                  : <button className="okr__btn okr__btn--primary" onClick={convert} disabled={status === "processing"}>{status === "processing" ? <><RefreshCw className="is-spinning" size={17} /> Processing…</> : <><Sparkles size={17} /> {config.compress ? "Compress image" : config.resize ? "Resize image" : `Convert to ${config.ext.toUpperCase()}`}</>}</button>}
                <button className="okr__btn okr__btn--ghost" onClick={reset}>{output ? "Convert another" : "Remove"}</button>
              </div>
            </div>
          </div>
        </>
      )}
      {!file && error && <p className="okr__tool-error" role="alert">{error}</p>}
    </div>
  );
}

function GeneratorWorkspace({ tool }) {
  if (tool.slug === "qr-code-generator") return <QrGenerator />;
  if (tool.slug === "color-palette-generator") return <PaletteGenerator />;
  if (tool.slug === "contrast-checker") return <ContrastChecker />;
  if (tool.slug === "gradient-generator") return <GradientGenerator />;
  return <TextGenerator slug={tool.slug} />;
}

function ToolShell({ children, output, filename = "result.txt", downloadType, preview }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() { await copyText(output); setCopied(true); window.setTimeout(() => setCopied(false), 1400); }
  return (
    <div className="okr__generator-grid">
      <div className="okr__generator-form">{children}</div>
      <div className="okr__generator-output">
        <div className="okr__generator-output-head"><span className="okr__tools-overline">LIVE OUTPUT</span>{output && <span className="okr__output-ready"><Check size={14} /> Ready</span>}</div>
        {preview || <pre>{output || "Your result will appear here."}</pre>}
        {output && <div className="okr__tool-actions"><button className="okr__btn okr__btn--primary" onClick={handleCopy}><Clipboard size={17} /> {copied ? "Copied" : "Copy result"}</button>{downloadType && <button className="okr__btn okr__btn--ghost" onClick={() => downloadText(output, filename, downloadType)}><Download size={17} /> Download</button>}</div>}
      </div>
    </div>
  );
}

function TextGenerator({ slug }) {
  const [values, setValues] = useState({ url: "", source: "", medium: "social", campaign: "", content: "", phone: "", message: "", title: "", description: "", author: "", robots: "index, follow", sitemap: "", allow: "/", disallow: "/admin\n/private", schemaType: "Person", name: "", email: "", caption: "" });
  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }));

  const result = useMemo(() => {
    try {
      if (slug === "utm-builder") {
        if (!values.url.trim()) return { output: "", error: "" };
        const url = new URL(normalizeUrl(values.url));
        [["utm_source", values.source], ["utm_medium", values.medium], ["utm_campaign", values.campaign], ["utm_content", values.content]].forEach(([key, value]) => { if (value.trim()) url.searchParams.set(key, value.trim()); });
        return { output: url.toString(), error: "" };
      }
      if (slug === "whatsapp-link-generator") {
        const phone = values.phone.replace(/\D/g, "").replace(/^0/, "62");
        if (!phone) return { output: "", error: "" };
        return { output: `https://wa.me/${phone}${values.message ? `?text=${encodeURIComponent(values.message)}` : ""}`, error: "" };
      }
      if (slug === "canonical-url-builder") return { output: values.url.trim() ? normalizeUrl(values.url) : "", error: "" };
      if (slug === "robots-txt-generator") return { output: `User-agent: *\nAllow: ${values.allow || "/"}\n${values.disallow.split("\n").filter(Boolean).map((item) => `Disallow: ${item.trim()}`).join("\n")}${values.sitemap ? `\nSitemap: ${normalizeUrl(values.sitemap)}` : ""}`, error: "" };
      if (slug === "sitemap-generator") {
        const urls = values.url.split("\n").map((item) => item.trim()).filter(Boolean).map(normalizeUrl);
        if (!urls.length) return { output: "", error: "" };
        return { output: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url>\n    <loc>${escapeHtml(url)}</loc>\n  </url>`).join("\n")}\n</urlset>`, error: "" };
      }
      if (slug === "meta-tag-generator") {
        if (!values.title && !values.description) return { output: "", error: "" };
        const title = escapeHtml(values.title);
        const description = escapeHtml(values.description);
        return { output: `<title>${title}</title>\n<meta name="description" content="${description}">\n<meta name="robots" content="${values.robots}">\n<meta property="og:title" content="${title}">\n<meta property="og:description" content="${description}">\n<meta name="twitter:card" content="summary_large_image">`, error: "" };
      }
      if (slug === "schema-markup-generator") {
        if (!values.name.trim()) return { output: "", error: "" };
        const schema = { "@context": "https://schema.org", "@type": values.schemaType, name: values.name.trim() };
        if (values.url.trim()) schema.url = normalizeUrl(values.url);
        if (values.email.trim()) schema.email = values.email.trim();
        if (values.description.trim()) schema.description = values.description.trim();
        return { output: `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`, error: "" };
      }
      if (slug === "caption-formatter") return { output: cleanCaption(values.caption), error: "" };
      return { output: "", error: "" };
    } catch {
      return { output: "", error: "Check the URL or input format." };
    }
  }, [slug, values]);

  const config = {
    "utm-builder": <><Field label="Destination URL" placeholder="https://example.com/landing" value={values.url} onChange={set("url")} /><div className="okr__field-2col"><Field label="Campaign source" placeholder="instagram" value={values.source} onChange={set("source")} /><Field label="Campaign medium" placeholder="social" value={values.medium} onChange={set("medium")} /></div><Field label="Campaign name" placeholder="new-launch" value={values.campaign} onChange={set("campaign")} /><Field label="Content (optional)" placeholder="hero-button" value={values.content} onChange={set("content")} /></>,
    "whatsapp-link-generator": <><Field label="WhatsApp number" placeholder="0812 3456 7890" value={values.phone} onChange={set("phone")} /><Field label="Prefilled message" textarea rows="5" placeholder="Hello, I would like to ask…" value={values.message} onChange={set("message")} /></>,
    "canonical-url-builder": <Field label="Page URL" placeholder="example.com/article/" value={values.url} onChange={set("url")} />,
    "robots-txt-generator": <><Field label="Allowed path" value={values.allow} onChange={set("allow")} /><Field label="Disallowed paths" textarea rows="5" value={values.disallow} onChange={set("disallow")} /><Field label="Sitemap URL (optional)" placeholder="https://example.com/sitemap.xml" value={values.sitemap} onChange={set("sitemap")} /></>,
    "sitemap-generator": <Field label="One URL per line" textarea rows="10" placeholder={"https://example.com/\nhttps://example.com/about\nhttps://example.com/contact"} value={values.url} onChange={set("url")} />,
    "meta-tag-generator": <><Field label="Page title" maxLength="70" value={values.title} onChange={set("title")} /><Field label="Meta description" textarea rows="5" maxLength="180" value={values.description} onChange={set("description")} /><SelectField label="Robots directive" value={values.robots} onChange={set("robots")} options={["index, follow", "noindex, follow", "index, nofollow", "noindex, nofollow"]} /></>,
    "schema-markup-generator": <><SelectField label="Entity type" value={values.schemaType} onChange={set("schemaType")} options={["Person", "Organization"]} /><Field label="Name" value={values.name} onChange={set("name")} /><Field label="Website URL" placeholder="https://example.com" value={values.url} onChange={set("url")} /><Field label="Email (optional)" type="email" value={values.email} onChange={set("email")} /><Field label="Description (optional)" textarea rows="4" value={values.description} onChange={set("description")} /></>,
    "caption-formatter": <Field label="Paste caption" textarea rows="13" placeholder="Paste a caption with untidy spacing…" value={values.caption} onChange={set("caption")} />,
  }[slug];

  const downloads = { "robots-txt-generator": ["robots.txt", "text/plain"], "sitemap-generator": ["sitemap.xml", "application/xml"], "schema-markup-generator": ["schema.html", "text/html"] }[slug];
  return <ToolShell output={result.output} filename={downloads?.[0]} downloadType={downloads?.[1]}>{config}{result.error && <p className="okr__tool-error">{result.error}</p>}</ToolShell>;
}

function QrGenerator() {
  const [value, setValue] = useState("");
  const [size, setSize] = useState(720);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    if (!value.trim()) { setResult(""); return undefined; }
    QRCode.toDataURL(value.trim(), { width: size, margin: 2, errorCorrectionLevel: "M", color: { dark: "#20181b", light: "#ffffff" } })
      .then((url) => { if (live) { setResult(url); setError(""); } })
      .catch(() => { if (live) setError("The QR code could not be generated."); });
    return () => { live = false; };
  }, [size, value]);
  const preview = result ? <div className="okr__qr-preview"><img src={result} alt="Generated QR code" /><a className="okr__btn okr__btn--primary" href={result} download="qr-code.png"><Download size={17} /> Download PNG</a></div> : null;
  return <ToolShell output="" preview={preview}><Field label="Text or URL" textarea rows="6" placeholder="https://israanwar.com" value={value} onChange={(event) => setValue(event.target.value)} /><SelectField label="Image size" value={String(size)} onChange={(event) => setSize(Number(event.target.value))} options={["360", "720", "1080"]} suffix=" px" />{error && <p className="okr__tool-error">{error}</p>}</ToolShell>;
}

function PaletteGenerator() {
  const [hue, setHue] = useState(18);
  const colors = useMemo(() => [-45, -20, 0, 25, 55].map((offset, index) => hslToHex((hue + offset + 360) % 360, 62 - index * 3, 42 + index * 7)), [hue]);
  const output = colors.join("\n");
  const preview = <div className="okr__palette-preview">{colors.map((color) => <button key={color} style={{ background: color }} onClick={() => copyText(color)}><span>{color}</span></button>)}</div>;
  return <ToolShell output={output} preview={preview}><RangeField label="Base hue" value={hue} onChange={setHue} min={0} max={359} suffix="°" /><div className="okr__tool-note">Select a starting hue. Click any colour swatch to copy its HEX value.</div></ToolShell>;
}

function ContrastChecker() {
  const [foreground, setForeground] = useState("#20181b");
  const [background, setBackground] = useState("#fff6ed");
  const ratio = contrastRatio(foreground, background);
  const output = `Contrast ratio: ${ratio.toFixed(2)}:1\nNormal text (AA): ${ratio >= 4.5 ? "PASS" : "FAIL"}\nLarge text (AA): ${ratio >= 3 ? "PASS" : "FAIL"}\nNormal text (AAA): ${ratio >= 7 ? "PASS" : "FAIL"}`;
  const preview = <div className="okr__contrast-preview" style={{ color: foreground, background }}><span>Contrast preview</span><strong>Aa</strong><p>Clear, readable design earns attention.</p><div>{ratio.toFixed(2)}:1 · {ratio >= 4.5 ? "AA PASS" : "AA FAIL"}</div></div>;
  return <ToolShell output={output} preview={preview}><ColorField label="Text colour" value={foreground} onChange={setForeground} /><ColorField label="Background colour" value={background} onChange={setBackground} /></ToolShell>;
}

function GradientGenerator() {
  const [first, setFirst] = useState("#c95732");
  const [second, setSecond] = useState("#431253");
  const [angle, setAngle] = useState(120);
  const output = `background: linear-gradient(${angle}deg, ${first} 0%, ${second} 100%);`;
  const preview = <div className="okr__gradient-preview" style={{ background: `linear-gradient(${angle}deg, ${first}, ${second})` }}><span>{angle}°</span></div>;
  return <ToolShell output={output} preview={preview}><div className="okr__field-2col"><ColorField label="First colour" value={first} onChange={setFirst} /><ColorField label="Second colour" value={second} onChange={setSecond} /></div><RangeField label="Angle" value={angle} onChange={setAngle} min={0} max={360} suffix="°" /></ToolShell>;
}

function SocialSizeGuide() {
  return <div className="okr__size-guide"><div className="okr__size-guide-head"><FileImage size={28} /><div><AnimatedHeadline as="h2" text="Common working canvas sizes" className="okr__hero-title--stagger" assembleLetters /><p>Use these as practical starting points. Platform requirements can change.</p></div></div><div className="okr__size-table">{SOCIAL_SIZES.map(([name, size, ratio]) => <div key={name}><strong>{name}</strong><span>{size}px</span><small>{ratio}</small></div>)}</div></div>;
}

function Field({ label, textarea = false, ...props }) {
  const Element = textarea ? "textarea" : "input";
  return <label className="okr__field"><span className="okr__label">{label}</span><Element className="okr__input" {...props} /></label>;
}

function SelectField({ label, options, suffix = "", ...props }) {
  return <label className="okr__field"><span className="okr__label">{label}</span><select className="okr__input" {...props}>{options.map((option) => <option key={option} value={option}>{option}{suffix}</option>)}</select></label>;
}

function RangeField({ label, value, onChange, min = 20, max = 100, suffix = "" }) {
  return <label className="okr__field okr__range-field"><span className="okr__label">{label}<strong>{value}{suffix}</strong></span><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function ColorField({ label, value, onChange }) {
  return <label className="okr__field"><span className="okr__label">{label}</span><span className="okr__color-field"><input type="color" value={value} onChange={(event) => onChange(event.target.value)} /><input className="okr__input" value={value} pattern="#[0-9a-fA-F]{6}" onChange={(event) => { if (/^#[0-9a-fA-F]{6}$/.test(event.target.value)) onChange(event.target.value); }} /></span></label>;
}
