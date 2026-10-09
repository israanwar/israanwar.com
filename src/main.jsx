import React from "react";
import ReactDOM from "react-dom/client";
import { Application } from "./Application";
import { publicBootstrap } from "./lib/publicBootstrap";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "./styles/brand-fonts.css";
import "./styles/globals.css";

const rootEl = document.getElementById("root");

// Disable native restoration before React starts. Waiting for the component
// tree is too late on a hard reload: the browser can already have restored
// the previous footer position.
if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

// Warm the bundled fonts in parallel with React instead of making the entire
// application wait behind them. The previous await left a black, scrollable
// document in place long enough for browser scroll restoration to become the
// first thing a visitor saw. @fontsource still supplies the same font files;
// this only removes the render-blocking waterfall.
if (!publicBootstrap && document.fonts?.load) {
  void Promise.all([
    document.fonts.load('400 1em "Plus Jakarta Sans"'),
    document.fonts.load('600 1em "Plus Jakarta Sans"'),
    document.fonts.load('700 1em "Plus Jakarta Sans"'),
  ]).catch(() => {
    // Continue with the system fallback if a local font asset cannot load.
  });
}

// The public build emits React server markup and its initial public data.
// Hydrate it in place: never clear readable content while downloading JS.
if (publicBootstrap) {
 ReactDOM.hydrateRoot(rootEl, <Application />, {onRecoverableError(error){console.error("Public hydration:",error);}});
} else {
 ReactDOM.createRoot(rootEl).render(<Application />);
}
