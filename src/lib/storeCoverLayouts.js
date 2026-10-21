// Building blocks for generated store covers: twelve page layouts, twelve
// background patterns and twenty topic glyphs. storePlaceholder.js assigns each
// product its own (layout, pattern) pair so no two covers share a composition.
export const LAYOUT_COUNT = 12;
export const PATTERN_COUNT = 12;

const FONT = 'font-family="Helvetica Neue, Helvetica, Arial, system-ui, sans-serif"';
const PAPER = "#fffdf9";
const INK = "#1a1a1a";

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function txt(x, y, str, { size = 20, weight = 700, fill, anchor = "start", ls = 0, opacity = 1 } = {}) {
  return `<text x="${x}" y="${y}" ${FONT} font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${ls}"${opacity < 1 ? ` opacity="${opacity}"` : ""}>${esc(str)}</text>`;
}

/* ---------------------------------------------------------------- patterns */

const ROTATIONS = [0, 15, 30, 45, 60, 75, 90];
const SCALES = [1, 1.35, 0.8, 1.7];

// Full-canvas decorative pattern. `variant` shifts scale and rotation so even
// two covers that share a pattern kind look different.
export function patternBackground(kind, color, slot) {
  const scale = SCALES[(slot * 3) % SCALES.length];
  const rotate = ROTATIONS[(slot * 5) % ROTATIONS.length];
  const tile = (w, h, inner, extra = "") =>
    `<pattern id="p" width="${w}" height="${h}" patternUnits="userSpaceOnUse" patternTransform="rotate(${rotate}) scale(${scale})"${extra}>${inner}</pattern>` +
    `<rect width="800" height="600" fill="url(#p)"/>`;
  switch (kind % PATTERN_COUNT) {
    case 0: return tile(32, 32, `<circle cx="16" cy="16" r="2.6" fill="${color}" opacity="0.3"/>`);
    case 1: return tile(28, 28, `<rect width="9" height="28" fill="${color}" opacity="0.1"/>`);
    case 2: {
      let rings = "";
      const cx = (slot * 131) % 800;
      const cy = slot % 2 ? 0 : 600;
      for (let r = 60 * scale; r <= 900; r += 70 * scale) rings += `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(0)}" fill="none" stroke="${color}" stroke-width="3" opacity="0.16"/>`;
      return rings;
    }
    case 3: return tile(44, 44, `<path d="M44 0 H0 V44" fill="none" stroke="${color}" stroke-width="1.6" opacity="0.2"/>`);
    case 4: return tile(80, 44, `<path d="M0 22 q20 -18 40 0 t40 0" fill="none" stroke="${color}" stroke-width="3" opacity="0.18"/>`);
    case 5: return tile(64, 56, `<path d="M32 8 L56 50 H8 Z" fill="none" stroke="${color}" stroke-width="2.4" opacity="0.2"/>`);
    case 6: return tile(46, 46, `<path d="M23 14 V32 M14 23 H32" stroke="${color}" stroke-width="3" stroke-linecap="round" opacity="0.24"/>`);
    case 7: return `<circle cx="${60 + ((slot * 37) % 260)}" cy="560" r="230" fill="${color}" opacity="0.1"/><circle cx="760" cy="60" r="${150 + (slot % 5) * 14}" fill="${color}" opacity="0.1"/><circle cx="400" cy="660" r="150" fill="${color}" opacity="0.08"/>`;
    case 8: return tile(40, 26, `<path d="M0 19 L10 7 L20 19 L30 7 L40 19" fill="none" stroke="${color}" stroke-width="3" opacity="0.2"/>`);
    case 9: return tile(24, 24, `<path d="M0 0 L24 24 M24 0 L0 24" stroke="${color}" stroke-width="1.8" opacity="0.17"/>`);
    case 10: return tile(48, 48, `<rect x="7" y="7" width="34" height="34" fill="none" stroke="${color}" stroke-width="2.6" opacity="0.18"/>`);
    default: return tile(48, 48, `<path d="M0 48 A48 48 0 0 1 48 0 M0 24 A24 24 0 0 1 24 0" fill="none" stroke="${color}" stroke-width="3" opacity="0.18"/>`);
  }
}

