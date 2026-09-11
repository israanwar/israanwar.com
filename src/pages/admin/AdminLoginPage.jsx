import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { IsraAnwarLogo } from "../../components/brand/IsraAnwarLogo";
import "../../styles/admin.css";

export function AdminLoginPage() {
  const { login, logout, user, isStaff, loading } = useAuth();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && !isStaff) logout();
  }, [isStaff, loading, logout, user]);

  if (!loading && user && isStaff) {
    const to = loc.state?.from ?? "/admin";
    return <Navigate to={to} replace />;
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message ?? "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wpx-login">
      <form className="wpx-login__card" onSubmit={submit}>
        <div className="wpx-login__brand">
          <IsraAnwarLogo name="israanwar" className="wpx-login__brand-logo" />
          <h1 className="wpx-login__brand-title">Panel Admin</h1>
          <p className="wpx-login__brand-sub">
            Masuk untuk mengelola situs
          </p>
        </div>

        {error && <div className="wpx__notice wpx__notice--error">{error}</div>}

        <div className="wpx__field">
          <label className="wpx__label">Email</label>
          <input
            className="wpx__input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@israanwar.com"
            required autoFocus
          />
        </div>
        <div className="wpx__field">
          <label className="wpx__label">Password</label>
          <input
            className="wpx__input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            required minLength={6}
          />
        </div>

        <button className="wpx-login__submit" type="submit" disabled={busy}>
          {busy ? "Memproses…" : "Masuk"}
        </button>
      </form>
    </div>
  );
}
