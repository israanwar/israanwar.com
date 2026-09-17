import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { SiteChrome } from "../components/layout/SiteChrome";
import "../styles/scroll-performance.css";
import "../styles/public-lavender-theme.css";

/**
 * Layout for every public route.
 *
 * Purpose: keep the Isra Anwar public chrome mounted across client-side
 * navigation. Page components only return their content and slot into
 * `<Outlet />`, keeping navigation stable and transitions immediate.
 *
 * `Suspense` wraps the outlet so a lazy-loaded route chunk doesn't unmount
 * the whole layout (header/SiteChrome) while it's fetched — only this
 * fallback shows in the content area below the header.
 *
 * This is the in-flight state for a normal chunk fetch, not a failure, so
 * it must stay visually silent (no "Loading..." text, no reload button) —
 * same reasoning as RouteFallback in AppRoutes.jsx. A genuine chunk-load
 * failure is retried once by importWithRetry (lazyWithRetry.js) and, if
 * still failing, surfaces through RouteErrorBoundary instead of hanging
 * here forever.
 */
function PublicRouteFallback() {
  return <div style={{ minHeight: "60vh" }} aria-hidden="true" />;
}

export function PublicLayout() {
  return (
    <SiteChrome>
      <Suspense fallback={<PublicRouteFallback />}>
        <Outlet />
      </Suspense>
    </SiteChrome>
  );
}
