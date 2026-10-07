import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Search } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { useLiveProducts } from "../../hooks/usePageData";
import { useI18n } from "../../lib/i18n";
import { localizeProduct, storeCategoryLabel } from "../../lib/storeI18n";
import { resolveProductCover } from "../../lib/storePlaceholder";
import { BlogPagination } from "../../components/blog/BlogPagination";
import { ProductSocialProof } from "../../components/store/ProductSocialProof";

const SORTS = [
  { key: "featured", labelKey: "store_sort_featured" },
  { key: "sold_desc", labelKey: "store_sort_sold_desc" },
  { key: "sold_asc", labelKey: "store_sort_sold_asc" },
  { key: "rating_desc", labelKey: "store_sort_rating_desc" },
  { key: "rating_asc", labelKey: "store_sort_rating_asc" },
  { key: "price_asc", labelKey: "store_sort_price_asc" },
  { key: "price_desc", labelKey: "store_sort_price_desc" },
  { key: "name_asc", labelKey: "store_sort_name_asc" },
];
const PAGE_SIZE_OPTIONS = [20, 50, 100];

export function StorePage() {
  const { lang, t } = useI18n();
  const items = useLiveProducts({ status: "active" });
  const displayItems = useMemo(
    () => items.map((item) => localizeProduct(item, lang)),
    [items, lang]
  );

  const categoriesWithCount = useMemo(() => {
    const counts = new Map();
    items.forEach((i) => { counts.set(i.category, (counts.get(i.category) ?? 0) + 1); });
    const list = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat, n]) => ({ cat, n }));
    return [{ cat: "All", n: items.length }, ...list];
  }, [items]);

  const [active, setActive] = useState("All");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("featured");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = displayItems
      .filter((i) => active === "All" || i.original_category === active)
      .filter((i) => !term
        || i.name.toLowerCase().includes(term)
        || (i.description ?? "").toLowerCase().includes(term)
        || (i.category ?? "").toLowerCase().includes(term)
        || (i.original_name ?? "").toLowerCase().includes(term)
        || (i.original_description ?? "").toLowerCase().includes(term)
        || (i.original_category ?? "").toLowerCase().includes(term));

    if (sort === "price_asc") list = [...list].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    else if (sort === "price_desc") list = [...list].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    else if (sort === "sold_desc") list = [...list].sort((a, b) => (b.sold_count ?? 0) - (a.sold_count ?? 0));
    else if (sort === "sold_asc") list = [...list].sort((a, b) => (a.sold_count ?? 0) - (b.sold_count ?? 0));
    else if (sort === "rating_desc") list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else if (sort === "rating_asc") list = [...list].sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
    else if (sort === "name_asc") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [displayItems, active, q, sort]);

  useEffect(() => {
    setPage(1);
  }, [active, q, sort, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, filtered.length);
  const pageItems = filtered.slice(pageStart, pageEnd);

  function updatePage(nextPage) {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <Seo title="Store — israanwar" description={t("store_subtitle")} />
              <section className="okr__section okr__page-hero">
          <div className="okr__wrap">
            <span className="okr__eyebrow">{t("store_eyebrow")}</span>
            <AnimatedHeadline text={t("store_title")} className="okr__h2 okr__hero-title--stagger" highlightFrom={1} assembleLetters />
            <p style={{ color: "var(--okr-muted)", maxWidth: 640, marginTop: 20, marginBottom: 40 }}>
              {t("store_subtitle")}
            </p>

            {items.length === 0 ? (
              <p style={{ color: "var(--okr-muted)" }}>{t("store_empty")}</p>
            ) : (
              <>
                <div className="okr__control-row">
                  <div className="okr__search-field okr__control-search">
                    <Search size={16} className="okr__search-icon" />
                    <input
                      type="search"
                      className="okr__glass-input"
                      placeholder={t("store_search")}
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      aria-label={t("store_search_aria")}
                    />
                  </div>

                  <label className="okr__control-sort-label">
                    {t("store_sort_label")}
                    <span className="okr__control-select-wrap">
                      <select
                        className="okr__glass-select"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                      >
                        {SORTS.map((s) => (
                          <option key={s.key} value={s.key}>
                            {t(s.labelKey)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="okr__control-select-chevron" aria-hidden="true" />
                    </span>
                  </label>
                </div>

                <div className="okr__category-rail-wrap" style={{ marginBottom: 32 }}>
                  <div className="okr__category-rail" aria-label={t("store_categories_label")}>
                    {categoriesWithCount.map(({ cat }) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActive(cat)}
                        aria-pressed={active === cat}
                        className={`okr__rail-chip${active === cat ? " is-active" : ""}`}
                      >
                        {cat === "All" ? t("store_all") : storeCategoryLabel(cat, lang)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="okr__results-bar okr__store-results-bar">
                  <div className="okr__results-count">
                    {filtered.length === 0 ? (
                      <>
                        {t("store_items_found", { count: 0 })}
                      </>
                    ) : (
                      <>
                        {t("store_showing", { start: pageStart + 1, end: pageEnd, total: filtered.length })}
                      </>
                    )}
                    {active !== "All" && (
                      <span style={{ color: "var(--okr-muted)" }}>
                        {" "} · {t("store_in_category", { category: storeCategoryLabel(active, lang) })}
                      </span>
                    )}
                  </div>
                  <label className="okr__control-sort-label okr__store-page-size">
                    {t("store_show")}
                    <span className="okr__control-select-wrap">
                      <select
                        className="okr__glass-select okr__store-page-size-select"
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        aria-label={t("store_products_per_page")}
                      >
                        {PAGE_SIZE_OPTIONS.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="okr__control-select-chevron" aria-hidden="true" />
                    </span>
                  </label>
                </div>

                {filtered.length === 0 ? (
                  <div className="okr__panel okr__store-empty">
                    <Search size={32} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                    <p>{t("store_no_match")}</p>
                  </div>
                ) : (
                  <>
                    <div className="okr__products okr__products--artifact">
                      {pageItems.map((p, index) => {
                        const coverUrl = resolveProductCover(p);
                        const productIndex = String(pageStart + index + 1).padStart(2, "0");
                        return (
                          <Link
                            key={p.id}
                            className="okr__product okr__artifact-card"
                            to={`/store/${p.slug}`}
                            data-card-index={productIndex}
                          >
                            <div className="okr__product-img">
                              <img src={coverUrl} alt={p.name} loading="lazy" decoding="async" />
                            </div>
                            <div className="okr__product-body">
                              <div className="okr__artifact-card-edition" aria-hidden="true">
                                <span>{productIndex}</span>
                                <span>ISRA ANWAR / ARTIFACT</span>
                              </div>
                              {p.category && <div className="okr__product-cat">{p.category}</div>}
                              <div className="okr__product-name">{p.name}</div>
                              <ProductSocialProof product={p} />
                              <div className="okr__product-price">Rp {(p.price ?? 0).toLocaleString("id-ID")}</div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>

                    {totalPages > 1 && (
                      <BlogPagination
                        current={currentPage}
                        total={totalPages}
                        onChange={updatePage}
                        ariaLabel={t("store_pagination")}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </section>
    </>
  );
}
