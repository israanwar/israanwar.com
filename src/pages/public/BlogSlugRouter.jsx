import { useParams, Navigate } from "react-router-dom";
import { CATEGORY_BY_SLUG } from "../../data/blogCategories";
import { SLUG_RENAMES } from "../../data/slugRenames";
import { BlogListPage } from "./BlogListPage";
import { BlogDetailPage } from "./BlogDetailPage";

// Route `/blog/:slug` bisa berarti dua hal:
// (1) `/blog/[category-slug]` → tampilkan list difilter kategori
// (2) `/blog/[post-slug]` → tampilkan detail artikel
// Karena kategori slugs finite dan diketahui compile-time (16 slot),
// kita cek dulu apakah param cocok kategori. Kalau tidak, fallback
// ke detail. Ini menjaga URL flat sesuai spec (`/blog/search-optimization`).
export function BlogSlugRouter() {
  const { slug } = useParams();
  // Old slugs already 301 at the edge (vercel.json), but an in-app <Link>
  // that still points at an old slug (client-side nav, no round trip to
  // Vercel) needs its own redirect so it doesn't try to render a post that
  // no longer exists under that URL.
  if (slug && SLUG_RENAMES[slug]) {
    return <Navigate to={`/blog/${SLUG_RENAMES[slug]}`} replace />;
  }
  if (slug && CATEGORY_BY_SLUG[slug]) {
    return <BlogListPage initialCategorySlug={slug} />;
  }
  return <BlogDetailPage />;
}