/* ------------------------------------------------------------------ glyphs */

const GLYPHS = {
  magnifier: (c) => `<circle cx="-8" cy="-8" r="26" fill="none" stroke="${c}" stroke-width="8"/><path d="M12 12 L36 36" stroke="${c}" stroke-width="9" stroke-linecap="round"/>`,
  note: (c) => `<ellipse cx="-20" cy="26" rx="14" ry="10" fill="${c}"/><ellipse cx="22" cy="16" rx="14" ry="10" fill="${c}"/><path d="M-8 26 V-28 M34 16 V-38" stroke="${c}" stroke-width="8" fill="none"/><path d="M-8 -28 L34 -38 V-24 L-8 -14Z" fill="${c}"/>`,
  nodes: (c) => `<path d="M-24 -18 L24 -18 M-24 -18 L0 28 M24 -18 L0 28" stroke="${c}" stroke-width="5" fill="none"/><circle cx="-24" cy="-18" r="15" fill="${c}"/><circle cx="24" cy="-18" r="15" fill="${c}"/><circle cx="0" cy="28" r="15" fill="${c}"/>`,
  bag: (c) => `<rect x="-30" y="-12" width="60" height="52" rx="9" fill="${c}"/><path d="M-16 -12 Q-16 -38 0 -38 Q16 -38 16 -12" fill="none" stroke="${c}" stroke-width="6"/>`,
  shop: (c) => `<path d="M-32 -8 L-22 -36 H22 L32 -8Z" fill="${c}"/><path d="M-32 -8 q8 14 16 0 q8 14 16 0 q8 14 16 0 q8 14 16 0" fill="${c}" stroke="${c}" stroke-width="2"/><rect x="-26" y="8" width="52" height="38" fill="none" stroke="${c}" stroke-width="5"/><rect x="-16" y="22" width="14" height="24" fill="${c}"/><rect x="6" y="18" width="12" height="12" fill="none" stroke="${c}" stroke-width="3"/>`,
  doc: (c) => `<rect x="-24" y="-34" width="48" height="68" rx="7" fill="none" stroke="${c}" stroke-width="7"/><path d="M-12 -12 H12 M-12 2 H12 M-12 16 H4" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`,
  chart: (c) => `<rect x="-32" y="4" width="18" height="30" rx="3" fill="${c}"/><rect x="-9" y="-14" width="18" height="48" rx="3" fill="${c}"/><rect x="14" y="-34" width="18" height="68" rx="3" fill="${c}"/>`,
  check: (c) => `<rect x="-32" y="-32" width="64" height="64" rx="12" fill="none" stroke="${c}" stroke-width="7"/><path d="M-16 0 L-4 14 L18 -14" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  calendar: (c) => `<rect x="-34" y="-28" width="68" height="62" rx="8" fill="none" stroke="${c}" stroke-width="6"/><path d="M-34 -10 H34" stroke="${c}" stroke-width="6"/><path d="M-16 -38 V-20 M16 -38 V-20" stroke="${c}" stroke-width="7" stroke-linecap="round"/><circle cx="-14" cy="8" r="4.5" fill="${c}"/><circle cx="2" cy="8" r="4.5" fill="${c}"/><circle cx="18" cy="8" r="4.5" fill="${c}"/><circle cx="-14" cy="22" r="4.5" fill="${c}"/><circle cx="2" cy="22" r="4.5" fill="${c}"/>`,
  mail: (c) => `<rect x="-36" y="-24" width="72" height="50" rx="8" fill="none" stroke="${c}" stroke-width="6"/><path d="M-34 -20 L0 6 L34 -20" fill="none" stroke="${c}" stroke-width="6" stroke-linejoin="round"/>`,
  spark: (c) => `<path d="M0 -40 Q4 -6 38 0 Q4 6 0 40 Q-4 6 -38 0 Q-4 -6 0 -40Z" fill="${c}"/><path d="M26 -34 Q27 -26 34 -25 Q27 -24 26 -16 Q25 -24 18 -25 Q25 -26 26 -34Z" fill="${c}"/>`,
  bulb: (c) => `<path d="M0 -38 A24 24 0 0 1 14 6 V16 H-14 V6 A24 24 0 0 1 0 -38Z" fill="none" stroke="${c}" stroke-width="7" stroke-linejoin="round"/><path d="M-12 28 H12 M-8 38 H8" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,
  target: (c) => `<circle r="34" fill="none" stroke="${c}" stroke-width="6"/><circle r="20" fill="none" stroke="${c}" stroke-width="6"/><circle r="7" fill="${c}"/>`,
  pen: (c) => `<path d="M-30 30 L-24 8 L16 -32 L32 -16 L-8 24 Z" fill="none" stroke="${c}" stroke-width="7" stroke-linejoin="round"/><path d="M-30 30 L-24 8 L-8 24Z" fill="${c}"/>`,
  gear: (c) => `<circle r="26" fill="none" stroke="${c}" stroke-width="12" stroke-dasharray="9 8"/><circle r="17" fill="none" stroke="${c}" stroke-width="7"/><circle r="6" fill="${c}"/>`,
  play: (c, paper) => `<rect x="-38" y="-26" width="76" height="52" rx="14" fill="${c}"/><path d="M-9 -12 L16 0 L-9 12Z" fill="${paper}"/>`,
  chat: (c) => `<path d="M-34 -28 H34 Q40 -28 40 -22 V12 Q40 18 34 18 H-4 L-22 36 V18 H-34 Q-40 18 -40 12 V-22 Q-40 -28 -34 -28Z" fill="none" stroke="${c}" stroke-width="6" stroke-linejoin="round"/><path d="M-22 -8 H22 M-22 4 H8" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`,
  funnel: (c) => `<path d="M-36 -32 H36 L8 4 V30 L-8 38 V4 Z" fill="${c}" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>`,
  coin: (c) => `<circle r="34" fill="none" stroke="${c}" stroke-width="7"/><text y="14" text-anchor="middle" ${FONT} font-size="42" font-weight="800" fill="${c}">$</text>`,
  layout: (c) => `<rect x="-36" y="-30" width="72" height="60" rx="6" fill="none" stroke="${c}" stroke-width="6"/><path d="M-36 -12 H36 M-8 -12 V30" stroke="${c}" stroke-width="5"/>`,
};

