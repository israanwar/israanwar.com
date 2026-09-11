// Image Resizer worker — deliberately a standalone sibling of
// imageCompressWorker.js, not a shared module. Both are simple enough (and
// the Compressor is LOCKed) that duplicating the small encode step here
// keeps the two tools fully isolated: nothing in this file is imported by,
// or imports from, the Compressor.
//
// Pipeline, all off the main thread:
//   1. decode  — native createImageBitmap (respects EXIF orientation by
//      default; verified across Chromium/Firefox/WebKit during the
//      Compressor's QA pass, same browser behavior applies here).
//   2. resize  — Pica (https://github.com/nodeca/pica, MIT), its `mks2013`
//      filter (the documented high-quality default — resize + sharpen in
//      one pass). Configured with features: ["js","wasm"] — no "ww", i.e.
//      Pica's own worker pool is disabled, because this file already *is*
//      the worker; nesting a second worker pool inside it would add
//      complexity for no benefit. Pica's wasm is inlined as base64 by its
//      own build, so no separate .wasm asset/URL wiring is needed (unlike
//      the jSquash codecs below).
//   3. encode  — same three jSquash codecs the Compressor uses (mozjpeg /
//      libwebp / oxipng), duplicated here rather than imported, per the
//      isolation requirement above. Same white-flatten-before-JPEG
//      behavior as the Compressor for transparent sources (see
//      decodeToImageData below).
//
// No network call anywhere in this file. Bytes arrive via postMessage from
// the tab that owns them and never leave the worker except back to that
// same tab.

import createPica from "pica/pica_main";
import { init as initJpegEncode, default as encodeJpeg } from "@jsquash/jpeg/encode";
import { init as initWebpEncode, default as encodeWebp } from "@jsquash/webp/encode";
import { init as initOxipng, default as optimisePng } from "@jsquash/oxipng/optimise";

import mozjpegEncWasmUrl from "@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm?url";
import webpEncWasmUrl from "@jsquash/webp/codec/enc/webp_enc.wasm?url";
import oxipngWasmUrl from "@jsquash/oxipng/codec/pkg/squoosh_oxipng_bg.wasm?url";

const pica = createPica({ features: ["js", "wasm"] });

// Pica's own createCanvas() falls back to `document.createElement("canvas")`
// for a few internal temp buffers (the ImageBitmap-orientation-bug
// workaround and the unsharp-mask step) whenever it isn't explicitly told
// to prefer OffscreenCanvas. There is no `document` in a Worker, and we
// deliberately run without Pica's own "ww" worker-pool feature (see header
// note above), so those specific calls threw "Pica: cannot create canvas".
// OffscreenCanvas is always available here (this file only ever runs
// inside a Worker), and it's exactly what Pica already uses everywhere else
// in its own code when `preferOffscreen` is true — so force it uniformly
// rather than touch Pica's resize logic itself.
pica.createCanvas = (width, height) => new OffscreenCanvas(width, height);

let codecsReady = null;
function ensureCodecsReady() {
  if (!codecsReady) {
    codecsReady = Promise.all([
      initJpegEncode({ locateFile: () => mozjpegEncWasmUrl }),
      initWebpEncode({ locateFile: () => webpEncWasmUrl }),
      initOxipng(oxipngWasmUrl).catch(() => null), // optional; see encodePng fallback
    ]);
  }
  return codecsReady;
}

async function decodeToBitmap(bytes, sourceType) {
  const blob = new Blob([bytes], { type: sourceType });
  return createImageBitmap(blob);
}

async function resizeToImageData(bitmap, targetWidth, targetHeight, flattenOnWhite) {
  const resized = new OffscreenCanvas(targetWidth, targetHeight);
  await pica.resize(bitmap, resized, {}); // default mks2013 filter, alpha preserved

  if (!flattenOnWhite) {
    const ctx = resized.getContext("2d");
    return ctx.getImageData(0, 0, targetWidth, targetHeight);
  }

  // Same reasoning as the Compressor: JPEG has no alpha channel, so a
  // transparent source's RGB (often literal black) would otherwise show
  // through once alpha is discarded. Composite the already-resized RGBA
  // canvas onto a fresh white one instead of flattening pre-resize, so the
  // resize filter still sees genuine alpha for correct edge blending.
  const flattened = new OffscreenCanvas(targetWidth, targetHeight);
  const fctx = flattened.getContext("2d");
  fctx.fillStyle = "#ffffff";
  fctx.fillRect(0, 0, targetWidth, targetHeight);
  fctx.drawImage(resized, 0, 0);
  return fctx.getImageData(0, 0, targetWidth, targetHeight);
}

async function encodePng(imageData) {
  try {
    const optimised = await optimisePng(imageData, { level: 2 });
    if (optimised) return optimised;
  } catch {
    // fall through to the plain-canvas fallback below
  }
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext("2d");
  ctx.putImageData(imageData, 0, 0);
  const blob = await canvas.convertToBlob({ type: "image/png" });
  return blob.arrayBuffer();
}

self.onmessage = async (event) => {
  const { id, bytes, sourceType, targetWidth, targetHeight, outputFormat, quality } = event.data;
  try {
    if (!(targetWidth > 0) || !(targetHeight > 0)) {
      throw new Error("Target dimensions must be greater than zero.");
    }
    await ensureCodecsReady();
    const bitmap = await decodeToBitmap(bytes, sourceType);
    if (bitmap.width * bitmap.height > 60_000_000) {
      bitmap.close();
      throw new Error("This image's resolution is too high to resize in-browser.");
    }
    const flattenOnWhite = outputFormat === "jpeg";
    const imageData = await resizeToImageData(bitmap, targetWidth, targetHeight, flattenOnWhite);
    bitmap.close();

    let resultBuffer;
    let mimeType;
    if (outputFormat === "png") {
      resultBuffer = await encodePng(imageData);
      mimeType = "image/png";
    } else if (outputFormat === "webp") {
      resultBuffer = await encodeWebp(imageData, { quality });
      mimeType = "image/webp";
    } else {
      resultBuffer = await encodeJpeg(imageData, { quality });
      mimeType = "image/jpeg";
    }

    self.postMessage(
      { id, ok: true, buffer: resultBuffer, mimeType, width: imageData.width, height: imageData.height },
      [resultBuffer],
    );
  } catch (error) {
    self.postMessage({ id, ok: false, error: error?.message || "The image could not be resized." });
  }
};
