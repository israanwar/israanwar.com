import { useEffect, useState } from "react";
import { getPostReadCount } from "../lib/blogMetrics";

// Real, cross-visitor, ever-incrementing read count backed by
// /api/post-views (Upstash Redis). Every mount (including a plain reload)
// counts as a view — there is deliberately no per-session dedup, since the
// whole point is "reload increases it."
//
// Returns null until the real count is known, and renders nothing until
// then (see BlogDetailPage). This is deliberate: showing a placeholder
// estimate first and then swapping it for the real number caused the
// number to visibly drop-then-jump on every load, which read as broken.
// A single clean transition (nothing -> final number) never does that.
export function usePostViewCount(post) {
  const [count, setCount] = useState(null);

  useEffect(() => {
    setCount(null);
    if (!post?.slug) return undefined;

    let cancelled = false;
    const fallback = getPostReadCount(post);

    (async () => {
      try {
        const res = await fetch("/api/post-views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: post.slug, seed: fallback }),
        });
        if (!res.ok) throw new Error(`bad status ${res.status}`);
        const data = await res.json();
        if (!Number.isFinite(data?.count) || data.count <= 0) {
          throw new Error("bad payload");
        }
        if (!cancelled) setCount(data.count);
      } catch {
        // Redis not reachable/configured — show the same deterministic
        // estimate the page always showed before this feature existed,
        // set once, never overwritten again for this mount.
        if (!cancelled) setCount(fallback);
      }
    })();

    return () => { cancelled = true; };
  }, [post?.slug]);

  return count;
}
