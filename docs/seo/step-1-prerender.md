# Step 1 — application HTML prerender

Status: local build, HTML/client parity, and mobile/desktop regression checks
passed; locked as local baseline by user approval to proceed to Step 2. No deployment.

The route generator now renders the built React application in Chromium and
replaces its provisional HTML only after every public route succeeds. Titles,
metadata, JSON-LD, headings, service descriptions, and locked prices therefore
come from the same components and data used by visitors. Browser contexts start
with empty visitor state and the site's default language. No pricing or design
source is changed. The client uses createRoot, not hydrateRoot.

## Build prerequisites

- Install dev dependencies, including `@playwright/test`.
- Install a supported Chromium runtime: `npx playwright install chromium`.
- Linux runners may need system browser dependencies:
  `npx playwright install --with-deps chromium` on runners with apt permission.
- Provide the same public Supabase environment variables as the deployed app.
- Run `npm run build` and then `node tests/prerender-parity.mjs`.

A missing browser, route failure, or client runtime error fails the build. Do
not deploy a failed build or silently fall back to the old content templates.

The snapshot reflects data at build time. Subsequent admin content changes need
a rebuild to update the HTML, while client-side live data continues to refresh.

Language strategy, schema semantics, domain redirects, and HTTP 404 handling
remain separate steps. Matching the current app does not resolve these issues.

## Verification result

- Build captured 343 public pages, including 140 individual services and 121
  store products available from the configured data source.
- All 343 HTML documents contain the application snapshot, H1, and client entry.
- Eight representative routes matched title, description, canonical, and H1
  between JavaScript-disabled HTML and the running app.
- Complete visible text on Services/category/detail matched; locked Landing
  Page price Rp200.000 is present in HTML.
- 390px and 1440px: no-JS price visible, no horizontal overflow, category and
  child navigation working with JavaScript.
- Five existing rate-card tests passed.

Search Console's “Page with redirect” notice is a separate investigation.
An intentional old-article redirect was checked as 308 -> 200 and absent from
the sitemap; affected URLs from the report are still needed to diagnose it.
