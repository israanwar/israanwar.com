// Premium editorial store covers. Every cover is assembled from six
// independent design dimensions (skeleton, line-art family, medallion frame,
// title style, ornament, line weight), plus its own color and Lucide icon.
// storeCoverPlan.js assigns each product a combination that differs from every
// other product in at least four of the six dimensions.
import { ICONS } from "../data/storeCoverIcons.js";

export const SKELETON_COUNT = 10;
export const ART_COUNT = 12;
export const FRAME_COUNT = 8;
export const TITLE_COUNT = 6;
export const ORNAMENT_COUNT = 8;
export const WEIGHT_COUNT = 6;

const SERIF = `font-family="Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, 'Times New Roman', serif"`;
const SANS = `font-family="'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif"`;
const WEIGHTS = [0.7, 0.9, 1.1, 1.35, 1.6, 1.9];
const f = (n) => Number(n.toFixed(1));

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function rng(seed) {
  let a = (seed * 2654435761 + 12345) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------------------------------------------- line art */

// Generative hairline art for the box, unique per seed. `bg` is only used by
// the ridgeline family, which hides lines behind nearer ridges.
function art(kind, box, seed, col, sw, bg) {
  const { x, y, w, h } = box;
  const r = rng(seed);
  const st = (o = 1, width = sw) => `fill="none" stroke="${col}" stroke-width="${width}" opacity="${o}" stroke-linecap="round" stroke-linejoin="round"`;
  const big = Math.max(w, h);
  let out = "";
  switch (kind % ART_COUNT) {
    case 0: { // orbits
      const cx = x + w * (0.3 + r() * 0.4), cy = y + h * (0.3 + r() * 0.4);
      const n = 8 + Math.floor(r() * 6), step = (big * 0.95) / n;
      for (let i = 1; i <= n; i++) {
        out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(step * i)}" ${st(0.25 + 0.5 * (i % 3 === 0))}/>`;
        if (i % 2 === 0) { const a = r() * 6.283; out += `<circle cx="${f(cx + Math.cos(a) * step * i)}" cy="${f(cy + Math.sin(a) * step * i)}" r="${f(sw * 2.6)}" fill="${col}"/>`; }
      }
      break;
    }
    case 1: { // sunburst
      const cx = x + w * (0.2 + r() * 0.6), cy = y + h * (r() < 0.5 ? 1.05 : -0.05);
      const n = 36 + Math.floor(r() * 36), len = big * 1.1;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, r0 = len * (i % 2 ? 0.16 : 0.1);
        out += `<path d="M${f(cx + Math.cos(a) * r0)} ${f(cy + Math.sin(a) * r0)} L${f(cx + Math.cos(a) * len)} ${f(cy + Math.sin(a) * len)}" ${st(i % 4 === 0 ? 0.8 : 0.35)}/>`;
      }
      break;
    }
    case 2: { // contour waves
      const n = 14 + Math.floor(r() * 10), amp = h / n * (1.4 + r() * 1.6), ph = r() * 6, freq = 1.2 + r() * 1.8;
      for (let i = 0; i <= n; i++) {
        let d = "";
        for (let k = 0; k <= 24; k++) {
          const px = x + (w * k) / 24, py = y + (h * i) / n + Math.sin((k / 24) * 6.283 * freq + ph + i * 0.34) * amp;
          d += `${k ? "L" : "M"}${f(px)} ${f(py)}`;
        }
        out += `<path d="${d}" ${st(0.3 + 0.45 * (i % 4 === 0))}/>`;
      }
      break;
    }
    case 3: { // lattice
      const s = 26 + Math.floor(r() * 26), rot = r() < 0.5 ? 1 : -1;
      for (let k = -Math.ceil(big / s); k <= Math.ceil((w + h) / s); k++) {
        out += `<path d="M${f(x + k * s)} ${f(y)} L${f(x + k * s + rot * h)} ${f(y + h)}" ${st(0.42)}/>`;
        out += `<path d="M${f(x + k * s)} ${f(y)} L${f(x + k * s - rot * h)} ${f(y + h)}" ${st(0.42)}/>`;
      }
      for (let i = 0; i < 5; i++) out += `<path d="M${f(x + r() * w)} ${f(y + r() * h)} l${s / 2} ${s / 2} l${-s / 2} ${s / 2} l${-s / 2} ${-s / 2} Z" fill="${col}" opacity="0.22"/>`;
      break;
    }
    case 4: { // rosette
      const cx = x + w * (0.35 + r() * 0.3), cy = y + h * (0.35 + r() * 0.3);
      const R = Math.min(w, h) * (0.4 + r() * 0.18), m = 14 + Math.floor(r() * 14), ry = R * (0.28 + r() * 0.22);
      for (let i = 0; i < m; i++) out += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(R)}" ry="${f(ry)}" transform="rotate(${f((i * 180) / m)} ${f(cx)} ${f(cy)})" ${st(0.5)}/>`;
      out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R)}" ${st(0.7)}/><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R * 0.16)}" ${st(0.9)}/>`;
      break;
    }
    case 5: { // arc fan from a corner
      const cx = x + (r() < 0.5 ? 0 : w), cy = y + (r() < 0.5 ? 0 : h), n = 12 + Math.floor(r() * 8), step = (big * 1.5) / n;
      for (let i = 1; i <= n; i++) out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(step * i)}" ${st(0.2 + 0.5 * (i % 4 === 0), sw)}${i % 5 === 0 ? ` stroke-dasharray="${f(sw * 3)} ${f(sw * 5)}"` : ""}/>`;
      break;
    }
    case 6: { // halftone
      const cols = 14 + Math.floor(r() * 8), rows = Math.max(6, Math.round((cols * h) / w)), fx = r(), fy = r();
      const cw = w / cols, ch = h / rows;
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const d = Math.hypot(i / cols - fx, (j / rows - fy) * (h / w));
        const rad = Math.max(0.4, (Math.min(cw, ch) / 2) * Math.max(0, 1.05 - d * 1.6));
        if (rad > 0.5) out += `<circle cx="${f(x + cw * (i + 0.5))}" cy="${f(y + ch * (j + 0.5))}" r="${f(rad)}" fill="${col}" opacity="0.6"/>`;
      }
      break;
    }
    case 7: { // triangulated mesh
      const cols = 5 + Math.floor(r() * 4), rows = 4 + Math.floor(r() * 3), pts = [];
      for (let j = 0; j <= rows; j++) { pts[j] = []; for (let i = 0; i <= cols; i++) pts[j][i] = [x + (w * i) / cols + (r() - 0.5) * (w / cols) * 0.5, y + (h * j) / rows + (r() - 0.5) * (h / rows) * 0.5]; }
      for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
        const [px, py] = pts[j][i];
        if (i < cols) out += `<path d="M${f(px)} ${f(py)} L${f(pts[j][i + 1][0])} ${f(pts[j][i + 1][1])}" ${st(0.5)}/>`;
        if (j < rows) out += `<path d="M${f(px)} ${f(py)} L${f(pts[j + 1][i][0])} ${f(pts[j + 1][i][1])}" ${st(0.5)}/>`;
        if (i < cols && j < rows) out += `<path d="M${f(px)} ${f(py)} L${f(pts[j + 1][i + 1][0])} ${f(pts[j + 1][i + 1][1])}" ${st(0.3)}/>`;
        out += `<circle cx="${f(px)}" cy="${f(py)}" r="${f(sw * 1.9)}" fill="${col}" opacity="0.8"/>`;
      }
      break;
    }
    case 8: { // spiral
      const cx = x + w * (0.35 + r() * 0.3), cy = y + h * (0.35 + r() * 0.3), turns = 5 + r() * 3, maxR = big * 0.8;
      for (let s = 0; s < 2; s++) {
        let d = "";
        for (let k = 0; k <= 160; k++) { const t = (k / 160) * turns * 6.283, rad = (t / (turns * 6.283)) * maxR; d += `${k ? "L" : "M"}${f(cx + Math.cos(t + s * 3.14159) * rad)} ${f(cy + Math.sin(t + s * 3.14159) * rad)}`; }
        out += `<path d="${d}" ${st(s ? 0.35 : 0.75)}/>`;
      }
      break;
    }
    case 9: { // ridgelines
      const n = 9 + Math.floor(r() * 4), a1 = r() * 6, a2 = r() * 6, a3 = r() * 6;
      for (let i = 0; i < n; i++) {
        const base = y + h * (0.28 + (i / n) * 0.72);
        let d = `M${f(x)} ${f(y + h)} L${f(x)} ${f(base)}`;
        for (let k = 0; k <= 40; k++) {
          const t = k / 40, yy = base - (Math.sin(t * 5 + a1 + i * 0.7) * 0.5 + Math.sin(t * 11 + a2 + i) * 0.25 + Math.sin(t * 23 + a3) * 0.1 + 0.85) * (h / n) * 1.5;
          d += ` L${f(x + w * t)} ${f(yy)}`;
        }
        d += ` L${f(x + w)} ${f(y + h)} Z`;
        out += `<path d="${d}" fill="${bg}" stroke="${col}" stroke-width="${sw}" opacity="0.9" stroke-linejoin="round"/>`;
      }
      break;
    }
    case 10: { // flower of life
      const rad = Math.min(w, h) / (3.2 + r() * 1.2), cx = x + w * (0.3 + r() * 0.4), cy = y + h * (0.3 + r() * 0.4);
      const centers = [[0, 0]];
      for (let ring = 1; ring <= 2; ring++) for (let k = 0; k < 6 * ring; k++) {
        const a = (k / (6 * ring)) * 6.283, d = rad * ring * (ring === 2 && k % 2 === 1 ? 1.732 / 1 : 1) * (ring === 2 && k % 2 === 1 ? 1 : 1);
        centers.push([Math.cos(a) * d, Math.sin(a) * d]);
      }
      centers.forEach(([dx, dy]) => (out += `<circle cx="${f(cx + dx)}" cy="${f(cy + dy)}" r="${f(rad)}" ${st(0.45)}/>`));
      break;
    }
    default: { // circuit steps
      const n = 8 + Math.floor(r() * 5);
      for (let i = 0; i < n; i++) {
        let px = x + r() * w, py = y + r() * h, d = `M${f(px)} ${f(py)}`;
        for (let k = 0; k < 5; k++) { if (k % 2 === 0) px += (r() - 0.5) * w * 0.5; else py += (r() - 0.5) * h * 0.5; d += ` L${f(px)} ${f(py)}`; }
        out += `<path d="${d}" ${st(0.5)}/><circle cx="${f(px)}" cy="${f(py)}" r="${f(sw * 2.4)}" ${st(0.9, sw)}/>`;
      }
    }
  }
  return out;
}

