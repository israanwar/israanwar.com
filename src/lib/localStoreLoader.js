// localStore.js holds the offline/admin fallback store and its seed catalog.
// It is loaded on demand so public visitors on a Supabase-backed site never
// download it unless a remote read actually fails.
let loaded = null;
let pending = null;

export function loadLocalStore() {
  pending ??= import("./localStore").then((mod) => (loaded = mod));
  return pending;
}

export function getLoadedLocalStore() {
  return loaded;
}
