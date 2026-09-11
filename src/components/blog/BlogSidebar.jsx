import { Link } from "react-router-dom";
import { BLOG_CATEGORIES } from "../../data/blogCategories";
import { useI18n } from "../../lib/i18n";
import { localizeBlogCategory } from "../../lib/blogCategoryI18n";
import { formatPostReadCount, getPostReadCount } from "../../lib/blogMetrics";

// Sidebar desktop untuk blog listing. Menampilkan:
// - Daftar 16 kategori (dengan count per kategori)
// - 5 artikel terbaru
// - Blok about singkat + CTA contact
// Semua data dikirim dari parent supaya sidebar tetap dumb (mudah dites).

export function BlogSidebar({ posts, activeCategorySlug }) {
  const { lang, t } = useI18n();
  const counts = posts.reduce((acc, p) => {
    const c = p.category || "opinion-philosophy";
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});
  const recent = [...posts]
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))
    .slice(0, 5);

  const sectionStyle = {
    border: "1px solid var(--okr-line, rgba(255,255,255,0.08))",
    background: "var(--okr-card-bg, rgba(255,255,255,0.02))",
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
  };
  const headingStyle = {
    fontSize: 12,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--okr-muted)",
    margin: "0 0 14px",
  };

  return (
    <aside style={{ position: "sticky", top: 100 }}>
      <div style={sectionStyle}>
        <h4 style={headingStyle}>{t("blog_sidebar_categories")}</h4>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {BLOG_CATEGORIES.map((c) => {
            const category = localizeBlogCategory(c, lang);
            const active = c.slug === activeCategorySlug;
            const count = counts[c.slug] || 0;
            return (
              <li key={c.slug}>
                <Link
                  to={`/blog/${c.slug}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: active ? "1px solid var(--okr-touch-glass-border)" : "1px solid transparent",
                    fontSize: 14,
                    color: "var(--okr-text)",
                    background: active ? "var(--okr-touch-glass)" : "transparent",
                    boxShadow: active ? "var(--okr-touch-glass-shadow)" : undefined,
                    textDecoration: "none",
                    fontWeight: active ? 600 : 400,
                    backdropFilter: active ? "blur(14px) saturate(140%)" : undefined,
                    WebkitBackdropFilter: active ? "blur(14px) saturate(140%)" : undefined,
                  }}
                >
                  <span>{category.name}</span>
                  <span style={{ fontSize: 12, opacity: 0.65 }}>{count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div style={sectionStyle}>
        <h4 style={headingStyle}>{t("blog_sidebar_latest")}</h4>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {recent.map((p) => (
            <li key={p.id}>
              <Link
                to={`/blog/${p.slug}`}
                style={{
                  display: "block",
                  textDecoration: "none",
                  color: "var(--okr-text)",
                  fontSize: 14,
                  lineHeight: 1.4,
                }}
              >
                {p.title}
                <div style={{ fontSize: 11, color: "var(--okr-dim)", marginTop: 4 }}>
                  {new Date(p.published_at ?? p.created_at).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                  {" · "}
                  {t("blog_read_count", { count: formatPostReadCount(getPostReadCount(p), lang) })}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ ...sectionStyle, background: "linear-gradient(135deg, rgba(86, 99, 111, 0.08), rgba(119, 125, 133, 0.04))" }}>
        <h4 style={headingStyle}>{t("blog_sidebar_about_title")}</h4>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--okr-muted)", margin: "0 0 14px" }}>
          {t("blog_sidebar_about_body")}
        </p>
        <Link
          to="/contact"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "10px 16px",
            borderRadius: 999,
            border: "1px solid var(--okr-touch-glass-border)",
            background: "var(--okr-touch-glass)",
            color: "var(--okr-text)",
            boxShadow: "var(--okr-touch-glass-shadow)",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 600,
            backdropFilter: "blur(14px) saturate(140%)",
            WebkitBackdropFilter: "blur(14px) saturate(140%)",
          }}
        >
          {t("blog_sidebar_cta")}
        </Link>
      </div>
    </aside>
  );
}
