import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { AuthProvider } from "./hooks/useAuth";
import { I18nProvider } from "./lib/i18n";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "./styles/globals.css";

const rootEl = document.getElementById("root");

// Disable native restoration before React starts. Waiting for the component
// tree is too late on a hard reload: the browser can already have restored
// the previous footer position.
if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}
if (window.location.pathname === "/" && !window.location.hash) {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

// Warm the bundled fonts in parallel with React instead of making the entire
// application wait behind them. The previous await left a black, scrollable
// document in place long enough for browser scroll restoration to become the
// first thing a visitor saw. @fontsource still supplies the same font files;
// this only removes the render-blocking waterfall.
if (document.fonts?.load) {
  void Promise.all([
    document.fonts.load('400 1em "Plus Jakarta Sans"'),
    document.fonts.load('600 1em "Plus Jakarta Sans"'),
    document.fonts.load('700 1em "Plus Jakarta Sans"'),
  ]).catch(() => {
    // Continue with the system fallback if a local font asset cannot load.
  });
}

// `dist/*/index.html` contains a hidden no-JS crawler shell. Clear it only
// when the real app is ready to mount so there is never a competing tree.
if (rootEl) rootEl.textContent = "";

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <I18nProvider>
          <App />
        </I18nProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
