const TABLES = {
  settings: "site_settings",
  homepage: "homepage_sections",
  page: "pages",
  post: "posts",
  product: "products",
  service: "services",
};

export function liveDataTable(key) {
  const root = String(key ?? "").replace(/^okr:/, "").split(":")[0];
  return TABLES[root] ?? root;
}

// Empty keys mean a broad invalidation (for example localStorage.clear()).
export function affectsLiveData(key, changedKey) {
  return !changedKey || liveDataTable(key) === liveDataTable(changedKey);
}

export function storageChangeKey(event) {
  if (event.key === "okr:remote-store-ping") {
    try { return JSON.parse(event.newValue)?.key ?? null; }
    catch { return null; }
  }
  return event.key;
}
