const BRAND = {
  black: "#050506",
  ink: "#d9dbde",
  muted: "#777d85",
  line: "#ffffff",
  watermark: "ISRA ANWAR JOURNAL",
};

const CATEGORY_PRESETS = {
  "search-optimization": {
    label: "SEARCH FIELD",
    motif: "search",
    primary: "#56636f",
    secondary: "#3d4751",
    accent: "#4c453a",
    deep: "#070809",
    panel: "#171a1e",
  },
  "ai-automation": {
    label: "AGENT SYSTEM",
    motif: "network",
    primary: "#3d4751",
    secondary: "#56636f",
    accent: "#4c453a",
    deep: "#050608",
    panel: "#161a1f",
  },
  "web-development": {
    label: "MODERN WEB",
    motif: "browser",
    primary: "#53616e",
    secondary: "#777d85",
    accent: "#3d4751",
    deep: "#0a0e12",
    panel: "#171d23",
  },
  "digital-marketing": {
    label: "FUNNEL SIGNAL",
    motif: "campaign",
    primary: "#777d85",
    secondary: "#4b555d",
    accent: "#3d4751",
    deep: "#0e1216",
    panel: "#1d2228",
  },
  "branding-marketing-selling": {
    label: "POSITIONING",
    motif: "campaign",
    primary: "#56636f",
    secondary: "#4c453a",
    accent: "#3d4751",
    deep: "#0a0c0f",
    panel: "#1d2125",
  },
  "e-commerce": {
    label: "COMMERCE FLOW",
    motif: "commerce",
    primary: "#4c453a",
    secondary: "#777d85",
    accent: "#3d4751",
    deep: "#080706",
    panel: "#201d19",
  },
  "analytics-cro": {
    label: "DATA SIGNAL",
    motif: "chart",
    primary: "#3d4751",
    secondary: "#4c453a",
    accent: "#777d85",
    deep: "#0d1013",
    panel: "#161a1f",
  },
  "case-studies": {
    label: "BEFORE AFTER",
    motif: "process",
    primary: "#777d85",
    secondary: "#3d4751",
    accent: "#4c453a",
    deep: "#0e0e0e",
    panel: "#1b1f23",
  },
  "business-strategy": {
    label: "STRATEGY MAP",
    motif: "process",
    primary: "#4c453a",
    secondary: "#3d4751",
    accent: "#56636f",
    deep: "#0d0c0b",
    panel: "#191714",
  },
  "management-leadership": {
    label: "DECISION FIELD",
    motif: "network",
    primary: "#4b555d",
    secondary: "#3d4751",
    accent: "#777d85",
    deep: "#0d0c0b",
    panel: "#201d19",
  },
  "technology-innovation": {
    label: "FRONTIER TECH",
    motif: "network",
    primary: "#3d4751",
    secondary: "#454f59",
    accent: "#777d85",
    deep: "#0a0c0f",
    panel: "#161a1f",
  },
  "research-insights": {
    label: "EVIDENCE MAP",
    motif: "editorial",
    primary: "#4c453a",
    secondary: "#3d4751",
    accent: "#777d85",
    deep: "#080808",
    panel: "#18191b",
  },
  "books-reviews": {
    label: "READING NOTE",
    motif: "books",
    primary: "#4b555d",
    secondary: "#777d85",
    accent: "#3d4751",
    deep: "#0d0c0b",
    panel: "#201d19",
  },
  "economics-public-policy": {
    label: "ECONOMY LINE",
    motif: "chart",
    primary: "#4c453a",
    secondary: "#3d4751",
    accent: "#777d85",
    deep: "#080a0c",
    panel: "#191714",
  },
  "opinion-philosophy": {
    label: "ESSAY FIELD",
    motif: "editorial",
    primary: "#777d85",
    secondary: "#454f59",
    accent: "#3d4751",
    deep: "#0a0c0f",
    panel: "#161a1f",
  },
  "company-news": {
    label: "ISRA ANWAR UPDATE",
    motif: "broadcast",
    primary: "#56636f",
    secondary: "#3d4751",
    accent: "#4c453a",
    deep: "#0a0c0f",
    panel: "#1d2125",
  },
};