const GLYPH_RULES = [
  ["note", /music|musik|tunecore|soundon|spotify|audio/],
  ["play", /youtube|video/],
  ["coin", /adsense|monetiz|invoice|financial|rate-calc|rate calc|quotation|price/],
  ["magnifier", /seo|search|keyword|audit|sem\b/],
  ["chart", /analytics|dashboard|okr|goal|metric|tracker|spss|statistik/],
  ["check", /checklist|qa\b|pre-?launch/],
  ["calendar", /calendar|kalender|planner|weekly|monthly|daily|editorial|jurnal|journal|habit/],
  ["mail", /email|e-mail|subject|newsletter|outreach|\bdm\b|cold/],
  ["gear", /automation|automasi|kanban|operat|ticketing/],
  ["spark", /prompt|chatgpt|\bai\b/],
  ["chat", /social|media|community|support|retention|persona-?kit|customer/],
  ["pen", /blog|writing|copy|content|swipe|storytell|style-guide|essay|skripsi|thesis|proposal-skripsi/],
  ["funnel", /funnel|pipeline|growth-loop|conversion/],
  ["bag", /ecommerce|e-commerce|marketplace|store|sales|retail/],
  ["target", /brand|persona|positioning|branding|personal|rebrand|okr|strategy|swot|canvas/],
  ["layout", /template|\btpl\b|canva|notion|excel|powerpoint|pitch|\bppt\b|\bword\b|design/],
  ["bulb", /research|kuesioner|review|survey|riset|validation|startup|coding-sheet|systematic/],
  ["nodes", /workflow|framework|blueprint|playbook|system|saas|roadmap/],
  ["doc", /contract|kontrak|mou|bizdoc|business-plan|sop|guideline|policy|onboarding|worksheet|workbook|ebook/],
];

