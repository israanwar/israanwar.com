// Main-thread wrapper around imageCompressWorker.js. One worker is shared
// across every file in a batch (loading the wasm codecs is the expensive
// part; each individual compress call is cheap once they're warm), and
// requests are matched back up by id so several files can be in flight
// without stepping on each other.

let worker = null;
let nextId = 0;
const pending = new Map();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("../../workers/imageCompressWorker.js", import.meta.url), {
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
        request.reject(new Error(error || "The image could not be processed."));
      }
    };
    worker.onerror = (event) => {
      // A load-time failure (e.g. the wasm asset 404s) rejects every
      // in-flight request instead of hanging them forever, and lets the
      // next call spin up a fresh worker rather than reusing a dead one.
      const message = event?.message || "The compression worker failed to start.";
      for (const request of pending.values()) request.reject(new Error(message));
      pending.clear();
      worker = null;
    };
  }
  return worker;
}

/**
 * Compress/re-encode one image file entirely inside a Web Worker.
 * Never touches the network — the file's bytes go straight from this tab
 * into the worker via postMessage and back.
 *
 * @param {File|Blob} file
 * @param {{ outputFormat: "jpeg"|"png"|"webp", quality?: number }} options
 * @returns {Promise<{ blob: Blob, mimeType: string, width: number, height: number }>}
 */
export async function compressImage(file, { outputFormat, quality = 75 }) {
  const bytes = await file.arrayBuffer();
  const id = ++nextId;
  const instance = getWorker();
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    instance.postMessage(
      { id, bytes, sourceType: file.type, outputFormat, quality },
      [bytes],
    );
  });
}