/* ----------------------------------------------------------- icon medallion */

function framePath(kind, cx, cy, r) {
  const p = (pts) => `M${pts.map(([a, b]) => `${f(a)} ${f(b)}`).join(" L")} Z`;
  switch (kind % FRAME_COUNT) {
    case 0: return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"/>`;
    case 1: return `<rect x="${f(cx - r)}" y="${f(cy - r)}" width="${f(2 * r)}" height="${f(2 * r)}" rx="${f(r * 0.34)}"/>`;
    case 2: return `<path d="M${f(cx - r)} ${f(cy + r * 1.15)} V${f(cy)} A${f(r)} ${f(r)} 0 0 1 ${f(cx + r)} ${f(cy)} V${f(cy + r * 1.15)} Z"/>`;
    case 3: return `<path d="${p([0, 1, 2, 3, 4, 5].map((i) => [cx + Math.cos((i * 60 - 90) * Math.PI / 180) * r * 1.08, cy + Math.sin((i * 60 - 90) * Math.PI / 180) * r * 1.08]))}" stroke-linejoin="round"/>`;
    case 4: return `<path d="${p([[cx, cy - r * 1.18], [cx + r * 1.18, cy], [cx, cy + r * 1.18], [cx - r * 1.18, cy]])}" stroke-linejoin="round"/>`;
    case 5: return `<path d="${p([0, 1, 2, 3, 4, 5, 6, 7].map((i) => [cx + Math.cos((i * 45 + 22.5) * Math.PI / 180) * r * 1.07, cy + Math.sin((i * 45 + 22.5) * Math.PI / 180) * r * 1.07]))}" stroke-linejoin="round"/>`;
    case 6: return `<rect x="${f(cx - r * 0.78)}" y="${f(cy - r * 1.12)}" width="${f(r * 1.56)}" height="${f(r * 2.24)}" rx="${f(r * 0.78)}"/>`;
    default: return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(r * 0.82)}" ry="${f(r * 1.08)}"/>`;
  }
}

