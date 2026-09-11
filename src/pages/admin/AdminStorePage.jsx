import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Edit, Search, Download, Copy, Check } from "lucide-react";
import { productsData } from "../../lib/supabaseData";

function toCsv(rows) {
  const esc = (s) => `"${String(s ?? "").replace(/"/g, `""`)}"`;
  const header = ["No", "Kategori", "Nama", "Slug", "Harga", "Rating", "Terjual", "Status", "Deskripsi"];
  const lines = [header.join(","),
    ...rows.map((r, i) => [i + 1, esc(r.category), esc(r.name), r.slug, r.price ?? 0, r.rating ?? "", r.sold_count ?? "", r.status, esc(r.description)].join(","))];
  return lines.join("\n");
}
function download(filename, text, mime = "text/csv") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export function AdminStorePage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [copied, setCopied] = useState(false);

  async function load() {
    setItems(await productsData.list());
  }
  useEffect(() => { load(); }, []);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [items]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items
      .filter((i) => cat === "All" || i.category === cat)
      .filter((i) => !term || i.name.toLowerCase().includes(term));
  }, [items, cat, q]);

  function remove(id) {
    if (!confirm("Hapus item store ini?")) return;
    productsData.delete(id).then(load);
  }

  return (
    <>
      <div className="wpx__page-header">
        <h1>Store</h1>
        <div className="spacer" />
        <button
          type="button"
          className="wpx__btn wpx__btn--secondary"
          onClick={async () => {
            await navigator.clipboard.writeText(toCsv(filtered));
            setCopied(true); setTimeout(() => setCopied(false), 1500);
          }}
          title="Copy semua produk ke clipboard sebagai CSV"
        >
          {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy CSV</>}
        </button>
        <button
          type="button"
          className="wpx__btn wpx__btn--secondary"
          onClick={() => download("israanwar-products.csv", toCsv(filtered))}
          title="Download CSV"
        >
          <Download size={14} /> Export CSV
        </button>
        <button
          type="button"
          className="wpx__btn wpx__btn--secondary"
          onClick={() => download("israanwar-products.json", JSON.stringify(filtered, null, 2), "application/json")}
          title="Download JSON"
        >
          <Download size={14} /> Export JSON
        </button>
        <Link className="wpx__btn wpx__btn--primary" to="/admin/store/new">
          <Plus size={14} /> Tambah item
        </Link>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-mute)" }} />
          <input
            className="wpx__input"
            placeholder="Cari item…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>
        <select className="wpx__select" value={cat} onChange={(e) => setCat(e.target.value)} style={{ minWidth: 180 }}>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ color: "var(--text-mute)", fontSize: 13, alignSelf: "center" }}>
          {filtered.length} item
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="wpx__card"><div className="wpx__card-body" style={{ textAlign: "center", color: "var(--text-mute)" }}>Tidak ada item.</div></div>
      ) : (
        <table className="wpx__table">
          <thead>
            <tr>
              <th style={{ width: 72 }}>Cover</th>
              <th>Nama</th>
              <th style={{ width: 160 }}>Kategori</th>
              <th style={{ width: 120 }}>Harga</th>
              <th style={{ width: 120 }}>Proof</th>
              <th style={{ width: 90 }}>Status</th>
              <th style={{ width: 110 }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <div style={{
                    width: 56, height: 42, borderRadius: 6, overflow: "hidden",
                    background: "var(--panel-2)", display: "grid", placeItems: "center",
                  }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} loading="lazy" />
                    ) : (
                      <span style={{ fontSize: 10, color: "var(--text-mute)" }}>—</span>
                    )}
                  </div>
                </td>
                <td>
                  <Link to={`/admin/store/${p.id}`} style={{ color: "var(--primary)", fontWeight: 600 }}>{p.name}</Link>
                  <div style={{ fontSize: 12, color: "var(--text-mute)", fontFamily: "ui-monospace, monospace", marginTop: 2 }}>{p.slug}</div>
                </td>
                <td>{p.category ?? "—"}</td>
                <td style={{ fontWeight: 700 }}>Rp {(p.price ?? 0).toLocaleString("id-ID")}</td>
                <td style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  {p.rating ? `★ ${Number(p.rating).toFixed(1)}` : "—"}
                  {p.sold_count ? <div>{Number(p.sold_count).toLocaleString("id-ID")} terjual</div> : null}
                </td>
                <td><span className={`wpx__badge wpx__badge--${p.status === "active" ? "published" : "draft"}`}>{p.status}</span></td>
                <td>
                  <Link to={`/admin/store/${p.id}`} className="wpx__btn wpx__btn--secondary" style={{ padding: "4px 10px", marginRight: 4 }}><Edit size={12} /></Link>
                  <button onClick={() => remove(p.id)} className="wpx__btn wpx__btn--danger" style={{ padding: "4px 10px" }}><Trash2 size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
