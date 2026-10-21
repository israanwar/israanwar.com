import { STORE_COVER_SLOTS } from "../data/storeCoverSlots.js";
import { STORE_COVER_COLORS } from "../data/storeCoverColors.js";
import { LAYOUT_COUNT, PATTERN_COUNT, glyphForProduct, patternBackground, renderLayout } from "./storeCoverLayouts.js";

// Generated covers differ in color AND composition. Every product owns a slot
// (see storeCoverSlots.js). The slot picks a color from a palette whose pairs
// are all clearly apart (storeCoverColors.js), one of twelve page layouts and
// one of twelve background patterns (storeCoverLayouts.js), arranged so that
// no two products share a (layout, pattern) pair. Text turns white on deep
// backgrounds.
const INK = "#1a1a1a";
const MUTED = "#37332f";

const SLOT_INDEX = new Map(STORE_COVER_SLOTS.map((slug, index) => [slug, index]));

function hashString(value) {
  let hash = 2166136261;
  for (const ch of String(value)) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
  return hash;
}

function slotFor(slug) {
  const known = SLOT_INDEX.get(slug);
  if (known !== undefined) return known;
  // Products added after the slot list was written land in the spare colors
  // after the listed ones (never on an existing product's color) until their
  // slug is appended to the list.
  const spare = Math.max(1, STORE_COVER_COLORS.length - STORE_COVER_SLOTS.length);
  return STORE_COVER_SLOTS.length + (hashString(slug) % spare);
}

function hsl(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const sat = s / 100;
  const light = l / 100;
  const k = (n) => (n + hue / 30) % 12;
  const amp = sat * Math.min(light, 1 - light);
  const channel = (n) => Math.round(255 * (light - amp * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return `#${[0, 8, 4].map((n) => channel(n).toString(16).padStart(2, "0")).join("")}`;
}

export function contrastRatio(hexA, hexB) {
  const [hi, lo] = [luminance(hexA), luminance(hexB)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

function luminance(hex) {
  const channel = (i) => {
    const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

// Layout and pattern for a slot. For slots 0..143 every pair is unique: the
// layout cycles fastest, and the pattern shifts by five per layout.
export function coverComposition(slot) {
  const layout = slot % LAYOUT_COUNT;
  const pattern = (Math.floor(slot / LAYOUT_COUNT) + layout * 5) % PATTERN_COUNT;
  return { layout, pattern };
}

// Hues 38-110 turn muddy olive at accent lightness, so accents borrow a warm
// orange instead while the canvas keeps its own pale tone.
function accentHue(hue) {
  return hue >= 38 && hue <= 110 ? 22 : hue;
}

// Background and colors for one slot. Exported so tests can prove that every
// slot looks different.
export function coverBackground(slot) {
  const [hue, sat, light] = STORE_COVER_COLORS[slot % STORE_COVER_COLORS.length];
  const { layout, pattern: kind } = coverComposition(slot);
  const angle = (slot * 47) % 360;
  const from = hsl(hue, sat, light);
  const to = hsl(hue, sat, Math.max(30, light - 7));
  const tone = accentHue(hue);
  // Text color is whichever reads better on the darker end of the gradient;
  // the accent line steps darker until it clears 4.5:1 on both ends.
  const worst = (color) => Math.min(contrastRatio(color, from), contrastRatio(color, to));
  const deep = worst("#ffffff") > worst(INK);
  const ink = deep ? "#ffffff" : INK;
  const muted = deep ? "#f1f1f1" : MUTED;
  const accentCandidates = deep ? ["#ffffff"] : [30, 22, 15, 8].map((l) => hsl(tone, 85, l));
  const canvasAccent = accentCandidates.find((color) => worst(color) >= 4.5) ?? ink;
  const accent = hsl(tone, 78, 34);
  const tint = hsl(tone, 70, 88);
  const rad = (angle * Math.PI) / 180;
  const gradient =
    `<defs><linearGradient id="g" x1="${(0.5 - Math.cos(rad) / 2).toFixed(3)}" y1="${(0.5 - Math.sin(rad) / 2).toFixed(3)}" x2="${(0.5 + Math.cos(rad) / 2).toFixed(3)}" y2="${(0.5 + Math.sin(rad) / 2).toFixed(3)}">` +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
    `<rect width="800" height="600" fill="url(#g)"/>`;
  return {
    hue, kind, layout, accent, tint, canvasAccent, ink, muted, deep, from, to,
    svg: gradient + patternBackground(kind, deep ? "#ffffff" : canvasAccent, slot),
  };
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

// Products whose cover keeps its own colors but sits in the same system as the
// generated ones. The image uploaded in the admin is left untouched; only the
// storefront rendering is swapped.
const COVER_OVERRIDES = {
  jagojualanshopee: {
    from: "#fdf6ee",
    to: "#f5e6d3",
    accent: "#e8541e",
    glyph: "shop",
    badge: ["8 BAB", "LANGKAH DEMI", "LANGKAH"],
    kicker: "EBOOK · FORMAT PDF",
    title: "Jago Jualan Shopee",
    subtitle: "Jurus Anti Ribet",
  },
};

function customLook({ from, to, accent }, slot) {
  const { layout, pattern: kind } = coverComposition(slot);
  const gradient =
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
    `<rect width="800" height="600" fill="url(#g)"/>`;
  return {
    layout, kind, accent, tint: "#f9e1d2", canvasAccent: accent, ink: INK, muted: MUTED, deep: false,
    svg: gradient + patternBackground(kind, accent, slot),
  };
}

function cleanTitle(name) {
  return String(name || "Untitled Product")
    .replace(/^(module|modul)\s*:\s*/i, "")
    .replace(/^bundle\s*:\s*/i, "Bundle ")
    .replace(/\s+/g, " ")
    .trim();
}

function typeLabel(product, fallback) {
  const prefix = String(product.slug || "").split("-")[0].toLowerCase();
  return TYPE_LABELS[prefix] || String(product.category || fallback).toUpperCase();
}

export function generateStoreCover(product = {}) {
  const override = COVER_OVERRIDES[product.slug];
  const slot = slotFor(String(product.slug || product.name || ""));
  const look = override ? customLook(override, slot) : coverBackground(slot);
  const body = renderLayout(look.layout, {
    ...look,
    kicker: override?.kicker || typeLabel(product, "DIGITAL PRODUCT"),
    title: override?.title || cleanTitle(product.name),
    subtitle: override?.subtitle,
    glyph: override?.glyph || glyphForProduct(product),
    badge: override?.badge,
  });
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">` +
    `<desc>Isra Anwar Store generated cover</desc>` +
    look.svg + body +
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

export function resolveProductCover(product) {
  if (
    !COVER_OVERRIDES[product?.slug]
    && product?.image_url
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