// A thin double-line frame with a glassy fill and the product's Lucide icon.
function medallion(c, cx, cy, r) {
  const sw = WEIGHTS[c.plan.weight];
  const shape = framePath(c.plan.frame, cx, cy, r);
  const inner = framePath(c.plan.frame, cx, cy, r - 8);
  const iconBody = ICONS[c.icon] ?? "";
  const s = (r * 1.05) / 24;
  return `<g fill="${c.plate}" stroke="${c.accent}" stroke-width="${f(sw)}">${shape}</g>` +
    `<g fill="none" stroke="${c.accent}" stroke-width="${f(sw * 0.7)}" opacity="0.5">${inner}</g>` +
    `<g transform="translate(${f(cx - 12 * s)} ${f(cy - 12 * s)}) scale(${f(s * 100) / 100})" fill="none" stroke="${c.accent}" stroke-width="${f(1.1 + sw * 0.28)}" stroke-linecap="round" stroke-linejoin="round">${iconBody}</g>`;
}

/* ----------------------------------------------------------------- ornaments */

function ornament(kind, x, y, c, anchor = "start") {
  const col = c.accent, sw = WEIGHTS[c.plan.weight];
  const o = anchor === "middle" ? x - 40 : anchor === "end" ? x - 80 : x;
  const st = `fill="none" stroke="${col}" stroke-width="${f(sw)}" stroke-linecap="round" stroke-linejoin="round"`;
  switch (kind % ORNAMENT_COUNT) {
    case 0: return `<g ${st}>${Array.from({ length: 17 }, (_, i) => `<path d="M${o + i * 5} ${y} v${i % 4 === 0 ? -9 : -5}"/>`).join("")}</g>`;
    case 1: return `<g ${st}><path d="M${o} ${y} h30 M${o + 50} ${y} h30"/><path d="M${o + 40} ${y - 5} l5 5 l-5 5 l-5 -5 Z"/></g>`;
    case 2: return [0, 1, 2].map((i) => `<circle cx="${o + 8 + i * 14}" cy="${y}" r="2.4" fill="${col}"/>`).join("");
    case 3: return `<g ${st}><circle cx="${o + 40}" cy="${y}" r="7"/><path d="M${o + 28} ${y} h24 M${o + 40} ${y - 12} v24"/></g>`;
    case 4: return [0, 1, 2, 3, 4].map((i) => `<path d="M${o + 6 + i * 17} ${y - 6} Q${o + 6 + i * 17} ${y} ${o + 12 + i * 17} ${y} Q${o + 6 + i * 17} ${y} ${o + 6 + i * 17} ${y + 6} Q${o + 6 + i * 17} ${y} ${o + i * 17} ${y} Q${o + 6 + i * 17} ${y} ${o + 6 + i * 17} ${y - 6}" fill="${col}"/>`).join("");
    case 5: return `<g ${st}>${[0, 1, 2, 3].map((i) => `<path d="M${o + 6 + i * 14} ${y - 6} l7 6 l-7 6"/>`).join("")}</g>`;
    case 6: return `<g ${st}><path d="M${o} ${y - 3} h80"/><path d="M${o} ${y + 3} h48"/></g>`;
    default: return `<g ${st}>${[0, 1, 2].flatMap((i) => [0, 1].map((j) => `<path d="M${o + 10 + i * 24} ${y - 8 + j * 14} h8 M${o + 14 + i * 24} ${y - 12 + j * 14} v8"/>`)).join("")}</g>`;
  }
}

