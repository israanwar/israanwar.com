import { useLayoutEffect, useRef } from "react";
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

  const initialNavigation = useRef({ pathname, hash, key });

  useLayoutEffect(() => {
    const initial = initialNavigation.current;
    const isInitial = pathname === initial.pathname && hash === initial.hash && key === initial.key;
    if (isInitial && window.__ISRA_INITIAL_SCROLL_RELEASED__) return;
    const targetId = hash ? decodeURIComponent(hash.slice(1)) : null;
    let live = true;
    let frame = 0;
    let timer = 0;
    let observer = null;

    const release = () => {
      live = false;
      observer?.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("scroll", onUnexpectedScroll);
      INTENT_EVENTS.forEach((type) => window.removeEventListener(type, release));
    };
    const apply = () => {
      if (!live) return false;
      if (targetId) {
        const target = document.getElementById(targetId);
        if (!target) return false;
        target.scrollIntoView({ block: "start", behavior: "auto" });
        return true;
      }
      if (window.scrollX !== 0 || window.scrollY !== 0) {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
      return false;
    };
    const onPageShow = () => { if (live && apply()) release(); };
    const onUnexpectedScroll = () => { if (live && apply()) release(); };

    // The head script guards initial restoration before React loads. For SPA
    // navigation reset once; native scroll events catch later restoration or
    // anchoring without polling layout on every frame.
    if (targetId) {
      if (apply()) return release;
      const maintainHash = () => {
        if (!live) return;
        if (apply()) return release();
        frame = requestAnimationFrame(maintainHash);
      };
      frame = requestAnimationFrame(maintainHash);
      observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onPageShow);
      observer?.observe(document.documentElement);
    } else if (!isInitial) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    timer = window.setTimeout(release, 8000);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("scroll", onUnexpectedScroll, { passive: true });
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
