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

async function mountApp() {
  // The hero relies on exact word wrapping. Waiting for the bundled fonts
  // prevents the fallback face from composing one layout and shifting it
  // immediately before the opening animation begins.
  if (document.fonts?.load) {
    try {
      await Promise.all([
        document.fonts.load('400 1em "Plus Jakarta Sans"'),
        document.fonts.load('600 1em "Plus Jakarta Sans"'),
        document.fonts.load('700 1em "Plus Jakarta Sans"'),
      ]);
    } catch {
      // Continue with the system fallback if a local font asset cannot load.
    }
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
}

mountApp();
