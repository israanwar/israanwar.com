// Editor-side checks. These are transparent, deterministic checks inspired by
// Yoast's published assessment list, not Yoast's proprietary scoring engine.
export const SEO_AUDIT_SOURCES = {
  yoast: "Yoast SEO Analysis: pemeriksaan frasa fokus dan struktur konten",
  title: "Google Search Central: judul yang jelas dan deskriptif",
  snippet: "Google Search Central: deskripsi halaman yang relevan",
  links: "Google Search Central: tautan yang dapat dijelajahi dan relevan",
  canonical: "Google Search Central: penentuan URL canonical",
};

function normalize(value) {
  return String(value ?? "").normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function words(value) {
  return normalize(value).split(/\s+/u).filter(Boolean);
}

function containsPhrase(haystack, phrase) {
  const needle = normalize(phrase);
  return Boolean(needle) && ` ${normalize(haystack)} `.includes(` ${needle} `);
}

function textOf(node) {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(textOf).filter(Boolean).join(" ");
  return [node.text ?? "", textOf(node.content)].filter(Boolean).join(" ").trim();
}

function collectBlocks(doc) {
  const paragraphs = [];
  const headings = [];
  const links = [];
  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "paragraph" && textOf(node)) paragraphs.push(textOf(node));
    if (node.type === "heading" && textOf(node)) headings.push(textOf(node));
    if (node.type === "text") {
      for (const mark of node.marks ?? []) {
        if (mark.type === "link" && mark.attrs?.href) links.push(mark.attrs.href);
      }
    }
    for (const child of node.content ?? []) visit(child);
  }
  visit(doc);
  return { paragraphs, headings, links, body: textOf(doc) };
}

function linkKind(href) {
  const value = String(href ?? "").trim();
  if (value.startsWith("/") || value.startsWith("#")) return "internal";
  try {
    const url = new URL(value);
    if (!/https?:/.test(url.protocol)) return "other";
    return /^(www\.)?israanwar\.com$/i.test(url.hostname) ? "internal" : "external";
  } catch {
    return "other";
  }
}

function check(id, label, status, evidence, action, source) {
  return { id, label, status, evidence, action, source };
}

