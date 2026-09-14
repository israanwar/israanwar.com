import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Edit, Search, Download, Copy, Check, Upload } from "lucide-react";
import { productsData } from "../../lib/supabaseData";

function toCsv(rows) {
  const esc = (s) => `"${String(s ?? "").replace(/"/g, `""`)}"`;
  const header = ["No", "Kategori", "Nama", "Slug", "Harga", "Rating", "Terjual", "Status", "Deskripsi", "Download URL"];
  const lines = [header.join(","),
    ...rows.map((r, i) => [i + 1, esc(r.category), esc(r.name), r.slug, r.price ?? 0, r.rating ?? "", r.sold_count ?? "", r.status, esc(r.description), esc(r.download_url)].join(","))];
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

// Minimal RFC4180-ish CSV parser — handles quoted fields, embedded commas,
// and escaped `""` quotes (matches the quoting toCsv() above produces).
// Not a full CSV spec implementation, but round-trips everything this page
// exports itself, which is the only supported import path.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.some((c) => c !== "")).map((r) => {
    const obj = {};
    header.forEach((h, idx) => { obj[h] = r[idx] ?? ""; });
    return obj;
  });
}

export function AdminStorePage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [copied, setCopied] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  async function load() {
    setItems(await productsData.list());
  }
  useEffect(() => { load(); }, []);

  // Bulk-import Download URL (and other CSV-carried fields) by matching on
  // `slug` — the counterpart to Export CSV above. Lets Isra fill in real
  // file links for many products at once in a spreadsheet instead of
  // opening each product's edit page individually. Only non-empty cells
  // overwrite existing values; unmatched slugs are reported, never silently
  // dropped.
  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setImportBusy(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      const bySlug = new Map(items.map((it) => [it.slug, it]));
      let updated = 0;
      let unchanged = 0;
      const notFound = [];
      for (const row of rows) {
        const slug = (row.Slug || row.slug || "").trim();
        const newUrl = (row["Download URL"] ?? row.download_url ?? "").trim();
        if (!slug || !newUrl) continue;
        const item = bySlug.get(slug);
        if (!item) { notFound.push(slug); continue; }
        if ((item.download_url ?? "") === newUrl) { unchanged++; continue; }
        await productsData.update(item.id, { download_url: newUrl });
        updated++;
      }
      setImportResult({ updated, unchanged, notFound });
      if (updated > 0) await load();
    } catch (err) {
      setImportResult({ error: err.message ?? "Gagal membaca file." });
    } finally {
      setImportBusy(false);
    }
  }

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
        <button
          type="button"
          className="wpx__btn wpx__btn--secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={importBusy}
          title="Import kolom Download URL (dan lainnya) dari CSV hasil Export CSV — cocokkan lewat Slug"
        >
          <Upload size={14} /> {importBusy ? "Mengimpor…" : "Import CSV"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleImportFile}
          style={{ display: "none" }}
        />
        <Link className="wpx__btn wpx__btn--primary" to="/admin/store/new">
          <Plus size={14} /> Tambah item
        </Link>
      </div>

      {importResult && (
        <div
          className={`wpx__notice wpx__notice--${importResult.error ? "error" : "success"}`}
          role="status"
        >
          {importResult.error ? (
            <>Gagal import: {importResult.error}</>
          ) : (
            <>
              Import selesai — {importResult.updated} produk diupdate, {importResult.unchanged} tidak berubah
              {importResult.notFound.length > 0 && (
                <> , {importResult.notFound.length} slug tidak ditemukan ({importResult.notFound.slice(0, 5).join(", ")}{importResult.notFound.length > 5 ? ", …" : ""})</>
              )}
              .
            </>
          )}
        </div>
      )}

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
