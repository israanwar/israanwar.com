import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPost, getPost, updatePost } from "../../services/postService";
import { RichEditor } from "../../components/admin/RichEditor";
import { useAuth } from "../../hooks/useAuth";
import { BLOG_CATEGORIES } from "../../data/blogCategories";

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
  return (refs ?? []).map((ref) => [ref.title, ref.source, ref.url].filter(Boolean).join(" | ")).join("\n");
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
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (isNew) {
      setReferencesText("");
      return;
    }
    getPost(id).then((p) => {
      setPost(p);
      setReferencesText(referencesToText(p?.references));
      setLoading(false);
    });
  }, [id, isNew]);

  if (loading) return <p>Loading…</p>;

  function set(k, v) { setPost((p) => ({ ...p, [k]: v })); }

  async function save(publishStatus) {
    setBusy(true); setMsg(null);
    try {
      const patch = {
        title: post.title,
        slug: post.slug || slugify(post.title),
        excerpt: post.excerpt,
        content: post.content,
        cover_url: post.cover_url,
        tags: post.tags,
        category: post.category,
        focus_keyword: post.focus_keyword,
        meta_title: post.meta_title,
        meta_description: post.meta_description,
        canonical_path: post.canonical_path,
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
        nav(`/admin/posts/${saved.id}`, { replace: true });
      } else {
        const saved = await updatePost(id, patch);
        setPost(saved);
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
