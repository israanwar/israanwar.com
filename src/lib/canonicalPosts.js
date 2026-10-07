// Single source of truth for "which URL is this blog post at, and what does
// it say" — used by every build-time script (prerender, sitemap, checks).
//
// The seed (blogSeedIsraVoice.js) still carries each post's ORIGINAL slug and
// title; the humanized slugs/titles/metadata were layered on afterwards via
// POST_CONTENT_OVERRIDES (keyed by the original slug) and SLUG_RENAMES. The
// browser merges them the same way in supabaseData.js (postRowToItem). The
// build scripts used to read the raw seed instead, which produced static
// pages at the OLD slugs while the sitemap and 301 redirects pointed at the
// NEW ones — so every new URL fell through to the SPA fallback (homepage).
//
// Plain ESM with explicit extensions and no browser APIs, so it runs in Node.

import { ISRA_ANWAR_BLOG_POSTS_SEED } from "../data/blogSeedIsraVoice.js";
import { POST_CONTENT_OVERRIDES } from "../data/postContentOverrides.js";
import { SLUG_RENAMES } from "../data/slugRenames.js";

export function canonicalSlug(slug) {
  return SLUG_RENAMES[slug] ?? slug;
}

// Rewrite internal /blog/<old-slug> links inside a Tiptap document so the
// body never links to a URL that has to 301 first.
function rewriteInternalLinks(node) {
  if (Array.isArray(node)) return node.map(rewriteInternalLinks);
  if (!node || typeof node !== "object") return node;
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    out[key] = rewriteInternalLinks(value);
  }
  if (out.type === "link" && typeof out.attrs?.href === "string") {
    const match = out.attrs.href.match(/^\/blog\/([^/?#]+)(.*)$/);
    if (match && SLUG_RENAMES[match[1]]) {
      out.attrs = { ...out.attrs, href: `/blog/${SLUG_RENAMES[match[1]]}${match[2]}` };
    }
  }
  return out;
}

export function resolveCanonicalPost(seedPost) {
  const override = POST_CONTENT_OVERRIDES[seedPost.slug];
  const merged = override ? { ...seedPost, ...override } : { ...seedPost };
  const slug = canonicalSlug(merged.slug);
  return {
    ...merged,
    slug,
    legacy_slug: seedPost.slug !== slug ? seedPost.slug : undefined,
    canonical_path: `/blog/${slug}`,
    related_slugs: (merged.related_slugs ?? []).map(canonicalSlug),
    content: rewriteInternalLinks(merged.content),
  };
}

function byNewest(a, b) {
  return (
    String(b.published_at ?? b.created_at ?? "").localeCompare(String(a.published_at ?? a.created_at ?? ""))
    || String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
  );
}

// Published posts, newest first, with canonical slug/title/metadata applied.
export function getCanonicalPublishedPosts() {
  return ISRA_ANWAR_BLOG_POSTS_SEED
    .filter((post) => post.status === "published")
    .map(resolveCanonicalPost)
    .sort(byNewest);
}
