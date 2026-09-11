import { Link } from "react-router-dom";
import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { useLivePosts } from "../../hooks/usePageData";
import { BLOG_CATEGORIES } from "../../data/blogCategories";
import { TOOLS_CATALOG, TOOLS_TOTAL_COUNT } from "../../data/toolsCatalog";

// Halaman sitemap versi HTML (human-readable). Di-link dari footer.
// Groupped by kategori supaya reinforce topical structure ke pembaca +
// crawler yang membaca inline anchor text.
// sitemap.xml (machine-readable) di-generate terpisah oleh
// scripts/generate-sitemap.mjs saat build.

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export function SitemapPage() {
  const allPosts = useLivePosts({ status: "published" });

  // Group posts by category. Category yang tidak punya artikel tetap
  // ditampilkan (count 0) supaya taxonomy transparan.
  const grouped = BLOG_CATEGORIES.map((cat) => {
    const posts = allPosts
      .filter((p) => p.category === cat.slug)
      .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
    return { category: cat, posts };
  });

  const totalPosts = allPosts.length;
  const activeCategories = grouped.filter((g) => g.posts.length > 0).length;

  const staticPages = [
    { path: "/",          label: "Beranda" },
    { path: "/about",     label: "Tentang" },
    { path: "/services",  label: "Layanan" },
    { path: "/portfolio", label: "Portfolio" },
    { path: "/tools",     label: "Tools" },
    { path: "/store",     label: "Store" },
    { path: "/blog",      label: "Blog" },
    { path: "/contact",   label: "Kontak" },
    { path: "/privacy",   label: "Privacy Policy" },
    { path: "/terms",     label: "Terms of Service" },
  ];

  return (
    <>
      <Seo
        title="Sitemap"
        description={`Peta lengkap halaman Isra Anwar — ${totalPosts} artikel di ${activeCategories} kategori aktif, plus halaman utama dan legal.`}
      />
              <section className="okr__section okr__page-hero" style={{ paddingBottom: 80 }}>
          <div className="okr__wrap" style={{ maxWidth: 960 }}>
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" style={{ fontSize: 12, color: "var(--okr-muted)", marginBottom: 16, letterSpacing: "0.04em" }}>
              <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>Beranda</Link>
              <span aria-hidden style={{ margin: "0 8px" }}>›</span>
              <span style={{ color: "var(--okr-text)" }}>Sitemap</span>
            </nav>

            <span className="okr__eyebrow">// SITEMAP</span>
            <AnimatedHeadline text="Peta situs" className="okr__h2" highlightLast={1} style={{ marginBottom: 16 }} />
            <p style={{ color: "var(--okr-muted)", maxWidth: 640, marginTop: 8, marginBottom: 40, fontSize: 16, lineHeight: 1.6 }}>
              Daftar lengkap {totalPosts} artikel di {activeCategories} kategori aktif, plus halaman utama dan legal.
              Halaman ini juga tersedia dalam format XML di{" "}
              <a href="/sitemap.xml" style={{ color: "var(--okr-primary-2, #c9cdd1)", textDecoration: "underline" }}>
                /sitemap.xml
              </a>{" "}
              untuk search engine.
            </p>

            {/* Static pages */}
            <section style={{ marginBottom: 56 }}>
              <h2 style={{ fontSize: 14, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--okr-muted)", marginBottom: 20 }}>
                Halaman utama
              </h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                {staticPages.map((p) => (
                  <li key={p.path}>
                    <Link
                      to={p.path}
                      style={{ display: "block", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--okr-line, rgba(255,255,255,0.08))", color: "var(--okr-text)", textDecoration: "none", fontSize: 14 }}
                    >
                      {p.label}
                      <span style={{ color: "var(--okr-dim)", marginLeft: 6, fontSize: 12 }}>{p.path}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section style={{ marginBottom: 56 }}>
              <h2 style={{ fontSize: 14, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--okr-muted)", marginBottom: 20 }}>
                Tools aktif ({TOOLS_TOTAL_COUNT})
              </h2>
              {TOOLS_CATALOG.map((category) => (
                <div key={category.slug} style={{ marginBottom: 28 }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 18 }}>{category.name}</h3>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                    {category.tools.map((tool) => (
                      <li key={tool.slug}>
                        <Link to={`/tools/${tool.slug}`} style={{ display: "block", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--okr-line, rgba(255,255,255,0.08))", color: "var(--okr-text)", textDecoration: "none", fontSize: 14 }}>
                          {tool.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>

            {/* Blog articles grouped by category */}
            <section>
              <h2 style={{ fontSize: 14, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--okr-muted)", marginBottom: 20 }}>
                Artikel blog per kategori
              </h2>

              {grouped.map(({ category, posts }) => (
                <section
                  key={category.slug}
                  style={{
                    marginBottom: 40,
                    paddingBottom: 32,
                    borderBottom: "1px solid var(--okr-line, rgba(255,255,255,0.06))",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8, gap: 16, flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
                      <Link to={`/blog/${category.slug}`} style={{ color: "var(--okr-text)", textDecoration: "none" }}>
                        {category.name}
                      </Link>
                    </h3>
                    <span style={{ fontSize: 12, color: "var(--okr-dim)" }}>
                      {posts.length} artikel
                    </span>
                  </div>
                  <p style={{ color: "var(--okr-muted)", fontSize: 14, lineHeight: 1.55, margin: "0 0 16px", maxWidth: 720 }}>
                    {category.description}
                  </p>

                  {posts.length === 0 ? (
                    <p style={{ color: "var(--okr-dim)", fontSize: 13, fontStyle: "italic", margin: 0 }}>
                      Belum ada artikel di kategori ini.
                    </p>
                  ) : (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                      {posts.map((p) => (
                        <li key={p.id}>
                          <Link
                            to={`/blog/${p.slug}`}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "baseline",
                              gap: 16,
                              padding: "8px 0",
                              color: "var(--okr-text)",
                              textDecoration: "none",
                              fontSize: 15,
                              lineHeight: 1.45,
                              flexWrap: "wrap",
                            }}
                          >
                            <span style={{ flex: 1, minWidth: 240 }}>{p.title}</span>
                            <span style={{ fontSize: 12, color: "var(--okr-dim)", whiteSpace: "nowrap" }}>
                              {fmtDate(p.published_at)}
                              {p.reading_time ? ` · ${p.reading_time} menit` : ""}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </section>
          </div>
        </section>
    </>
  );
}
