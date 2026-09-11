import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Edit } from "lucide-react";
import { deletePost, listPosts } from "../../services/postService";

export function AdminPostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setPosts(await listPosts());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function remove(id) {
    if (!confirm("Hapus post ini?")) return;
    await deletePost(id);
    load();
  }

  return (
    <>
      <div className="wpx__page-header">
        <h1>Posts</h1>
        <div className="spacer" />
        <Link className="wpx__btn wpx__btn--primary" to="/admin/posts/new">
          <Plus size={14} /> Tambah baru
        </Link>
      </div>

      {loading ? <p>Loading…</p> : (
        <table className="wpx__table">
          <thead>
            <tr>
              <th>Title</th><th style={{ width: 100 }}>Status</th><th style={{ width: 160 }}>Created</th><th style={{ width: 120 }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--wpx-muted)", padding: 40 }}>Belum ada post.</td></tr>
            ) : posts.map((p) => (
              <tr key={p.id}>
                <td><Link to={`/admin/posts/${p.id}`} style={{ color: "var(--wpx-primary)", fontWeight: 600 }}>{p.title}</Link></td>
                <td><span className={`wpx__badge wpx__badge--${p.status}`}>{p.status}</span></td>
                <td>{new Date(p.created_at).toLocaleDateString("id-ID")}</td>
                <td>
                  <Link to={`/admin/posts/${p.id}`} className="wpx__btn wpx__btn--secondary" style={{ padding: "3px 8px", marginRight: 4 }}>
                    <Edit size={12} />
                  </Link>
                  <button className="wpx__btn wpx__btn--danger" style={{ padding: "3px 8px" }} onClick={() => remove(p.id)}>
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