const FALLBACK_PRESETS = [
  CATEGORY_PRESETS["opinion-philosophy"],
  CATEGORY_PRESETS["analytics-cro"],
  CATEGORY_PRESETS["technology-innovation"],
  CATEGORY_PRESETS["business-strategy"],
];

function xmlEsc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function hashString(value) {
  let hash = 0;
  const input = String(value ?? "");
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function categoryLabel(value) {
  return String(value || "Journal")
    .replace(/&/g, "and")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function compactLabel(value, max = 24) {
  const label = categoryLabel(value);
  if (label.length <= max) return label;
  return `${label.slice(0, Math.max(1, max - 3)).trim()}...`;
}

function categoryInitials(value) {
  const skip = new Set(["AND", "THE", "OF", "FOR"]);
  const words = categoryLabel(value)
    .replace(/[^A-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !skip.has(word));

  if (words.length === 0) return "OK";
  if (words.length === 1) return words[0].slice(0, 2);
  return words.map((word) => word[0]).join("").slice(0, 3);
}

function presetFor(categorySlug, seed) {
  if (categorySlug && CATEGORY_PRESETS[categorySlug]) return CATEGORY_PRESETS[categorySlug];
  return FALLBACK_PRESETS[seed % FALLBACK_PRESETS.length];
}

function seeded(seed, index, min, max) {
  const span = max - min;
  const raw = Math.floor(seed / (index * 37 + 11)) % 1000;
  return min + (raw / 1000) * span;
}

function meshLines(seed, preset) {
  return Array.from({ length: 6 }, (_, index) => {
    const y = 130 + index * 70 + seeded(seed, index + 1, -18, 18);
    const amp = seeded(seed, index + 3, 26, 72);
    const width = index % 2 === 0 ? 3 : 6;
    const color = index % 3 === 0 ? preset.primary : index % 3 === 1 ? preset.secondary : preset.accent;
    return `<path d="M-90 ${y.toFixed(1)} C 168 ${(y - amp).toFixed(1)} 340 ${(y + amp).toFixed(1)} 518 ${y.toFixed(1)} S 820 ${(y - amp * 0.45).toFixed(1)} 1090 ${(y + amp * 0.28).toFixed(1)}" fill="none" stroke="${color}" stroke-opacity="${0.1 + index * 0.018}" stroke-width="${width}" stroke-linecap="round"/>`;
  }).join("");
}

function chartMotif(seed, preset) {
  const heights = [96, 138, 74, 164, 118].map((height, index) => height + Math.round(seeded(seed, index + 1, -18, 18)));
  const bars = heights.map((height, index) => (
    `<rect x="${20 + index * 46}" y="${176 - height}" width="24" height="${height}" rx="8" fill="${index % 2 ? preset.primary : preset.secondary}" fill-opacity="${index % 2 ? 0.72 : 0.48}"/>`
  )).join("");

  return (
    `<g transform="translate(560 222)">` +
    `<rect x="-28" y="-42" width="306" height="240" rx="24" fill="${BRAND.black}" fill-opacity="0.46" stroke="${preset.secondary}" stroke-opacity="0.26"/>` +
    `<path d="M20 148 L66 126 L112 138 L158 86 L204 102 L250 54" fill="none" stroke="${preset.accent}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.92"/>` +
    bars +
    `<path d="M18 178 H256" stroke="${BRAND.line}" stroke-opacity="0.16" stroke-width="2"/>` +
    `</g>`
  );
}

function networkMotif(seed, preset) {
  const nodes = [
    [28, 78], [112, 24], [214, 66], [76, 170], [190, 166], [266, 116],
  ];
  const shiftedNodes = nodes.map(([x, y], index) => [x + seeded(seed, index + 1, -10, 10), y + seeded(seed, index + 7, -10, 10)]);
  const lines = [[0, 1], [1, 2], [0, 3], [3, 4], [2, 5], [4, 5], [1, 4]].map(([a, b]) => (
    `<path d="M${shiftedNodes[a][0].toFixed(1)} ${shiftedNodes[a][1].toFixed(1)} L${shiftedNodes[b][0].toFixed(1)} ${shiftedNodes[b][1].toFixed(1)}" stroke="${preset.secondary}" stroke-opacity="0.34" stroke-width="3"/>`
  )).join("");
  const nodeSvg = shiftedNodes.map(([x, y], index) => (
    `<rect x="${(x - 12).toFixed(1)}" y="${(y - 12).toFixed(1)}" width="24" height="24" rx="7" fill="${index % 2 ? preset.primary : preset.accent}" fill-opacity="${index % 2 ? 0.82 : 0.58}" stroke="${BRAND.line}" stroke-opacity="0.16"/>`
  )).join("");

  return (
    `<g transform="translate(560 214)">` +
    `<rect x="-28" y="-34" width="342" height="254" rx="28" fill="${BRAND.black}" fill-opacity="0.42" stroke="${preset.primary}" stroke-opacity="0.24"/>` +
    lines +
    nodeSvg +
    `<path d="M26 216 H286" stroke="${preset.primary}" stroke-opacity="0.36" stroke-width="2" stroke-dasharray="10 12"/>` +
    `</g>`
  );
}

function searchMotif(seed, preset) {
  const ring = 72 + Math.round(seeded(seed, 2, -8, 14));
  return (
    `<g transform="translate(570 214)">` +
    `<rect x="-38" y="-32" width="330" height="246" rx="28" fill="${BRAND.black}" fill-opacity="0.42" stroke="${preset.secondary}" stroke-opacity="0.24"/>` +
    `<circle cx="118" cy="86" r="${ring}" fill="none" stroke="${preset.primary}" stroke-opacity="0.78" stroke-width="12"/>` +
    `<circle cx="118" cy="86" r="${Math.max(34, ring - 34)}" fill="none" stroke="${preset.secondary}" stroke-opacity="0.42" stroke-width="4" stroke-dasharray="14 12"/>` +
    `<path d="M172 142 L244 214" stroke="${preset.accent}" stroke-width="16" stroke-linecap="round" opacity="0.82"/>` +
    `<path d="M28 34 H208 M28 186 H186" stroke="${BRAND.line}" stroke-opacity="0.12" stroke-width="2"/>` +
    `</g>`
  );
}

function browserMotif(seed, preset) {
  const lineWidths = [170, 108, 210, 134].map((width, index) => width + Math.round(seeded(seed, index + 2, -22, 22)));
  const lines = lineWidths.map((width, index) => (
    `<rect x="36" y="${72 + index * 34}" width="${width}" height="10" rx="5" fill="${index % 2 ? preset.primary : preset.secondary}" fill-opacity="${index % 2 ? 0.66 : 0.38}"/>`
  )).join("");

  return (
    `<g transform="translate(548 210)">` +
    `<rect x="-18" y="-18" width="330" height="246" rx="24" fill="${BRAND.black}" fill-opacity="0.46" stroke="${preset.primary}" stroke-opacity="0.24"/>` +
    `<rect x="16" y="20" width="260" height="182" rx="18" fill="${preset.panel}" stroke="${BRAND.line}" stroke-opacity="0.16"/>` +
    `<path d="M16 58 H276" stroke="${BRAND.line}" stroke-opacity="0.12" stroke-width="2"/>` +
    `<circle cx="42" cy="39" r="5" fill="${preset.primary}"/><circle cx="62" cy="39" r="5" fill="${preset.secondary}" opacity="0.76"/><circle cx="82" cy="39" r="5" fill="${preset.accent}" opacity="0.72"/>` +
    lines +
    `<rect x="36" y="168" width="88" height="18" rx="9" fill="${preset.accent}" fill-opacity="0.68"/>` +
    `</g>`
  );
}

function campaignMotif(seed, preset) {
  const tilt = seeded(seed, 3, -8, 8);
  return (
    `<g transform="translate(552 210) rotate(${tilt.toFixed(1)} 140 112)">` +
    `<rect x="-24" y="-24" width="332" height="246" rx="28" fill="${BRAND.black}" fill-opacity="0.42" stroke="${preset.primary}" stroke-opacity="0.24"/>` +
    `<path d="M36 166 L250 52 L250 204 Z" fill="${preset.primary}" fill-opacity="0.2" stroke="${preset.primary}" stroke-opacity="0.52" stroke-width="3"/>` +
    `<path d="M52 152 L230 74 M74 168 L244 116 M96 184 L238 164" stroke="${preset.secondary}" stroke-opacity="0.5" stroke-width="5" stroke-linecap="round"/>` +
    `<rect x="26" y="58" width="118" height="42" rx="12" fill="${preset.accent}" fill-opacity="0.72"/>` +
    `<rect x="34" y="114" width="86" height="20" rx="10" fill="${BRAND.line}" fill-opacity="0.14"/>` +
    `</g>`
  );
}

function commerceMotif(seed, preset) {
  const offset = Math.round(seeded(seed, 4, -8, 10));
  return (
    `<g transform="translate(552 208)">` +
    `<rect x="-18" y="-24" width="330" height="252" rx="28" fill="${BRAND.black}" fill-opacity="0.42" stroke="${preset.secondary}" stroke-opacity="0.25"/>` +
    `<rect x="38" y="26" width="220" height="138" rx="22" fill="${preset.panel}" stroke="${BRAND.line}" stroke-opacity="0.16"/>` +
    `<rect x="62" y="54" width="84" height="18" rx="9" fill="${preset.primary}" fill-opacity="0.78"/>` +
    `<rect x="62" y="90" width="${142 + offset}" height="12" rx="6" fill="${BRAND.line}" fill-opacity="0.18"/>` +
    `<rect x="62" y="118" width="${104 - offset}" height="12" rx="6" fill="${BRAND.line}" fill-opacity="0.14"/>` +
    `<rect x="186" y="48" width="46" height="46" rx="12" fill="${preset.secondary}" fill-opacity="0.52"/>` +
    `<path d="M74 188 H246" stroke="${preset.accent}" stroke-width="16" stroke-linecap="round" opacity="0.8"/>` +
    `</g>`
  );
}

function processMotif(seed, preset) {
  const yShift = seeded(seed, 4, -12, 12);
  return (
    `<g transform="translate(548 216)">` +
    `<rect x="-22" y="-30" width="338" height="246" rx="28" fill="${BRAND.black}" fill-opacity="0.42" stroke="${preset.primary}" stroke-opacity="0.24"/>` +
    `<path d="M34 ${(150 + yShift).toFixed(1)} C98 64 162 224 230 92 L284 42" fill="none" stroke="${preset.secondary}" stroke-opacity="0.62" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<rect x="26" y="36" width="92" height="54" rx="15" fill="${preset.primary}" fill-opacity="0.48"/>` +
    `<rect x="124" y="116" width="92" height="54" rx="15" fill="${preset.accent}" fill-opacity="0.58"/>` +
    `<rect x="220" y="64" width="72" height="96" rx="18" fill="${preset.secondary}" fill-opacity="0.42"/>` +
    `<path d="M50 190 H270" stroke="${BRAND.line}" stroke-opacity="0.13" stroke-width="2" stroke-dasharray="8 10"/>` +
    `</g>`
  );
}

function editorialMotif(seed, preset) {
  const lift = Math.round(seeded(seed, 4, -12, 12));
  return (
    `<g transform="translate(556 208)">` +
    `<rect x="-26" y="-28" width="336" height="252" rx="28" fill="${BRAND.black}" fill-opacity="0.42" stroke="${preset.secondary}" stroke-opacity="0.25"/>` +
    `<rect x="40" y="${34 + lift}" width="156" height="182" rx="18" fill="${preset.panel}" stroke="${BRAND.line}" stroke-opacity="0.16"/>` +
    `<rect x="82" y="10" width="156" height="182" rx="18" fill="${BRAND.black}" fill-opacity="0.42" stroke="${preset.primary}" stroke-opacity="0.42"/>` +
    `<path d="M106 58 H204 M106 88 H226 M106 118 H190 M106 148 H214" stroke="${preset.accent}" stroke-opacity="0.58" stroke-width="8" stroke-linecap="round"/>` +
    `<path d="M50 62 C84 32 112 34 134 66" fill="none" stroke="${preset.secondary}" stroke-opacity="0.48" stroke-width="5" stroke-linecap="round"/>` +
    `</g>`
  );
}

function booksMotif(seed, preset) {
  const bookWidths = [38, 52, 44, 60, 42].map((width, index) => width + Math.round(seeded(seed, index + 1, -5, 7)));
  const books = bookWidths.map((width, index) => {
    const x = 50 + index * 44;
    const color = index % 3 === 0 ? preset.primary : index % 3 === 1 ? preset.secondary : preset.accent;
    return `<rect x="${x}" y="${46 + index * 8}" width="${width}" height="${164 - index * 8}" rx="12" fill="${color}" fill-opacity="${index % 2 ? 0.5 : 0.72}"/><path d="M${x + 12} ${76 + index * 8} V${176}" stroke="${BRAND.black}" stroke-opacity="0.32" stroke-width="3"/>`;
  }).join("");

  return (
    `<g transform="translate(552 208)">` +
    `<rect x="-18" y="-24" width="330" height="252" rx="28" fill="${BRAND.black}" fill-opacity="0.42" stroke="${preset.secondary}" stroke-opacity="0.25"/>` +
    books +
    `<path d="M42 220 H266" stroke="${BRAND.line}" stroke-opacity="0.14" stroke-width="3"/>` +
    `</g>`
  );
}

function broadcastMotif(seed, preset) {
  const pulse = Math.round(seeded(seed, 5, -12, 12));
  return (
    `<g transform="translate(558 212)">` +
    `<rect x="-28" y="-30" width="336" height="250" rx="28" fill="${BRAND.black}" fill-opacity="0.42" stroke="${preset.primary}" stroke-opacity="0.25"/>` +
    `<rect x="42" y="60" width="156" height="104" rx="22" fill="${preset.panel}" stroke="${BRAND.line}" stroke-opacity="0.16"/>` +
    `<path d="M198 ${112 + pulse} C232 76 258 58 290 48 M198 ${112 + pulse} C238 114 264 142 292 178" fill="none" stroke="${preset.secondary}" stroke-opacity="0.54" stroke-width="8" stroke-linecap="round"/>` +
    `<path d="M78 112 H166 M78 138 H144" stroke="${preset.accent}" stroke-opacity="0.7" stroke-width="10" stroke-linecap="round"/>` +
    `<rect x="70" y="190" width="164" height="14" rx="7" fill="${preset.primary}" fill-opacity="0.7"/>` +
    `</g>`
  );
}

function motifSvg(type, seed, preset) {
  if (type === "chart") return chartMotif(seed, preset);
  if (type === "network") return networkMotif(seed, preset);
  if (type === "search") return searchMotif(seed, preset);
  if (type === "browser") return browserMotif(seed, preset);
  if (type === "campaign") return campaignMotif(seed, preset);
  if (type === "commerce") return commerceMotif(seed, preset);
  if (type === "process") return processMotif(seed, preset);
  if (type === "books") return booksMotif(seed, preset);
  if (type === "broadcast") return broadcastMotif(seed, preset);
  return editorialMotif(seed, preset);
}

export function generateBlogCover({ title, category = "", categorySlug = "", slug = "" }) {
  const seed = hashString(`${slug}|${title}|${category}|${categorySlug}`);
  const preset = presetFor(categorySlug, seed);
  const id = `okrCover${seed}`;
  const labelSource = category || preset.label;
  const label = compactLabel(labelSource);
  const initials = categoryInitials(labelSource);
  const issue = seed % 3 === 0 ? "FIELD NOTE" : seed % 3 === 1 ? "SIGNAL MAP" : "WORKING PAPER";
  const serial = String((seed % 89) + 11).padStart(2, "0");

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 625" preserveAspectRatio="xMidYMid slice">` +
    `<title>${xmlEsc(title || "Isra Anwar Journal cover")}</title>` +
    `<defs>` +
    `<linearGradient id="${id}-bg" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${preset.deep}"/>` +
    `<stop offset="0.52" stop-color="${BRAND.black}"/>` +
    `<stop offset="1" stop-color="${preset.panel}"/>` +
    `</linearGradient>` +
    `<linearGradient id="${id}-type" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${preset.primary}"/>` +
    `<stop offset="0.58" stop-color="${preset.secondary}"/>` +
    `<stop offset="1" stop-color="${preset.accent}"/>` +
    `</linearGradient>` +
    `<pattern id="${id}-grid" width="34" height="34" patternUnits="userSpaceOnUse">` +
    `<path d="M34 0H0V34" fill="none" stroke="${BRAND.line}" stroke-opacity="0.06" stroke-width="1"/>` +
    `</pattern>` +
    `<filter id="${id}-soften" x="-20%" y="-20%" width="140%" height="140%">` +
    `<feGaussianBlur stdDeviation="18"/>` +
    `</filter>` +
    `</defs>` +
    `<rect width="1000" height="625" fill="url(#${id}-bg)"/>` +
    `<rect width="1000" height="625" fill="url(#${id}-grid)" opacity="0.7"/>` +
    `<path d="M-80 506 C160 428 306 556 528 468 C706 398 826 428 1088 336" fill="none" stroke="${preset.primary}" stroke-opacity="0.18" stroke-width="42" filter="url(#${id}-soften)"/>` +
    `<path d="M-70 142 C160 76 310 180 520 100 C702 32 828 80 1078 28" fill="none" stroke="${preset.secondary}" stroke-opacity="0.16" stroke-width="34" filter="url(#${id}-soften)"/>` +
    `<rect x="70" y="58" width="860" height="510" rx="34" fill="${BRAND.black}" fill-opacity="0.58" stroke="${BRAND.line}" stroke-opacity="0.12"/>` +
    `<path d="M70 154 H930" stroke="${BRAND.line}" stroke-opacity="0.1" stroke-width="2"/>` +
    meshLines(seed, preset) +
    `<rect x="120" y="96" width="292" height="48" rx="14" fill="${preset.primary}" fill-opacity="0.16" stroke="${preset.primary}" stroke-opacity="0.44"/>` +
    `<text x="146" y="126" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="800" fill="${BRAND.ink}" letter-spacing="3">${xmlEsc(label)}</text>` +
    `<rect x="690" y="96" width="182" height="48" rx="14" fill="${BRAND.black}" fill-opacity="0.54" stroke="${preset.secondary}" stroke-opacity="0.35"/>` +
    `<text x="781" y="126" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="12" font-weight="800" fill="${preset.secondary}" letter-spacing="2">${xmlEsc(issue)}</text>` +
    `<text x="118" y="432" font-family="Plus Jakarta Sans, Inter, ui-sans-serif, system-ui, sans-serif" font-size="180" font-weight="800" fill="url(#${id}-type)" opacity="0.9">${xmlEsc(initials)}</text>` +
    `<path d="M126 466 H414" stroke="${preset.accent}" stroke-opacity="0.82" stroke-width="12" stroke-linecap="round"/>` +
    `<path d="M126 492 H340" stroke="${BRAND.line}" stroke-opacity="0.16" stroke-width="8" stroke-linecap="round"/>` +
    motifSvg(preset.motif, seed, preset) +
    `<text x="124" y="528" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="12" font-weight="800" fill="${BRAND.muted}" letter-spacing="3">${xmlEsc(BRAND.watermark)} / ${serial}</text>` +
    `<path d="M820 512 H872 L848 538" fill="none" stroke="${preset.accent}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.72"/>` +
    `</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function isGeneratedBlogCover(url) {
  if (!url) return true;
  if (!String(url).startsWith("data:image/svg+xml")) return false;
  try {
    const payload = String(url).split(",").slice(1).join(",");
    const decoded = decodeURIComponent(payload);
    return decoded.includes("ISRA ANWAR") && (decoded.includes("BLOG") || decoded.includes("JOURNAL"));
  } catch {
    return String(url).includes("ISRA ANWAR");
  }
}

export function resolveCover(post, category) {
  if (post?.cover_url && !isGeneratedBlogCover(post.cover_url)) return post.cover_url;
  return generateBlogCover({
    title: post?.title ?? "Untitled",
    slug: post?.slug ?? "",
    category: category?.short ?? category?.name ?? "",
    categorySlug: category?.slug ?? post?.category ?? "",
  });
}
