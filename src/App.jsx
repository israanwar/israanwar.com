import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { AppRoutes } from "./routes/AppRoutes";

// Any of these means the reader is driving the page now — trackpad, mouse
// wheel, scrollbar drag, keyboard, or touch. Once one lands we stop
// correcting scroll for that navigation.
const INTENT_EVENTS = ["wheel", "touchstart", "pointerdown", "keydown"];

function ScrollToTop() {
  const { pathname, hash, key } = useLocation();

  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    // Both branches below used to fire once, immediately after mount — while
    // the document is still just viewport-height. Routes are lazy chunks and
    // their data lands afterwards, so the real page height only arrives a
    // beat (or several seconds, on a slow connection) later. That left two
    // bugs with one cause: a page that settled at a non-zero offset once it
    // grew had no guard left to pull it back ("loads at the footer"), and a
    // #hash link never found its section because the section didn't exist
    // yet. So the intent is re-applied while the document keeps growing —
    // until it's satisfied, the reader takes over, or the window closes.
    const targetId = hash ? decodeURIComponent(hash.slice(1)) : null;

    let live = true;
    let lastHeight = document.documentElement.scrollHeight;
    // Declared up front so `release` can run on the early path too, before
    // the frame/observer/timer below have been created.
    let frame = 0;
    let timer = 0;
    let observer = null;

    const release = () => {
      live = false;
      observer?.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
      INTENT_EVENTS.forEach((type) => window.removeEventListener(type, release));
    };

    // Returns true once the intent is fully satisfied and we can stand down.
    const apply = () => {
      if (!live) return false;
      if (targetId) {
        const target = document.getElementById(targetId);
        if (!target) return false; // section hasn't rendered yet — keep waiting
        target.scrollIntoView({ block: "start", behavior: "auto" });
        return true;
      }
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      return false; // stay armed: later content can still shift us
    };

    if (apply()) return release;
    frame = requestAnimationFrame(() => {
      if (apply()) release();
    });

    const onGrow = () => {
      if (!live) return;
      const height = document.documentElement.scrollHeight;
      if (height === lastHeight) return;
      lastHeight = height;
      // Only correct a top-pin if something actually moved us; a hash jump
      // re-runs until its target finally exists.
      if (targetId || window.scrollY !== 0) {
        if (apply()) release();
      }
    };

    observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onGrow);
    observer?.observe(document.documentElement);

    // Hard stop, so this can never end up fighting a reader on a long-lived page.
    timer = window.setTimeout(release, 8000);
    INTENT_EVENTS.forEach((type) =>
      window.addEventListener(type, release, { passive: true, once: true }),
    );

    return release;
  }, [pathname, hash, key]);

  return null;
}

export function App() {
  return (
    <div className="app-shell">
      <ScrollToTop />
      <AppRoutes />
    </div>
  );
}