/* ------------------------------------------------------------------ text */

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
  if (words.join(" ").length > lines.join(" ").length && lines.length) lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.,;:\s-]+$/, "")}\u2026`;
  return lines;
}

function tagline(description) {
  const clean = String(description || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const first = clean.split(/(?<=[.!?])\s/)[0].replace(/[.!?]+$/, "");
  if (first.length <= 84) return first;
  const head = first.slice(0, 84);
  const cut = Math.max(head.lastIndexOf(", "), head.lastIndexOf("; "), head.lastIndexOf(" - "), head.lastIndexOf(": "));
  if (cut > 38) return head.slice(0, cut).replace(/[,:;\s-]+$/, "");
  return `${head.replace(/\s+\S*$/, "").replace(/[,:;\s-]+$/, "")}\u2026`;
}

const TITLE_FACTORS = [0.5, 0.74, 0.56, 0.5, 0.52, 0.5];
const TITLE_MAX = [62, 40, 56, 58, 58, 58];

// Kicker, title and tagline as one block; anchored by its bottom or top edge.
function textBlock(c, { x, anchor = "start", maxW, yBottom, yTop, maxLines = 4, align = anchor }) {
  const t = c.plan.title;
  const text = t === 1 ? String(c.title).toUpperCase() : c.title;
  const factor = TITLE_FACTORS[t] + (t === 1 ? 0.06 : 0);
  // Shrink the type until the whole title fits; only cut it if even the
  // smallest size cannot hold it.
  let size = TITLE_MAX[t];
  let lines = [];
  for (; size >= 26; size -= 2) {
    const chars = Math.max(6, Math.floor(maxW / (size * factor)));
    lines = wrapLines(text, chars, 12);
    if (lines.length <= maxLines && Math.max(...lines.map((l) => l.length)) * size * factor <= maxW * 1.04) break;
  }
  if (lines.length > maxLines) lines = wrapLines(text, Math.max(6, Math.floor(maxW / (26 * factor))), maxLines);
  size = Math.max(26, size);
  const lh = size * 1.08;
  const tag = tagline(c.description);
  const tagLines = tag ? wrapLines(tag, Math.max(18, Math.floor(maxW / 8.4)), 2) : [];
  const kickerH = 34, gap = tag ? 26 : 0, tagH = tagLines.length * 23;
  const total = kickerH + lines.length * lh + gap + tagH;
  const y0 = yTop !== undefined ? yTop : yBottom - total;
  const sw = WEIGHTS[c.plan.weight];
  let out = txt(x, f(y0 + 12), c.kicker, { sans: true, size: 12.5, weight: 700, fill: c.accent, anchor, ls: 4.2 });
  const first = y0 + kickerH + size * 0.82;
  lines.forEach((line, i) => {
    const last = i === lines.length - 1;
    const props = [
      { serif: true, weight: 400, fill: last ? c.accent : c.ink, italic: last },
      { serif: true, weight: 400, fill: last ? c.accent : c.ink, ls: 3.2 },
      { serif: true, weight: 700, fill: c.ink },
      { serif: true, weight: last ? 700 : 400, fill: last ? c.accent : c.ink },
      { sans: true, weight: last ? 600 : 300, fill: last ? c.accent : c.ink, ls: -1 },
      { serif: true, weight: 400, fill: last ? c.accent : c.ink, italic: true },
    ][t];
    out += txt(x, f(first + i * lh), line, { size, anchor, ls: -0.8, ...props });
  });
  const endTitle = y0 + kickerH + lines.length * lh;
  if (t === 2) {
    const ux = anchor === "middle" ? x - 28 : anchor === "end" ? x - 56 : x;
    out += `<rect x="${f(ux)}" y="${f(endTitle + 2)}" width="56" height="${f(Math.max(1.5, sw * 1.3))}" fill="${c.accent}"/>`;
  }
  tagLines.forEach((line, i) => (out += txt(x, f(endTitle + gap + 14 + i * 23), line, { sans: true, size: 15.5, weight: 400, fill: c.ink, anchor, opacity: 0.78 })));
  return out;
}

function txt(x, y, str, { serif, sans, size = 16, weight = 400, fill, anchor = "start", ls = 0, italic = false, opacity = 1 }) {
  return `<text x="${x}" y="${y}" ${serif ? SERIF : SANS} font-size="${f(size)}" font-weight="${weight}"${italic ? ' font-style="italic"' : ""} fill="${fill}" text-anchor="${anchor}" letter-spacing="${ls}"${opacity < 1 ? ` opacity="${opacity}"` : ""}>${esc(str)}</text>`;
}

function footer(c, x0 = 56, x1 = 744, y = 566, anchor = "full") {
  const sw = WEIGHTS[c.plan.weight];
  const line = `<rect x="${x0}" y="${y - 26}" width="${x1 - x0}" height="${f(Math.max(0.7, sw * 0.8))}" fill="${c.ink}" opacity="0.28"/>`;
  if (anchor === "center") return line + txt((x0 + x1) / 2, y - 2, "ISRAANWAR.COM   ·   N° " + c.edition, { sans: true, size: 11.5, weight: 600, fill: c.ink, anchor: "middle", ls: 4, opacity: 0.8 });
  return line + txt(x0, y - 2, "ISRAANWAR.COM", { sans: true, size: 11.5, weight: 600, fill: c.ink, ls: 4, opacity: 0.8 }) +
    txt(x1, y - 2, "N° " + c.edition, { serif: true, size: 15, fill: c.ink, anchor: "end", italic: true, opacity: 0.85 });
}

/* ----------------------------------------------------------------- plates */

// A framed rectangle (or arch/circle) holding generative line art, with a
// hairline mat line inside it.
function plate(c, box, shape = "rect", artFill = true) {
  const sw = WEIGHTS[c.plan.weight];
  const id = `pl${shape}`;
  const { x, y, w, h } = box;
  let outline;
  if (shape === "arch") outline = `M${x} ${y + h} V${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + h} Z`;
  else if (shape === "circle") outline = `M${x} ${y + h / 2} A${w / 2} ${h / 2} 0 1 1 ${x + w} ${y + h / 2} A${w / 2} ${h / 2} 0 1 1 ${x} ${y + h / 2} Z`;
  else outline = `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
  const mat = shape === "rect" ? `<rect x="${x + 9}" y="${y + 9}" width="${w - 18}" height="${h - 18}" fill="none" stroke="${c.accent}" stroke-width="${f(sw * 0.7)}" opacity="0.45"/>`
    : shape === "circle" ? `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${f(w / 2 - 9)}" fill="none" stroke="${c.accent}" stroke-width="${f(sw * 0.7)}" opacity="0.45"/>`
      : `<path d="M${x + 9} ${y + h} V${y + w / 2} A${w / 2 - 9} ${w / 2 - 9} 0 0 1 ${x + w - 9} ${y + w / 2} V${y + h}" fill="none" stroke="${c.accent}" stroke-width="${f(sw * 0.7)}" opacity="0.45"/>`;
  return `<defs><clipPath id="${id}"><path d="${outline}"/></clipPath></defs>` +
    `<path d="${outline}" fill="${c.plate}"/>` +
    (artFill ? `<g clip-path="url(#${id})">${art(c.plan.art, box, c.seed, c.accent, sw, c.plate)}</g>` : "") +
    `<path d="${outline}" fill="none" stroke="${c.accent}" stroke-width="${f(sw * 1.2)}"/>` + mat;
}

