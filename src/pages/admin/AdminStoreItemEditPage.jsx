import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, X, RefreshCw } from "lucide-react";
import { coverSvg, productSocialProof } from "../../lib/localStore";
import { productsData } from "../../lib/supabaseData";

function slugify(s) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export function AdminStoreItemEditPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const isNew = id === "new";
  const fileRef = useRef(null);
  const [p, setP] = useState({
    name: "", slug: "", description: "", price: 0, category: "", image_url: "", download_url: "",
    rating: "", sold_count: "", status: "active",
  });
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (isNew) return;
    productsData.get(id).then((existing) => {
      if (existing) setP(existing);
    });
  }, [id, isNew]);

  function set(k, v) { setP((x) => ({ ...x, [k]: v })); }

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMsg({ type: "error", text: "File harus berupa gambar." }); return;
    }
    if (file.size > 800 * 1024) {
      setMsg({ type: "error", text: "Ukuran maksimal 800KB (compress dulu di tinypng/squoosh)." }); return;
    }
    const dataUrl = await new Promise((res, rej) => {
      const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file);
    });
    set("image_url", dataUrl);
    setMsg({ type: "success", text: "Gambar di-preview. Klik Simpan supaya aktif." });
    e.target.value = "";
  }

  function regenerateCover() {
    if (!p.name || !p.category) {
      setMsg({ type: "error", text: "Isi nama & kategori dulu sebelum generate cover otomatis." });
      return;
    }
    set("image_url", coverSvg({ name: p.name, category: p.category }));
    setMsg({ type: "success", text: "Cover otomatis di-generate. Klik Simpan." });
  }

  async function save() {
    setMsg(null);
    try {
      const payload = {
        ...p,
        slug: p.slug || slugify(p.name),
        price: Number(p.price) || 0,
        rating: p.rating === "" ? undefined : Number(p.rating),
        sold_count: p.sold_count === "" ? undefined : Number(p.sold_count),
      };
      if (!Number.isFinite(payload.rating)) delete payload.rating;
      if (!Number.isFinite(payload.sold_count)) delete payload.sold_count;
      if (!payload.sold_count || !payload.rating) {
        Object.assign(payload, productSocialProof({
          slug: payload.slug,
          category: payload.category,
          name: payload.name,
          description: payload.description,
          price: payload.price,
        }));
      }
      if (isNew) {
        // auto-generate cover kalau kosong
        if (!payload.image_url && payload.name && payload.category) {
          payload.image_url = coverSvg({ name: payload.name, category: payload.category });
        }
        const created = await productsData.create(payload);
        nav(`/admin/store/${created.id}`, { replace: true });
      } else {
        await productsData.update(id, payload);
        setMsg({ type: "success", text: "Tersimpan." });
      }
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  }

  return (
    <>
      <div className="wpx__page-header">
        <h1>{isNew ? "Item store baru" : "Edit item store"}</h1>
        <div className="spacer" />
        <button className="wpx__btn wpx__btn--primary" onClick={save}>Simpan</button>
      </div>

      {msg && <div className={`wpx__notice wpx__notice--${msg.type}`}>{msg.text}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        <div>
          <div className="wpx__card">
            <div className="wpx__card-body">
              <div className="wpx__field">
                <label className="wpx__label">Nama item</label>
                <input className="wpx__input" value={p.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="wpx__field">
                <label className="wpx__label">Slug</label>
                <input className="wpx__input" value={p.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto dari nama" />
              </div>
              <div className="wpx__field">
                <label className="wpx__label">Deskripsi</label>
                <textarea className="wpx__textarea" value={p.description ?? ""} onChange={(e) => set("description", e.target.value)} rows={6} />
              </div>
            </div>
          </div>
        </div>

        <aside>
          <div className="wpx__card">
            <div className="wpx__card-header">Cover Image</div>
            <div className="wpx__card-body">
              <div style={{
                width: "100%", aspectRatio: "4/3", background: "var(--panel-2)",
                borderRadius: 8, overflow: "hidden", marginBottom: 12,
                display: "grid", placeItems: "center", position: "relative",
              }}>
                {p.image_url ? (
                  <>
                    <img src={p.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    <button
                      type="button" title="Hapus cover"
                      onClick={() => set("image_url", "")}
                      style={{
                        position: "absolute", top: 6, right: 6,
                        width: 24, height: 24, borderRadius: "50%",
                        background: "rgba(239,68,68,0.9)", color: "#fff", border: "none",
                        cursor: "pointer", display: "grid", placeItems: "center",
                      }}
                    ><X size={14} /></button>
                  </>
                ) : (
                  <span style={{ color: "var(--text-mute)", fontSize: 12 }}>No cover</span>
                )}
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <button type="button" className="wpx__btn wpx__btn--secondary" onClick={() => fileRef.current?.click()}>
                  <Upload size={13} /> Upload gambar
                </button>
                <button type="button" className="wpx__btn wpx__btn--secondary" onClick={regenerateCover}>
                  <RefreshCw size={13} /> Generate cover otomatis
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFile} />
              </div>
              <div className="wpx__field" style={{ marginTop: 12 }}>
                <label className="wpx__label" style={{ fontSize: 11 }}>Atau paste URL manual</label>
                <input className="wpx__input" placeholder="https://…" value={p.image_url ?? ""} onChange={(e) => set("image_url", e.target.value)} />
              </div>
              <p className="wpx__help">Max 800KB kalau upload. Cover otomatis pakai gradient + kategori + nama.</p>
            </div>
          </div>

          <div className="wpx__card">
            <div className="wpx__card-header">Detail</div>
            <div className="wpx__card-body">
              <div className="wpx__field">
                <label className="wpx__label">Harga (Rp)</label>
                <input className="wpx__input" type="number" min="0" max="799000" value={p.price} onChange={(e) => set("price", e.target.value)} />
                <p className="wpx__help">Maksimal Rp 799.000. Pakai variasi ribuan 1-9, hindari akhiran seperti 120.000 atau 450.000.</p>
              </div>
              <div className="wpx__grid-2">
                <div className="wpx__field">
                  <label className="wpx__label">Rating</label>
                  <input
                    className="wpx__input"
                    type="number"
                    min="4.4"
                    max="5"
                    step="0.1"
                    value={p.rating ?? ""}
                    onChange={(e) => set("rating", e.target.value)}
                    placeholder="Auto"
                  />
                </div>
                <div className="wpx__field">
                  <label className="wpx__label">Terjual</label>
                  <input
                    className="wpx__input"
                    type="number"
                    min="0"
                    value={p.sold_count ?? ""}
                    onChange={(e) => set("sold_count", e.target.value)}
                    placeholder="Auto"
                  />
                </div>
              </div>
              <p className="wpx__help" style={{ marginTop: -10 }}>Kosongkan rating/terjual kalau ingin social proof otomatis dari sistem.</p>
              <div className="wpx__field">
                <label className="wpx__label">Kategori</label>
                <input className="wpx__input" list="store-categories" value={p.category ?? ""} onChange={(e) => set("category", e.target.value)}
                  placeholder="Templates, Ebooks, Guidelines…" />
                <datalist id="store-categories">
                  <option value="Templates" /><option value="Ebooks" /><option value="Guidelines" />
                  <option value="Prompt Collections" /><option value="Checklists" /><option value="Workbooks" />
                  <option value="Planners" /><option value="Worksheets" /><option value="Frameworks" />
                  <option value="Playbooks" /><option value="Blueprints" /><option value="SOP" />
                  <option value="Swipe Files" /><option value="Business Documents" /><option value="Research Resources" />
                  <option value="Marketing Resources" /><option value="Branding Resources" />
                  <option value="Productivity Resources" /><option value="Printables" /><option value="Digital Bundles" />
                  <option value="Modul" />
                </datalist>
              </div>
              <div className="wpx__field">
                <label className="wpx__label">Download URL (after payment)</label>
                <input className="wpx__input" placeholder="https://drive.google.com/… or Dropbox link"
                  value={p.download_url ?? ""} onChange={(e) => set("download_url", e.target.value)} />
                <p className="wpx__help">Customer sees this link after admin approves payment.</p>
              </div>
              <div className="wpx__field">
                <label className="wpx__label">Status</label>
                <select className="wpx__select" value={p.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="active">Active (tampil)</option>
                  <option value="draft">Draft (tidak tampil)</option>
                </select>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
