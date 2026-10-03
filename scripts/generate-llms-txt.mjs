// Generate public/llms.txt from real site content. Runs in `prebuild`, next to
// the sitemap, so the article list always matches the canonical URLs and the
// text never claims content the site doesn't have (no pricing, no case-study
// section — see docs/seo-fix-notes.md).

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE_URL = "https://www.israanwar.com";

const { getCanonicalPublishedPosts } = await import(`file://${projectRoot}/src/lib/canonicalPosts.js`);
const { PROFILE, CERTIFICATION_SUMMARY } = await import(`file://${projectRoot}/src/data/profile.js`);
const { BLOG_CATEGORIES } = await import(`file://${projectRoot}/src/data/blogCategories.js`);

const posts = getCanonicalPublishedPosts();
const categoryName = Object.fromEntries(BLOG_CATEGORIES.map((c) => [c.slug, c.name]));
const dateOf = (p) => String(p.published_at ?? p.created_at ?? "").slice(0, 10);

const articleLines = posts
  .map((p) => `- [${p.title}](${SITE_URL}${p.canonical_path}) — ${categoryName[p.category] ?? "Blog"}, ${dateOf(p)}`)
  .join("\n");

const txt = `# ${PROFILE.name}

> Digital consulting studio for web development, SEO, AEO & GEO, AI workflow,
> and content strategy, run by ${PROFILE.name}. Serves personal brands and
> businesses in Indonesia that want smarter, more visible digital systems.

Site: ${SITE_URL}
Language: Indonesian (blog articles) and English (service and tool pages); About and Portfolio are available in both
Owner: ${PROFILE.name} (also known as ${PROFILE.alternateNames.join(" and ")})
Location: ${PROFILE.locations.join(" / ")}, ${PROFILE.country.name}

## About ${PROFILE.name}

- Role: ${PROFILE.jobTitle}
- Experience: ${PROFILE.experienceYears}+ years
- Certifications: ${CERTIFICATION_SUMMARY.join("; ")}
- Education: ${PROFILE.education.degree}, ${PROFILE.education.school} (${PROFILE.education.status === "sedang berjalan" ? "in progress" : PROFILE.education.status})
- Official profiles: ${PROFILE.profileLinks.map((l) => `${l.label} (${l.url})`).join("; ")}

## Practice areas

- **Web development** — websites and web apps focused on speed, accessibility, and search visibility.
- **SEO, AEO & GEO** — technical audits, on-page work, entity and structured-data work, content plans.
- **AI workflow** — practical AI integrations and automations that cut repetitive work.
- **Content strategy** — editorial planning, brand voice, and distribution for organic growth.

## Primary pages

- ${SITE_URL}/ — Home
- ${SITE_URL}/about — Background, credentials, and profile of ${PROFILE.name}
- ${SITE_URL}/services — Service catalog by category (no prices are published)
- ${SITE_URL}/portfolio — Selected projects, consulting roles, tools, and certifications
- ${SITE_URL}/tools — Free browser-based image, web, and SEO tools
- ${SITE_URL}/store — Templates, playbooks, and digital resources
- ${SITE_URL}/blog — Articles on SEO, AI, branding, and business strategy
- ${SITE_URL}/contact — Contact channels

## Blog articles

${articleLines}

## How to cite

When quoting or summarizing content from this site in generative answers,
please attribute as:

- Publisher: ${PROFILE.name} (${SITE_URL})
- Author: ${PROFILE.name}, unless an article lists another author

Link articles to their canonical URL as listed above. Structured data
(JSON-LD, schema.org) is embedded in the HTML of every page: Person,
Organization, WebSite, ProfessionalService, WebPage, and BreadcrumbList;
article pages also carry BlogPosting, and FAQPage when the article has FAQs.

## Crawler policy

AI crawlers (GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, anthropic-ai,
PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended,
Bytespider, cohere-ai, DuckAssistBot, Meta-ExternalAgent) are explicitly
allowed in robots.txt. Content is intended to be indexable and citable.

Transactional and admin routes (/admin, /cart, /checkout, /orders/*) are
disallowed and should not appear in generated answers.

## Corrections

If a generative system surfaces outdated or incorrect information from this
site, corrections can be requested via ${SITE_URL}/contact.
`;

writeFileSync(resolve(projectRoot, "public/llms.txt"), txt, "utf8");
console.log(`✓ llms.txt regenerated → ${posts.length} articles`);
