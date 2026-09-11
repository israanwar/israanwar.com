import { Link } from "react-router-dom";
import { CATEGORY_BY_SLUG, DEFAULT_CATEGORY_SLUG } from "../../data/blogCategories";
import { useI18n } from "../../lib/i18n";
import { localizeBlogCategory } from "../../lib/blogCategoryI18n";

// Bulletproof date formatter: empty input or unparseable strings return blank.
// null/undefined atau string non-parseable, return empty string (bukan
// "Invalid Date"). Ini defensive terhadap draft post yang belum publish
// atau data legacy yang miss field.
function fmtDate(iso, lang) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// AUTHOR: belum ada sistem multi-author yang aktif, jadi untuk sekarang
// resolve author display dari brand. Bisa di-extend ke usersRepo nanti.
const AUTHOR_DISPLAY = "Isra Anwar";

export function PostCard({ post, layout = "grid", index = null }) {
  const { lang } = useI18n();
  const rawCategory = CATEGORY_BY_SLUG[post.category] ?? CATEGORY_BY_SLUG[DEFAULT_CATEGORY_SLUG];
  const category = localizeBlogCategory(rawCategory, lang);
  const author = post.author_name ?? AUTHOR_DISPLAY;

  const isHorizontal = layout === "horizontal";
  const cardIndex = index == null ? null : String(index + 1).padStart(2, "0");

  return (
    <article
      className={`okr__blog-card okr__editorial-card${isHorizontal ? " okr__blog-card--horizontal" : ""}`}
      data-card-index={cardIndex ?? undefined}
    >
      <Link
        className="okr__blog-card-cover"
        to={`/blog/${post.slug}`}
        aria-label={post.image_alt || post.title}
      >
        <span className="okr__blog-card-cover-category">{category?.name || "Journal"}</span>
      </Link>
      <div className="okr__blog-card-body">
        <time className="okr__blog-card-date" dateTime={post.published_at ?? post.created_at ?? undefined}>
          {fmtDate(post.published_at ?? post.created_at, lang)}
        </time>
        <h3 className="okr__blog-card-title">
          <Link className="okr__blog-card-title-link" to={`/blog/${post.slug}`}>
            {post.title}
          </Link>
        </h3>
        <div className="okr__blog-card-meta">
          {category && <Link className="okr__blog-card-category" to={`/blog/${category.slug}`}>{category.name}</Link>}
          <span>{author}</span>
        </div>
      </div>
    </article>
  );
}
