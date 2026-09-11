# israanwar.com

Marketing site, blog, store, and a set of browser-based tools for Isra Anwar.

## Stack

- React 19 + Vite 8 (SPA with a custom Node prerender step for static HTML)
- Plain CSS (`src/styles/`), no CSS framework
- Supabase (optional backend — see below)
- A handful of browser-only tools (image conversion, resize, compression, QR
  codes, generators) that run entirely client-side

## Install

```bash
npm install
```

Copy `.env.example` to `.env.local` and fill in Supabase values if you have a
project. Both variables are optional — see **Data layer** below.

## Development

```bash
npm run dev
```

Starts Vite's dev server (`--host 0.0.0.0`) with hot reload.

## Production build

```bash
npm run build
```

Runs `vite build`, then a `postbuild` step (`scripts/prerender.mjs`) that
crawls the app's routes and writes static HTML for each one (SEO/crawlers).
Output goes to `dist/`.

```bash
npm run preview
```

Serves the built `dist/` output locally to sanity-check a production build.

## Data layer

`VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` are optional. When unset,
the app falls back to `src/lib/localStore.js`, a browser-localStorage-backed
mock of the same data/auth API — useful for running the site with zero
backend setup. When set, real Supabase is used instead (see `supabase/` for
schema migrations and edge functions).

## Project structure (short version)

```
src/
  components/   shared UI (layout, blog, store, tools, brand)
  pages/        route-level components (public/, admin/)
  lib/          data layer, i18n helpers, browser-tool clients
  workers/      Web Workers for the image tools (one per tool, isolated)
  styles/       global CSS
  data/         static content/catalog data
scripts/        prerender + sitemap/social-image generation (build-time only)
supabase/       SQL migrations + edge functions (used only if Supabase is configured)
public/         static assets served as-is
```

## Privacy principle (browser-based tools)

The image tools (compressor, resizer, and the format converters) never upload
your files anywhere. Decoding, resizing, and re-encoding all happen inside a
dedicated Web Worker in your own browser tab; the resulting file never leaves
the page except when you choose to download it. There is no server-side
processing and no telemetry attached to these tools.

## License / third-party acknowledgements

This repository's own code has no license file yet (private project). Third-
party packages keep their own licenses — see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
for the ones with runtime code embedded in the built site (image codecs and
resize engine).

---

This is a working application under active development, not a finished or
publicly deployed product — treat anything here as subject to change.
