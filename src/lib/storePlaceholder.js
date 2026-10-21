import { STORE_COVER_SLOTS } from "../data/storeCoverSlots.js";
import { STORE_COVER_COLORS } from "../data/storeCoverColors.js";

// Generated covers follow the look of the real product covers: a light canvas,
// a bold headline whose last word carries the accent color, a book mockup with
// a topic glyph, and a dot grid. Every product owns a slot (see
// storeCoverSlots.js) that fixes its own background, so no two covers share
// one: slot n takes color n from a palette picked so every pair is clearly
// apart (storeCoverColors.js), the pattern cycles through eight kinds, and the
// gradient direction varies on top. Text turns white on deep backgrounds.
const INK = "#1a1a1a";
const MUTED = "#37332f";
const PAPER = "#fffdf9";

const PATTERN_COUNT = 8;
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

function patternSvg(kind, accent, slot) {
  const shift = (slot * 37) % 500;
  switch (kind) {
    case 0:
      return `<pattern id="p" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="15" cy="15" r="2.4" fill="${accent}" opacity="0.28"/></pattern><rect width="800" height="600" fill="url(#p)"/>`;
    case 1:
      return `<pattern id="p" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="28" fill="${accent}" opacity="0.10"/></pattern><rect width="800" height="600" fill="url(#p)"/>`;
    case 2: {
      let rings = "";
      for (let r = 70; r <= 560; r += 70) rings += `<circle cx="${160 + shift}" cy="560" r="${r}" fill="none" stroke="${accent}" stroke-width="3" opacity="0.16"/>`;
      return rings;
    }
    case 3:
      return `<pattern id="p" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0 H0 V44" fill="none" stroke="${accent}" stroke-width="1.6" opacity="0.2"/></pattern><rect width="800" height="600" fill="url(#p)"/>`;
    case 4: {
      let waves = "";
      for (let y = 90; y < 600; y += 70) waves += `<path d="M-20 ${y} q 40 -26 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0" fill="none" stroke="${accent}" stroke-width="3" opacity="0.17"/>`;
      return waves;
    }
    case 5:
      return `<pattern id="p" width="64" height="56" patternUnits="userSpaceOnUse"><path d="M32 8 L56 50 H8 Z" fill="none" stroke="${accent}" stroke-width="2.4" opacity="0.2"/></pattern><rect width="800" height="600" fill="url(#p)"/>`;
    case 6:
      return `<pattern id="p" width="46" height="46" patternUnits="userSpaceOnUse"><path d="M23 14 V32 M14 23 H32" stroke="${accent}" stroke-width="3" stroke-linecap="round" opacity="0.24"/></pattern><rect width="800" height="600" fill="url(#p)"/>`;
    default:
      return `<circle cx="${60 + (shift % 200)}" cy="560" r="230" fill="${accent}" opacity="0.1"/><circle cx="760" cy="60" r="${150 + (slot % 5) * 14}" fill="${accent}" opacity="0.1"/><circle cx="400" cy="660" r="150" fill="${accent}" opacity="0.08"/>`;
  }
}

