import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit, Trash2 } from "lucide-react";
import { servicesData } from "../../lib/supabaseData";

export function AdminServicesPage() {
  const [items, setItems] = useState([]);
  async function load() {
    setItems(await servicesData.list());
  }
  useEffect(() => { load(); }, []);

  function remove(id) {
    if (!confirm("Hapus layanan ini?")) return;
    servicesData.delete(id).then(load);
  }

  return (
    <>
      <div className="wpx__page-header">
        <h1>Services</h1>
        <div className="spacer" />
        <Link className="wpx__btn wpx__btn--primary" to="/admin/services/new">
          <Plus size={14} /> Tambah layanan
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="wpx__card"><div className="wpx__card-body" style={{ textAlign: "center", color: "var(--text-mute)" }}>Belum ada layanan.</div></div>
      ) : (
        <table className="wpx__table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>#</th>
              <th>Nama</th>
              <th>Tagline</th>
              <th style={{ width: 90 }}>Status</th>
              <th style={{ width: 110 }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id}>
                <td style={{ fontFamily: "monospace", color: "var(--text-mute)" }}>{s.order ?? "—"}</td>
                <td>
                  <Link to={`/admin/services/${s.id}`} style={{ color: "var(--primary)", fontWeight: 600 }}>{s.name}</Link>
                  <div style={{ fontSize: 12, color: "var(--text-mute)", fontFamily: "ui-monospace, monospace", marginTop: 2 }}>{s.slug}</div>
                </td>
                <td style={{ fontSize: 13, color: "var(--text-dim)" }}>{s.tagline}</td>
                <td><span className={`wpx__badge wpx__badge--${s.status === "active" ? "published" : "draft"}`}>{s.status}</span></td>
                <td>
                  <Link to={`/admin/services/${s.id}`} className="wpx__btn wpx__btn--secondary" style={{ padding: "4px 10px", marginRight: 4 }}><Edit size={12} /></Link>
                  <button onClick={() => remove(s.id)} className="wpx__btn wpx__btn--danger" style={{ padding: "4px 10px" }}><Trash2 size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
