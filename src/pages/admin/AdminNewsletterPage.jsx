import { useEffect, useState } from "react";
import { Trash2, Download, Mail } from "lucide-react";
import { newsletterData } from "../../lib/supabaseData";

export function AdminNewsletterPage() {
  const [items, setItems] = useState([]);

  async function load() {
    setItems(await newsletterData.list());
  }
  useEffect(() => { load(); }, []);

  function remove(id) {
    if (!confirm("Hapus subscriber ini?")) return;
    newsletterData.delete(id).then(load);
  }

  function exportCsv() {
    const rows = [["email", "source", "status", "subscribed_at"]];
    for (const s of items) rows.push([s.email, s.source ?? "", s.status ?? "subscribed", s.created_at ?? ""]);
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "newsletter-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const bySource = items.reduce((acc, s) => {
    const key = s.source || "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <div className="wpx__page-header">
        <h1>Newsletter subscribers</h1>
        <div className="spacer" />
        <span style={{ color: "var(--text-mute)", fontSize: 13, marginRight: 12 }}>{items.length} total</span>
        <button className="wpx__btn wpx__btn--secondary" onClick={exportCsv} disabled={items.length === 0}>
          <Download size={13} /> Export CSV
        </button>
      </div>

      {items.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          {Object.entries(bySource).map(([source, count]) => (
            <span key={source} style={{
              fontSize: 12, padding: "4px 10px", borderRadius: 999,
              background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--text-mute)",
            }}>
              {source}: <strong style={{ color: "var(--text)" }}>{count}</strong>
            </span>
          ))}
        </div>
      )}

      <div className="wpx__card" style={{ padding: 0, overflow: "hidden" }}>
        {items.length === 0 ? (
          <div className="wpx__card-body" style={{ textAlign: "center", color: "var(--text-mute)", padding: 60 }}>
            Belum ada subscriber.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                <th style={{ padding: "12px 16px", color: "var(--text-mute)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>Email</th>
                <th style={{ padding: "12px 16px", color: "var(--text-mute)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>Source</th>
                <th style={{ padding: "12px 16px", color: "var(--text-mute)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "12px 16px", color: "var(--text-mute)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>Subscribed</th>
                <th style={{ padding: "12px 16px" }} />
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <a href={`mailto:${s.email}`} style={{ color: "var(--text)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Mail size={13} style={{ color: "var(--text-mute)" }} /> {s.email}
                    </a>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-mute)" }}>{s.source || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      fontSize: 12, padding: "2px 8px", borderRadius: 999,
                      background: s.status === "unsubscribed" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                      color: s.status === "unsubscribed" ? "#f87171" : "#4ade80",
                    }}>
                      {s.status || "subscribed"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-mute)" }}>
                    {s.created_at ? new Date(s.created_at).toLocaleString("id-ID") : "—"}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button className="wpx__btn wpx__btn--danger" style={{ padding: "5px 10px" }} onClick={() => remove(s.id)}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
