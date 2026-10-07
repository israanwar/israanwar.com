// Unique meta descriptions for the priority service pages (Search
// Optimization, AI & Automation, landing pages, GA4/GTM tracking). The other
// service pages still fall back to the catalog tagline, which is templated
// ("A focused <category> service for <name> projects.") — see
// docs/seo-fix-notes.md for the plan for those pages.
//
// These describe the scope of work only; no pricing, results, or client
// claims. Keep each under ~160 characters (checked by scripts/verify-seo.mjs).

export const SERVICE_META_DESCRIPTIONS = {
  // Search Optimization
  "search-optimization-seo-audit":
    "SEO audit from Isra Anwar: crawl, indexation, on-page, content, and backlink review with a prioritized action plan your team can implement.",
  "search-optimization-technical-seo":
    "Technical SEO for sites that must be crawled and indexed cleanly: site architecture, canonicals, redirects, speed, and structured data.",
  "search-optimization-on-page-seo":
    "On-page SEO that aligns titles, headings, content, internal links, and schema with search intent so every page has one clear job.",
  "search-optimization-off-page-seo":
    "Off-page SEO focused on earned authority: link profile review, digital PR angles, citations, and brand mentions, without spammy link schemes.",
  "search-optimization-local-seo":
    "Local SEO for businesses serving a specific area: Google Business Profile, local landing pages, citations, and review signals.",
  "search-optimization-international-seo":
    "International SEO for multi-country and multi-language sites: hreflang, URL structure, localized content, and regional search targeting.",
  "search-optimization-enterprise-seo":
    "Enterprise SEO for large sites: scalable templates, governance, crawl budget, and reporting that works across teams and stakeholders.",
  "search-optimization-e-commerce-seo":
    "E-commerce SEO for online stores: category and product page optimization, faceted navigation, product schema, and technical clean-up.",
  "search-optimization-seo-content-strategy":
    "SEO content strategy that maps topics to search intent, builds topical authority, and turns expertise into pages worth ranking and citing.",
  "search-optimization-answer-engine-optimization-aeo":
    "Answer Engine Optimization (AEO): structure content with clear answers, FAQs, and schema so search engines and AI assistants can quote it.",
  "search-optimization-generative-engine-optimization-geo":
    "Generative Engine Optimization (GEO): make your brand and content easy for AI search tools to understand, trust, and cite in answers.",
  "search-optimization-knowledge-graph-optimization":
    "Knowledge Graph optimization: define your entity, align structured data and profiles, and strengthen how search engines recognize your brand.",
  "search-optimization-entity-seo":
    "Entity SEO that clarifies who you are, what you offer, and which topics you belong to, using structured data and consistent signals.",
  "search-optimization-seo-recovery":
    "SEO recovery after a traffic drop, migration, or update: diagnose the cause, fix technical and content issues, and monitor the rebound.",
  "search-optimization-seo-monitoring-and-reporting":
    "SEO monitoring and reporting with Search Console, analytics, and rank tracking, turned into clear monthly insights and next actions.",

  // AI & Automation
  "ai-automation-ai-strategy-consulting":
    "AI strategy consulting: find where AI saves real time in your business, choose tools carefully, and plan a safe, practical rollout.",
  "ai-automation-ai-workflow-automation":
    "AI workflow automation that removes repetitive tasks across your tools, with clear triggers, human review points, and documentation.",
  "ai-automation-ai-agent-development":
    "AI agent development: task-focused agents connected to your data and tools, with guardrails, logging, and a defined human handoff.",
  "ai-automation-ai-chatbot-development":
    "AI chatbot development for websites and messaging channels, grounded in your own content and built to hand complex cases to a person.",
  "ai-automation-prompt-engineering":
    "Prompt engineering for business use: reusable prompts, templates, and evaluation checks that keep AI output consistent and on brand.",
  "ai-automation-business-process-automation":
    "Business process automation that maps manual workflows, removes bottlenecks, and connects approvals, data, and notifications.",
  "ai-automation-workflow-integration":
    "Workflow integration that connects your CRM, forms, spreadsheets, and apps so data moves between tools without copy-paste.",
  "ai-automation-knowledge-base-development":
    "Knowledge base development: organize documents and FAQs into a searchable source of truth for customers, staff, and AI assistants.",
  "ai-automation-ai-document-processing":
    "AI document processing to extract, classify, and summarize information from invoices, forms, and reports, with review steps for accuracy.",
  "ai-automation-ai-customer-support":
    "AI customer support setup: automate common questions from your knowledge base while keeping a clear path to a human agent.",
  "ai-automation-ai-content-workflow":
    "AI content workflow that speeds up research, drafting, and repurposing while keeping editorial review, voice, and fact-checking in place.",
  "ai-automation-custom-ai-solution-development":
    "Custom AI solution development scoped to one business problem: data, model or API choice, integration, testing, and handover.",

  // Landing pages
  "web-development-landing-page-development":
    "Landing page development built around one goal: a clear message, fast loading, tracking, and a structure that turns visits into enquiries.",
  "content-creative-landing-page-copywriting":
    "Landing page copywriting that clarifies your offer, answers objections, and guides visitors to one clear call to action.",

  // GA4 / GTM / tracking
  "analytics-data-intelligence-google-analytics-setup":
    "Google Analytics 4 (GA4) setup: property and data stream configuration, key events, audiences, and a clean measurement plan.",
  "analytics-data-intelligence-google-tag-manager-setup":
    "Google Tag Manager setup: containers, tags, triggers, and data layer events, documented so tracking stays accurate as the site changes.",
  "analytics-data-intelligence-conversion-tracking":
    "Conversion tracking for forms, calls, WhatsApp clicks, and purchases across GA4, Google Ads, and Meta, tested before it goes live.",
};

export function getServiceMetaDescription(service) {
  return SERVICE_META_DESCRIPTIONS[service.slug] || service.tagline || service.body || "";
}
