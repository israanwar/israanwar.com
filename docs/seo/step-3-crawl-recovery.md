# Crawl recovery, SEO, AEO and GEO — 2026-10-07

## Confirmed production failure before the repair

All 22 renamed article URLs returned HTTP 200 with homepage HTML and its
canonical, without article content or BlogPosting JSON-LD. JavaScript later
rendered the correct article. The sitemap used renamed slugs, while prerender
generated HTML at the original slugs. Unknown URLs also returned homepage HTML
with HTTP 200. Both apex and www domains returned 200.

## Changes

- Sitemap and prerender share publicPostUrls.js for article paths.
- Application snapshots include actual content and metadata. Build verification
  rejects missing sitemap routes, wrong canonicals, public noindex pages, and
  articles without visible content or BlogPosting schema.
- The final sitemap derives from the successful route inventory: 343 pages,
  including 22 articles and 121 active store products. It avoids synthetic daily
  lastmod dates on pages whose content modification time is unknown.
- Dedicated AI bot groups preserve the private-route exclusions. llms.txt
  describes the actual language strategy and provides absolute page links.
- The apex domain redirects to www; trailing slashes normalize to the canonical
  path. The homepage catch-all rewrite is removed. Unknown public URLs use
  Vercel's native 404 and a custom 404.html document.
- Admin and transactional SPA routes use a separate noindex HTML shell and
  X-Robots-Tag. The existing /api/post-views function is preserved.
- The existing single-URL EN/ID toggle is preserved. Indonesian articles declare
  their content language independently of the visitor's navigation preference.
- JSON-LD describes visible article, service and product data. Removed the
  unsupported blog SearchAction, generic Speakable markup, inferred word counts,
  and favicon used as a founder portrait. No ratings or credentials invented;
  service starting prices are not represented as fixed-price offers.

## Validation

- Builds passed for the current workspace and an isolated release built from
  production commit da75438 plus the SEO changes only. The final isolated build
  uses the baseline dependency lock (including TipTap 3.29.2) plus Playwright as
  a build/test dependency, preserving unrelated dependency work in the workspace.
- Each build verified all 343 HTML pages and all 343 sitemap URLs.
- Prerender parity covered eight representative pages plus all 22 articles,
  comparing initial HTML with the browser's rendered metadata and headings.
- EN/ID preference, reload, article language and navigation passed at 390/1440px.
- 12 focused tests passed, including schema, redirect contracts, bot exclusions,
  the existing SEO audit and locked rate-card behavior.
- Preview and production browser checks passed at 390px and 1440px: article
  responses, language switching/reload, service and product schema, visible
  prices, no-JS content, overflow, redirects, 404 and private-route noindex.
- All 343 production sitemap URLs were fetched sequentially at a bounded rate:
  343 HTTP 200, matching canonicals and H1s, no noindex, valid JSON-LD, zero
  failures. All 121 store pages included Product schema.
- Production apex /services redirects 308 to www; missing public paths return
  HTTP 404. The existing API returns its expected 400 for a missing slug.
- Requests simulating Googlebot and OAI-SearchBot both returned HTTP 200 for an
  article. These are user-agent simulations, not proof of actual crawler IPs.

## Production release evidence

- Ready deployment: dpl_5BbsaBpHonoJ2EHMsn4MrQF7RRzh
- Deployment URL: https://israanwar-7wifcvqcg-israanwar.vercel.app
- Verified custom domains: israanwar.com and www.israanwar.com
- Public artifact SHA1: a41a870269fbc98932f3317d36a3492ed5d9b63f
- Preview access used a temporary deployment-scoped share link, revoked after
  verification. Deployment protection remains enabled for non-custom domains.
- Source changes were not committed or pushed. A scoped seo-source.patch was
  prepared in the isolated release directory and checked against a fresh copy
  of da75438. It applies cleanly and excludes unrelated work.

## Unverified external state

Search Console was unavailable through the browser tools in this session. No
URL Inspection, sitemap resubmission, or indexing request was performed. The
Google-selected canonical, last Google crawl, indexed URL count and AI citations
remain unverified. The independent web extraction tool also could not access
the site, while HTTP and Playwright checks succeeded; its failure did not expose
a diagnostic that establishes a site-side block. The hosting firewall API
returned 404 "Seawall Config not found" rather than an inspectable configuration;
no firewall or global security settings were changed.

## Deployment scope and operating limits

The isolated release excludes unrelated admin, chat, styling, dependency and
editorial work present in the shared workspace. Release artifacts contain the
built public site and the existing API; no .env file or private reference PDFs
are uploaded. Git history and the shared dirty files are preserved.

This is build-time rendering. Public content changes require a fresh build to
update crawler HTML and its sitemap. HTTP checks and user-agent simulations do
not prove Google's actual index state. Google recrawling, selected canonical,
and indexing status must be confirmed in Search Console; indexing and AI
citations are not guaranteed by schema or llms.txt.

## Reference documentation

- https://developers.google.com/search/docs/crawling-indexing/javascript/fix-search-javascript
- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://developers.google.com/search/updates (FAQ rich results deprecated May 2026)
- https://developers.openai.com/api/docs/bots
- https://vercel.com/docs/project-configuration/vercel-json
- https://vercel.com/kb/guide/custom-404-page

## Verification commands

```sh
npm run build
node tests/prerender-parity.mjs
node tests/language-seo.browser.mjs
node --test tests/seo-contract.test.mjs tests/seoAudit.test.mjs tests/rateCard.test.mjs
SEO_URL=https://www.israanwar.com node tests/seo-browser.mjs
```
