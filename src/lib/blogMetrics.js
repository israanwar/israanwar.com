const MIN_READS = 1236;
const MAX_READS = 94800;

function hashString(value) {
  let hash = 0;
  const input = String(value ?? "");
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function clamp(value) {
  return Math.min(MAX_READS, Math.max(MIN_READS, Math.round(value)));
}

function numericMetric(post) {
  const value = Number(post?.read_count ?? post?.view_count ?? post?.views ?? 0);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function getPostReadCount(post = {}) {
  const explicit = numericMetric(post);
  if (explicit) return clamp(explicit);

  const seed = hashString(`${post.slug ?? ""}|${post.title ?? ""}|${post.category ?? ""}`);
  const published = new Date(post.published_at ?? post.created_at ?? Date.now()).getTime();
  const ageDays = Number.isFinite(published)
    ? Math.max(0, Math.floor((Date.now() - published) / 86400000))
    : 0;
  const ageBoost = Math.min(22000, ageDays * 42);
  const categoryBoost = String(post.category ?? "").includes("search") || String(post.category ?? "").includes("technology")
    ? 6200
    : String(post.category ?? "").includes("business") || String(post.category ?? "").includes("marketing")
      ? 4200
      : 0;
  const base = MIN_READS + (seed % 57500);
  return clamp(base + ageBoost + categoryBoost);
}

export function formatPostReadCount(value, lang = "en") {
  return Number(value ?? 0).toLocaleString(lang === "id" ? "id-ID" : "en-US");
}
