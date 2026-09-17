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
 * `Suspense` wraps the outlet so lazy-loaded route chunks show a subtle
 * loading placeholder instead of a blank flash while the JS is fetched.
 */
function PublicRouteFallback() {
  return (
    <section className="okr__section okr__page-hero">
      <div className="okr__wrap" style={{ color: "var(--okr-muted)" }}>Loading...</div>
    </section>
  );
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
