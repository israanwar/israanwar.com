// Artikel yang dibuat lewat admin dashboard hanya ada di Supabase, bukan di
// file seed. Build (prerender + sitemap) harus ikut membacanya, kalau tidak
// URL-nya 404 di host dan tidak pernah masuk sitemap. Best-effort: kalau env
// belum ada atau Supabase tidak terjangkau, kembalikan [] dan build lanjut.

import { resolve } from "node:path";

try {
  process.loadEnvFile(resolve(process.cwd(), ".env.local"));
} catch {
  // Di Vercel env sudah ada di process.env.
}

export async function fetchDbOnlyPosts(seedPosts = []) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn("⚠ posts: VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY belum di-set, artikel dari admin dilewati.");
    return [];
  }
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("status", "published");
    if (error) throw error;
    const known = new Set(seedPosts.map((p) => p.slug));
    return (data ?? [])
      .filter((row) => row.slug && !known.has(row.slug))
      .map((row) => {
        const d = row.data ?? {};
        return {
          ...d,
          id: row.id,
          slug: row.slug,
          title: row.title ?? d.title,
          status: row.status,
          category: row.category ?? d.category,
          published_at: row.published_at ?? d.published_at,
          created_at: row.created_at ?? d.created_at,
          updated_at: row.updated_at ?? d.updated_at,
        };
      });
  } catch (err) {
    console.warn("⚠ posts: gagal mengambil artikel dari Supabase.", err?.message ?? err);
    return [];
  }
}