/* --------------------------------------------------------------- skeletons */

const SKELETONS = [
  // 0 plate right
  (c) => plate(c, { x: 436, y: 48, w: 316, h: 372 }) + medallion(c, 594, 420, 66) +
    textBlock(c, { x: 56, maxW: 340, yBottom: 500 }) + ornament(c.plan.ornament, 56, 70, c) + footer(c),
  // 1 plate left
  (c) => plate(c, { x: 48, y: 48, w: 316, h: 372 }) + medallion(c, 206, 420, 66) +
    textBlock(c, { x: 420, maxW: 324, yBottom: 500 }) + ornament(c.plan.ornament, 420, 70, c) + footer(c),
  // 2 classic centered
  (c) => `<g opacity="0.55">${art(c.plan.art, { x: 0, y: 0, w: 800, h: 600 }, c.seed, c.accent, WEIGHTS[c.plan.weight] * 0.8, c.bg1)}</g>` +
    `<rect x="26" y="26" width="748" height="548" fill="${c.bg1}" opacity="0.58"/>` +
    `<rect x="26" y="26" width="748" height="548" fill="none" stroke="${c.accent}" stroke-width="${f(WEIGHTS[c.plan.weight])}"/>` +
    `<rect x="36" y="36" width="728" height="528" fill="none" stroke="${c.accent}" stroke-width="${f(WEIGHTS[c.plan.weight] * 0.7)}" opacity="0.55"/>` +
    medallion(c, 400, 134, 62) + ornament(c.plan.ornament, 400, 226, c, "middle") +
    textBlock(c, { x: 400, anchor: "middle", maxW: 600, yTop: 244, maxLines: 3 }) + footer(c, 76, 724, 546, "center"),
  // 3 full-bleed art with scrim
  (c) => `<g>${art(c.plan.art, { x: 0, y: 0, w: 800, h: 600 }, c.seed, c.accent, WEIGHTS[c.plan.weight], c.bg1)}</g>` +
    `<defs><linearGradient id="sc" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c.bg1}" stop-opacity="0.97"/><stop offset="0.55" stop-color="${c.bg1}" stop-opacity="0.85"/><stop offset="1" stop-color="${c.bg1}" stop-opacity="0"/></linearGradient></defs>` +
    `<rect width="800" height="600" fill="url(#sc)"/>` + medallion(c, 676, 150, 66) +
    textBlock(c, { x: 56, maxW: 420, yBottom: 500 }) + ornament(c.plan.ornament, 56, 70, c) + footer(c),
  // 4 spine
  (c) => `<rect width="78" height="600" fill="${c.plate}"/><rect x="78" width="${f(WEIGHTS[c.plan.weight])}" height="600" fill="${c.accent}" opacity="0.7"/>` +
    `<g transform="translate(46 560) rotate(-90)">${txt(0, 0, "ISRA ANWAR  ·  STORE  ·  N° " + c.edition, { sans: true, size: 12, weight: 700, fill: c.accent, ls: 5 })}</g>` +
    plate(c, { x: 124, y: 48, w: 620, h: 196 }) + medallion(c, 640, 244, 56) +
    textBlock(c, { x: 124, maxW: 470, yBottom: 510, maxLines: 2 }) + ornament(c.plan.ornament, 744, 28, c, "end") + footer(c, 124, 744, 566),
  // 5 medallion focus
  (c) => plate(c, { x: 372, y: 70, w: 380, h: 380 }, "circle") + medallion(c, 452, 430, 58) +
    textBlock(c, { x: 56, maxW: 300, yBottom: 500 }) + ornament(c.plan.ornament, 56, 70, c) + footer(c),
  // 6 arch window
  (c) => plate(c, { x: 484, y: 48, w: 264, h: 450 }, "arch") + medallion(c, 616, 360, 56) +
    textBlock(c, { x: 56, maxW: 380, yBottom: 500 }) + ornament(c.plan.ornament, 56, 70, c) + footer(c),
  // 7 title above full-width strip
  (c) => textBlock(c, { x: 56, maxW: 600, yTop: 50, maxLines: 3 }) +
    `<defs><clipPath id="strip"><rect x="0" y="348" width="800" height="206"/></clipPath></defs><rect x="0" y="348" width="800" height="206" fill="${c.plate}"/>` +
    `<g clip-path="url(#strip)">${art(c.plan.art, { x: 0, y: 348, w: 800, h: 206 }, c.seed, c.accent, WEIGHTS[c.plan.weight], c.plate)}</g>` +
    `<rect x="0" y="348" width="800" height="206" fill="none" stroke="${c.accent}" stroke-width="${f(WEIGHTS[c.plan.weight])}"/>` +
    medallion(c, 678, 348, 62) + ornament(c.plan.ornament, 56, 322, c) + footer(c, 56, 744, 590),
  // 8 diagonal split
  (c) => `<defs><clipPath id="dg"><path d="M470 0 H800 V600 H318 Z"/></clipPath></defs><path d="M470 0 H800 V600 H318 Z" fill="${c.plate}"/>` +
    `<g clip-path="url(#dg)">${art(c.plan.art, { x: 300, y: 0, w: 500, h: 600 }, c.seed, c.accent, WEIGHTS[c.plan.weight], c.plate)}</g>` +
    `<path d="M470 0 L318 600" stroke="${c.accent}" stroke-width="${f(WEIGHTS[c.plan.weight] * 1.3)}"/>` + medallion(c, 580, 300, 66) +
    textBlock(c, { x: 56, maxW: 270, yBottom: 500 }) + ornament(c.plan.ornament, 56, 70, c) + footer(c, 56, 300, 566),
  // 9 poster numeral
  (c) => `<text x="40" y="500" ${SERIF} font-size="330" font-weight="700" fill="none" stroke="${c.accent}" stroke-width="${f(WEIGHTS[c.plan.weight] * 0.8)}" opacity="0.16" letter-spacing="-8">${c.edition}</text>` +
    `<g opacity="0.55">${art(c.plan.art, { x: 520, y: 40, w: 240, h: 240 }, c.seed, c.accent, WEIGHTS[c.plan.weight], c.bg1)}</g>` + medallion(c, 640, 160, 70) +
    textBlock(c, { x: 56, maxW: 420, yBottom: 500 }) + ornament(c.plan.ornament, 56, 70, c) + footer(c),
];

export function renderLayout(ctx) {
  return SKELETONS[ctx.plan.skeleton % SKELETON_COUNT](ctx);
}
