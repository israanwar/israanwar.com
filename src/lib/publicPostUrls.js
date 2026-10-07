import { SLUG_RENAMES } from "../data/slugRenames.js";

// Shared by sitemap and prerender: never create an HTML file at a URL
// that redirects to a different public article URL.
export function publicPostSlug(slug) {
  return SLUG_RENAMES[slug] || slug;
}

export function publicPostPath(post) {
  return `/blog/${publicPostSlug(post.slug)}`;
}
