import { kv } from "@vercel/kv";

// Serverless function backing the real, cross-visitor read counter.
// Requires a Vercel KV (Upstash Redis) store connected to this project —
// Vercel injects KV_REST_API_URL / KV_REST_API_TOKEN automatically once
// that's done, no manual env var setup needed.
//
// GET  /api/post-views?slug=x         -> current count, does not increment
// POST /api/post-views  { slug, seed } -> increments by 1, returns new count
//
// `seed` (the old deterministic fake count already shown for that post) is
// used only the very first time a slug is seen, so the number picks up
// from where it already was instead of jarringly resetting to 1.
export default async function handler(req, res) {
  const slug = req.method === "GET" ? req.query?.slug : req.body?.slug;
  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ error: "missing slug" });
  }

  const key = `post_views:${slug}`;

  try {
    if (req.method === "GET") {
      const count = Number((await kv.get(key)) ?? 0);
      return res.status(200).json({ slug, count });
    }

    if (req.method === "POST") {
      const seed = Number(req.body?.seed);
      const exists = await kv.exists(key);
      if (!exists && Number.isFinite(seed) && seed > 0) {
        await kv.set(key, Math.round(seed));
      }
      const count = await kv.incr(key);
      return res.status(200).json({ slug, count });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method not allowed" });
  } catch (error) {
    // KV store not connected yet, or a transient error — fail soft so the
    // page still renders with its existing fallback count instead of a
    // broken request blocking anything.
    return res.status(503).json({ error: "kv unavailable", detail: String(error?.message ?? error) });
  }
}
