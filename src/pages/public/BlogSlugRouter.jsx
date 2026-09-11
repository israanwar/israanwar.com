import { useParams } from "react-router-dom";
import { CATEGORY_BY_SLUG } from "../../data/blogCategories";
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
  if (slug && CATEGORY_BY_SLUG[slug]) {
    return <BlogListPage initialCategorySlug={slug} />;
  }
  return <BlogDetailPage />;
}
