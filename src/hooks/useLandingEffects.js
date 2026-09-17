import { useEffect } from "react";

// How long a touch-driven feedback state (spotlight glow, letter pop,
// service-row fill, CTA fill) stays visible after the finger lifts or the
// browser cancels the pointer for scrolling. A real tap's pointerdown→
// pointerup window is often shorter than the 180-400ms CSS transitions
// these effects already use, and pointercancel (fired the moment Chrome
// decides the gesture is a scroll, not a tap) used to clear the state
// immediately — so the effect was frequently removed before it had ever
// finished fading in, reading as "barely there" or "not working" on a
// real touchscreen even though the exact same CSS looks fine under mouse
// hover or devtools' synthetic touch emulation. Desktop/mouse is
// untouched: mouse keeps the original immediate clear (hover itself
// already drives the visible state there; this class is redundant for
// mouse, just no longer allowed to *fight* touch's timing).
const TOUCH_LINGER_MS = 220;

// Elements that get the generic tap "pop" (feedback class only — no
// coordinate tracking, unlike the spotlight below). Kept as one delegated
// listener rather than per-node handlers, same reasoning as the spotlight.
const PRESS_FEEDBACK_SELECTOR =
  ".okr__letter-touch, .okr__word-touch, .okr__services-row, .okr__services-all-btn, .okr__hero-pointcloud-cta";
const PRESS_FEEDBACK_CLASS = "okr__touch-active";

/**
 * Landing-page micro-interactions. Kept as a single hook so we set up (and
 * tear down) one delegated pointer listener regardless of how many cards live
 * on the page.
 *
 * Effects:
 *  1. Touch/pointer spotlight — a delegated pointer listener paints
 *     `--okr-mx / --okr-my` on any `.okr__spotlight` ancestor of the pointer,
 *     so the CSS glow can chase the finger. One handler covers cards, posts,
 *     and process cards without per-node listeners. Mouse behavior (hover
 *     chases the cursor, clears the instant the pointer leaves) is
 *     unchanged; touch gets a lingering release (see TOUCH_LINGER_MS above)
 *     instead of clearing on pointerup/pointercancel.
 *  2. Generic press feedback — the same lingering-release pattern applied
 *     to per-letter touch pop, service rows, and the two CTA fill buttons,
 *     via `.okr__touch-active` alongside their existing `:hover`/`:active`
 *     CSS (added, not replaced — desktop's :hover/:active paths are
 *     untouched).
 *
 * Scroll progress is native CSS now (`animation-timeline: scroll(root)`), so
 * this hook intentionally does not write layout-affecting scroll styles.
 * Every listener here is passive and never calls preventDefault, so native
 * scrolling/swiping is never blocked by either effect.
 *
 * Bails out entirely when `prefers-reduced-motion: reduce` — no pointer
 * chasing. The shell still renders; it just doesn't animate.
 */
export function useLandingEffects(shellRef) {
  useEffect(() => {
    // Same fallback pattern as useScrollReveal — `.okr` is a singleton so
    // we can just find it if the caller didn't pass one in.
    const shell = shellRef?.current ?? document.querySelector(".okr");
    if (!shell) return undefined;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) return undefined;

    // --- Pointer spotlight ---------------------------------------------------
    // We track the nearest `.okr__spotlight` ancestor and paint local coords
    // on it, so the CSS radial-gradient can position itself under the finger.
    let lastTarget = null;
    let spotlightReleaseTimer = 0;
    const cancelSpotlightRelease = () => {
      if (spotlightReleaseTimer) {
        clearTimeout(spotlightReleaseTimer);
        spotlightReleaseTimer = 0;
      }
    };
    const releaseSpotlightNow = () => {
      cancelSpotlightRelease();
      if (lastTarget) {
        lastTarget.classList.remove("is-touched");
        lastTarget = null;
      }
    };
    const onPointerMove = (event) => {
      const target = event.target?.closest?.(".okr__spotlight");
      cancelSpotlightRelease();
      if (!target) {
        releaseSpotlightNow();
        return;
      }
      if (target !== lastTarget) {
        if (lastTarget) lastTarget.classList.remove("is-touched");
        lastTarget = target;
        target.classList.add("is-touched");
      }
      const rect = target.getBoundingClientRect();
      target.style.setProperty("--okr-mx", `${event.clientX - rect.left}px`);
      target.style.setProperty("--okr-my", `${event.clientY - rect.top}px`);
    };
    // Mouse: fade out the instant the button/finger lifts, same as before —
    // :hover already drives visibility for mouse, so this is just tidying
    // the JS class. Touch: the pointer is gone (finger lifted, or Chrome
    // just took the gesture over for scrolling) with no :hover to fall back
    // on, so let the glow actually finish being seen before it clears.
    const onPointerEnd = (event) => {
      if (!lastTarget) return;
      if (event.pointerType === "mouse") {
        releaseSpotlightNow();
        return;
      }
      cancelSpotlightRelease();
      spotlightReleaseTimer = setTimeout(releaseSpotlightNow, TOUCH_LINGER_MS);
    };
    const onPointerLeave = () => releaseSpotlightNow();

    shell.addEventListener("pointermove", onPointerMove, { passive: true });
    shell.addEventListener("pointerdown", onPointerMove, { passive: true });
    shell.addEventListener("pointerup", onPointerEnd, { passive: true });
    shell.addEventListener("pointercancel", onPointerEnd, { passive: true });
    shell.addEventListener("pointerleave", onPointerLeave, { passive: true });

    // --- Generic press feedback (letters, service rows, CTA fills) ---------
    // Touch only — desktop keeps its existing :hover/:active CSS untouched.
    // Adds `.okr__touch-active` on pointerdown, same lingering release as
    // the spotlight above on pointerup/pointercancel.
    let pressedTarget = null;
    let pressReleaseTimer = 0;
    const cancelPressRelease = () => {
      if (pressReleaseTimer) {
        clearTimeout(pressReleaseTimer);
        pressReleaseTimer = 0;
      }
    };
    const releasePressNow = () => {
      cancelPressRelease();
      if (pressedTarget) {
        pressedTarget.classList.remove(PRESS_FEEDBACK_CLASS);
        pressedTarget = null;
      }
    };
    const onPressStart = (event) => {
      if (event.pointerType === "mouse") return;
      const target = event.target?.closest?.(PRESS_FEEDBACK_SELECTOR);
      if (!target) return;
      cancelPressRelease();
      if (pressedTarget && pressedTarget !== target) {
        pressedTarget.classList.remove(PRESS_FEEDBACK_CLASS);
      }
      pressedTarget = target;
      target.classList.add(PRESS_FEEDBACK_CLASS);
    };
    const onPressEnd = (event) => {
      if (event.pointerType === "mouse" || !pressedTarget) return;
      cancelPressRelease();
      pressReleaseTimer = setTimeout(releasePressNow, TOUCH_LINGER_MS);
    };

    shell.addEventListener("pointerdown", onPressStart, { passive: true });
    shell.addEventListener("pointerup", onPressEnd, { passive: true });
    shell.addEventListener("pointercancel", onPressEnd, { passive: true });

    return () => {
      cancelSpotlightRelease();
      cancelPressRelease();
      shell.removeEventListener("pointermove", onPointerMove);
      shell.removeEventListener("pointerdown", onPointerMove);
      shell.removeEventListener("pointerup", onPointerEnd);
      shell.removeEventListener("pointercancel", onPointerEnd);
      shell.removeEventListener("pointerleave", onPointerLeave);
      shell.removeEventListener("pointerdown", onPressStart);
      shell.removeEventListener("pointerup", onPressEnd);
      shell.removeEventListener("pointercancel", onPressEnd);
      if (lastTarget) lastTarget.classList.remove("is-touched");
      if (pressedTarget) pressedTarget.classList.remove(PRESS_FEEDBACK_CLASS);
    };
  }, [shellRef]);
}

