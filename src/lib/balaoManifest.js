// Auditable inventory of public sources. IDs and URLs are generated from
// records used by pages; private routes, orders, and contact submissions
// are never inputs to Balao's knowledge.
export function buildBalaoManifest(knowledge) {
  const base = String(knowledge.site?.url || "").replace(/\/$/, "");
  const records = [];
  const add = (type, id, name, path, source) => records.push({ type, id, name, url: base + path, source });
  for (const c of knowledge.categories || []) add("category", c.slug, c.name, `/services/${c.slug}`, "public active service catalog");
  for (const s of knowledge.services || []) add("service", s.slug, s.name, `/services/${s.slug}`, "public active service catalog");
  for (const r of knowledge.rateCard || []) add("rate", r.id, r.name, "/services", "israanwar-master-rate-card-v2.md (LOCKED)");
  for (const group of knowledge.tools || []) for (const t of group.tools || []) add("tool", t.slug, t.name, `/tools/${t.slug}`, "toolsCatalog.js");
  for (const p of knowledge.products || []) add("product", p.slug, p.name, `/store/${p.slug}`, "public active product catalog");
  for (const p of knowledge.posts || []) add("post", p.slug, p.title, `/blog/${p.slug}`, "public published posts");
  for (const [providerIndex, provider] of (knowledge.portfolio?.certifications || []).entries()) {
    for (const [index, cert] of (provider.items || []).entries()) records.push({ type: "credential", id: `${providerIndex}:${index}`, name: cert.name, url: cert.url, source: "public portfolio" });
  }
  const counts = {};
  for (const r of records) counts[r.type] = (counts[r.type] || 0) + 1;
  return { counts, records, boundaries: "Public catalog only; no admin, customer orders, private uploads, or contact submissions." };
}
