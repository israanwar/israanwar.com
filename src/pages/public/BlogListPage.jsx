import { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ChevronDown, Search } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { useLivePosts } from "../../hooks/usePageData";
import { BLOG_CATEGORIES, CATEGORY_BY_SLUG } from "../../data/blogCategories";
import { PostCard } from "../../components/blog/PostCard";
import { BlogPagination } from "../../components/blog/BlogPagination";
import { BlogSidebar } from "../../components/blog/BlogSidebar";
import { useI18n } from "../../lib/i18n";
import { localizeBlogCategory } from "../../lib/blogCategoryI18n";
import { getPostReadCount } from "../../lib/blogMetrics";

const PAGE_SIZE = 12;
const SORT_OPTIONS = [
  { value: "newest", labelKey: "blog_sort_newest" },
  { value: "oldest", labelKey: "blog_sort_oldest" },
  { value: "read_desc", labelKey: "blog_sort_most_read" },
  { value: "read_asc", labelKey: "blog_sort_least_read" },
];

function sortPosts(posts, mode) {
  const copy = [...posts];
  if (mode === "oldest") {
    copy.sort((a, b) => (a.published_at ?? "").localeCompare(b.published_at ?? ""));
  } else if (mode === "read_desc" || mode === "popular") {
    copy.sort((a, b) => {
      const diff = getPostReadCount(b) - getPostReadCount(a);
      if (diff !== 0) return diff;
      return (b.published_at ?? "").localeCompare(a.published_at ?? "");
    });
  } else if (mode === "read_asc") {
    copy.sort((a, b) => {
      const diff = getPostReadCount(a) - getPostReadCount(b);
      if (diff !== 0) return diff;
      return (b.published_at ?? "").localeCompare(a.published_at ?? "");
    });
  } else {
    // newest (default)
    copy.sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
  }
  return copy;
}

