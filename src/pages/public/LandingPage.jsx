import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { useLiveSettings, useLiveHomepage, useLivePosts } from "../../hooks/usePageData";
import { useI18n } from "../../lib/i18n";
import { localizeHomepage, localizeSiteDescription } from "../../lib/pageI18n";
import { useLandingEffects, useProcessScrollStory } from "../../hooks/useLandingEffects";
import { PostCard } from "../../components/blog/PostCard";

const DEFAULT_HERO_SUBTITLES = new Set([
  "web, seo, ai workflow & content strategy for personal brands and businesses.",
  "web, seo, workflow ai, dan strategi konten untuk personal brand dan bisnis.",
  "building smarter digital systems for stronger visibility, efficient operations, and sustainable business growth.",
  "kami membangun sistem digital yang lebih cerdas untuk memperkuat visibilitas, mengefisienkan operasional, dan mendorong pertumbuhan bisnis berkelanjutan.",
]);

function useHeroSequence(text) {
  const [sequence, setSequence] = useState({ complete: false, typing: false, value: "" });

  useEffect(() => {
    if (!text) {
      setSequence({ complete: true, typing: false, value: "" });
      return undefined;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setSequence({ complete: true, typing: false, value: text });
      return undefined;
    }

    let index = 0;
    let timer = 0;
    let cancelled = false;
    const glyphs = Array.from(text);

    setSequence({ complete: false, typing: false, value: "" });

    const typeNext = () => {
      if (cancelled) return;
      index += 1;
      const value = glyphs.slice(0, index).join("");
      const complete = index >= glyphs.length;
      setSequence({ complete, typing: !complete, value });

      if (complete) return;

      const current = glyphs[index - 1];
      const humanRhythm = [28, 42, 34, 55, 31, 47, 36];
      const delay = current === ","
        ? 180
        : current === "."
          ? 260
          : current === " "
            ? 22
            : humanRhythm[(index - 1) % humanRhythm.length];
      timer = window.setTimeout(typeNext, delay);
    };

    timer = window.setTimeout(() => {
      setSequence((current) => ({ ...current, typing: true }));
      typeNext();
    }, 3350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [text]);

  return sequence;
}

function isDefaultHeroSubtitle(value) {
  return DEFAULT_HERO_SUBTITLES.has(String(value ?? "").trim().toLowerCase());
}

function ScrollRevealTitle({ text }) {
  const words = String(text ?? "").trim().split(/\s+/).filter(Boolean);

  return (
    <h2 className="okr__h2 okr__process-scroll-title" aria-label={text}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="okr__scroll-word"
          style={{ "--word-index": index }}
          aria-hidden="true"
        >
          {word}{index < words.length - 1 ? " " : ""}
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
  const posts = useLivePosts({ status: "published" }).slice(0, 6);

  const hero = sections.hero ?? {};
  const heroLeadWordCount = String(hero.title_line1 || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const siteDescription = localizeSiteDescription(settings.description, lang, settings.description_id);
  const heroSubtitle = !hero.subtitle || isDefaultHeroSubtitle(hero.subtitle)
    ? siteDescription
    : hero.subtitle;
  const heroSequence = useHeroSequence(heroSubtitle);
  const cta = sections.cta ?? {};
  const process = sections.process ?? { title: "", items: [] };
  const services = sections.services ?? { items: [] };
  const cases = sections.cases ?? { title: t("section_cases_title"), items: [] };
  const processItems = process.items ?? [];
  const processSectionRef = useRef(null);
  const [selectedProcessIndex, setSelectedProcessIndex] = useState(0);
  const activeProcessIndex = Number.isInteger(selectedProcessIndex) && selectedProcessIndex >= 0
    ? Math.min(selectedProcessIndex, Math.max(processItems.length - 1, 0))
    : -1;
  // Section reveals now run entirely through CSS `animation-timeline: view()`
  // (see `.okr__reveal` in landing.css) — no IntersectionObserver, no
  // classList mutation, no React re-render conflicts. This hook only keeps the
  // pointer spotlight alive; scroll progress is native CSS.
  useLandingEffects(null);
  useProcessScrollStory(processSectionRef, processItems.length, setSelectedProcessIndex);

  function moveToProcessStage(index) {
    setSelectedProcessIndex(index);
    const section = processSectionRef.current;
    const desktop = window.matchMedia("(min-width: 901px) and (min-height: 700px)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!section || !desktop || reduce || processItems.length < 2) return;

    const travel = Math.max(section.offsetHeight - window.innerHeight, 0);
    const target = section.offsetTop + (travel * index) / (processItems.length - 1);
    window.scrollTo({ top: target, behavior: "smooth" });
  }

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
          <section className="okr__hero">
            <div className="okr__hero-opening-curtain" aria-hidden="true">
              <span><b>IA</b> / DIGITAL SYSTEMS</span>
            </div>
            <div className="okr__wrap">
              {hero.kicker && (
                <span className="okr__kicker okr__hero-kicker">{hero.kicker}</span>
              )}
              <AnimatedHeadline
                text={[hero.title_line1, hero.title_line2].filter(Boolean).join(" ")}
                className="okr__hero-title okr__hero-title--stagger"
                highlightFrom={heroLeadWordCount}
                assembleLetters
              />
              {heroSubtitle && (
                <p className="okr__hero-sub okr__hero-sub--typed" aria-label={heroSubtitle}>
                  <span className="okr__hero-sub-measure" aria-hidden="true">{heroSubtitle}</span>
                  <span className="okr__hero-sub-output" aria-hidden="true">
                    {heroSequence.value}
                    <i className={heroSequence.typing ? "is-typing" : ""} />
                  </span>
                </p>
              )}
              <div className={`okr__hero-cta okr__hero-cta--sequenced${heroSequence.complete ? " is-ready" : ""}`}>
                <Link
                  className="okr__btn okr__btn--primary okr__btn--tactile"
                  to="/services"
                  aria-hidden={!heroSequence.complete}
                  tabIndex={heroSequence.complete ? undefined : -1}
                >
                  {hero.cta_secondary_label || t("hero_cta_secondary")}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </section>

          {services.items?.length > 0 && (
            <section className="okr__section" id="services">
              <div className="okr__wrap">
                <div className="okr__section-topbar okr__reveal">
                  <div className="okr__section-head">
                    <span className="okr__eyebrow">{t("section_services")}</span>
                    <h2 className="okr__h2">{t("section_services_head")}<br />{t("section_services_head_2")}</h2>
                  </div>
                </div>
                <div className="okr__cards okr__cards--services">
                  {services.items.map((s, i) => (
                    <article
                      key={i}
                      className="okr__card okr__service-card okr__spotlight okr__reveal"
                      data-card-index={String(i + 1).padStart(2, "0")}
                      style={{ "--reveal-delay": `${Math.min(i, 5) * 60}ms` }}
                    >
                      <div className="okr__service-card-meta" aria-hidden="true">
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        <span>{t("section_services")}</span>
                      </div>
                      <h3 className="okr__card-title">{s.title}</h3>
                      <p className="okr__card-body">{s.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {processItems.length > 0 && (
            <section
              ref={processSectionRef}
              className="okr__section okr__process-section okr__process-section--story"
              id="about"
              data-active-stage={processItems[activeProcessIndex]?.title || ""}
              style={{ "--process-count": processItems.length }}
            >
              <div className="okr__wrap">
                <div className="okr__process-story-shell">
                  <div className="okr__process-intro">
                    <div>
                      <span className="okr__eyebrow okr__reveal">{t("section_process")}</span>
                      <ScrollRevealTitle text={process.title} />
                    </div>
                    <p className="okr__process-intro-copy">
                      {lang === "id"
                        ? "Proses menyeluruh yang mengubah ide menjadi hasil nyata."
                        : "A clear, end-to-end process to turn ideas into real outcomes."}
                    </p>
                  </div>
                  <div className="okr__stage-theatre">
                    <nav className="okr__stage-nav" aria-label={t("section_process")}>
                    {processItems.map((s, i) => (
                      <button
                        key={s.title}
                        type="button"
                        className={`okr__stage-nav-item${i === activeProcessIndex ? " is-active" : ""}`}
                        style={{ "--stage-index": i }}
                        onMouseEnter={() => {
                          if (!window.matchMedia("(max-width: 900px)").matches) setSelectedProcessIndex(i);
                        }}
                        onFocus={() => setSelectedProcessIndex(i)}
                        onClick={() => moveToProcessStage(i)}
                        aria-pressed={i === activeProcessIndex}
                        aria-controls={`okr-stage-${i}`}
                      >
                        <span>{s.title}</span>
                        <small>{s.body}</small>
                      </button>
                    ))}
                    </nav>
                    <div className="okr__stage-viewport" role="region" aria-live="polite">
                      {processItems.map((stage, i) => (
                        <article
                          key={stage.title}
                          className={`okr__stage-scene${stage.title.length > 10 ? " has-long-title" : stage.title.length > 7 ? " has-medium-title" : ""}${i === activeProcessIndex ? " is-active" : ""}`}
                          id={`okr-stage-${i}`}
                          data-stage-name={stage.title}
                          aria-hidden={i !== activeProcessIndex}
                        >
                          <div className="okr__stage-copy">
                            <span className="okr__stage-kicker">{t("process_detail_label")}</span>
                            <h3>{stage.title}</h3>
                            <p>{stage.detail || stage.body}</p>
                          </div>
                          {stage.points?.length > 0 && (
                            <div className="okr__stage-points">
                              <span>{t("process_points_label")}</span>
                              <ul>
                                {stage.points.map((point, pointIndex) => (
                                  <li key={point} style={{ "--point-index": pointIndex }}>{point}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {posts.length > 0 && (
            <section className="okr__section okr__journal-section" id="journal">
              <div className="okr__wrap">
                <div className="okr__section-topbar okr__reveal">
                  <div className="okr__section-head">
                    <span className="okr__eyebrow">{t("section_journal")}</span>
                    <h2 className="okr__h2">{t("section_journal_title")}</h2>
                  </div>
                  <Link className="okr__link okr__link--glass" to="/blog">
                    {t("section_journal_all")} <ArrowRight size={15} />
                  </Link>
                </div>
                <div className="okr__journal okr__journal--editorial okr__blog-grid--editorial">
                  {posts.map((p, i) => (
                    <PostCard key={p.id} post={p} index={i} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {cases.items?.length > 0 && (
            <section className="okr__section">
              <div className="okr__wrap">
                <h2 className="okr__h2 okr__reveal">{cases.title}</h2>
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

          <section className="okr__wrap" id="contact">
            <div className="okr__cta okr__reveal">
              <h3>{cta.title}</h3>
              <p>{cta.subtitle}</p>
            </div>
          </section>
      </div>
    </>
  );
}
