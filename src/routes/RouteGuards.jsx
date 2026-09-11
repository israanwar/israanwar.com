import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function RequireAuth() {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Loading…</div>;
  if (!user) return <Navigate to="/admin/login" state={{ from: loc.pathname }} replace />;
  return <Outlet />;
}

export function RequireStaff() {
  const { isStaff, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Loading…</div>;
  if (!isStaff) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Loading…</div>;
  if (!isAdmin) return <Navigate to="/admin" replace />;
  return <Outlet />;
}
