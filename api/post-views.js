import { Redis } from "@upstash/redis";

// Serverless function backing the real, cross-visitor read counter.
// Uses a plain Upstash Redis database (upstash.com, free tier, no card
// required) instead of the Vercel Marketplace KV integration, which puts a
// payment method on file even for free-tier usage. Add these two env vars
// to the Vercel project (Settings -> Environment Variables), copied from
// the Upstash console's REST API section:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
//
// GET  /api/post-views?slug=x         -> current count, does not increment
// POST /api/post-views  { slug, seed } -> increments by 1, returns new count
//
// `seed` (the old deterministic fake count already shown for that post) is
// used only the very first time a slug is seen, so the number continues
// from where it already was instead of resetting to 1.
function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export default async function handler(req, res) {
  const slug = req.method === "GET" ? req.query?.slug : req.body?.slug;
  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ error: "missing slug" });
  }

  const redis = getRedis();
  if (!redis) {
    return res.status(503).json({ error: "redis not configured" });
  }

  const key = `post_views:${slug}`;

  try {
    if (req.method === "GET") {
      const count = Number((await redis.get(key)) ?? 0);
      return res.status(200).json({ slug, count });
    }

    if (req.method === "POST") {
      const seed = Number(req.body?.seed);
      const exists = await redis.exists(key);
      if (!exists && Number.isFinite(seed) && seed > 0) {
        await redis.set(key, Math.round(seed));
      }
      const count = await redis.incr(key);
      return res.status(200).json({ slug, count });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method not allowed" });
  } catch (error) {
    // Transient/misconfiguration error — fail soft so the page still
    // renders with its existing fallback count instead of breaking.
    return res.status(503).json({ error: "redis unavailable", detail: String(error?.message ?? error) });
  }
}