// initialCategorySlug dilempar dari BlogSlugRouter kalau route
// `/blog/[category-slug]` matched. Kalau tidak, tanda "semua kategori".
export function BlogListPage({ initialCategorySlug = null }) {
  const { lang, t } = useI18n();
  const allPosts = useLivePosts({ status: "published" });
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategory = initialCategorySlug
    ? CATEGORY_BY_SLUG[initialCategorySlug]
    : null;
  const activeCategoryDisplay = activeCategory ? localizeBlogCategory(activeCategory, lang) : null;
  const q = (searchParams.get("q") ?? "").trim();
  const rawSort = searchParams.get("sort");
  const sort = rawSort === "popular"
    ? "read_desc"
    : SORT_OPTIONS.find((s) => s.value === rawSort)?.value ?? "newest";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  // Filter → sort → paginate
  const filtered = useMemo(() => {
    let list = allPosts;
    if (activeCategory) list = list.filter((p) => p.category === activeCategory.slug);
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter((p) =>
        (p.title ?? "").toLowerCase().includes(needle)
        || (p.excerpt ?? "").toLowerCase().includes(needle)
        || (p.focus_keyword ?? "").toLowerCase().includes(needle)
        || (p.tags ?? []).some((tag) => tag.toLowerCase().includes(needle))
      );
    }
    return sortPosts(list, sort);
  }, [allPosts, activeCategory, q, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  function updateParams(patch) {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "") next.delete(k);
      else next.set(k, String(v));
    });
    // Reset page ke 1 kalau filter/query berubah
    if (Object.keys(patch).some((k) => k !== "page")) next.delete("page");
    setSearchParams(next, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // SEO
  const pageTitle = activeCategoryDisplay
    ? `${activeCategoryDisplay.name} — Blog israanwar`
    : `${t("blog_title")} — israanwar`;
  const pageDesc = activeCategoryDisplay
    ? activeCategoryDisplay.description
    : t("blog_subtitle");
  const heroKicker = activeCategoryDisplay ? t("blog_category_kicker") : t("blog_journal_kicker");
  const heroTitle = activeCategoryDisplay ? activeCategoryDisplay.name : t("blog_title");
  const heroSubtitle = activeCategoryDisplay ? activeCategoryDisplay.description : t("blog_subtitle");

  return (
    <>
      <Seo title={pageTitle} description={pageDesc} />
              <section className="okr__section okr__page-hero" style={{ paddingBottom: 40 }}>
          <div className="okr__wrap">
            {/* Breadcrumb ringan */}
            <nav aria-label="Breadcrumb" style={{ fontSize: 12, color: "var(--okr-muted)", marginBottom: 16, letterSpacing: "0.04em" }}>
              <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>{t("nav_home")}</Link>
              <span aria-hidden style={{ margin: "0 8px" }}>›</span>
              <Link to="/blog" style={{ color: "inherit", textDecoration: "none" }}>{t("blog_title")}</Link>
              {activeCategoryDisplay && (
                <>
                  <span aria-hidden style={{ margin: "0 8px" }}>›</span>
                  <span style={{ color: "var(--okr-text)" }}>{activeCategoryDisplay.name}</span>
                </>
              )}
            </nav>

            {/* Hero */}
            <span className="okr__eyebrow">{heroKicker}</span>
            <AnimatedHeadline text={heroTitle} className="okr__h2" highlightLast={1} style={{ marginBottom: 16 }} />
            <p style={{ color: "var(--okr-muted)", maxWidth: 720, marginTop: 8, marginBottom: 40, fontSize: 16, lineHeight: 1.6 }}>
              {heroSubtitle}
            </p>

            {/* Search + Sort bar */}
            <div className="okr__control-row">
              <div className="okr__search-field okr__control-search">
                <Search size={16} className="okr__search-icon" />
                <input
                  type="search"
                  placeholder={t("blog_search")}
                  defaultValue={q}
                  onChange={(e) => {
                    const val = e.target.value;
                    // debounce simpel via setTimeout
                    clearTimeout(window.__blogSearchT);
                    window.__blogSearchT = setTimeout(() => updateParams({ q: val }), 250);
                  }}
                  className="okr__glass-input"
                  aria-label={t("blog_search_aria")}
                />
              </div>
              <label className="okr__control-sort-label">
                {t("blog_sort_label")}
                <span className="okr__control-select-wrap">
                  <select
                    value={sort}
                    onChange={(e) => updateParams({ sort: e.target.value === "newest" ? "" : e.target.value })}
                    className="okr__glass-select"
                  >
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{t(o.labelKey)}</option>)}
                  </select>
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className="okr__control-select-chevron"
                  />
                </span>
              </label>
            </div>

            {/* Category chips (scrollable horizontal on mobile) */}
            <div
              className="okr__category-rail-wrap"
              style={{ marginBottom: 32 }}
            >
              <div
                className="okr__category-rail"
                aria-label={t("blog_categories_label")}
              >
                <Link
                  to="/blog"
                  className={`okr__rail-chip${!activeCategory ? " is-active" : ""}`}
                >
                  {t("blog_all")}
                </Link>
                {BLOG_CATEGORIES.map((c) => (
                  <Link
                    key={c.slug}
                    to={`/blog/${c.slug}`}
                    className={`okr__rail-chip${activeCategory?.slug === c.slug ? " is-active" : ""}`}
                  >
                    {localizeBlogCategory(c, lang).name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Result count */}
            <div style={{ marginBottom: 20, fontSize: 13, color: "var(--okr-muted)" }}>
              {filtered.length === 0
                ? t("blog_no_match")
                : q
                  ? t("blog_showing_query", {
                    start: pageStart + 1,
                    end: Math.min(pageStart + PAGE_SIZE, filtered.length),
                    total: filtered.length,
                    query: q,
                  })
                  : t("blog_showing", {
                    start: pageStart + 1,
                    end: Math.min(pageStart + PAGE_SIZE, filtered.length),
                    total: filtered.length,
                  })}
            </div>

            {/* 2-column layout: content + sidebar */}
            <div className="okr__blog-layout">
              <div>
                {pageItems.length === 0 ? (
                  <div style={{
                    padding: 40,
                    borderRadius: 14,
                    border: "1px dashed var(--okr-line-strong, rgba(255,255,255,0.1))",
                    textAlign: "center",
                    color: "var(--okr-muted)",
                  }}>
                    {q
                      ? t("blog_no_match_query", { query: q })
                      : activeCategoryDisplay
                        ? t("blog_no_articles_category", { category: activeCategoryDisplay.name })
                        : t("blog_empty")}
                    {(q || activeCategory) && (
                      <div style={{ marginTop: 16 }}>
                        <Link to="/blog" style={{ color: "var(--okr-primary-2, #c9cdd1)", textDecoration: "underline" }}>
                          {t("blog_view_all_articles")}
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="okr__blog-grid okr__blog-grid--editorial">
                    {pageItems.map((p, i) => <PostCard key={p.id} post={p} index={pageStart + i} />)}
                  </div>
                )}

                <BlogPagination
                  current={currentPage}
                  total={totalPages}
                  onChange={(n) => updateParams({ page: n === 1 ? "" : n })}
                  ariaLabel={t("blog_pagination")}
                />
              </div>

              <div className="okr__blog-sidebar">
                <BlogSidebar posts={allPosts} activeCategorySlug={activeCategory?.slug ?? null} />
              </div>
            </div>
          </div>
        </section>

      {/* Layout CSS via style tag — sidebar hidden di mobile, side-by-side di desktop.
          Grid card: 3 kolom di desktop, 2 di tablet, 2 compact kolom di mobile. */}
      <style>{`
        .okr__blog-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 40px;
          align-items: flex-start;
        }
        .okr__blog-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }
        @media (max-width: 1100px) {
          .okr__blog-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 960px) {
          .okr__blog-layout { grid-template-columns: 1fr; }
          .okr__blog-sidebar { display: none; }
        }
        @media (max-width: 640px) {
          .okr__blog-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        }
      `}</style>
    </>
  );
}
