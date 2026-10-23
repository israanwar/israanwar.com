import { CertificationsStrip } from "../../components/marketing/CertificationsStrip";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { useLiveSettings, useLiveHomepage, useLivePosts, useLivePage, useLiveServices } from "../../hooks/usePageData";
import { useI18n } from "../../lib/i18n";
import { localizeHomepage, localizePage, localizeSiteDescription } from "../../lib/pageI18n";
import { localizeServiceCardItems } from "../../lib/serviceI18n";
import { useLandingEffects } from "../../hooks/useLandingEffects";
import { BlogPinCard } from "../../components/blog/BlogPinCard";
import { SunBackground } from "../../components/hero/SunBackground";
import { ProcessTimeline } from "../../components/marketing/ProcessTimeline";
import { ServiceFolderGrid } from "../../components/marketing/ServiceFolderGrid";
import { ServicesKineticGrid } from "../../components/marketing/ServicesKineticGrid";
import "../../styles/service-folder-grid.css";

// Wraps each non-space character in its own span so hover (desktop) / tap
// (mobile, via :active — no touch JS needed) can pop just that one letter.
// Letters are grouped per word (word wrapper gets white-space: nowrap) so
// the browser can still only wrap the text at real word boundaries — flat
// letter-by-letter spans with no word grouping let the browser insert line
// breaks mid-word (e.g. "syst" / "ems"), which this avoids.
function renderTouchLetters(text, keyPrefix) {
  return String(text ?? "").split(/(\s+)/).map((chunk, wi) => {
    if (chunk === "" || /^\s+$/.test(chunk)) return chunk;
    return (
      <span className="okr__word-touch" key={`${keyPrefix}-w${wi}`}>
        {Array.from(chunk).map((ch, ci) => (
          <span className="okr__letter-touch" key={`${keyPrefix}-w${wi}-${ci}`}>{ch}</span>
        ))}
      </span>
    );
  });
}

function ScrollRevealTitle({ text }) {
  const words = String(text ?? "").trim().split(/\s+/).filter(Boolean);

  return (
    <h2 className="okr__h2 okr__process-scroll-title" aria-label={text}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          // Last word carries the same lavender accent every other heading's
          // tail portion gets (AnimatedHeadline's `is-grad`) — this title
          // has its own dedicated scroll-ink color animation instead of
          // AnimatedHeadline, so it needs its own highlight class rather
          // than reusing `.okr__word.is-grad` directly.
          className={`okr__scroll-word${index === words.length - 1 ? " is-highlight" : ""}`}
          style={{ "--word-index": index }}
          aria-hidden="true"
        >
          {/* Letters get the same hover/tap touch effect as elsewhere
              (.okr__letter-touch) — this is purely additive, the outer
              word span (and its --word-index) still drives the existing
              scroll-scrubbed reveal untouched. */}
          {Array.from(word).map((glyph, glyphIndex) => (
            <span className="okr__letter-touch" key={`${index}-${glyphIndex}`}>{glyph}</span>
          ))}
          {index < words.length - 1 ? " " : ""}
        </span>
      ))}
    </h2>
  );
}