export function glyphForProduct(product = {}) {
  const text = `${product.slug ?? ""} ${product.name ?? ""}`.toLowerCase();
  for (const [key, pattern] of GLYPH_RULES) if (pattern.test(text)) return key;
  return "doc";
}

function glyph(kind, color, x, y, scale = 1) {
  const draw = GLYPHS[kind] ?? GLYPHS.doc;
  return `<g transform="translate(${x} ${y}) scale(${scale})">${draw(color, PAPER)}</g>`;
}

/* ----------------------------------------------------------------- objects */

function rules(x, y, w, ink) {
  return `<rect x="${x}" y="${y}" width="${w * 0.9}" height="7" rx="3.5" fill="${ink}" opacity="0.85"/>` +
    `<rect x="${x}" y="${y + 20}" width="${w * 0.65}" height="7" rx="3.5" fill="${ink}" opacity="0.25"/>` +
    `<rect x="${x}" y="${y + 40}" width="${w * 0.78}" height="7" rx="3.5" fill="${ink}" opacity="0.25"/>`;
}

function rot(svg, deg, cx, cy) {
  return deg ? `<g transform="rotate(${deg} ${cx} ${cy})">${svg}</g>` : svg;
}

function book(c, x, y, w, h, deg = 0) {
  const cx = x + w / 2;
  return rot(
    `<rect x="${x + 8}" y="${y + 20}" width="${w}" height="${h}" rx="3" fill="#000" opacity="0.08"/>` +
    `<rect x="${x + 6}" y="${y + 6}" width="${w}" height="${h}" rx="3" fill="#efe6d6"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${PAPER}"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="10" fill="${c.accent}"/>` +
    `<rect x="${x}" y="${y + 10}" width="14" height="${h - 10}" fill="#000" opacity="0.05"/>` +
    `<circle cx="${cx + 4}" cy="${y + h * 0.38}" r="${w * 0.32}" fill="${c.tint}"/>` +
    glyph(c.glyph, c.accent, cx + 4, y + h * 0.38, w / 244) +
    rules(x + 40, y + h * 0.71, w - 80, INK) +
    txt(x + 40, y + h * 0.93, "ISRA ANWAR", { size: 12, fill: c.accent, ls: 3 }),
    deg, cx, y + h / 2);
}

function windowMock(c, x, y, w, h, deg = 0) {
  const cx = x + w / 2;
  return rot(
    `<rect x="${x + 8}" y="${y + 16}" width="${w}" height="${h}" rx="16" fill="#000" opacity="0.1"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${PAPER}"/>` +
    `<path d="M${x} ${y + 34} V${y + 16} Q${x} ${y} ${x + 16} ${y} H${x + w - 16} Q${x + w} ${y} ${x + w} ${y + 16} V${y + 34} Z" fill="${c.accent}"/>` +
    [0, 1, 2].map((i) => `<circle cx="${x + 22 + i * 18}" cy="${y + 17}" r="5" fill="#fff" opacity="0.85"/>`).join("") +
    `<circle cx="${cx}" cy="${y + 34 + (h - 34) * 0.4}" r="${Math.min(w, h) * 0.2}" fill="${c.tint}"/>` +
    glyph(c.glyph, c.accent, cx, y + 34 + (h - 34) * 0.4, Math.min(w, h) / 220) +
    rules(x + 36, y + h - 76, w - 72, INK),
    deg, cx, y + h / 2);
}