export function auditPostSeo(post, relatedPosts = null) {
  const title = String(post.meta_title || post.title || "").trim();
  const description = String(post.meta_description || post.excerpt || "").trim();
  const slug = String(post.slug || "").trim();
  const phrase = String(post.focus_keyword || "").trim();
  const { paragraphs, headings, links, body } = collectBlocks(post.content);
  const bodyWords = words(body);
  const internalLinks = links.filter((href) => linkKind(href) === "internal");
  const externalLinks = links.filter((href) => linkKind(href) === "external");
  const references = Array.isArray(post.references) ? post.references : [];
  const relatedSlugs = Array.isArray(post.related_slugs) ? post.related_slugs : [];
  const validRelated = relatedPosts ? relatedSlugs.filter((s) => relatedPosts.some((p) => p.slug === s && p.status === "published")) : [];
  const externalReferences = references.filter((ref) => String(ref.title ?? "").trim() && linkKind(ref.url) === "external");
  const canonical = String(post.canonical_path || `/blog/${slug}`).trim();
  const canonicalIsPath = canonical.startsWith("/") && !canonical.startsWith("//") && !/[?#\s]/u.test(canonical);
  let canonicalIsExternal = false;
  let canonicalIsSameSite = false;
  if (!canonicalIsPath) {
    try {
      const url = new URL(canonical);
      if (/^https?:$/u.test(url.protocol)) {
        canonicalIsSameSite = /^(www\.)?israanwar\.com$/i.test(url.hostname);
        canonicalIsExternal = !canonicalIsSameSite;
      }
    } catch { /* Invalid canonical remains a warning. */ }
  }
  const checks = [
    check("title", "Judul SEO", title ? "good" : "improve", `${title ? `${title.length} karakter` : "Belum ada judul"}${post.meta_title ? " · meta title khusus" : " · memakai judul post"}`, "Tulis judul yang jelas dan menggambarkan isi artikel.", SEO_AUDIT_SOURCES.title),
    check("description", "Meta description", description ? "good" : "improve", `${description ? `${description.length} karakter` : "Belum ada deskripsi"}${post.meta_description ? " · meta description khusus" : " · memakai excerpt"}`, "Tulis ringkasan unik yang menjelaskan isi halaman. Google dapat memilih cuplikan lain.", SEO_AUDIT_SOURCES.snippet),
    check("slug", "URL artikel", /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug) ? "good" : "improve", slug ? `/blog/${slug}` : "Slug belum diisi; saat simpan akan dibuat dari judul.", "Gunakan slug yang jelas. Cek ulang setelah mengubah slug artikel yang sudah terbit.", SEO_AUDIT_SOURCES.yoast),
    check("canonical", "Canonical", (canonicalIsPath || canonicalIsSameSite) && slug ? "good" : (canonicalIsExternal ? "info" : "improve"), (canonicalIsPath || canonicalIsSameSite) && slug ? canonical : (canonicalIsExternal ? `URL lintas domain: ${canonical} · perlu pemeriksaan manual` : "Path canonical belum valid."), "Gunakan path seperti /blog/nama-artikel; URL lintas domain perlu dipastikan disengaja.", SEO_AUDIT_SOURCES.canonical),
    check("keyphrase", "Frasa fokus", phrase ? "good" : "improve", phrase ? `“${phrase}” · ${words(phrase).length} kata` : "Belum diisi", "Isi frasa fokus agar pemeriksaan relevansi bisa berjalan.", SEO_AUDIT_SOURCES.yoast),
  ];

  const phraseChecks = [
    ["phrase-title", "Frasa utuh di judul", title, title ? `Judul: ${title}` : "Judul kosong"],
    ["phrase-description", "Frasa utuh di deskripsi", description, description ? `Deskripsi: ${description.slice(0, 130)}${description.length > 130 ? "…" : ""}` : "Deskripsi kosong"],
    ["phrase-intro", "Frasa utuh di paragraf pertama", paragraphs[0] ?? "", paragraphs.length ? `Paragraf pertama: ${paragraphs[0].slice(0, 130)}${paragraphs[0].length > 130 ? "…" : ""}` : "Konten belum punya paragraf"],
    ["phrase-heading", "Frasa utuh di subjudul", headings.join(" "), headings.length ? `${headings.length} subjudul diperiksa` : "Konten belum punya subjudul"],
  ];
  for (const [id, label, target, evidence] of phraseChecks) {
    checks.push(check(id, label, phrase ? (containsPhrase(target, phrase) ? "good" : "improve") : "pending", evidence, "Gunakan frasa secara alami jika memang sesuai dengan isi.", SEO_AUDIT_SOURCES.yoast));
  }

  const slugWords = new Set(words(slug.replace(/-/gu, " ")));
  const focusWords = words(phrase);
  const matchedSlugWords = focusWords.filter((word) => slugWords.has(word)).length;
  checks.push(check(
    "phrase-slug", "Kata frasa fokus di URL",
    phrase ? (containsPhrase(slug.replace(/-/gu, " "), phrase) ? "good" : "info") : "pending",
    phrase ? `${matchedSlugWords}/${focusWords.length} kata sama persis · slug: ${slug || "(kosong)"}` : "Frasa fokus belum diisi",
    "Kecocokan kata ini hanya informasi. URL artikel yang sudah terbit jangan diganti hanya demi lampu hijau tanpa redirect.",
    SEO_AUDIT_SOURCES.yoast,
  ));

  const phraseOccurrences = phrase ? ` ${normalize(body)} `.split(` ${normalize(phrase)} `).length - 1 : 0;
  checks.push(
    check("body", "Frasa dalam isi", phrase ? (containsPhrase(body, phrase) ? "good" : "improve") : "pending", `${bodyWords.length} kata di isi · ${phrase ? `${Math.max(0, phraseOccurrences)} kemunculan frasa utuh` : "frasa belum diisi"}`, "Tulis artikel untuk pembaca; jangan mengulang frasa hanya demi indikator.", SEO_AUDIT_SOURCES.yoast),
    check("internal", "Tautan internal", internalLinks.length + validRelated.length ? "good" : (relatedSlugs.length && !relatedPosts ? "pending" : "improve"), `${internalLinks.length} tautan di isi · ${relatedPosts ? `${validRelated.length} post terkait yang terbit` : "post terkait belum terverifikasi"}`, "Hubungkan ke halaman lain yang relevan di situs ini.", SEO_AUDIT_SOURCES.links),
    check("outbound", "Tautan keluar", externalLinks.length + externalReferences.length ? "good" : "improve", `${externalLinks.length} tautan di isi · ${externalReferences.length} referensi eksternal`, "Tambahkan sumber luar yang relevan jika artikel memerlukannya.", SEO_AUDIT_SOURCES.yoast),
    check("length", "Panjang konten", "info", `${bodyWords.length} kata di isi artikel`, "Jumlah kata ditampilkan sebagai data; tidak ada panjang universal yang menjamin peringkat.", SEO_AUDIT_SOURCES.yoast),
  );

  return {
    checks,
    good: checks.filter((item) => item.status === "good").length,
    improve: checks.filter((item) => item.status === "improve").length,
    pending: checks.filter((item) => item.status === "pending").length,
    info: checks.filter((item) => item.status === "info").length,
  };
}
