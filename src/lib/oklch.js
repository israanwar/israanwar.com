// OKLCH to sRGB hex. OKLCH keeps lightness and chroma perceptually even, so
// tints and shades of one hue stay clean instead of turning muddy like HSL.
const toHex = (v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0");
const gamma = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.abs(v) ** (1 / 2.4) - 0.055);

export function oklchToRgb(L, C, H) {
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(gamma);
}

export function inGamut(L, C, H) {
  return oklchToRgb(L, C, H).every((v) => v >= -0.0005 && v <= 1.0005);
}

// Out-of-gamut colors lose chroma until they fit, never shifting hue.
export function oklchToHex(L, C, H) {
  let chroma = C;
  while (chroma > 0 && !inGamut(L, chroma, H)) chroma -= 0.002;
  return `#${oklchToRgb(L, Math.max(0, chroma), H).map(toHex).join("")}`;
}
