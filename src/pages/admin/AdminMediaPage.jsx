import { useEffect, useRef, useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import { deleteMedia, listMedia, uploadMedia } from "../../services/mediaService";
import { useAuth } from "../../hooks/useAuth";

export function AdminMediaPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  async function load() { setItems(await listMedia()); }
  useEffect(() => { load(); }, []);

  async function onFile(e) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    try {
      for (const f of files) await uploadMedia(f, user.id);
      await load();
    } finally { setBusy(false); e.target.value = ""; }
  }

  async function remove(m) {
    if (!confirm("Hapus file ini?")) return;
    await deleteMedia(m.id);
    load();
  }

  return (
    <>
      <div className="wpx__page-header">
        <h1>Media Library</h1>
        <div className="spacer" />
        <button className="wpx__btn wpx__btn--primary" onClick={() => fileRef.current?.click()} disabled={busy}>
          <Upload size={14} /> {busy ? "Uploading…" : "Upload"}
        </button>
        <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: "none" }} onChange={onFile} />
      </div>

      {items.length === 0 ? (
        <div className="wpx__card"><div className="wpx__card-body" style={{ textAlign: "center", color: "var(--wpx-muted)" }}>Belum ada media.</div></div>
      ) : (
        <div className="wpx__media-grid">
          {items.map((m) => (
            <div key={m.id} className="wpx__media-tile" title={m.filename} onClick={() => navigator.clipboard.writeText(m.url)}>
              <img src={m.url} alt={m.filename} />
              <button onClick={(e) => { e.stopPropagation(); remove(m); }}><Trash2 size={11} /></button>
            </div>
          ))}
        </div>
      )}
      <p className="wpx__help" style={{ marginTop: 12 }}>Klik gambar untuk copy URL ke clipboard.</p>
    </>
  );
}
