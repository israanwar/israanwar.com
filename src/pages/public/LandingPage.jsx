import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, ExternalLink, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { useLiveSettings, useLiveHomepage, useLivePosts, useLivePage, useLiveServices } from "../../hooks/usePageData";
import { useI18n } from "../../lib/i18n";
import { localizeHomepage, localizePage, localizeSiteDescription } from "../../lib/pageI18n";
import { localizeServiceCardItems } from "../../lib/serviceI18n";
import { useLandingEffects, useProcessScrollStory } from "../../hooks/useLandingEffects";
import { BlogPinCard } from "../../components/blog/BlogPinCard";
import { SunBackground } from "../../components/hero/SunBackground";
import "../../styles/home-services-motion.css";

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
          // Last word carries the same orange accent every other heading's
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

// Slow, continuous px/ms drift for the auto-scrolling credential carousel —
// deliberately gentle ("bergerak otomatis perlahan"), same speed on every
// device (mobile just also gets scroll-snap + native touch momentum).
const CERTSTRIP_SPEED = 0.055;

// Issuer cards show only the brand logo — click opens a modal listing that
// issuer's certificates. Only real certification issuers belong here —
// `providers` is `portfolio.certifications`, already exactly that list.
function CertificationsStrip({ providers, t }) {
  const [activeSlug, setActiveSlug] = useState(null);
  const trackRef = useRef(null);
  const dragRef = useRef({ dragging: false, startX: 0, startScroll: 0, moved: false });
  // Refs, not state: read every animation frame, so they must never trigger
  // a re-render on their own — hovering/dragging updates them directly.
  const hoveringRef = useRef(false);
  const interactingRef = useRef(false);
  const pausedRef = useRef(false);
  // Used only to detect when a real touch-driven native scroll has gone
  // idle after a `pointercancel` (see onPointerUpOrCancel below).
  const scrollIdleTimeoutRef = useRef(null);
  const scrollIdleListenerRef = useRef(null);

  const active = providers?.find((p) => p.slug === activeSlug) || null;
  const loopedProviders = providers?.length ? [...providers, ...providers] : [];

  function syncPaused() {
    pausedRef.current = hoveringRef.current || interactingRef.current;
  }

  // The auto-scroll loop itself. Runs once per mount; reads live refs each
  // frame rather than closing over state, so hover/drag never need to
  // restart the effect. Duplicating the provider list once and wrapping
  // scrollLeft past the halfway point is what makes the loop seamless.
  //
  // `pos` is a plain JS float, not `track.scrollLeft` read back each frame
  // — the browser rounds scrollLeft to whole device pixels, so at this
  // speed (a fraction of a px per frame) reading it back as the basis for
  // the next increment loses that fraction every single frame and the
  // strip never moves at all. Keeping the "true" position in `pos` and
  // only writing it out fixes that; resyncing `pos` from the DOM while
  // paused means resuming continues from wherever a manual drag left it.
  useEffect(() => {
    if (!providers?.length) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    let rafId;
    let last = performance.now();
    let pos = trackRef.current ? trackRef.current.scrollLeft : 0;
    function step(now) {
      const dt = now - last;
      last = now;
      const track = trackRef.current;
      if (!track) {
        rafId = requestAnimationFrame(step);
        return;
      }
      if (pausedRef.current) {
        pos = track.scrollLeft;
      } else {
        const half = track.scrollWidth / 2;
        if (half > 0) {
          pos += CERTSTRIP_SPEED * dt;
          if (pos >= half) pos -= half;
          track.scrollLeft = pos;
        }
      }
      rafId = requestAnimationFrame(step);
    }
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [providers]);

  // Defensive cleanup only — the drag listeners below are normally removed
  // in onWindowPointerUp the instant the mouse is released.
  useEffect(() => () => {
    window.removeEventListener("pointermove", onWindowPointerMove);
    window.removeEventListener("pointerup", onWindowPointerUp);
    clearScrollIdleWatch();
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    function onKeyDown(e) {
      if (e.key === "Escape") setActiveSlug(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active]);

  if (!providers?.length) return null;

  // Touch devices routinely fire a synthetic "mouseenter" right after a
  // tap/swipe with no matching "mouseleave" afterwards (a long-standing
  // mobile-browser quirk) — left unguarded, that would latch
  // hoveringRef true forever and permanently freeze the auto-scroll the
  // very first time a finger passes over the strip. Gating on
  // `(hover: hover)` restricts this pause path to devices that can
  // actually hover with a mouse; touch keeps working through
  // interactingRef (set from real pointer/touch events) instead.
  function handleMouseEnter() {
    if (!window.matchMedia("(hover: hover)").matches) return;
    hoveringRef.current = true;
    syncPaused();
  }
  function handleMouseLeave() {
    if (!window.matchMedia("(hover: hover)").matches) return;
    hoveringRef.current = false;
    syncPaused();
  }
  // Any pointer going down — mouse or touch — pauses the auto-scroll for
  // as long as the user is actually interacting with the strip.
  function onPointerDown(e) {
    interactingRef.current = true;
    syncPaused();
    if (e.pointerType !== "mouse" || !trackRef.current) return;
    // Native touch/pen scrolling already works on an overflow-x:auto strip
    // — this only adds click-and-drag for mouse users, who have no native
    // way to drag-scroll. `moved` suppresses the click-to-open-modal that
    // would otherwise fire right after a drag release. Deliberately NOT
    // using setPointerCapture: capturing the pointer on the track
    // redirects every subsequent pointerup (and the click the browser
    // synthesizes from it) to the track itself instead of the card
    // underneath the cursor — so a plain, no-drag click would never reach
    // the card's onClick at all. window-level listeners (added only while
    // a drag is in progress) keep the drag responsive even if the cursor
    // leaves the strip's bounds mid-gesture, without that side effect.
    dragRef.current = { dragging: true, startX: e.clientX, startScroll: trackRef.current.scrollLeft, moved: false };
    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerUp);
  }
  function clearScrollIdleWatch() {
    const track = trackRef.current;
    if (track && scrollIdleListenerRef.current) {
      track.removeEventListener("scroll", scrollIdleListenerRef.current);
    }
    scrollIdleListenerRef.current = null;
    if (scrollIdleTimeoutRef.current) {
      clearTimeout(scrollIdleTimeoutRef.current);
      scrollIdleTimeoutRef.current = null;
    }
  }
  // A real finger-driven swipe on a touch device fires `pointercancel`,
  // not `pointerup` — the browser cancels the pointer the moment it
  // decides the gesture is native scrolling, i.e. right as the swipe
  // *starts*, not when it ends. Resuming the auto-scroll loop right there
  // (as a plain pointerup/pointercancel handler would) means the RAF loop
  // starts overwriting scrollLeft again while the user is still actively
  // dragging — fighting the swipe in real time and making the strip feel
  // impossible to drag. Instead, stay paused and watch the track's own
  // `scroll` events go quiet (debounced) before resuming, so the loop
  // only takes back over once the user's swipe/momentum has truly settled.
  function watchForScrollIdle() {
    const track = trackRef.current;
    if (!track) return;
    clearScrollIdleWatch();
    function onScroll() {
      if (scrollIdleTimeoutRef.current) clearTimeout(scrollIdleTimeoutRef.current);
      scrollIdleTimeoutRef.current = setTimeout(() => {
        clearScrollIdleWatch();
        interactingRef.current = false;
        syncPaused();
      }, 150);
    }
    scrollIdleListenerRef.current = onScroll;
    track.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
  // Touch releases end on the track itself (no window listener involved
  // for non-mouse pointers), so this is what un-pauses after a swipe —
  // except pointercancel, which means native scrolling just took over
  // (see watchForScrollIdle above).
  function onPointerUpOrCancel(e) {
    if (e.pointerType === "mouse") return;
    if (e.type === "pointercancel") {
      watchForScrollIdle();
      return;
    }
    interactingRef.current = false;
    syncPaused();
  }
  function onWindowPointerMove(e) {
    const state = dragRef.current;
    if (!state.dragging || !trackRef.current) return;
    const dx = e.clientX - state.startX;
    if (Math.abs(dx) > 4) state.moved = true;
    trackRef.current.scrollLeft = state.startScroll - dx;
  }
  function onWindowPointerUp() {
    dragRef.current.dragging = false;
    interactingRef.current = false;
    syncPaused();
    window.removeEventListener("pointermove", onWindowPointerMove);
    window.removeEventListener("pointerup", onWindowPointerUp);
  }
  function handleCardClick(e, slug) {
    if (dragRef.current.moved) {
      e.preventDefault();
      return;
    }
    setActiveSlug(slug);
  }

  return (
    <>
      <div
        className="okr__certstrip"
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUpOrCancel}
        onPointerCancel={onPointerUpOrCancel}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {loopedProviders.map((provider, i) => (
          <button
            key={`${provider.slug}-${i}`}
            type="button"
            className="okr__certstrip-card"
            onClick={(e) => handleCardClick(e, provider.slug)}
            aria-label={`${provider.name} — ${t("section_certs_view")}`}
            tabIndex={i < providers.length ? 0 : -1}
            aria-hidden={i < providers.length ? undefined : true}
          >
            <span className="okr__certstrip-card-icon">
              <img src={provider.logo} alt="" aria-hidden="true" draggable={false} />
            </span>
            <span className="okr__certstrip-card-name">{provider.name}</span>
          </button>
        ))}
      </div>

      {active && typeof document !== "undefined" && createPortal(
        // Portal straight into <body>: several ancestor sections use
        // `contain: layout paint style`, which turns them into a
        // containing block for position:fixed descendants and would trap
        // a same-tree modal instead of letting it cover the viewport.
        <div className="okr__cert-overlay" onClick={() => setActiveSlug(null)}>
          <div
            className="okr__cert-panel"
            role="dialog"
            aria-modal="true"
            aria-label={active.name}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="okr__cert-panel-close"
              onClick={() => setActiveSlug(null)}
              aria-label={t("portfolio_cert_close")}
            >
              <X size={18} />
            </button>
            <div className="okr__cert-panel-head">
              <img src={active.logo} alt="" aria-hidden="true" className="okr__cert-panel-logo" />
              <div className="okr__cert-panel-headcopy">
                <span className="okr__cert-panel-eyebrow">
                  {t("section_certs_count", { count: active.items.length })}
                </span>
                <h3 className="okr__cert-panel-title">{active.name}</h3>
              </div>
            </div>
            <ul className="okr__cert-panel-list">
              {active.items.map((item) => (
                <li key={item.name}>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <span>{item.name}</span>
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export function LandingPage() {
  const { lang, t } = useI18n();
  const settings = useLiveSettings();
  const rawSections = useLiveHomepage();
  const sections = localizeHomepage(rawSections, lang);
  const posts = useLivePosts({ status: "published" }).slice(0, 6);
  const rawPortfolio = useLivePage("portfolio");
  const portfolio = useMemo(() => localizePage(rawPortfolio, lang), [rawPortfolio, lang]);
  // Real, navigable service categories (same source ServicesPage.jsx uses) —
  // capped at 8 for the homepage row list, per spec ("maksimal 8 service
  // utama jika datanya lebih banyak").
  const rawServiceCategories = useLiveServices({ status: "active" });
  const serviceCategories = useMemo(() => {
    const categories = rawServiceCategories.filter((s) => s.kind === "category");
    return localizeServiceCardItems(categories, lang).slice(0, 8);
  }, [rawServiceCategories, lang]);

  const hero = sections.hero ?? {};
  const heroTitle = [hero.title_line1, hero.title_line2].filter(Boolean).join(" ");
  const cta = sections.cta ?? {};
  const curatedServices = sections.services?.items ?? [];
  const whatsappHref = /^https:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(settings.whatsapp_url ?? "")
    ? settings.whatsapp_url
    : null;
  const process = sections.process ?? { title: "", items: [] };
  const cases = sections.cases ?? { title: t("section_cases_title"), items: [] };
  const processItems = process.items ?? [];
  const processSectionRef = useRef(null);
  const [heroSceneReady, setHeroSceneReady] = useState(false);
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
          <section
            className={`okr__hero okr__hero--pointcloud${heroSceneReady ? " is-scene-ready" : ""}`}
            aria-busy={!heroSceneReady}
          >
            <SunBackground onReady={setHeroSceneReady} />
            <div className="okr__hero-pointcloud-copy">
              {hero.kicker && (
                <p className="okr__hero-pointcloud-kicker" aria-label={hero.kicker}>
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
                <p className="okr__hero-pointcloud-subtitle" aria-label={hero.subtitle}>
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

          {(serviceCategories.length > 0 || curatedServices.length > 0) && (
            <section className="okr__section okr__services-section" id="services">
              <div className="okr__wrap">
                <div className="okr__services-card okr__reveal">
                  <div className="okr__services-top">
                    <span className="okr__services-eyebrow">
                      <span aria-hidden="true">•</span> Our services
                    </span>
                    <h2 className="okr__services-headline" aria-label="Everything your business needs to grow under one roof.">
                      <span aria-hidden="true">
                        {renderTouchLetters("Everything your business needs to grow", "serviceshead1")}
                        <br />
                        {renderTouchLetters("under one roof.", "serviceshead2")}
                      </span>
                    </h2>
                  </div>
                  {serviceCategories.length > 0 && <div className="okr__services-list">
                    {serviceCategories.map((s, i) => (
                      <Link
                        key={s.id}
                        to={`/services/${s.slug}`}
                        className="okr__services-row"
                      >
                        <span className="okr__services-row-index">{String(i + 1).padStart(2, "0")}</span>
                        <span className="okr__services-row-name">{s.name}</span>
                        <span className="okr__services-row-arrow" aria-hidden="true">
                          <ArrowRight className="okr__services-row-arrow-icon okr__services-row-arrow-icon--front" size={18} strokeWidth={1.5} />
                          <ArrowRight className="okr__services-row-arrow-icon okr__services-row-arrow-icon--back" size={18} strokeWidth={1.5} />
                        </span>
                      </Link>
                    ))}
                  </div>}
                  {curatedServices.length > 0 && (
                    <div className="okr__services-highlights">
                      {curatedServices.map((item, index) => (
                        <div className="okr__services-highlight" key={`${item.title}-${index}`}>
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <h3>{item.title}</h3>
                          <p>{item.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <Link to="/services" className="okr__services-all-btn">
                    <span className="okr__services-all-btn-fill" aria-hidden="true" />
                    <span className="okr__services-all-btn-label">All Services</span>
                  </Link>
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
                    <p
                      className="okr__process-intro-copy"
                      aria-label={lang === "id"
                        ? "Proses menyeluruh yang mengubah ide menjadi hasil nyata."
                        : "A clear, end-to-end process to turn ideas into real outcomes."}
                    >
                      <span aria-hidden="true">
                        {lang === "id"
                          ? renderTouchLetters("Proses menyeluruh yang mengubah ide menjadi hasil nyata.", "processsub")
                          : renderTouchLetters("A clear, end-to-end process to turn ideas into real outcomes.", "processsub")}
                      </span>
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
                  <span className="okr__home-contact-eyebrow">LET'S TALK</span>
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
