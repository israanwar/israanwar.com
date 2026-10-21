// Generated covers follow the look of the real product covers: a warm light
// canvas, a bold headline whose last word carries the accent color, a book
// mockup with a simple glyph, and a dot grid. The accent hue changes with the
// product family so the catalog is colorful instead of one flat tone.
const INK = "#1a1a1a";
const MUTED = "#6b6560";
const PAPER = "#fffdf9";

const PALETTES = {
  google: { accent: "#2563eb", bg: "#eef3fc", tint: "#dbe6fa" },
  music: { accent: "#7c3aed", bg: "#f4effd", tint: "#e6dafb" },
  workflow: { accent: "#0f9d6e", bg: "#ecf7f2", tint: "#d3eee3" },
  commerce: { accent: "#e8541e", bg: "#fcf3ec", tint: "#f5e2d2" },
  default: { accent: "#db2777", bg: "#fdeff5", tint: "#f9d9e7" },
  indigo: { accent: "#4f46e5", bg: "#eef0fe", tint: "#dcdffb" },
  teal: { accent: "#0891b2", bg: "#ecf8fb", tint: "#d2edf4" },
  amber: { accent: "#d97706", bg: "#fdf6e8", tint: "#f8e8c6" },
};

// Hue follows the product type so a catalog of mostly "workflow"-style
// products does not collapse into one color. Music and Google/SEO keep their
// own hues; the glyph still follows the topic.
const TYPE_PALETTES = {
  ebook: "commerce", modul: "commerce", bizdoc: "commerce",
  bundle: "default", mkt: "default", brand: "default",
  tpl: "teal", prod: "teal", planner: "teal", print: "teal",
  checklist: "workflow", sop: "workflow", guideline: "workflow", playbook: "workflow",
  framework: "indigo", workbook: "indigo", worksheet: "indigo",
  blueprint: "amber", research: "amber",
  prompt: "music", swipe: "music",
};

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
function titleSvg(lines, accent) {
  const longest = Math.max(1, ...lines.map((line) => line.length));
  const fitted = Math.floor(400 / (longest * 0.58));
  const fontSize = Math.max(34, Math.min(lines.length <= 2 ? 66 : lines.length === 3 ? 56 : 46, fitted));
  const lineHeight = fontSize * 1.08;
  const baseline = 440;
  const startY = baseline - (lines.length - 1) * lineHeight;

  return lines.map((line, index) => {
    const isLast = index === lines.length - 1;
    return `<text x="60" y="${(startY + index * lineHeight).toFixed(1)}" font-family="Helvetica Neue, Helvetica, Arial, system-ui, sans-serif" font-size="${fontSize}" font-weight="800" fill="${isLast ? accent : INK}" letter-spacing="-1.5">${xmlEsc(line)}</text>`;
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
  const prefix = String(product.slug || "").split("-")[0].toLowerCase();
  const paletteKey = categoryKey === "google" || categoryKey === "music" ? categoryKey : TYPE_PALETTES[prefix] || categoryKey;
  const { accent, bg, tint } = PALETTES[paletteKey] || PALETTES.default;
  const kicker = typeLabel(product, CATEGORY_LABELS[categoryKey]);
  const lines = wrapTitle(cleanTitle(product.name), 14, 4);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">` +
    `<desc>Isra Anwar Store generated cover</desc>` +
    `<rect width="800" height="600" fill="${bg}"/>` +
    `<rect width="800" height="12" fill="${accent}"/>` +
    `<circle cx="620" cy="320" r="190" fill="${tint}"/>` +
    dotGrid(accent) +
    `<text x="60" y="78" font-family="Helvetica Neue, Helvetica, Arial, system-ui, sans-serif" font-size="19" font-weight="700" fill="${accent}" letter-spacing="5">${xmlEsc(kicker)}</text>` +
    `<rect x="60" y="98" width="52" height="5" fill="${accent}"/>` +
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
    titleSvg(lines, accent) +
    `<rect x="60" y="520" width="680" height="1.5" fill="#000" opacity="0.12"/>` +
    `<path d="M60 566 L82 534 L94 551 L106 566 Z" fill="${INK}"/>` +
    `<text x="120" y="563" font-family="Helvetica Neue, Helvetica, Arial, system-ui, sans-serif" font-size="20" font-weight="700" fill="${MUTED}" letter-spacing="4">ISRAANWAR.COM</text>` +
    `<text x="740" y="563" text-anchor="end" font-family="Helvetica Neue, Helvetica, Arial, system-ui, sans-serif" font-size="20" font-weight="600" fill="${MUTED}" letter-spacing="3">2026</text>` +
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