// Background and colors for one slot. Exported so tests can prove that every
// slot looks different.
export function coverBackground(slot) {
  const [hue, sat, light] = STORE_COVER_COLORS[slot % STORE_COVER_COLORS.length];
  const kind = slot % PATTERN_COUNT;
  const angle = (slot * 47) % 360;
  const from = hsl(hue, sat, light);
  const to = hsl(hue, sat, Math.max(30, light - 7));
  // Text color is whichever reads better on the darker end of the gradient;
  // the accent line steps darker until it clears 4.5:1 on both ends.
  const worst = (color) => Math.min(contrastRatio(color, from), contrastRatio(color, to));
  const deep = worst("#ffffff") > worst(INK);
  const ink = deep ? "#ffffff" : INK;
  const muted = deep ? "#f1f1f1" : MUTED;
  const accentCandidates = deep ? ["#ffffff"] : [30, 22, 15, 8].map((l) => hsl(hue, 85, l));
  const canvasAccent = accentCandidates.find((color) => worst(color) >= 4.5) ?? ink;
  const accent = hsl(hue, 78, 34);
  const tint = hsl(hue, 70, 88);
  const rad = (angle * Math.PI) / 180;
  const gradient =
    `<defs><linearGradient id="g" x1="${(0.5 - Math.cos(rad) / 2).toFixed(3)}" y1="${(0.5 - Math.sin(rad) / 2).toFixed(3)}" x2="${(0.5 + Math.cos(rad) / 2).toFixed(3)}" y2="${(0.5 + Math.sin(rad) / 2).toFixed(3)}">` +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
    `<rect width="800" height="600" fill="url(#g)"/>`;
  return {
    hue, kind, accent, tint, canvasAccent, ink, muted, deep, from, to,
    svg: gradient + patternSvg(kind, deep ? "#ffffff" : canvasAccent, slot),
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

const CATEGORY_LABELS = {
  google: "SEO & GROWTH SYSTEM",
  music: "MUSIC & AUDIO",
  workflow: "WORKFLOW KIT",
  commerce: "GROWTH KIT",
  default: "DIGITAL PRODUCT",
};

const GOOGLE_WORDS = [
  "google",
  "adsense",
  "ad sense",
  "search engine",
  "search console",
  "analytics",
  "ga4",
  "tag manager",
  "youtube",
  "seo",
  "sem",
];

const MUSIC_WORDS = [
  "music",
  "musik",
  "soundon",
  "tunecore",
  "spotify",
  "apple music",
  "audio",
  "song",
  "lagu",
  "streaming",
  "royalty",
  "artist",
];

const WORKFLOW_WORDS = [
  "workflow",
  "automation",
  "automasi",
  "ai",
  "prompt",
  "notion",
  "excel",
  "dashboard",
  "template",
  "checklist",
  "worksheet",
  "workbook",
  "planner",
  "framework",
  "playbook",
  "sop",
  "productivity",
  "operating",
  "calendar",
  "system",
];

const COMMERCE_WORDS = [
  "ecommerce",
  "e-commerce",
  "marketplace",
  "sales",
  "funnel",
  "launch",
  "ads",
  "marketing",
  "brand",
  "branding",
  "copywriting",
  "content",
  "affiliate",
  "business",
];

function xmlEsc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function hasAny(text, words) {
  return words.some((word) => text.includes(word));
}

function cleanTitle(name) {
  return String(name || "Untitled Product")
    .replace(/^(module|modul)\s*:\s*/i, "")
    .replace(/^bundle\s*:\s*/i, "Bundle ")
    .replace(/\s+/g, " ")
    .trim();
}

function classifyProductKey(product = {}) {
  const identity = [
    product.slug,
    product.name,
    product.category,
  ].join(" ").toLowerCase();
  const fullText = [
    identity,
    product.description,
  ].join(" ").toLowerCase();

  if (hasAny(fullText, MUSIC_WORDS)) return "music";
  if (hasAny(identity, GOOGLE_WORDS)) return "google";
  if (hasAny(identity, WORKFLOW_WORDS)) return "workflow";
  if (hasAny(identity, COMMERCE_WORDS)) return "commerce";
  return "default";
}

function wrapTitle(title, maxCharsPerLine = 15, maxLines = 4) {
  const words = String(title || "Untitled Product")
    .replace(/\s*&\s*/g, " & ")
    .split(/\s+/)
    .filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const next = (line + " " + word).trim();
    if (next.length > maxCharsPerLine && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
    if (lines.length === maxLines) break;
  }

  if (line && lines.length < maxLines) lines.push(line);
  if (words.join(" ").length > lines.join(" ").length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/\.+$/, "")}...`;
  }
  return lines;
}

function fontSizeFor(lines) {
  const base = lines.length <= 1 ? 68 : lines.length === 2 ? 54 : lines.length === 3 ? 44 : 37;
  const longest = Math.max(1, ...lines.map((line) => line.length));
  const maxWidth = lines.length <= 1 ? 600 : 560;
  const charRatio = lines.length <= 1 ? 0.62 : 0.72;
  const fitted = Math.floor(maxWidth / (longest * charRatio));
  return Math.max(32, Math.min(base, fitted));
}

function typeLabel(product, fallback) {
  const prefix = String(product.slug || "").split("-")[0].toLowerCase();
  return TYPE_LABELS[prefix] || String(product.category || fallback).toUpperCase();
}

// Headline sits on the left; the last line takes the accent color, like the
// real covers.
function titleSvg(lines, accent, ink) {
  const longest = Math.max(1, ...lines.map((line) => line.length));
  const fitted = Math.floor(400 / (longest * 0.58));
  const fontSize = Math.max(34, Math.min(lines.length <= 2 ? 66 : lines.length === 3 ? 56 : 46, fitted));
  const lineHeight = fontSize * 1.08;
  const baseline = 440;
  const startY = baseline - (lines.length - 1) * lineHeight;

  return lines.map((line, index) => {
    const isLast = index === lines.length - 1;
    return `<text x="60" y="${(startY + index * lineHeight).toFixed(1)}" font-family="Helvetica Neue, Helvetica, Arial, system-ui, sans-serif" font-size="${fontSize}" font-weight="800" fill="${isLast ? accent : ink}" letter-spacing="-1.5">${xmlEsc(line)}</text>`;
  }).join("");
}

function glyphSvg(key, accent) {
  const stroke = (width = 8) => `fill="none" stroke="${accent}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;
  switch (key) {
    case "google":
      return `<circle cx="610" cy="250" r="30" ${stroke()}/><path d="M632 272 L654 294" ${stroke()}/>`;
    case "music":
      return `<ellipse cx="598" cy="290" rx="14" ry="10" fill="${accent}"/><ellipse cx="642" cy="280" rx="14" ry="10" fill="${accent}"/>` +
        `<path d="M610 290 V228 M654 280 V218" ${stroke()}/><path d="M610 228 L654 218 V232 L610 242 Z" fill="${accent}"/>`;
    case "workflow":
      return `<path d="M595 235 L645 235 M595 235 L620 290 M645 235 L620 290" ${stroke(5)}/>` +
        `<circle cx="595" cy="235" r="17" fill="${accent}"/><circle cx="645" cy="235" r="17" fill="${accent}"/><circle cx="620" cy="290" r="17" fill="${accent}"/>`;
    case "commerce":
      return `<rect x="590" y="244" width="60" height="54" rx="9" fill="${accent}"/><path d="M604 244 Q604 216 620 216 Q636 216 636 244" ${stroke(6)}/>`;
    default:
      return `<rect x="596" y="222" width="48" height="68" rx="7" ${stroke(7)}/><path d="M608 244 H632 M608 258 H632 M608 272 H624" ${stroke(5)}/>`;
  }
}

function dotGrid(accent) {
  let dots = "";
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 7; col++) {
      dots += `<circle cx="${548 + col * 30}" cy="${62 + row * 30}" r="3" fill="${accent}" opacity="0.55"/>`;
    }
  }
  return dots;
}

