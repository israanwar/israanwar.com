// Main-thread wrapper around imageResizeWorker.js. Deliberately not shared
// with the Compressor's client — same shape, separate module, separate
// worker instance, so the two tools stay fully isolated from each other.

let worker = null;
let nextId = 0;
const pending = new Map();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("../../workers/imageResizeWorker.js", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (event) => {
      const { id, ok, buffer, mimeType, width, height, error } = event.data;
      const request = pending.get(id);
      if (!request) return;
      pending.delete(id);
      if (ok) {
        request.resolve({ blob: new Blob([buffer], { type: mimeType }), mimeType, width, height });
      } else {
        request.reject(new Error(error || "The image could not be resized."));
      }
    };
    worker.onerror = (event) => {
      const message = event?.message || "The resize worker failed to start.";
      for (const request of pending.values()) request.reject(new Error(message));
      pending.clear();
      worker = null;
    };
  }
  return worker;
}

/**
 * Resize + re-encode one image file entirely inside a Web Worker. Never
 * touches the network.
 *
 * @param {File|Blob} file
 * @param {{ targetWidth: number, targetHeight: number, outputFormat: "jpeg"|"png"|"webp", quality?: number }} options
 * @returns {Promise<{ blob: Blob, mimeType: string, width: number, height: number }>}
 */
export async function resizeImage(file, { targetWidth, targetHeight, outputFormat, quality = 75 }) {
  const bytes = await file.arrayBuffer();
  const id = ++nextId;
  const instance = getWorker();
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    instance.postMessage(
      { id, bytes, sourceType: file.type, targetWidth, targetHeight, outputFormat, quality },
      [bytes],
    );
  });
}
