// Extracts plain text from a user-uploaded file, entirely in the browser —
// the file is never sent to any server. Used by SiteChatWidget's document
// upload feature (see balaoKnowledge.js's bestDocumentChunks/documentAnswer
// for what Balao does with the extracted text: literal keyword search, not
// real comprehension).
//
// Supported inputs:
// - .txt/.md and other plain-text files — read directly.
// - .pdf — embedded text is pulled via pdf.js; if a PDF has no embedded
//   text at all (a scanned document saved as PDF, just a picture of a
//   page), each page is rendered to a canvas and OCR'd instead (see OCR
//   note below).
// - .docx — parsed via mammoth.
// - Images (.png/.jpg/.jpeg/.webp) — read via OCR (optical character
//   recognition), since an image has no embedded text at all.
//
// OCR uses Tesseract.js — free, open-source, and runs the actual
// recognition entirely in the browser (no per-use cost, no image data sent
// anywhere for processing). It does fetch its language-model file from a
// public CDN the first time OCR runs in a session (a static, one-time
// asset download, not a transmission of the user's document) — and it's
// meaningfully slower than plain text extraction (real recognition work,
// not a lookup) and never perfectly accurate, especially on messy scans or
// handwriting. Still fully free and still entirely client-side.

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10MB
// Bounds how much text is kept in memory/searched — plenty for a brief,
// spec, or report; a much larger document just gets its first slice used.
const MAX_DOCUMENT_CHARS = 60000;
// OCR is slow enough (real recognition work per page) that running it
// across a large scanned PDF would make the widget feel hung — capped to
// the first few pages, which covers the realistic case (a scanned letter,
// invoice, or brief) without risking a multi-minute wait.
const MAX_OCR_PAGES = 5;

export class DocumentReadError extends Error {
  constructor(reason) {
    super(reason);
    this.reason = reason; // "too-large" | "unsupported-type" | "empty" | "parse-failed"
  }
}

function extensionOf(file) {
  const match = file.name.toLowerCase().match(/\.[a-z0-9]+$/);
  return match ? match[0] : "";
}

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function isPdf(file) {
  return file.type === "application/pdf" || extensionOf(file) === ".pdf";
}

function isDocx(file) {
  return (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extensionOf(file) === ".docx"
  );
}

function isImage(file) {
  return file.type.startsWith("image/") || IMAGE_EXTENSIONS.has(extensionOf(file));
}

// Formats this project doesn't (and, for the binary ones, realistically
// can't without much heavier tooling) read: older Office binary formats,
// archives, audio/video, executables. Everything else falls through to
// being read as plain text.
const UNSUPPORTED_EXTENSIONS = [
  ".doc", ".xls", ".xlsx", ".ppt", ".pptx", ".odt", ".rtf",
  ".zip", ".rar", ".7z", ".gif", ".svg",
  ".mp3", ".mp4", ".mov", ".exe", ".dmg",
];

function hasUnsupportedExtension(file) {
  return UNSUPPORTED_EXTENSIONS.includes(extensionOf(file));
}

// A single shared OCR worker per page load — creating one takes a moment
// (fetching the language model), so it's cached instead of re-created for
// every image/scanned page.
let ocrWorkerPromise = null;
function getOcrWorker() {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = import("tesseract.js").then(({ createWorker }) =>
      // English + Indonesian covers the site's own two core languages;
      // Tesseract can still often pick up plain Latin-script text in other
      // languages reasonably well with this pair.
      createWorker("eng+ind")
    );
  }
  return ocrWorkerPromise;
}

async function ocrImageSource(source) {
  const worker = await getOcrWorker();
  const { data } = await worker.recognize(source);
  return data.text;
}

// pdf.js's worker needs a real URL to fetch — Vite's `?url` import gives us
// exactly that without needing to hand-configure static asset copying.
// Dynamically imported so pdf.js (and its worker) never load unless a
// visitor actually uploads a PDF.
async function loadPdfjs() {
  const [pdfjs, { default: workerUrl }] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjs;
}

async function renderPageToCanvas(page) {
  // A moderate scale keeps OCR accuracy reasonable without producing an
  // enormous canvas for a high-DPI source PDF.
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

async function extractPdfText(file) {
  const { getDocument } = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: buffer }).promise;

  const pageTexts = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    // Concatenating every item with a forced space is the naive approach,
    // but pdf.js's text items are content-stream text-showing runs, not
    // whole words — a single word can legitimately span two adjacent items
    // (a real font-kerning quirk), and forcing a space between every item
    // corrupts words like "dimulai" into "dimul ai". Each item's own `str`
    // already carries any real inter-word space as an actual character, so
    // items are concatenated directly; `hasEOL` (end of a visual line) adds
    // a single space rather than a line break — a PDF line wrap is a word
    // boundary, not a paragraph one, so treating it as a break would chop
    // one real paragraph into several disconnected search chunks.
    let pageText = "";
    for (const item of content.items) {
      pageText += item.str + (item.hasEOL ? " " : "");
    }
    pageTexts.push(pageText.replace(/[ \t]+/g, " ").trim());
  }

  const embeddedText = pageTexts.join("\n\n");
  if (embeddedText.trim()) return embeddedText;

  // No embedded text at all — this is a scanned/photographed document
  // saved as a PDF, just a picture of a page. Fall back to OCR on each
  // page's rendered image (capped — see MAX_OCR_PAGES).
  const ocrTexts = [];
  for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, MAX_OCR_PAGES); pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const canvas = await renderPageToCanvas(page);
    ocrTexts.push(await ocrImageSource(canvas));
  }
  return ocrTexts.join("\n\n");
}

async function extractDocxText(file) {
  const mammoth = await import("mammoth");
  const buffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer: buffer });
  return value;
}

// Anything not recognized as PDF/DOCX/image is read as plain text (.txt,
// .md, and similar).
async function extractPlainText(file) {
  return file.text();
}

export async function extractDocumentText(file) {
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new DocumentReadError("too-large");
  }
  if (!isPdf(file) && !isDocx(file) && !isImage(file) && hasUnsupportedExtension(file)) {
    throw new DocumentReadError("unsupported-type");
  }

  let text;
  try {
    if (isPdf(file)) text = await extractPdfText(file);
    else if (isDocx(file)) text = await extractDocxText(file);
    else if (isImage(file)) text = await ocrImageSource(file);
    else text = await extractPlainText(file);
  } catch {
    throw new DocumentReadError("parse-failed");
  }

  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) throw new DocumentReadError("empty");

  return text.length > MAX_DOCUMENT_CHARS ? text.slice(0, MAX_DOCUMENT_CHARS) : text;
}
