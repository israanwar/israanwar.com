import { useEffect, useState } from "react";
import { getPostReadCount } from "../lib/blogMetrics";

const SESSION_KEY_PREFIX = "okr:viewed:";

// Real, cross-visitor read count backed by /api/post-views (Vercel KV).
// Falls back to the existing deterministic estimate (blogMetrics.js) while
// the request is in flight, and stays on that estimate for good if the KV
// store isn't connected yet or the request fails, so the page never shows
// a broken or empty number.
export function usePostViewCount(post) {
  const fallback = getPostReadCount(post ?? {});
  const [count, setCount] = useState(fallback);

  useEffect(() => {
    if (!post?.slug) return undefined;
    const sessionKey = `${SESSION_KEY_PREFIX}${post.slug}`;
    let alreadyViewedThisSession = false;
    try {
      alreadyViewedThisSession = sessionStorage.getItem(sessionKey) === "1";
    } catch {
      // Storage unavailable (private mode etc.) — treat every load as a
      // fresh view rather than blocking the feature entirely.
    }

    let cancelled = false;
    async function run() {
      try {
        const res = alreadyViewedThisSession
          ? await fetch(`/api/post-views?slug=${encodeURIComponent(post.slug)}`)
          : await fetch("/api/post-views", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug: post.slug, seed: fallback }),
            });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Number.isFinite(data?.count) && data.count > 0) {
          setCount(data.count);
        }
        if (!alreadyViewedThisSession) {
          try {
            sessionStorage.setItem(sessionKey, "1");
          } catch {
            // Best-effort only — a missed write just means the next load
            // in this session counts as a view again.
          }
        }
      } catch {
        // KV not connected yet, offline, etc. — keep showing `fallback`.
      }
    }
    run();
    return () => { cancelled = true; };
  }, [post?.slug, fallback]);

  return count;
}
