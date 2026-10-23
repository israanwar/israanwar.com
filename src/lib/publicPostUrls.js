import { SLUG_RENAMES } from "../data/slugRenames.js";

// Shared by sitemap and prerender: never create an HTML file at a URL
// that redirects to a different public article URL.
export function publicPostSlug(slug) {
  return SLUG_RENAMES[slug] || slug;
}

export function publicPostPath(post) {
  return `/blog/${publicPostSlug(post.slug)}`;
}

// A post keeps its original slug internally, but its public URL is the renamed
// one. A canonical that still points at the old slug names a URL that
// redirects, which the prerender check rejects and search engines treat as a
// canonical pointing at a redirect.
export function postCanonicalPath(post) {
  const explicit = String(post.canonical_path ?? "").trim();
  if (!explicit) return publicPostPath(post);
  const match = explicit.match(/^\/blog\/([^/?#]+)\/?$/);
  return match && SLUG_RENAMES[match[1]] ? `/blog/${SLUG_RENAMES[match[1]]}` : explicit;
}
