# Balao public-catalog advisor — 17 October 2026

The requested change improves Balao without an AI API. It uses deterministic
retrieval, arithmetic, prior user messages, and guided troubleshooting.

## Knowledge inventory

- Locked prices: 458 entries parsed from `israanwar-master-rate-card-v2.md`;
  includes services, add-ons, packages, custom quotes, units, and commitments.
- Public service seed: 12 categories and 140 individual services. Runtime
  knowledge follows the same active public service hooks as Services.
- Tools: all 21 implemented tools in `toolsCatalog.js`, with direct routes.
- Products: the same active product feed and effective prices used by Store;
  no private order, contact-submission, or admin data is retrieved.
- Existing published-post, About, Portfolio, and contact sources are retained.
- `buildBalaoManifest()` exposes an inspectable inventory of source IDs and
  public URLs. It is not evidence of a complete live website crawl.

## Behavior

- Indonesian/English catalog questions resolve before broad keyword handlers.
  Product Design, Invoice System, and App Store Deployment remain services.
- Follow-ups use recent user messages in the current conversation. Assistant
  output is never an authority for a price. Reset clears this context.
- Estimates show quantity assumptions, distinguish one-off/monthly costs,
  retain minimum commitments, and state that scope/overlap needs review.
- Ambiguous names across categories are qualified by category. Unknown
  prices and durations are not invented. Null product prices are not free.
- Guided checks cover speed, search/indexing, conversion, automation,
  launching a website, UX, analytics, and content. Advice is explicitly not
  a claimed inspection of the visitor's website.
- Contact information remains available when requested. Unknown questions
  ask for the goal, current situation, and obstacle instead of a handoff.
- Chat UI, document extraction, and public layout remain intact. In the
  release checkout the existing local widget simply passes its conversation
  to the updated engine. The working checkout's unfinished webhook path is
  not included in the release.

## Verification before release

- 21 advisor regression tests pass; includes individual name retrieval for
  every locked rate, all tool routes, scopes, counts, context/reset,
  quantities, budget, exclusions, ambiguity, and non-fabrication.
- Existing four lead-flow client tests pass separately. These are legacy
  client-contract tests, not evidence of an active n8n integration.
- Vite build passes (existing large-chunk warning remains).
- Browser chat checks pass: Rp200.000 landing-page starting price; Rp500.000
  arithmetic subtotal for one landing page and three additional pages;
  speed guidance; free WhatsApp link tool; and context reset.
- No AI-provider or chat-webhook requests, and no page errors observed
  during the browser chat scenarios.
- Public data adapters returned 121 active products and 152 service records
  (including categories) in the tested local session. A returned product,
  `modul-digital-sales-funnel`, was retrieved through the chat. This is
  adapter/session evidence, not proof that every product was inspected live.

## Limits

This is not a generative model or unrestricted reasoning system. Indonesian
and English have the enhanced advisor; other legacy language paths retain
their existing coverage. It does not browse arbitrary sites, verify analytics,
negotiate discounts, confirm availability, or produce binding quotations.
Uploaded document support remains local text extraction/search, not semantic
document analysis. Conversation context lasts within the mounted chat session.
