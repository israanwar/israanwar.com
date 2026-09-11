const STORE_WATERMARK = "Isra Anwar — Store";

// One brand look for every generated cover: white canvas, ink title, one
// orange accent line. Earlier versions layered diagonal ribbons, rotated
// chip badges, grid lines, and a dark "Arcana" palette per category —
// busy and, per feedback, cheap-looking. This is deliberately plain:
// kicker, rule, headline, a faint real logo watermark. Category still
// changes the kicker label so covers stay informative per product type,
// just never the color.
const INK = "#20181b";
const MUTED = "#9a8f92";
const ACCENT = "#c95732";
const BG = "#fcfbf8";

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
  const words = String(title || "UNTITLED PRODUCT")
    .toUpperCase()
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

// Title block is bottom-anchored so 1 line and 4 lines both end at the same
// baseline instead of the headline drifting up and down per product.
function titleSvg(lines) {
  const fontSize = fontSizeFor(lines);
  const lineHeight = fontSize * 1.12;
  const baseline = 470;
  const startY = baseline - (lines.length - 1) * lineHeight;

  return lines.map((line, index) => {
    const isLast = index === lines.length - 1;
    return `<text x="80" y="${startY + index * lineHeight}" font-family="Arial Black, Arial, system-ui, sans-serif" font-size="${fontSize}" font-weight="900" fill="${isLast ? ACCENT : INK}" letter-spacing="-0.01em">${xmlEsc(line)}</text>`;
  }).join("");
}

export function generateStoreCover(product = {}) {
  const categoryKey = classifyProductKey(product);
  const kicker = String(product.category || CATEGORY_LABELS[categoryKey]).toUpperCase();
  const title = cleanTitle(product.name);
  const lines = wrapTitle(title);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">` +
    `<rect width="800" height="600" fill="${BG}"/>` +
    // A single oversized, cropped triangle echoing the logo mark's
    // silhouette — the only "decoration". An <image> reference to the real
    // PNG would be more literal, but external resources don't reliably
    // load inside an SVG used as a data: URI <img src>, and inlining the
    // file as base64 would add ~40KB to every cached cover for a corner
    // watermark nobody consciously looks at.
    `<path d="M540 620 L790 160 L900 620 Z" fill="${INK}" opacity="0.035"/>` +
    `<text x="80" y="98" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="14" font-weight="700" fill="${MUTED}" letter-spacing="3">${xmlEsc(kicker)}</text>` +
    `<rect x="80" y="114" width="44" height="3" fill="${ACCENT}"/>` +
    titleSvg(lines) +
    `<text x="80" y="536" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="12" font-weight="600" fill="${MUTED}" letter-spacing="2">${xmlEsc(STORE_WATERMARK)}</text>` +
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
