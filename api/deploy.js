// Memicu rebuild Vercel setelah admin mem-publish/menyimpan artikel, supaya
// halaman statis dan sitemap ikut memuat artikel dari Supabase.
// Env (Vercel): VERCEL_DEPLOY_HOOK_URL, VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method not allowed" });
  }
  const hook = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!hook) return res.status(503).json({ error: "deploy hook not configured" });

  const token = String(req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
  const supaUrl = process.env.VITE_SUPABASE_URL;
  const supaKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!token || !supaUrl || !supaKey) return res.status(401).json({ error: "unauthorized" });

  try {
    const who = await fetch(`${supaUrl}/auth/v1/user`, {
      headers: { apikey: supaKey, Authorization: `Bearer ${token}` },
    });
    if (!who.ok) return res.status(401).json({ error: "unauthorized" });
    const user = await who.json();
    const prof = await fetch(
      `${supaUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`,
      { headers: { apikey: supaKey, Authorization: `Bearer ${token}` } },
    );
    const rows = prof.ok ? await prof.json() : [];
    if (!["admin", "editor"].includes(rows?.[0]?.role)) {
      return res.status(403).json({ error: "forbidden" });
    }
    const r = await fetch(hook, { method: "POST" });
    return res.status(r.ok ? 202 : 502).json({ triggered: r.ok });
  } catch (error) {
    return res.status(502).json({ error: String(error?.message ?? error) });
  }
}
