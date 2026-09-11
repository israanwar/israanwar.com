// Image Compressor worker — all decode/encode happens in here, off the main
// thread, so a large image never freezes the UI. Nothing in this file (or
// anything it calls) performs a network request: input bytes come in via
// postMessage from the tab that owns them, and the only I/O is the codecs'
// own .wasm binaries, which are bundled same-origin assets (see the `?url`
// imports below) — not a call to any server, analytics endpoint, or
// third-party service.
//
// Codecs: jSquash (https://github.com/jamsinclair/jSquash, Apache-2.0),
// which repackages Google's Squoosh app codecs
// (https://github.com/GoogleChromeLabs/squoosh, Apache-2.0) as plain ESM.
// Only the encode path of each codec is used — decoding of the *source*
// file is done with the browser's own native image decoder
// (createImageBitmap), which already handles JPEG/PNG/WebP without any
// extra wasm, so the worker doesn't bundle a decoder for each of those.
//
// - JPEG output -> @jsquash/jpeg (mozjpeg encoder)
// - WebP output -> @jsquash/webp (libwebp encoder)
// - PNG output  -> @jsquash/oxipng (lossless re-compression of the browser's
//   own PNG encode; falls back to that plain PNG blob untouched if oxipng's
//   wasm fails to load for any reason, so PNG output never hard-fails).

import { init as initJpegEncode, default as encodeJpeg } from "@jsquash/jpeg/encode";
import { init as initWebpEncode, default as encodeWebp } from "@jsquash/webp/encode";
import { init as initOxipng, default as optimisePng } from "@jsquash/oxipng/optimise";

import mozjpegEncWasmUrl from "@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm?url";
import webpEncWasmUrl from "@jsquash/webp/codec/enc/webp_enc.wasm?url";
import oxipngWasmUrl from "@jsquash/oxipng/codec/pkg/squoosh_oxipng_bg.wasm?url";

// Each codec's own bundled glue guesses its .wasm path relative to the
// *built* JS chunk's location, using plain string concatenation rather than
// a bundler-analyzable `new URL(..., import.meta.url)` — so after Vite
// hashes filenames for production, that guess 404s. Handing each codec the
// real, hashed `?url` import up front (once, before first use) sidesteps
// the guess entirely.
let codecsReady = null;
function ensureCodecsReady() {
  if (!codecsReady) {
    codecsReady = Promise.all([
      initJpegEncode({ locateFile: () => mozjpegEncWasmUrl }),
      initWebpEncode({ locateFile: () => webpEncWasmUrl }),
      initOxipng(oxipngWasmUrl).catch(() => null), // optional; see PNG path below
    ]);
  }
  return codecsReady;
}

async function decodeToImageData(bytes, sourceType, { flattenOnWhite = false } = {}) {
  const blob = new Blob([bytes], { type: sourceType });
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d", { alpha: true });
  if (flattenOnWhite) {
    // JPEG has no alpha channel, so the encoder simply drops it — leaving
    // whatever RGB value sat under a transparent pixel. Many PNGs store
    // (0,0,0) there, which turned transparent areas solid black once alpha
    // was discarded. Painting white first, before the source is drawn on
    // top, makes that flatten deterministic and matches what a person
    // expects a "removed" transparent background to look like.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  bitmap.close();
  return imageData;
}

async function encodePng(imageData) {
  try {
    // level 2 keeps re-compression time reasonable on large photos while
    // still meaningfully beating the browser's own PNG encoder.
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
  const { id, bytes, sourceType, outputFormat, quality } = event.data;
  try {
    await ensureCodecsReady();
    const imageData = await decodeToImageData(bytes, sourceType, { flattenOnWhite: outputFormat === "jpeg" });

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
      {
        id,
        ok: true,
        buffer: resultBuffer,
        mimeType,
        width: imageData.width,
        height: imageData.height,
      },
      [resultBuffer],
    );
  } catch (error) {
    self.postMessage({ id, ok: false, error: error?.message || "The image could not be processed." });
  }
};
