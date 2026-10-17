import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, X } from "lucide-react";

// Slow, continuous px/ms drift for the auto-scrolling credential carousel —
// deliberately gentle ("bergerak otomatis perlahan"), same speed on every
// device (mobile just also gets scroll-snap + native touch momentum).
const CERTSTRIP_SPEED = 0.055;

// Issuer cards show only the brand logo — click opens a modal listing that
// issuer's certificates. Only real certification issuers belong here —
// `providers` is `portfolio.certifications`, already exactly that list.
export function CertificationsStrip({ providers, t }) {
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
    const track = trackRef.current;
    let half = track ? track.scrollWidth / 2 : 0;
    // Refresh geometry when its inputs change, rather than forcing a layout
    // read between scroll writes on every animation frame.
    const measure = () => { half = track ? track.scrollWidth / 2 : 0; };
    const sizeObserver = new ResizeObserver(measure);
    if (track) {
      sizeObserver.observe(track);
      for (const child of track.children) sizeObserver.observe(child);
    }
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
        if (half > 0) {
          pos += CERTSTRIP_SPEED * dt;
          if (pos >= half) pos -= half;
          track.scrollLeft = pos;
        }
      }
      rafId = requestAnimationFrame(step);
    }
    rafId = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(rafId); sizeObserver.disconnect(); };
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
              <img src={provider.logo} alt="" aria-hidden="true" draggable={false} loading="lazy" decoding="async" />
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

