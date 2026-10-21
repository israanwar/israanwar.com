import { STORE_COVER_SLOTS } from "../data/storeCoverSlots.js";
import { ICONS, ICON_BY_SLUG, SPARE_ICONS } from "../data/storeCoverIcons.js";

// One cover system for every product: a black canvas, white type, lavender used
// sparingly (the type label and one short rule), and a single Lucide icon.
// Background, frame, type, icon size, stroke weight and spacing are identical on
// every cover; only the icon, the title and the edition number change. No
// gradients, glow or per-product color.
const BG = "#08080b";
const WHITE = "#f7f7f8";
const LAVENDER = "#d7c9ff";
const MUTED = "#85858d";
const FRAME = "rgba(255,255,255,0.12)";
const SANS = `font-family="'Plus Jakarta Sans', 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif"`;
const ICON_SIZE = 96;
const ICON_STROKE = 1.1;

const SLOT_INDEX = new Map(STORE_COVER_SLOTS.map((slug, index) => [slug, index]));

function hashString(value) {
  let hash = 2166136261;
  for (const ch of String(value)) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
  return hash;
}

function luminance(hex) {
  const channel = (i) => {
    const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

export function contrastRatio(hexA, hexB) {
  const [hi, lo] = [luminance(hexA), luminance(hexB)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

// The colors the cover uses, exported so tests can check them.
export const COVER_COLORS = { background: BG, text: WHITE, accent: LAVENDER, muted: MUTED };

// The Lucide icon of a product. Listed products have their own; a product added
// later takes a spare one until its slug is added to storeCoverIcons.js.
export function coverIconFor(slug) {
  return ICON_BY_SLUG[slug] ?? SPARE_ICONS[hashString(slug) % SPARE_ICONS.length];
}

function xmlEsc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function cleanTitle(name) {
  return String(name || "Untitled Product")
    .replace(/^(module|modul)\s*:\s*/i, "")
    .replace(/^bundle\s*:\s*/i, "Bundle ")
    .replace(/\s+/g, " ")
    .trim();
}

const TYPE_LABELS = {
  ebook: "EBOOK · FORMAT PDF",
  modul: "MODUL · FORMAT PDF",
  tpl: "TEMPLATE SIAP PAKAI",
  checklist: "CHECKLIST",
  planner: "PLANNER",
  workbook: "WORKBOOK",
  worksheet: "WORKSHEET",
  swipe: "SWIPE FILE",
  prompt: "PROMPT PACK",
  bundle: "BUNDLE HEMAT",
  playbook: "PLAYBOOK",
  sop: "SOP SIAP PAKAI",
  blueprint: "BLUEPRINT",
  framework: "FRAMEWORK",
  guideline: "GUIDELINE",
  bizdoc: "DOKUMEN BISNIS",
  research: "KIT RISET",
  print: "PRINTABLE",
  prod: "PRODUKTIVITAS",
  mkt: "MARKETING KIT",
  brand: "BRANDING KIT",
};

// Products whose slug has no type prefix.
const LABEL_BY_SLUG = { jagojualanshopee: "EBOOK \u00b7 FORMAT PDF" };

function typeLabel(product) {
  if (LABEL_BY_SLUG[product.slug]) return LABEL_BY_SLUG[product.slug];
  const prefix = String(product.slug || "").split("-")[0].toLowerCase();
  return TYPE_LABELS[prefix] || String(product.category || "DIGITAL PRODUCT").toUpperCase();
}

function wrapLines(title, maxChars) {
  const words = String(title).replace(/\s*&\s*/g, " & ").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = (line + " " + word).trim();
    if (next.length > maxChars && line) { lines.push(line); line = word; } else { line = next; }
  }
  if (line) lines.push(line);
  return lines;
}

// The title is as large as fits in at most two lines; it shrinks before it is
// ever cut.
function titleLines(title) {
  const maxWidth = 500;
  for (let size = 38; size >= 22; size -= 2) {
    const lines = wrapLines(title, Math.floor(maxWidth / (size * 0.56)));
    if (lines.length <= 2 && Math.max(...lines.map((l) => l.length)) * size * 0.56 <= maxWidth * 1.04) return { lines, size };
  }
  const lines = wrapLines(title, Math.floor(maxWidth / (22 * 0.56)));
  return { lines: lines.slice(0, 2).map((l, i, all) => (i === 1 && lines.length > 2 ? `${l}\u2026` : l)), size: 22 };
}

export function generateStoreCover(product = {}) {
  const slug = String(product.slug || product.name || "");
  const slot = SLOT_INDEX.get(slug);
  const edition = slot === undefined ? "---" : String(slot + 1).padStart(3, "0");
  // A few Lucide icons paint with currentColor, which inside an <img> SVG falls
  // back to black and would vanish on the black canvas.
  const icon = (ICONS[coverIconFor(slug)] ?? "").replace(/currentColor/g, WHITE);
  const { lines, size } = titleLines(cleanTitle(product.name));
  const lineHeight = size * 1.18;
  // The title block is centered on y = 448, between the rule and the footer.
  const firstBase = 448 - ((lines.length - 1) * lineHeight) / 2 + size * 0.34;
  const scale = ICON_SIZE / 24;
  const text = (x, y, str, { anchor = "start", fontSize, weight = 600, fill, spacing = 0 }) =>
    `<text x="${x}" y="${y}" ${SANS} font-size="${fontSize}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${spacing}">${xmlEsc(str)}</text>`;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">` +
    `<desc>Isra Anwar Store generated cover</desc>` +
    `<rect width="800" height="600" fill="${BG}"/>` +
    `<rect x="100.5" y="36.5" width="599" height="527" fill="none" stroke="${FRAME}"/>` +
    text(132, 88, typeLabel(product), { fontSize: 13, weight: 700, fill: LAVENDER, spacing: 4 }) +
    text(668, 88, `N\u00b0 ${edition}`, { anchor: "end", fontSize: 13, weight: 500, fill: MUTED, spacing: 2 }) +
    `<circle cx="400" cy="236" r="92" fill="none" stroke="${WHITE}" stroke-opacity="0.18"/>` +
    `<g transform="translate(${400 - 12 * scale} ${236 - 12 * scale}) scale(${scale})" fill="none" stroke="${WHITE}" stroke-width="${ICON_STROKE}" stroke-linecap="round" stroke-linejoin="round">${icon}</g>` +
    `<rect x="380" y="362" width="40" height="2" fill="${LAVENDER}"/>` +
    lines.map((line, i) => text(400, (firstBase + i * lineHeight).toFixed(1), line, { anchor: "middle", fontSize: size, weight: 600, fill: WHITE, spacing: -0.4 })).join("") +
    `<rect x="132" y="522" width="536" height="1" fill="${FRAME}"/>` +
    text(132, 548, "ISRAANWAR.COM", { fontSize: 11, weight: 600, fill: MUTED, spacing: 4 }) +
    text(668, 548, "2026", { anchor: "end", fontSize: 11, weight: 600, fill: MUTED, spacing: 3 }) +
    `</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function isGeneratedStoreCover(url) {
  if (!url) return true;
  if (!String(url).startsWith("data:image/svg+xml")) return false;
  try {
    const payload = String(url).split(",").slice(1).join(",");
    const decoded = decodeURIComponent(payload);
    // Case-insensitive so covers generated before the "ISRA ANWAR" ->
    // "Isra Anwar" wordmark casing fix are still recognized as generated
    // (not a real uploaded image) and get regenerated with the new look.
    return /isra anwar/i.test(decoded) && /store/i.test(decoded);
  } catch {
    return /isra anwar/i.test(String(url));
  }
}

export function isLegacyStoreCover(url) {
  if (!String(url || "").startsWith("data:image/svg+xml")) return false;
  try {
    const payload = String(url).split(",").slice(1).join(",");
    const decoded = decodeURIComponent(payload);
    return /OKKARHYS|OKKA\s*RHYS/i.test(decoded);
  } catch {
    return /OKKARHYS|OKKA\s*RHYS/i.test(String(url));
  }
}

// generateStoreCover() builds an SVG string (paths, gradients, wrapped title
// text) from scratch every call — deterministic, but not free. Pages re-render
// this per visible card on any unrelated state change (language toggle, sort,
// search), so cache by the fields that actually affect the artwork (slug,
// name, category — name/category can change with language, everything else
// is fixed per product) rather than rebuilding identical output repeatedly.
const coverCache = new Map();

// Products that always show the store cover system, even though a photo is
// uploaded for them in the admin (the upload itself is left untouched).
const SYSTEM_COVER_SLUGS = new Set(["jagojualanshopee"]);

export function resolveProductCover(product) {
  if (
    product?.image_url
    && !SYSTEM_COVER_SLUGS.has(product.slug)
    && !isGeneratedStoreCover(product.image_url)
    && !isLegacyStoreCover(product.image_url)
  ) return product.image_url;

  const cacheKey = `${product?.slug ?? ""}::${product?.name ?? ""}::${product?.category ?? ""}`;
  const cached = coverCache.get(cacheKey);
  if (cached) return cached;

  const cover = generateStoreCover(product);
  coverCache.set(cacheKey, cover);
  return cover;
}
