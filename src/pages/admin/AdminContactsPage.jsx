import { useEffect, useMemo, useState } from "react";
import { Trash2, Copy, Check } from "lucide-react";
import { contactsData } from "../../lib/supabaseData";

export function AdminContactsPage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState("");
  async function copyValue(value, label) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(`${label} disalin.`);
      setError(null);
    } catch {
      setError(`Gagal menyalin ${label.toLowerCase()}. Pilih dan salin teks secara manual.`);
    }
  }
  async function load() {
    setItems(await contactsData.list());
  }
  useEffect(() => { load(); }, []);
  useEffect(() => { if (!selected && items[0]) setSelected(items[0]); }, [items, selected]);

  async function markRead(id) {
    try { await contactsData.updateStatus(id, "read"); setError(null); await load(); }
    catch (e) { setError(e.message ?? "Gagal memperbarui pesan."); }
  }
  async function remove(id) {
    if (!confirm("Hapus pesan ini?")) return;
    try { await contactsData.delete(id); setSelected(null); setError(null); await load(); }
    catch (e) { setError(e.message ?? "Gagal menghapus pesan."); }
  }

  const current = useMemo(() => items.find((c) => c.id === selected?.id), [items, selected]);

  return (
    <>
      <div className="wpx__page-header">
        <h1>Contacts inbox</h1>
        <div className="spacer" />
        <span style={{ color: "var(--text-mute)", fontSize: 13 }}>
          {items.filter((c) => c.status === "new").length} baru · {items.length} total
        </span>
      </div>

      {error && <div className="wpx__notice wpx__notice--error">{error}</div>}
      {copied && <div className="wpx__notice wpx__notice--success">{copied}</div>}

      {items.length === 0 ? (
        <div className="wpx__card"><div className="wpx__card-body" style={{ textAlign: "center", color: "var(--text-mute)", padding: 60 }}>
          Belum ada pesan masuk.
        </div></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, minHeight: 500 }}>
          {/* List */}
          <div className="wpx__card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ maxHeight: 600, overflowY: "auto" }}>
              {items.map((c) => (
                <div key={c.id} onClick={() => { setSelected(c); if (c.status === "new") markRead(c.id); }}
                  style={{
                    padding: "14px 16px", cursor: "pointer",
                    borderBottom: "1px solid var(--border)",
                    background: selected?.id === c.id ? "var(--panel-2)" : "transparent",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8 }}>
                    <div style={{ fontWeight: c.status === "new" ? 700 : 500, fontSize: 14 }}>{c.name}</div>
                    {c.status === "new" && <span style={{ width: 8, height: 8, background: "var(--primary)", borderRadius: "50%", marginTop: 6 }} />}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.subject || c.message}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 6 }}>
                    {new Date(c.created_at).toLocaleString("id-ID")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail */}
          <div className="wpx__card">
            {current ? (
              <div className="wpx__card-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{current.subject || "(Tanpa subjek)"}</h2>
                    <div style={{ color: "var(--text-mute)", fontSize: 13, marginTop: 6 }}>
                      {new Date(current.created_at).toLocaleString("id-ID")}
                    </div>
                  </div>
                  <button className="wpx__btn wpx__btn--danger" style={{ padding: "6px 12px" }} onClick={() => remove(current.id)}>
                    <Trash2 size={13} /> Hapus
                  </button>
                </div>

                <div style={{
                  padding: 16, background: "var(--panel-2)", borderRadius: 8,
                  display: "grid", gap: 8, fontSize: 14, marginBottom: 24,
                }}>
                  <div><strong>Nama:</strong> {current.name}</div>
                  <div><strong>Email:</strong> {current.email}</div>
                  {current.phone && <div><strong>Phone:</strong> {current.phone}</div>}
                </div>

                <div style={{ fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-wrap", color: "var(--text)" }}>
                  {current.message}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => copyValue(current.email, "Email")} className="wpx__btn wpx__btn--secondary"><Copy size={13} /> Salin email</button>
                  {current.phone && (
                    <button type="button" onClick={() => copyValue(current.phone, "Nomor telepon")} className="wpx__btn wpx__btn--secondary"><Copy size={13} /> Salin nomor</button>
                  )}
                  {current.status === "new" && (
                    <button className="wpx__btn wpx__btn--secondary" onClick={() => markRead(current.id)}>
                      <Check size={13} /> Tandai dibaca
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="wpx__card-body" style={{ textAlign: "center", color: "var(--text-mute)", padding: 60 }}>
                Pilih pesan untuk melihat detail.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
