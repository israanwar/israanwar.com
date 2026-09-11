import { useEffect, useState } from "react";
import { listProfiles, updateProfileRole } from "../../services/userService";

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setUsers(await listProfiles());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function changeRole(id, role) {
    await updateProfileRole(id, role);
    load();
  }

  return (
    <>
      <div className="wpx__page-header">
        <h1>Users</h1>
      </div>

      <div className="wpx__notice wpx__notice--info">
        Untuk mengundang user baru: buka Supabase Dashboard → Authentication → Users → <b>Add user</b>. Setelah user pertama kali login, dia akan otomatis punya role <b>editor</b>. Ubah ke admin di tabel bawah.
      </div>

      {loading ? <p>Loading…</p> : (
        <table className="wpx__table">
          <thead>
            <tr><th>Email</th><th>Nama</th><th style={{ width: 120 }}>Role</th><th style={{ width: 160 }}>Dibuat</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.full_name ?? "—"}</td>
                <td>
                  <select className="wpx__select" value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                    <option value="editor">editor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>{new Date(u.created_at).toLocaleDateString("id-ID")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
