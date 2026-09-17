import { useParams, Link, Navigate } from "react-router-dom";
import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { useLivePostState, useLivePosts } from "../../hooks/usePageData";
import { RenderTiptap } from "../../components/blog/RenderTiptap";
import { PostShareBar } from "../../components/blog/PostShareBar";
import { NewsletterForm } from "../../components/marketing/NewsletterForm";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { formatPostReadCount, getPostReadCount } from "../../lib/blogMetrics";
import { CATEGORY_BY_SLUG, DEFAULT_CATEGORY_SLUG } from "../../data/blogCategories";
import { getBlogSocialArtworkPath } from "../../data/blogArtwork";
import { SOCIAL_CARD_PATH } from "../../lib/socialMeta";
import "../../styles/blog-home-theme.css";

export function BlogDetailPage() {
  const { lang, t } = useI18n();
  const { slug } = useParams();
  const { value: post, loading } = useLivePostState(slug);
  const allPosts = useLivePosts({ status: "published" });

  if (loading && !post) {
    return (
      <section className="okr__section okr__page-hero okr__blog-detail-page">
          <div className="okr__wrap" style={{ color: "var(--okr-muted)" }}>Loading…</div>
        </section>
    );
  }

  if (!post || post.status !== "published") return <Navigate to="/blog" replace />;

  // Resolve related posts dari slug list (co-citation internal).
  const relatedPosts = (post.related_slugs ?? [])
    .map((s) => allPosts.find((p) => p.slug === s))
    .filter(Boolean);
  const references = post.references ?? [];
  const faqs = Array.isArray(post.faqs) ? post.faqs : [];
  const description = post.meta_description || post.excerpt;
  const seoTitle = post.meta_title || `${post.title} — Blog israanwar`;
  const canonicalPath = post.canonical_path || `/blog/${post.slug}`;
  const readingTime = post.reading_time ?? 1;
  const readCount = getPostReadCount(post);
  const rawCategory = CATEGORY_BY_SLUG[post.category] ?? CATEGORY_BY_SLUG[DEFAULT_CATEGORY_SLUG];
  const postIndex = Math.max(0, allPosts.findIndex((candidate) => candidate.id === post.id));
  const socialImage = post.cover_url || getBlogSocialArtworkPath(postIndex) || SOCIAL_CARD_PATH;

  return (
    <>
      <Seo
        title={seoTitle}
        description={description}
        path={canonicalPath}
        article={{ post, category: rawCategory }}
        socialTitle={post.title}
        socialImage={socialImage}
      />
      <article className="okr__section okr__blog-detail-page" style={{ paddingTop: 100 }}>
          <div className="okr__wrap" style={{ maxWidth: 780 }}>
            <Link to="/blog" className="okr__link" style={{ marginBottom: 24, display: "inline-flex" }}>
              <ArrowLeft size={14} /> {t("blog_back")}
            </Link>
            {post.tags?.length > 0 && (
              <div className="okr__post-tags" style={{ marginTop: 16 }}>{post.tags.join(" · ").toUpperCase()}</div>
            )}
            <AnimatedHeadline
              text={post.title}
              className="okr__h2 okr__detail-title okr__hero-title--stagger"
              highlightLast={1}
              assembleLetters
              style={{ margin: "8px 0 20px" }}
            />
            <p style={{ color: "var(--okr-muted)", fontSize: 15, marginBottom: 32, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span>
                {new Date(post.published_at ?? post.created_at).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </span>
              <span aria-hidden>·</span>
              <span>{t("blog_min_read", { count: readingTime })}</span>
              <span aria-hidden>·</span>
              <span>{t("blog_read_count", { count: formatPostReadCount(readCount, lang) })}</span>
            </p>
            {post.excerpt && (
              <p style={{ color: "var(--okr-text)", fontSize: 20, lineHeight: 1.5, marginBottom: 32 }}>{post.excerpt}</p>
            )}
            <RenderTiptap doc={post.content} />
            <PostShareBar
              post={post}
              canonicalPath={canonicalPath}
              socialImage={socialImage}
              lang={lang}
            />

            <NewsletterForm source="blog" variant="blog" className="okr__reveal" />

            {faqs.length > 0 && (
              <section style={{ marginTop: 56, paddingTop: 32, borderTop: "1px solid var(--okr-border, rgba(255,255,255,0.08))" }}>
                <h3 style={{ fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--okr-muted)", marginBottom: 20 }}>
                  Pertanyaan yang sering muncul
                </h3>
                <div style={{ display: "grid", gap: 12 }}>
                  {faqs.map((faq, i) => (
                    <details
                      key={i}
                      style={{
                        border: "1px solid var(--okr-border, rgba(255,255,255,0.08))",
                        borderRadius: 12,
                        padding: "16px 20px",
                        background: "var(--okr-card-bg, rgba(255,255,255,0.02))",
                      }}
                    >
                      <summary
                        style={{
                          cursor: "pointer",
                          fontSize: 16,
                          fontWeight: 600,
                          lineHeight: 1.45,
                          color: "var(--okr-text)",
                          listStyle: "none",
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 16,
                        }}
                      >
                        <span>{faq.question}</span>
                        <span aria-hidden style={{ color: "var(--okr-muted)", fontSize: 20, lineHeight: 1, flexShrink: 0 }}>+</span>
                      </summary>
                      <p style={{
                        margin: "12px 0 0",
                        color: "var(--okr-muted)",
                        fontSize: 15,
                        lineHeight: 1.6,
                      }}>
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {references.length > 0 && (
              <section style={{ marginTop: 56, paddingTop: 32, borderTop: "1px solid var(--okr-border, rgba(255,255,255,0.08))" }}>
                <h3 style={{ fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--okr-muted)", marginBottom: 16 }}>{t("blog_references")}</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                  {references.map((ref, i) => (
                    <li key={i} style={{ fontSize: 15, lineHeight: 1.55 }}>
                      <a href={ref.url} target="_blank" rel="noreferrer" style={{ color: "var(--okr-text)", textDecoration: "underline" }}>
                        {ref.title}
                      </a>
                      {ref.source && <span style={{ color: "var(--okr-muted)", marginLeft: 8 }}>· {ref.source}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {relatedPosts.length > 0 && (
              <section style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid var(--okr-border, rgba(255,255,255,0.08))" }}>
                <h3 style={{ fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--okr-muted)", marginBottom: 16 }}>{t("blog_related_reading")}</h3>
                <div style={{ display: "grid", gap: 16 }}>
                  {relatedPosts.map((rp) => (
                    <Link key={rp.id} to={`/blog/${rp.slug}`} className="okr__post" style={{ display: "block", padding: "24px 28px", borderRadius: 12, border: "1px solid var(--okr-border, rgba(255,255,255,0.08))", textDecoration: "none" }}>
                      {rp.tags?.length > 0 && (
                        <div className="okr__post-tags" style={{ fontSize: 11 }}>{rp.tags.slice(0, 2).join(" · ").toUpperCase()}</div>
                      )}
                      <h4 style={{ fontSize: 18, fontWeight: 600, margin: "10px 0 8px", lineHeight: 1.35 }}>{rp.title}</h4>
                      {rp.excerpt && (
                        <p style={{ color: "var(--okr-muted)", fontSize: 14, margin: 0, lineHeight: 1.55 }}>{rp.excerpt}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </article>
    </>
  );
}
