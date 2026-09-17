// Vite emits content-hashed route chunks. A tab restored after a deployment
// can still reference the previous hash, so its next dynamic import rejects
// even though the new deployment is healthy. React.lazy does not retry that
// rejection by itself.
const RELOAD_MARKER_KEY = "okr:route-chunk-reload";

const CHUNK_LOAD_ERROR_PATTERNS = [
  /failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /importing a module script failed/i,
  /unable to preload css for/i,
  /loading chunk .+ failed/i,
  /chunkloaderror/i,
];

function currentLocationKey() {
  return `${window.location.pathname}${window.location.search}`;
}

export function isChunkLoadError(error) {
  const name = error?.name || "";
  const message = error?.message || String(error || "");
  const details = `${name}: ${message}`;

  // Safari reports a failed dynamic import as the otherwise terse
  // TypeError("Load failed"). This catch only surrounds the import() loader,
  // so the exact pair remains narrow and does not swallow app exceptions.
  if (name === "TypeError" && message === "Load failed") return true;

  return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) => pattern.test(details));
}

function markReloadAttempt() {
  try {
    const locationKey = currentLocationKey();
    const previous = JSON.parse(sessionStorage.getItem(RELOAD_MARKER_KEY) || "null");
    if (previous?.locationKey === locationKey) return false;

    sessionStorage.setItem(RELOAD_MARKER_KEY, JSON.stringify({ locationKey }));
    return true;
  } catch {
    // If storage is unavailable we cannot prove a reload is bounded. Surface
    // the original error through the route boundary instead of risking a loop.
    return false;
  }
}

export function clearChunkReloadMarker() {
  try {
    sessionStorage.removeItem(RELOAD_MARKER_KEY);
  } catch {
    // Storage may be unavailable in hardened/private browsing modes.
  }
}

// Reload only for a recognised route-asset failure and only once for the
// current URL. A fresh document receives the current deployment manifest.
// The marker is cleared by AppRoutes only after the destination route mounts.
export function importWithRetry(loader) {
  return loader().catch((error) => {
    if (!isChunkLoadError(error) || !markReloadAttempt()) throw error;

    window.location.reload();
    // Navigation is in progress. Keeping this promise pending prevents the
    // stale document from rendering an intermediate error before unload.
    return new Promise(() => {});
  });
}