function card(c, x, y, w, h, deg, withGlyph) {
  return rot(
    `<rect x="${x + 6}" y="${y + 12}" width="${w}" height="${h}" rx="16" fill="#000" opacity="0.1"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${PAPER}"/>` +
    `<rect x="${x}" y="${y}" width="14" height="${h}" rx="7" fill="${c.accent}"/>` +
    (withGlyph
      ? `<circle cx="${x + 78}" cy="${y + 72}" r="40" fill="${c.tint}"/>` + glyph(c.glyph, c.accent, x + 78, y + 72, 0.78) + rules(x + 40, y + h - 80, w - 80, INK)
      : rules(x + 40, y + 38, w - 80, INK)),
    deg, x + w / 2, y + h / 2);
}

function phone(c, x, y, w, h, deg) {
  const cx = x + w / 2;
  return rot(
    `<rect x="${x + 8}" y="${y + 16}" width="${w}" height="${h}" rx="36" fill="#000" opacity="0.12"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="36" fill="${INK}"/>` +
    `<rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" rx="29" fill="${PAPER}"/>` +
    `<rect x="${cx - 32}" y="${y + 16}" width="64" height="14" rx="7" fill="${INK}"/>` +
    `<rect x="${x + 24}" y="${y + 52}" width="${w - 48}" height="${h * 0.42}" rx="18" fill="${c.tint}"/>` +
    glyph(c.glyph, c.accent, cx, y + 52 + (h * 0.42) / 2, w / 200) +
    rules(x + 30, y + h * 0.7, w - 60, INK),
    deg, cx, y + h / 2);
}

function seal(c, cx, cy, r, ringColor) {
  return `<circle cx="${cx}" cy="${cy}" r="${r + 10}" fill="${ringColor.fill}" opacity="${ringColor.opacity}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c.accent}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r - 14}" fill="none" stroke="#fff" stroke-width="2.5" opacity="0.5"/>` +
    glyph(c.glyph, "#ffffff", cx, cy, r / 52);
}

function tile(c, x, y, s, filled) {
  return `<rect x="${x + 5}" y="${y + 10}" width="${s}" height="${s}" rx="20" fill="#000" opacity="0.1"/>` +
    `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="20" fill="${filled ? c.accent : PAPER}"/>` +
    (filled ? "" : `<circle cx="${x + s / 2}" cy="${y + s / 2}" r="${s * 0.3}" fill="${c.tint}"/>`) +
    glyph(c.glyph, filled ? "#ffffff" : c.accent, x + s / 2, y + s / 2, s / 150);
}

/* ------------------------------------------------------------ text blocks */

