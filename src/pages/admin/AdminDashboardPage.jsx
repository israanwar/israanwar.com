import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FileText, Image as ImageIcon, Users as UsersIcon, Package, ShoppingBag, Briefcase, Inbox,
  AlertTriangle, ArrowRight, Check,
} from "lucide-react";
import { getStats } from "../../lib/localStore";
import { getRemoteStats, settingsData } from "../../lib/supabaseData";
import { useAuth } from "../../hooks/useAuth";

export function AdminDashboardPage() {
  const { profile } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const [stats, setStats] = useState({ posts: null, media: null, users: null });
  const [settings, setSettings] = useState(null);
  const [toast, setToast] = useState(loc.state?.toast ?? null);

  useEffect(() => {
    let alive = true;
    setStats(getStats());
    settingsData.get().then((next) => { if (alive) setSettings(next); });
    getRemoteStats().then((next) => { if (alive && next) setStats(next); });
    return () => { alive = false; };
  }, []);

  // Bersihkan navigation state supaya toast tidak muncul lagi kalau user refresh
  useEffect(() => {
    if (loc.state?.toast) nav(loc.pathname, { replace: true, state: {} });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const missingQris = settings && !settings.qris_image;

  return (
    <>
      {toast && (
        <div style={{
          position: "fixed", top: 76, right: 24, zIndex: 100,
          minWidth: 300, maxWidth: 420,
          padding: "14px 18px", borderRadius: 10,
          background: toast.type === "success" ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
          border: `1px solid ${toast.type === "success" ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)"}`,
          color: toast.type === "success" ? "#86efac" : "#fca5a5",
          backdropFilter: "blur(10px)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", gap: 10,
          fontSize: 14, fontWeight: 500,
        }}>
          {toast.type === "success" && <Check size={16} />}
          <span>{toast.text}</span>
        </div>
      )}

      <div className="wpx__page-header">
        <h1>Dashboard</h1>
      </div>

      {missingQris && (
        <div style={{
          padding: "16px 20px", borderRadius: 10, marginBottom: 20,
          background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.35)",
          display: "flex", gap: 14, alignItems: "flex-start",
        }}>
          <AlertTriangle size={20} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>QRIS belum di-upload</div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-dim)", lineHeight: 1.5 }}>
              Customer belum bisa lihat QR pembayaran saat checkout. Upload sekali di Settings — nanti otomatis muncul di halaman order.
            </p>
          </div>
          <Link to="/admin/settings" className="wpx__btn wpx__btn--primary" style={{ padding: "8px 14px", fontSize: 13, whiteSpace: "nowrap" }}>
            Upload QRIS <ArrowRight size={13} />
          </Link>
        </div>
      )}

      <div className="wpx__card">
        <div className="wpx__card-body">
          <p style={{ margin: 0, fontSize: 16 }}>
            Selamat datang, <strong style={{ color: "var(--primary)" }}>{profile?.full_name || profile?.email}</strong>.
          </p>
          <p style={{ margin: "6px 0 0", color: "var(--text-dim)" }}>
            Kelola konten israanwar.com dari panel ini.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        <StatCard icon={FileText} label="Posts" value={stats.posts} to="/admin/posts" />
        <StatCard icon={Package} label="Store items" value={stats.products} to="/admin/store" />
        <StatCard icon={ShoppingBag} label="Orders" value={stats.orders} to="/admin/orders" />
        <StatCard icon={Briefcase} label="Services" value={stats.services} to="/admin/services" />
        <StatCard icon={Inbox}
          label={`Contacts${stats.contactsUnread > 0 ? " (" + stats.contactsUnread + " baru)" : ""}`}
          value={stats.contacts} to="/admin/contacts" highlight={stats.contactsUnread > 0} />
        <StatCard icon={ImageIcon} label="Media" value={stats.media} to="/admin/media" />
        <StatCard icon={UsersIcon} label="Users" value={stats.users} to="/admin/users" />
      </div>
    </>
  );
}

function StatCard({ icon: Icon, label, value, to, highlight }) {
  const content = (
    <div className="wpx__stat" style={highlight ? { borderColor: "rgba(86, 99, 111, 0.5)" } : undefined}>
      <div className="wpx__stat-icon"><Icon size={20} /></div>
      <div>
        <div className="wpx__stat-label">{label}</div>
        <div className="wpx__stat-value">{value ?? "—"}</div>
      </div>
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>{content}</Link> : content;
}
