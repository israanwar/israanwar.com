import { useEffect, useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import {
  LayoutDashboard, FileText, Image as ImageIcon, Settings, Users, Home, LogOut, Sliders,
  ShoppingBag, Package, Briefcase, FileEdit, Inbox,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { contactsData } from "../lib/supabaseData";
import { IsraAnwarLogo } from "../components/brand/IsraAnwarLogo";
import "../styles/admin.css";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/posts", label: "Posts", icon: FileText },
  { to: "/admin/store", label: "Store", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/services", label: "Services", icon: Briefcase },
  { to: "/admin/contacts", label: "Contacts", icon: Inbox, badge: "contacts" },
  { to: "/admin/homepage", label: "Homepage", icon: Sliders },
  { to: "/admin/pages", label: "Pages", icon: FileEdit },
  { to: "/admin/media", label: "Media", icon: ImageIcon },
  { to: "/admin/users", label: "Users", icon: Users, adminOnly: true },
  { to: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true },
];

export function AdminLayout() {
  const { profile, logout, isAdmin } = useAuth();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    const update = async () => {
      const contacts = await contactsData.list();
      setUnread(contacts.filter((c) => c.status === "new").length);
    };
    update();
    const t = setInterval(update, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="wpx">
      <div className="wpx__shell">
        <aside className="wpx__sidebar">
          <div className="wpx__brand">
            <IsraAnwarLogo name="israanwar" className="wpx-logo" markClassName="wpx__brand-mark" />
          </div>
          <ul className="wpx__nav">
            {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => (
              <li key={n.to} className="wpx__nav-item">
                <NavLink
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) => `wpx__nav-link${isActive ? " is-active" : ""}`}
                >
                  <span className="wpx__nav-icon"><n.icon size={16} /></span>
                  <span style={{ flex: 1 }}>{n.label}</span>
                  {n.badge === "contacts" && unread > 0 && (
                    <span style={{
                      background: "var(--primary)", color: "#fff", fontSize: 11, fontWeight: 700,
                      borderRadius: 999, padding: "1px 8px", minWidth: 20, textAlign: "center",
                    }}>{unread}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </aside>

        <div className="wpx__main">
          <header className="wpx__topbar">
            <span className="wpx__topbar-brand">
              <Link to="/">
                <Home size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                Lihat situs
              </Link>
            </span>
            <div className="wpx__topbar-spacer" />
            <div className="wpx__topbar-user">
              <span>Halo, {profile?.full_name || profile?.email}</span>
              <button onClick={logout} type="button">
                <LogOut size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                Logout
              </button>
            </div>
          </header>
          <div className="wpx__content">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
