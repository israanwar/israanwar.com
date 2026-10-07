# Step 2 — language consistency

User decision: keep one URL per page and the existing EN/ID toggle. English
remains the default. Do not create /id/, /en/, or alternate-language URLs.

- WebPage language and Open Graph locale follow the selected language.
- WebSite lists the supported English and Indonesian languages.
- Indonesian articles retain Indonesian language metadata and an explicit
  article lang attribute when the surrounding navigation is English.
- The chosen UI language persists across reloads and is restored when leaving
  an article for an ordinary page.
- Removed inherited homepage hreflang tags: there are no separate language
  URLs to declare. The existing canonical strategy is unchanged.

A single-URL preference toggle is not a separately crawlable Indonesian version
of an English page. This decision does not claim both UI variants will be
indexed independently. Article translation and content editing are out of scope.

Verification: node tests/language-seo.browser.mjs (390/1440), npm run build,
node tests/prerender-parity.mjs, and built HTML language checks.
Status: local verification passed on 2026-10-07 at 390px and 1440px.
Production verification is tracked in step-3-crawl-recovery.md.
