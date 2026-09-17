import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FileText, Image as ImageIcon, Users as UsersIcon, Package, ShoppingBag, Briefcase, Inbox,
  AlertTriangle, ArrowRight, Check, Plus,
} from "lucide-react";
import { getStats } from "../../lib/localStore";
import { getRemoteStats, settingsData } from "../../lib/supabaseData";
import { useAuth } from "../../hooks/useAuth";

export function AdminDashboardPage() {
  const { profile, isAdmin } = useAuth();
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

  const missingQris = isAdmin && settings && !settings.qris_image;
  const unreadContacts = stats.contactsUnread ?? 0;
  const firstName = (profile?.full_name || profile?.email || "Admin").split(/\s|@/)[0];

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

      <div className="wpx__page-header wpx__dashboard-heading">
        <div>
          <span className="wpx__eyebrow">RUANG KERJA / ISRA ANWAR</span>
          <h1>Dashboard</h1>
        </div>
      </div>

      <section className="wpx__dashboard-welcome" aria-label="Selamat datang">
        <div>
          <span className="wpx__eyebrow">SELAMAT DATANG KEMBALI</span>
          <h2>Halo, {firstName}.</h2>
          <p>Konten, layanan, dan aktivitas situs Anda dalam satu tempat.</p>
        </div>
        <Link to="/admin/posts/new" className="wpx__btn wpx__btn--primary">
          <Plus size={16} /> Tulis post baru
        </Link>
      </section>

      {missingQris && (
        <div className="wpx__dashboard-alert">
          <AlertTriangle size={20} className="wpx__dashboard-alert-icon" />
          <div style={{ flex: 1 }}>
            <strong>QRIS belum di-upload</strong>
            <p>
              Customer belum bisa lihat QR pembayaran saat checkout. Upload sekali di Settings — nanti otomatis muncul di halaman order.
            </p>
          </div>
          <Link to="/admin/settings" className="wpx__btn wpx__btn--secondary">
            Upload QRIS <ArrowRight size={13} />
          </Link>
        </div>
      )}

      <div className="wpx__dashboard-grid">
        <section className="wpx__dashboard-panel" aria-labelledby="overview-title">
          <div className="wpx__dashboard-panel-head">
            <div>
              <span className="wpx__eyebrow">SEKILAS</span>
              <h2 id="overview-title">Ringkasan situs</h2>
            </div>
            <span className="wpx__dashboard-panel-note">Data saat ini</span>
          </div>
          <div className="wpx__dashboard-stats">
            <StatCard icon={FileText} label="Posts" value={stats.posts} to="/admin/posts" />
            <StatCard icon={Package} label="Produk" value={stats.products} to="/admin/store" />
            <StatCard icon={ShoppingBag} label="Pesanan" value={stats.orders} to="/admin/orders" />
            <StatCard icon={Briefcase} label="Layanan" value={stats.services} to="/admin/services" />
          </div>
        </section>

        <section className="wpx__dashboard-panel" aria-labelledby="attention-title">
          <div className="wpx__dashboard-panel-head">
            <div>
              <span className="wpx__eyebrow">PERLU DICEK</span>
              <h2 id="attention-title">Aktivitas masuk</h2>
            </div>
          </div>
          <Link className="wpx__dashboard-activity" to="/admin/contacts">
            <span className="wpx__dashboard-activity-icon"><Inbox size={20} /></span>
            <span className="wpx__dashboard-activity-copy"><strong>Pesan kontak</strong><small>{unreadContacts > 0 ? `${unreadContacts} pesan baru menunggu dibaca` : "Tidak ada pesan baru"}</small></span>
            <span className="wpx__dashboard-activity-count">{stats.contacts ?? "—"}</span>
            <ArrowRight size={17} className="wpx__dashboard-activity-arrow" />
          </Link>
          <p className="wpx__dashboard-panel-footnote">Jumlah di kanan menunjukkan seluruh pesan kontak.</p>
        </section>
      </div>

      <div className="wpx__dashboard-grid wpx__dashboard-grid--bottom">
        <section className="wpx__dashboard-panel" aria-labelledby="quick-title">
          <div className="wpx__dashboard-panel-head">
            <div>
              <span className="wpx__eyebrow">AKSES CEPAT</span>
              <h2 id="quick-title">Lanjutkan pekerjaan</h2>
            </div>
          </div>
          <div className="wpx__dashboard-shortcuts">
            <QuickLink to="/admin/posts/new" icon={FileText} label="Tulis post" detail="Buat artikel baru" />
            <QuickLink to="/admin/store/new" icon={Package} label="Tambah produk" detail="Kelola katalog toko" />
            <QuickLink to="/admin/media" icon={ImageIcon} label="Pustaka media" detail="Lihat dan unggah aset" />
            <QuickLink to="/admin/homepage" icon={FileText} label="Edit homepage" detail="Perbarui halaman utama" />
          </div>
        </section>

        <section className="wpx__dashboard-panel" aria-labelledby="content-title">
          <div className="wpx__dashboard-panel-head">
            <div>
              <span className="wpx__eyebrow">PUSTAKA SITUS</span>
              <h2 id="content-title">Konten & akses</h2>
            </div>
          </div>
          <div className="wpx__dashboard-mini-stats">
            <StatCard icon={ImageIcon} label="Media" value={stats.media} to="/admin/media" />
            {isAdmin && <StatCard icon={UsersIcon} label="Pengguna" value={stats.users} to="/admin/users" />}
          </div>
        </section>
      </div>
    </>
  );
}

function StatCard({ icon: Icon, label, value, to }) {
  return (
    <Link to={to} className="wpx__dashboard-stat">
      <div className="wpx__stat-icon"><Icon size={20} /></div>
      <div className="wpx__dashboard-stat-copy">
        <div className="wpx__stat-label">{label}</div>
        <div className="wpx__stat-value">{value ?? "—"}</div>
      </div>
      <ArrowRight size={15} className="wpx__dashboard-stat-arrow" />
    </Link>
  );
}

function QuickLink({ to, icon: Icon, label, detail }) {
  return (
    <Link to={to} className="wpx__dashboard-shortcut">
      <span className="wpx__dashboard-shortcut-icon"><Icon size={18} /></span>
      <span><strong>{label}</strong><small>{detail}</small></span>
      <ArrowRight size={15} />
    </Link>
  );
}
