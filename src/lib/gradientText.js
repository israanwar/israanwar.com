// Color-gradient math for the "gradasi" tail-word accent on hero titles
// like "Build what conventional minds miss before the market moves." — see
// AnimatedHeadline.jsx, the one consumer of this.
const GRADIENT_STOPS = [
  { at: 0, color: [212, 103, 67] },
  { at: 0.4, color: [155, 68, 47] },
  { at: 1, color: [59, 37, 40] },
];

// `index`/`total` describe one glyph's position within the word it's part
// of (0-based index, word length) — the gradient runs orange-to-dark across
// each individual word, restarting for the next one, matching how
// AnimatedHeadline has always applied it.
function interpolate(stops, index, total) {
  const progress = total > 1 ? index / (total - 1) : 0;
  const rightIndex = stops.findIndex((stop) => progress <= stop.at);
  const right = stops[Math.max(rightIndex, 1)];
  const left = stops[Math.max(rightIndex - 1, 0)];
  const span = Math.max(right.at - left.at, Number.EPSILON);
  const localProgress = (progress - left.at) / span;
  const channels = left.color.map((channel, channelIndex) => (
    Math.round(channel + (right.color[channelIndex] - channel) * localProgress)
  ));
  return `rgb(${channels.join(", ")})`;
}

export function getGradientColor(index, total) {
  return interpolate(GRADIENT_STOPS, index, total);
}
