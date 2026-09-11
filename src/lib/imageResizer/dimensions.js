// Pure target-dimension math for the Image Resizer. No DOM, no canvas — kept
// this way specifically so the arithmetic (the part with exact expected
// numbers in the spec) can be verified directly, independent of any browser
// quirk in the actual pixel resize step.

/** Clamp to a sane positive integer; never 0, never negative, never NaN. */
export function toPositiveInt(value, fallback = 1) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 1) return fallback;
  return n;
}

/**
 * Dimensions mode: user typed one axis, the other follows the source's
 * aspect ratio when locked. Returns the pair to actually resize to.
 */
export function computeDimensions(sourceWidth, sourceHeight, width, height, lockRatio) {
  const ratio = sourceWidth / sourceHeight;
  if (!lockRatio) {
    return { width: toPositiveInt(width), height: toPositiveInt(height) };
  }
  // Locked: whichever axis was just edited drives the other. Since the
  // caller always has both fields, prefer width as the driver when both are
  // present (the component only calls this with one axis "fresh" and
  // recomputes the other before display), rounding rather than truncating
  // to avoid drifting the ratio by more than half a pixel.
  const w = toPositiveInt(width);
  return { width: w, height: Math.max(1, Math.round(w / ratio)) };
}

export function computeHeightDriven(sourceWidth, sourceHeight, height) {
  const ratio = sourceWidth / sourceHeight;
  const h = toPositiveInt(height);
  return { width: Math.max(1, Math.round(h * ratio)), height: h };
}

/** Percentage mode: 25/50/75/custom, applied uniformly to both axes. */
export function computePercentage(sourceWidth, sourceHeight, percent) {
  const p = Number(percent);
  if (!Number.isFinite(p) || p <= 0) return null; // caller shows a validation error
  return {
    width: Math.max(1, Math.round((sourceWidth * p) / 100)),
    height: Math.max(1, Math.round((sourceHeight * p) / 100)),
  };
}

/**
 * Fit Within mode: scale down (never crop) so the whole image sits inside
 * maxWidth x maxHeight, preserving aspect ratio. Only upscales if the
 * caller explicitly says so (allowUpscale) — mirrors the tool-wide Prevent
 * Upscale switch for this mode specifically, since "fit within a box
 * without ever exceeding it" naturally wants scale <= 1 by default.
 */
export function computeFitWithin(sourceWidth, sourceHeight, maxWidth, maxHeight, allowUpscale = false) {
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  const effectiveScale = allowUpscale ? scale : Math.min(scale, 1);
  return {
    width: Math.max(1, Math.round(sourceWidth * effectiveScale)),
    height: Math.max(1, Math.round(sourceHeight * effectiveScale)),
  };
}

/**
 * Final safety net applied after any mode's math: if Prevent Upscale is on
 * and the computed target would enlarge the image on either axis, the
 * resize is a no-op — output stays at the source's own dimensions rather
 * than a partially-clamped guess. Returns `{ width, height, clamped }` so
 * the caller can show the user why nothing grew.
 */
export function applyPreventUpscale(sourceWidth, sourceHeight, targetWidth, targetHeight, preventUpscale) {
  const wouldUpscale = targetWidth > sourceWidth || targetHeight > sourceHeight;
  if (preventUpscale && wouldUpscale) {
    return { width: sourceWidth, height: sourceHeight, clamped: true };
  }
  return { width: targetWidth, height: targetHeight, clamped: false };
}
