import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createPost, getPost, listPosts, updatePost } from "../../services/postService";
import { RichEditor } from "../../components/admin/RichEditor";
import { useAuth } from "../../hooks/useAuth";
import { BLOG_CATEGORIES } from "../../data/blogCategories";
import { auditPostSeo } from "../../lib/seoAudit";

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function toDateTimeLocal(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function fromDateTimeLocal(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

function referencesToText(refs) {
  return (Array.isArray(refs) ? refs : []).map((ref) => [ref.title, ref.source, ref.url].filter(Boolean).join(" | ")).join("\n");
}

function textToReferences(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title = "", source = "", url = ""] = line.split("|").map((part) => part.trim());
      return { title, source, url };
    })
    .filter((ref) => ref.title || ref.url);
}

export function AdminPostEditPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const isNew = id === "new";
  const [post, setPost] = useState({
    title: "", slug: "", excerpt: "", content: null, cover_url: "", tags: [], status: "draft",
    category: "", focus_keyword: "", meta_title: "", meta_description: "",
    canonical_path: "", related_slugs: [], references: [], published_at: "", read_count: "",
  });
  const [referencesText, setReferencesText] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState(null);

  const audit = useMemo(() => auditPostSeo({
    ...post,
    slug: post.slug || slugify(post.title),
    references: textToReferences(referencesText),
  }, relatedPosts), [post, referencesText, relatedPosts]);

  useEffect(() => {
    if (isNew) {
      setReferencesText("");
      return;
    }
    let active = true;
    setLoading(true);
    setLoadError("");
    getPost(id).then((p) => {
      if (!active) return;
      if (!p) {
        setLoadError("Post tidak ditemukan. Buka kembali dari daftar Posts.");
        return;
      }
      setPost({
        ...p,
        tags: Array.isArray(p.tags) ? p.tags : [],
        related_slugs: Array.isArray(p.related_slugs) ? p.related_slugs : [],
      });
      setOriginalSlug(p.slug || "");
      setReferencesText(referencesToText(p.references));
    }).catch((error) => {
      if (active) setLoadError(error?.message || "Gagal memuat post.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [id, isNew]);

  useEffect(() => {
    let active = true;
    listPosts().then((posts) => {
      if (active) setRelatedPosts(posts);
    }).catch(() => {
      if (active) setRelatedPosts(null);
    });
    return () => { active = false; };
  }, []);

  if (loading) return <p>Loading…</p>;
  if (loadError) return <div className="wpx__notice wpx__notice--error" role="alert">{loadError} <Link to="/admin/posts">Kembali ke daftar Posts</Link></div>;

  function set(k, v) {
    setPost((p) => {
      if (k === "slug" && (!p.canonical_path || p.canonical_path === `/blog/${p.slug}`)) {
        return { ...p, slug: v, canonical_path: `/blog/${v}` };
      }
      return { ...p, [k]: v };
    });
  }

  async function save(publishStatus) {
    setBusy(true); setMsg(null);
    try {
      const nextSlug = slugify(post.slug || post.title);
      if (!nextSlug) throw new Error("Judul atau slug post harus diisi.");
      const canonicalPath = !post.canonical_path || post.canonical_path === `/blog/${originalSlug}` || post.canonical_path === `/blog/${post.slug}`
        ? `/blog/${nextSlug}`
        : post.canonical_path;
      const patch = {
        title: post.title,
        slug: nextSlug,
        excerpt: post.excerpt,
        content: post.content,
        cover_url: post.cover_url,
        tags: post.tags,
        category: post.category,
        focus_keyword: post.focus_keyword,
        meta_title: post.meta_title,
        meta_description: post.meta_description,
        canonical_path: canonicalPath,
        related_slugs: post.related_slugs ?? [],
        references: textToReferences(referencesText),
        status: publishStatus ?? post.status,
        published_at: publishStatus === "published" ? (post.published_at || new Date().toISOString()) : post.published_at,
      };
      const readCount = Number(post.read_count);
      if (post.read_count !== "" && Number.isFinite(readCount)) {
        patch.read_count = Math.max(1236, Math.round(readCount));
      }
      if (isNew) {
        const saved = await createPost({ ...patch, author_id: user.id });
        nav(`/admin/posts/${saved.slug}`, { replace: true });
      } else {
        const saved = await updatePost(id, patch);
        setPost(saved);
        setOriginalSlug(saved.slug);
        if (id !== saved.slug) nav(`/admin/posts/${saved.slug}`, { replace: true });
        setMsg({ type: "success", text: "Tersimpan." });
      }
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    } finally { setBusy(false); }
  }

  return (
    <>
      <div className="wpx__page-header">
        <h1>{isNew ? "Post baru" : "Edit post"}</h1>
        <div className="spacer" />
        <button className="wpx__btn wpx__btn--secondary" onClick={() => save("draft")} disabled={busy}>Simpan draft</button>
        <button className="wpx__btn wpx__btn--primary" onClick={() => save("published")} disabled={busy}>Publish</button>
      </div>

      {msg && <div className={`wpx__notice wpx__notice--${msg.type}`}>{msg.text}</div>}

      <div className="wpx__edit-grid">
        <div>
          <div className="wpx__field">
            <input
              className="wpx__input"
              placeholder="Judul post"
              value={post.title}
              onChange={(e) => set("title", e.target.value)}
              style={{ fontSize: 20, padding: 12 }}
            />
          </div>
          <div className="wpx__field">
            <label className="wpx__label">Slug</label>
            <input className="wpx__input" value={post.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-generated dari title" />
          </div>
          <div className="wpx__field">
            <label className="wpx__label">Excerpt</label>
            <textarea className="wpx__textarea" value={post.excerpt ?? ""} onChange={(e) => set("excerpt", e.target.value)} rows={2} />
          </div>
          <div className="wpx__card">
            <div className="wpx__card-header">SEO, AEO & Internal Linking</div>
            <div className="wpx__card-body">
              <div className="wpx__field">
                <label className="wpx__label">Meta title</label>
                <input className="wpx__input" value={post.meta_title ?? ""} onChange={(e) => set("meta_title", e.target.value)} placeholder="Kosongkan untuk pakai judul artikel" />
              </div>
              <div className="wpx__field">
                <label className="wpx__label">Meta description</label>
                <textarea className="wpx__textarea" rows={3} value={post.meta_description ?? ""} onChange={(e) => set("meta_description", e.target.value)} />
              </div>
              <div className="wpx__grid-2">
                <div className="wpx__field">
                  <label className="wpx__label">Focus keyword</label>
                  <input className="wpx__input" value={post.focus_keyword ?? ""} onChange={(e) => set("focus_keyword", e.target.value)} />
                </div>
                <div className="wpx__field">
                  <label className="wpx__label">Canonical path</label>
                  <input className="wpx__input" value={post.canonical_path ?? ""} onChange={(e) => set("canonical_path", e.target.value)} placeholder={`/blog/${post.slug || "slug"}`} />
                </div>
              </div>
              <div className="wpx__field">
                <label className="wpx__label">Related post slugs (pisahkan dengan koma)</label>
                <input
                  className="wpx__input"
                  value={(post.related_slugs ?? []).join(", ")}
                  onChange={(e) => set("related_slugs", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                />
              </div>
              <div className="wpx__field">
                <label className="wpx__label">References (Title | Source | URL, satu per baris)</label>
                <textarea
                  className="wpx__textarea"
                  rows={4}
                  value={referencesText}
                  onChange={(e) => setReferencesText(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="wpx__field">
            <label className="wpx__label">Konten</label>
            <RichEditor value={post.content} onChange={(json) => set("content", json)} />
          </div>
        </div>

        <aside className="wpx__edit-aside">
          <div className="wpx__card">
            <div className="wpx__card-header">Publish</div>
            <div className="wpx__card-body">
              <p style={{ margin: "4px 0", fontSize: 12 }}>
                Status: <span className={`wpx__badge wpx__badge--${post.status}`}>{post.status}</span>
              </p>
              <div className="wpx__field" style={{ marginTop: 12 }}>
                <label className="wpx__label">Published date</label>
                <input
                  className="wpx__input"
                  type="datetime-local"
                  value={toDateTimeLocal(post.published_at)}
                  onChange={(e) => set("published_at", fromDateTimeLocal(e.target.value))}
                />
              </div>
              <div className="wpx__field">
                <label className="wpx__label">Read count</label>
                <input
                  className="wpx__input"
                  type="number"
                  min="1236"
                  value={post.read_count ?? ""}
                  onChange={(e) => set("read_count", e.target.value)}
                  placeholder="Auto"
                />
                <p className="wpx__help">Kosongkan untuk angka baca otomatis yang stabil.</p>
              </div>
            </div>
          </div>
          <section className="wpx__card wpx__seo-audit" aria-label="Pemeriksaan SEO artikel">
            <div className="wpx__card-header">Pemeriksaan SEO langsung</div>
            <div className="wpx__card-body">
              <p className="wpx__seo-audit-summary">{audit.good} baik · {audit.improve} perlu ditinjau · {audit.info} informasi{audit.pending ? ` · ${audit.pending} menunggu data` : ""}</p>
              <p className="wpx__help">Dihitung dari isi editor saat ini. Ini pemeriksaan konten, bukan skor resmi Yoast atau hasil pengindeksan Google.</p>
              <ul className="wpx__seo-audit-list">
                {audit.checks.map((item) => (
                  <li key={item.id} className={`wpx__seo-audit-item wpx__seo-audit-item--${item.status}`}>
                    <span className="wpx__seo-audit-dot" aria-hidden="true" />
                    <div>
                      <strong>{item.label}</strong>
                      <span className="wpx__seo-audit-evidence">{item.evidence}</span>
                      {(item.status === "improve" || item.status === "info") && <span className="wpx__seo-audit-action">{item.action}</span>}
                      <span className="wpx__seo-audit-source">Dasar: {item.source}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="wpx__help">Hijau berarti aturan yang tertulis terpenuhi, bukan jaminan ranking. Analisis sinonim, keterbacaan per bahasa, alt gambar, dan duplikasi frasa belum diperiksa di sini.</p>
              <p className="wpx__help">Sitemap dan HTML awal situs ini dibuat saat build. Perubahan post di admin belum otomatis memperbarui keduanya untuk crawler; verifikasi halaman publik dan Search Console tetap diperlukan.</p>
            </div>
          </section>
          <div className="wpx__card">
            <div className="wpx__card-header">Category</div>
            <div className="wpx__card-body">
              <select className="wpx__select" value={post.category ?? ""} onChange={(e) => set("category", e.target.value)}>
                <option value="">No category</option>
                {BLOG_CATEGORIES.map((category) => (
                  <option key={category.slug} value={category.slug}>{category.name}</option>
                ))}
              </select>
              <p className="wpx__help">Menentukan kategori blog tempat artikel ini tampil.</p>
            </div>
          </div>
          <div className="wpx__card">
            <div className="wpx__card-header">Cover</div>
            <div className="wpx__card-body">
              <input className="wpx__input" placeholder="https://…" value={post.cover_url ?? ""} onChange={(e) => set("cover_url", e.target.value)} />
              {post.cover_url && <img src={post.cover_url} alt="" style={{ width: "100%", marginTop: 8, borderRadius: 3 }} />}
              <p className="wpx__help">Paste URL atau ambil dari Media library.</p>
            </div>
          </div>
          <div className="wpx__card">
            <div className="wpx__card-header">Tags</div>
            <div className="wpx__card-body">
              <input className="wpx__input" placeholder="pisahkan dengan koma" value={(post.tags ?? []).join(", ")}
                onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