export function LandingPage() {
  const { lang, t } = useI18n();
  const settings = useLiveSettings();
  const rawSections = useLiveHomepage();
  const sections = localizeHomepage(rawSections, lang);
  const posts = useLivePosts({ status: "published", limit: 6, view: "home" }).slice(0, 6);
  const rawPortfolio = useLivePage("portfolio");
  const portfolio = useMemo(() => localizePage(rawPortfolio, lang), [rawPortfolio, lang]);
  // The folder catalog uses six explicitly curated categories, while its
  // preview cards keep the real child-service routes from the shared catalog.
  const rawServiceItems = useLiveServices({ status: "active", view: "folder" });
  const serviceItems = useMemo(
    () => localizeServiceCardItems(rawServiceItems, lang),
    [rawServiceItems, lang],
  );

  const hero = sections.hero ?? {};
  const heroTitle = [hero.title_line1, hero.title_line2].filter(Boolean).join(" ");
  const cta = sections.cta ?? {};
  const whatsappHref = /^https:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(settings.whatsapp_url ?? "")
    ? settings.whatsapp_url
    : null;
  const process = sections.process ?? { title: "", items: [] };
  const cases = sections.cases ?? { title: t("section_cases_title"), items: [] };
  const processItems = process.items ?? [];
  const [heroSceneReady, setHeroSceneReady] = useState(false);
  // Section reveals now run entirely through CSS `animation-timeline: view()`
  // (see `.okr__reveal` in landing.css) — no IntersectionObserver, no
  // classList mutation, no React re-render conflicts. This hook only keeps the
  // pointer spotlight alive; scroll progress is native CSS.
  useLandingEffects(null);

  return (
    <>
      <Seo
        title={settings.seo_default_title || settings.site_name || "israanwar"}
        description={localizeSiteDescription(
          settings.seo_default_description || settings.description,
          lang,
          settings.seo_default_description_id || settings.description_id,
        )}
      />
      {/* A compact, native scroll-progress indicator is shown on mobile only. */}
      <span className="okr__scroll-progress" aria-hidden="true" />
    <div className="okr__home">
          <section
            className={`okr__hero okr__hero--pointcloud${heroSceneReady ? " is-scene-ready" : ""}`}
            aria-busy={!heroSceneReady}
          >
            <SunBackground onReady={setHeroSceneReady} />
            <div className="okr__hero-pointcloud-copy">
              {hero.kicker && (
                <p className="okr__hero-pointcloud-kicker">
                  <span className="okr__visually-hidden">{hero.kicker}</span>
                  <span aria-hidden="true">{renderTouchLetters(hero.kicker, "hero-kicker")}</span>
                </p>
              )}
              {heroTitle && (
                <h1 className="okr__hero-pointcloud-title" aria-label={heroTitle}>
                  <span aria-hidden="true">
                    {hero.title_line1 && renderTouchLetters(hero.title_line1, "hero-title-1")}
                    {hero.title_line1 && hero.title_line2 ? " " : ""}
                    {hero.title_line2 && (
                      <span className="okr__hero-pointcloud-title-accent">
                        {renderTouchLetters(hero.title_line2, "hero-title-2")}
                      </span>
                    )}
                  </span>
                </h1>
              )}
              {hero.subtitle && (
                <p className="okr__hero-pointcloud-subtitle">
                  <span className="okr__visually-hidden">{hero.subtitle}</span>
                  <span aria-hidden="true">{renderTouchLetters(hero.subtitle, "hero-subtitle")}</span>
                </p>
              )}
              <div className="okr__hero-pointcloud-actions">
                <Link className="okr__hero-pointcloud-cta" to="/services">
                  <span className="okr__hero-pointcloud-cta-fill" aria-hidden="true" />
                  <span className="okr__hero-pointcloud-cta-label">
                    {hero.cta_secondary_label || t("hero_cta_secondary")}
                  </span>
                </Link>
              </div>
            </div>
            {false && (
              <a className="okr__hero-pointcloud-scroll" href="#services">
                <span>Scroll &amp; explore</span>
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            )}
          </section>

          {serviceItems.length > 0 && (
            <>
              <ServicesKineticGrid scope="page" />
              <section className="okr__section okr__services-section" id="services">
                <div className="okr__wrap">
                  <ServiceFolderGrid items={serviceItems} lang={lang} />
                </div>
              </section>
            </>
          )}

          {processItems.length > 0 && (
            <section
              className="okr__section okr__process-section okr__process-section--timeline"
              id="about"
            >
              <div className="okr__wrap">
                <div className="process-timeline-intro">
                  <div>
                    <span className="okr__eyebrow">{t("section_process")}</span>
                    <h2 className="process-timeline-title" aria-label={lang === "id" ? "Cara kami bekerja." : "How we work."}>
                      <span aria-hidden="true">{renderTouchLetters(lang === "id" ? "Cara kami" : "How we", "process-title-lead")}</span>{" "}
                      <em aria-hidden="true">{renderTouchLetters(lang === "id" ? "bekerja." : "work.", "process-title-accent")}</em>
                    </h2>
                  </div>
                  <p>{lang === "id" ? "Lima tahap yang jelas, dari brief awal hingga perbaikan berkelanjutan." : "Five clear stages, from your first brief to continuous improvement."}</p>
                </div>
                <ProcessTimeline items={processItems} lang={lang} />
              </div>
            </section>
          )}

          {posts.length > 0 && (
            <section className="okr__section okr__journal-section" id="journal">
              <div className="okr__wrap">
                <div className="okr__section-topbar okr__reveal">
                  <div className="okr__section-head">
                    <span className="okr__eyebrow">{t("section_journal")}</span>
                    <AnimatedHeadline
                      as="h2"
                      text={t("section_journal_title")}
                      className="okr__h2 okr__hero-title--stagger"
                      assembleLetters
                    />
                  </div>
                  <Link className="okr__link okr__link--glass" to="/blog">
                    {t("section_journal_all")} <ArrowRight size={15} />
                  </Link>
                </div>
                <div className="okr__blog-pin-grid">
                  {posts.map((p, i) => (
                    <BlogPinCard key={p.id} post={p} index={i} lang={lang} t={t} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {cases.items?.length > 0 && (
            <section className="okr__section">
              <div className="okr__wrap">
                <AnimatedHeadline
                  as="h2"
                  text={cases.title}
                  className="okr__h2 okr__reveal okr__hero-title--stagger"
                  assembleLetters
                />
                <div className="okr__cases">
                  {cases.items.map((c, i) => (
                    <article
                      key={i}
                      className="okr__case okr__spotlight okr__reveal"
                      style={{ "--reveal-delay": `${Math.min(i, 5) * 60}ms` }}
                    >
                      {c.img && <div className="okr__case-img" style={{ backgroundImage: `url("${c.img}")` }} />}
                      <div className="okr__case-body">
                        <div className="okr__case-tags">{c.tags}</div>
                        <h3 className="okr__case-title">{c.title}</h3>
                        <p>{c.body}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {portfolio.certifications?.length > 0 && (
            <section className="okr__section okr__certs-section" id="certifications">
              <div className="okr__wrap">
                <div className="okr__section-topbar okr__reveal">
                  <div className="okr__section-head">
                    <AnimatedHeadline
                      as="h2"
                      text={t("section_certs_head")}
                      /* `okr__hero-title--stagger` is what the assemble-letters
                         glyph-scatter CSS (light-theme.css) is scoped to — it's
                         just an animation-enabling flag (no sizing of its own),
                         reused here to get the exact same letter-assemble
                         effect as the hero title, not a hero-specific look. */
                      className="okr__h2 okr__hero-title--stagger"
                      assembleLetters
                    />
                  </div>
                </div>
                <CertificationsStrip providers={portfolio.certifications} t={t} />
              </div>
            </section>
          )}

          {(cta.title || cta.subtitle || cta.button_label) && (
            <section className="okr__section okr__home-contact-section">
              <div className="okr__wrap">
                <div className="okr__home-contact">
                  <span className="okr__home-contact-eyebrow">{t("home_contact_eyebrow")}</span>
                  {cta.title && <h2>{cta.title}</h2>}
                  {cta.subtitle && <p>{cta.subtitle}</p>}
                  {cta.button_label && (whatsappHref
                    ? <a className="okr__btn okr__btn--primary" href={whatsappHref} target="_blank" rel="noopener noreferrer">{cta.button_label} <ArrowRight size={16} /></a>
                    : <Link className="okr__btn okr__btn--primary" to="/contact">{cta.button_label} <ArrowRight size={16} /></Link>
                  )}
                </div>
              </div>
            </section>
          )}

      </div>
    </>
  );
}
