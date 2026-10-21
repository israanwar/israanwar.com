import { STORE_COVER_SLOTS } from "../data/storeCoverSlots.js";
import { STORE_COVER_COLORS } from "../data/storeCoverColors.js";
import { STORE_COVER_PLAN } from "../data/storeCoverPlan.js";
import { ICON_BY_SLUG, SPARE_ICONS } from "../data/storeCoverIcons.js";
import { oklchToHex } from "./oklch.js";
import { ART_COUNT, FRAME_COUNT, ORNAMENT_COUNT, SKELETON_COUNT, TITLE_COUNT, WEIGHT_COUNT, renderLayout } from "./storeCoverLayouts.js";

// Premium editorial covers. Every product owns a slot (storeCoverSlots.js) that
// fixes its color (OKLCH palette), its Lucide icon, and a design plan across six
// dimensions (storeCoverPlan.js): skeleton, line-art family, medallion frame,
// title style, ornament and line weight. Text color and accent are derived
// from the background so they always clear a 4.5:1 contrast.
const PLAN_DIMS = [SKELETON_COUNT, ART_COUNT, FRAME_COUNT, TITLE_COUNT, ORNAMENT_COUNT, WEIGHT_COUNT];
const SLOT_INDEX = new Map(STORE_COVER_SLOTS.map((slug, index) => [slug, index]));

function hashString(value) {
  let hash = 2166136261;
  for (const ch of String(value)) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
  return hash;
}

function slotFor(slug) {
  const known = SLOT_INDEX.get(slug);
  if (known !== undefined) return known;
  // Products added after the lists were written take a spare color after the
  // listed ones until their slug is appended to storeCoverSlots.js.
  const spare = Math.max(1, STORE_COVER_COLORS.length - STORE_COVER_SLOTS.length);
  return STORE_COVER_SLOTS.length + (hashString(slug) % spare);
}

function planFor(slot, slug) {
  const listed = STORE_COVER_PLAN[slot];
  const values = listed ?? PLAN_DIMS.map((d, i) => hashString(`${slug}:${i}`) % d);
  const [skeleton, art, frame, title, ornament, weight] = values;
  return { skeleton, art, frame, title, ornament, weight };
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

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Colors for one slot: a tonal two-stop background, a glassy plate, readable
// ink and a foil-like accent that is a tint (deep backgrounds) or a deep shade
// (light backgrounds) of the same family.
export function coverLook(slot) {
  const [L, C, H] = STORE_COVER_COLORS[slot % STORE_COVER_COLORS.length];
  const bg1 = oklchToHex(L, C, H);
  const bg2 = oklchToHex(clamp(L + (L > 0.55 ? -0.06 : 0.07), 0.12, 0.985), C * 1.04, H + 9);
  return deriveLook({ bg1, bg2, L, C, H });
}

function deriveLook({ bg1, bg2, L, C, H, plate, accent: brandAccent }) {
  const worst = (color) => Math.min(contrastRatio(color, bg1), contrastRatio(color, bg2));
  const ivory = oklchToHex(0.975, 0.012, H);
  const deepInk = oklchToHex(0.2, 0.035, H);
  const deep = worst(ivory) > worst(deepInk);
  const ink = deep ? ivory : deepInk;
  let accent;
  if (deep) {
    let al = 0.84;
    accent = oklchToHex(al, Math.min(0.12, C + 0.05), H + 14);
    while (worst(accent) < 4.5 && al < 0.97) { al += 0.02; accent = oklchToHex(al, Math.min(0.1, C + 0.04), H + 14); }
  } else {
    let al = 0.44;
    accent = oklchToHex(al, 0.13, H);
    while (worst(accent) < 4.5 && al > 0.2) { al -= 0.02; accent = oklchToHex(al, 0.12, H); }
  }
  if (brandAccent && worst(brandAccent) >= 4.5) accent = brandAccent;
  return {
    bg1, bg2, ink, accent, deep, hue: H,
    plate: plate ?? oklchToHex(clamp(L + (deep ? 0.05 : -0.045), 0.1, 0.99), C, H),
    glow: oklchToHex(clamp(L + 0.14, 0.2, 0.99), C, H),
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

// Products whose cover keeps its own brand colors. The image uploaded in the
// admin is left untouched; only the storefront rendering is swapped.
const COVER_OVERRIDES = {
  jagojualanshopee: {
    look: { bg1: "#fbf1e5", bg2: "#f2dcc3", L: 0.95, C: 0.03, H: 60, plate: "#f6e3cc", accent: "#b03509" },
    icon: "shopping-basket",
    kicker: "EBOOK · FORMAT PDF",
    title: "Jago Jualan Shopee",
    description: "Jurus anti ribet berjualan di Shopee, langkah demi langkah dalam 8 bab.",
  },
};

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
  const slug = String(product.slug || product.name || "");
  const override = COVER_OVERRIDES[product.slug];
  const slot = slotFor(slug);
  const look = override ? deriveLook(override.look) : coverLook(slot);
  const plan = planFor(slot, slug);
  const ctx = {
    ...look,
    plan,
    slot,
    seed: slot * 977 + 3,
    edition: String(slot + 1).padStart(3, "0"),
    icon: override?.icon ?? ICON_BY_SLUG[slug] ?? SPARE_ICONS[hashString(slug) % SPARE_ICONS.length],
    kicker: override?.kicker || typeLabel(product, "DIGITAL PRODUCT"),
    title: override?.title || cleanTitle(product.name),
    description: override?.description ?? product.description,
  };
  const gx = 0.2 + ((slot * 37) % 60) / 100;
  const gy = 0.15 + ((slot * 53) % 50) / 100;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">` +
    `<desc>Isra Anwar Store generated cover</desc>` +
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${look.bg1}"/><stop offset="1" stop-color="${look.bg2}"/></linearGradient>` +
    `<radialGradient id="gl" cx="${gx}" cy="${gy}" r="0.75"><stop offset="0" stop-color="${look.glow}" stop-opacity="0.5"/><stop offset="1" stop-color="${look.glow}" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="800" height="600" fill="url(#bg)"/><rect width="800" height="600" fill="url(#gl)"/>` +
    renderLayout(ctx) +
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

  const cacheKey = `${product?.slug ?? ""}::${product?.name ?? ""}::${product?.category ?? ""}::${String(product?.description ?? "").slice(0, 40)}`;
  const cached = coverCache.get(cacheKey);
  if (cached) return cached;

  const cover = generateStoreCover(product);
  coverCache.set(cacheKey, cover);
  return cover;
}