/**
 * Track which process card is currently snapped into view on mobile, and
 * report its index via `onChange`. Uses an IntersectionObserver against a
 * scroller ref so it doesn't fire during vertical page scroll. Silently
 * no-ops on desktop widths where the process grid isn't a snap scroller.
 */
export function useSnapActiveIndex(scrollerRef, itemCount, onChange) {
  useEffect(() => {
    const scroller = scrollerRef?.current;
    if (!scroller || itemCount === 0) return undefined;
    if (typeof IntersectionObserver === "undefined") return undefined;

    // Snap scrolling only exists at the mobile breakpoint. On desktop the
    // container is a plain grid and every card is fully "visible" against
    // itself as the observer root — running would clobber the intended
    // default active index. Re-attach when the viewport crosses the boundary.
    const mq = window.matchMedia("(max-width: 720px)");
    let observer = null;

    const attach = () => {
      if (!mq.matches) return;
      const items = Array.from(scroller.querySelectorAll("[data-snap-index]"));
      if (!items.length) return;

      let currentIndex = -1;
      observer = new IntersectionObserver(
        (entries) => {
          // Pick the most-visible entry among those crossing 0.6 visibility.
          let best = null;
          entries.forEach((entry) => {
            if (entry.intersectionRatio > (best?.intersectionRatio ?? 0)) {
              best = entry;
            }
          });
          if (!best || best.intersectionRatio < 0.6) return;
          const idx = Number(best.target.dataset.snapIndex);
          if (Number.isFinite(idx) && idx !== currentIndex) {
            currentIndex = idx;
            onChange(idx);
          }
        },
        { root: scroller, threshold: [0.6, 0.9] },
      );
      items.forEach((n) => observer.observe(n));
    };

    const detach = () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    };

    const onChangeMq = () => {
      detach();
      attach();
    };

    attach();
    mq.addEventListener("change", onChangeMq);

    return () => {
      mq.removeEventListener("change", onChangeMq);
      detach();
    };
  }, [scrollerRef, itemCount, onChange]);
}

/**
 * Turns the desktop Process section into a deterministic scroll story.
 * The section has a fixed authored height; only transforms/opacity and the
 * active index change while scrolling, so swapping copy never shifts layout.
 */
export function useProcessScrollStory(sectionRef, itemCount, onChange) {
  useEffect(() => {
    const section = sectionRef?.current;
    if (!section || itemCount < 2) return undefined;

    const desktop = window.matchMedia("(min-width: 901px) and (min-height: 700px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let lastIndex = -1;

    const update = () => {
      frame = 0;
      if (!desktop.matches || reduce.matches) {
        section.style.setProperty("--process-progress", "0");
        return;
      }

      const rect = section.getBoundingClientRect();
      const travel = Math.max(section.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      const nextIndex = Math.min(itemCount - 1, Math.round(progress * (itemCount - 1)));

      section.style.setProperty("--process-progress", progress.toFixed(4));
      if (nextIndex !== lastIndex) {
        lastIndex = nextIndex;
        onChange(nextIndex);
      }
    };

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const reset = () => {
      lastIndex = -1;
      requestUpdate();
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    desktop.addEventListener("change", reset);
    reduce.addEventListener("change", reset);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      desktop.removeEventListener("change", reset);
      reduce.removeEventListener("change", reset);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [sectionRef, itemCount, onChange]);
}