export function wrapLines(title, maxChars, maxLines) {
  const words = String(title || "Untitled Product").replace(/\s*&\s*/g, " & ").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = (line + " " + word).trim();
    if (next.length > maxChars && line) { lines.push(line); line = word; } else { line = next; }
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (words.join(" ").length > lines.join(" ").length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/\.+$/, "")}...`;
  }
  return lines;
}

// Bottom- or top-anchored headline; the last line takes the accent color.
function headline(c, { x, base, top, anchor = "start", maxWidth, maxSize = 66, chars, maxLines = 4, ink = c.ink, accent = c.canvasAccent }) {
  const lines = wrapLines(c.title, chars, maxLines);
  const longest = Math.max(1, ...lines.map((l) => l.length));
  const size = Math.max(32, Math.min(maxSize, Math.floor(maxWidth / (longest * 0.58))));
  const lh = size * 1.08;
  const subtitleGap = c.subtitle ? 46 : 0;
  const lastBase = top !== undefined ? top + (lines.length - 1) * lh : base - subtitleGap;
  const first = lastBase - (lines.length - 1) * lh;
  const out = lines.map((line, i) =>
    `<text x="${x}" y="${(first + i * lh).toFixed(1)}" ${FONT} font-size="${size}" font-weight="800" fill="${i === lines.length - 1 ? accent : ink}" text-anchor="${anchor}" letter-spacing="-1.5">${esc(line)}</text>`).join("");
  const sub = c.subtitle ? txt(x, (lastBase + 42).toFixed(1), c.subtitle, { size: 30, weight: 500, fill: ink, anchor, ls: -0.5 }) : "";
  return out + sub;
}

function kicker(c, x, y, anchor = "start", fill = c.canvasAccent) {
  const barX = anchor === "end" ? x - 52 : anchor === "middle" ? x - 26 : x;
  return txt(x, y, c.kicker, { size: 19, fill, anchor, ls: 5 }) + `<rect x="${barX}" y="${y + 20}" width="52" height="5" fill="${fill}"/>`;
}

function topBar(c) {
  return `<rect width="800" height="12" fill="${c.canvasAccent}"/>`;
}

function footer(c, variant = "full", x0 = 60, x1 = 740, y = 566, ink = c.ink, muted = c.muted) {
  const logo = (x) => `<path d="M${x} ${y} L${x + 22} ${y - 32} L${x + 34} ${y - 15} L${x + 46} ${y} Z" fill="${ink}"/>`;
  if (variant === "center") {
    return logo(196) + txt(256, y - 3, "ISRAANWAR.COM", { size: 20, fill: muted, ls: 4 }) + txt(528, y - 3, "2026", { size: 20, weight: 600, fill: muted, ls: 3 });
  }
  const line = variant === "full" ? `<rect x="${x0}" y="${y - 46}" width="${x1 - x0}" height="1.5" fill="${ink}" opacity="0.2"/>` : "";
  return line + logo(x0) + txt(x0 + 60, y - 3, "ISRAANWAR.COM", { size: 20, fill: muted, ls: 4 }) +
    (variant === "full" ? txt(x1, y - 3, "2026", { size: 20, weight: 600, fill: muted, anchor: "end", ls: 3 }) : "");
}

function badge(list, accent) {
  if (!list) return "";
  const t = (y, size, weight, ls, str) => txt(724, y, str, { size, weight, fill: "#ffffff", anchor: "middle", ls });
  return `<circle cx="724" cy="462" r="56" fill="${accent}"/>` + t(466, 28, 800, -1, list[0]) + t(484, 9, 700, 1.5, list[1]) + t(496, 9, 700, 1.5, list[2]);
}

/* ---------------------------------------------------------------- layouts */

const LAYOUTS = [
  // 0 book right
  (c) => topBar(c) + kicker(c, 60, 78) + book(c, 500, 126, 244, 346) +
    headline(c, { x: 60, base: 440, maxWidth: 400, chars: 14 }) + footer(c),
  // 1 book left, text right
  (c) => topBar(c) + kicker(c, 740, 78, "end") + book(c, 60, 126, 244, 346, -4) +
    headline(c, { x: 740, base: 440, anchor: "end", maxWidth: 400, chars: 14 }) + footer(c),
  // 2 centered seal
  (c) => topBar(c) + kicker(c, 400, 76, "middle") + seal(c, 400, 212, 92, c.shade) +
    headline(c, { x: 400, base: 470, anchor: "middle", maxWidth: 660, maxSize: 60, chars: 24, maxLines: 3 }) + footer(c, "center"),
  // 3 split panel
  (c) => `<rect width="300" height="600" fill="${c.accent}"/>` +
    `<circle cx="150" cy="270" r="104" fill="#fff" opacity="0.16"/>` + glyph(c.glyph, "#ffffff", 150, 270, 2.2) +
    txt(40, 560, "ISRA ANWAR", { size: 14, fill: "#fff", ls: 5 }) +
    kicker(c, 350, 96) + headline(c, { x: 350, base: 400, maxWidth: 390, chars: 13 }) + footer(c, "plain", 350, 740),
  // 4 title on top, window below right
  (c) => topBar(c) + kicker(c, 60, 78) + headline(c, { x: 60, top: 168, maxWidth: 520, maxSize: 58, chars: 18, maxLines: 3 }) +
    windowMock(c, 340, 290, 390, 214) + footer(c, "plain", 60, 740),
  // 5 framed
  (c) => `<rect x="44" y="44" width="712" height="512" rx="20" fill="${c.paper}" opacity="0.72" stroke="${c.accent}" stroke-width="3"/>` +
    kicker(c, 400, 112, "middle") + `<circle cx="400" cy="208" r="56" fill="${c.tint}"/>` + glyph(c.glyph, c.accent, 400, 208, 1) +
    headline(c, { x: 400, base: 420, anchor: "middle", maxWidth: 600, maxSize: 58, chars: 22, maxLines: 3, ink: INK, accent: c.accent }) +
    footer(c, "center", 60, 740, 520, INK, "#37332f"),
  // 6 giant watermark glyph
  (c) => `<g opacity="0.14">${glyph(c.glyph, c.deep ? "#ffffff" : c.accent, 590, 300, 7.5)}</g>` + kicker(c, 60, 78) +
    headline(c, { x: 60, base: 440, maxWidth: 640, maxSize: 72, chars: 22, maxLines: 3 }) + footer(c),
  // 7 phone
  (c) => topBar(c) + kicker(c, 60, 78) + phone(c, 530, 58, 206, 430, 6) +
    headline(c, { x: 60, base: 440, maxWidth: 410, chars: 14 }) + footer(c),
  // 8 stacked cards
  (c) => `<rect width="14" height="600" fill="${c.canvasAccent}"/>` + kicker(c, 60, 78) +
    card(c, 470, 130, 260, 210, -12, false) + card(c, 470, 175, 260, 210, -4, false) + card(c, 470, 220, 260, 220, 5, true) +
    headline(c, { x: 60, base: 440, maxWidth: 380, chars: 13 }) + footer(c),
  // 9 big circle
  (c) => `<circle cx="600" cy="290" r="225" fill="${c.shade.fill}" opacity="${c.shade.opacity}"/>` +
    `<circle cx="600" cy="290" r="150" fill="${c.accent}"/>` + glyph(c.glyph, "#ffffff", 600, 290, 3.1) +
    kicker(c, 60, 78) + headline(c, { x: 60, base: 470, maxWidth: 360, chars: 12 }) + footer(c, "plain", 60, 740),
  // 10 top band + tiles
  (c) => `<rect width="800" height="206" fill="${c.accent}"/>` + kicker(c, 60, 62, "start", "#ffffff") +
    headline(c, { x: 60, base: 170, maxWidth: 680, maxSize: 54, chars: 26, maxLines: 2, ink: "#ffffff", accent: "#ffffff" }) +
    tile(c, 60, 262, 200, false) + tile(c, 300, 262, 200, true) + tile(c, 540, 262, 200, false) + footer(c),
  // 11 diagonal
  (c) => `<polygon points="0,0 480,0 0,440" fill="${c.accent}"/>` + glyph(c.glyph, "#ffffff", 120, 128, 2.5) +
    kicker(c, 740, 78, "end") + headline(c, { x: 740, base: 440, anchor: "end", maxWidth: 440, maxSize: 62, chars: 16, maxLines: 3 }) + footer(c),
];

export function renderLayout(index, ctx) {
  const c = {
    ...ctx,
    paper: PAPER,
    shade: ctx.deep ? { fill: "#000000", opacity: 0.2 } : { fill: "#ffffff", opacity: 0.45 },
  };
  return LAYOUTS[index % LAYOUT_COUNT](c) + badge(ctx.badge, ctx.accent);
}