export function generateStoreCover(product = {}) {
  const categoryKey = classifyProductKey(product);
  const { accent, tint, canvasAccent, ink, muted, deep, svg: background } = coverBackground(slotFor(String(product.slug || product.name || "")));
  const kicker = typeLabel(product, CATEGORY_LABELS[categoryKey]);
  const lines = wrapTitle(cleanTitle(product.name), 14, 4);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">` +
    `<desc>Isra Anwar Store generated cover</desc>` +
    background +
    `<rect width="800" height="12" fill="${canvasAccent}"/>` +
    `<circle cx="620" cy="320" r="190" fill="#ffffff" opacity="${deep ? 0.18 : 0.4}"/>` +
    dotGrid(canvasAccent) +
    `<text x="60" y="78" font-family="Helvetica Neue, Helvetica, Arial, system-ui, sans-serif" font-size="19" font-weight="700" fill="${canvasAccent}" letter-spacing="5">${xmlEsc(kicker)}</text>` +
    `<rect x="60" y="98" width="52" height="5" fill="${canvasAccent}"/>` +
    // Book mockup: page edge, soft shadow, cover, accent top bar.
    `<rect x="508" y="146" width="244" height="346" rx="3" fill="#000" opacity="0.08"/>` +
    `<rect x="506" y="132" width="244" height="346" rx="3" fill="#efe6d6"/>` +
    `<rect x="500" y="126" width="244" height="346" rx="3" fill="${PAPER}"/>` +
    `<rect x="500" y="126" width="244" height="10" fill="${accent}"/>` +
    `<rect x="500" y="136" width="14" height="336" fill="#000" opacity="0.05"/>` +
    `<circle cx="622" cy="255" r="78" fill="${tint}"/>` +
    glyphSvg(categoryKey, accent) +
    `<rect x="540" y="372" width="164" height="7" rx="3.5" fill="${INK}" opacity="0.85"/>` +
    `<rect x="540" y="392" width="120" height="7" rx="3.5" fill="${INK}" opacity="0.25"/>` +
    `<rect x="540" y="412" width="140" height="7" rx="3.5" fill="${INK}" opacity="0.25"/>` +
    `<text x="540" y="452" font-family="Helvetica Neue, Helvetica, Arial, system-ui, sans-serif" font-size="12" font-weight="700" fill="${accent}" letter-spacing="3">ISRA ANWAR</text>` +
    titleSvg(lines, canvasAccent, ink) +
    `<rect x="60" y="520" width="680" height="1.5" fill="${ink}" opacity="0.2"/>` +
    `<path d="M60 566 L82 534 L94 551 L106 566 Z" fill="${ink}"/>` +
    `<text x="120" y="563" font-family="Helvetica Neue, Helvetica, Arial, system-ui, sans-serif" font-size="20" font-weight="700" fill="${muted}" letter-spacing="4">ISRAANWAR.COM</text>` +
    `<text x="740" y="563" text-anchor="end" font-family="Helvetica Neue, Helvetica, Arial, system-ui, sans-serif" font-size="20" font-weight="600" fill="${muted}" letter-spacing="3">2026</text>` +
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
    product?.image_url
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
