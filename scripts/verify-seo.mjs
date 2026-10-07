// Post-build SEO acceptance checks against dist/ (raw HTML, no JavaScript —
// what GPTBot/ClaudeBot/PerplexityBot see). Run: `npm run build && npm run verify:seo`.
// Exits non-zero on any failure.

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(projectRoot, "dist");
const SITE_URL = "https://www.israanwar.com";

const { SLUG_RENAMES } = await import(`file://${projectRoot}/src/data/slugRenames.js`);
const { getCanonicalPublishedPosts } = await import(`file://${projectRoot}/src/lib/canonicalPosts.js`);

const failures = [];
const fail = (msg) => failures.push(msg);

function htmlFor(path) {
  const file = path === "/" ? resolve(distDir, "index.html") : resolve(distDir, path.slice(1), "index.html");
  return existsSync(file) ? readFileSync(file, "utf8") : null;
}

const sitemap = readFileSync(resolve(projectRoot, "public/sitemap.xml"), "utf8");
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!locs.length) fail("sitemap.xml has no <loc> entries");

// 1. Every sitemap URL has its own static page with a self-referencing canonical,
//    exactly one H1, JSON-LD, and no link to the non-www host.
for (const loc of locs) {
  if (!loc.startsWith(`${SITE_URL}/`)) { fail(`sitemap URL not on www host: ${loc}`); continue; }
  const path = loc.slice(SITE_URL.length);
  const html = htmlFor(path);
  if (!html) { fail(`no prerendered page for sitemap URL ${loc}`); continue; }
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (canonical !== loc) fail(`${loc}: canonical is ${canonical}`);
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) fail(`${loc}: expected 1 <h1>, found ${h1s}`);
  if (!html.includes("application/ld+json")) fail(`${loc}: no JSON-LD in initial HTML`);
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch { fail(`${loc}: invalid JSON-LD block`); }
  }
  if (/(href|content)="https?:\/\/israanwar\.com/.test(html)) fail(`${loc}: links/meta to non-www host`);
  const siteName = html.match(/<meta property="og:site_name" content="([^"]*)"/)?.[1];
  if (siteName !== "Isra Anwar") fail(`${loc}: og:site_name is "${siteName}"`);
}

// 2. Blog posts: unique <title>, BlogPosting + BreadcrumbList, real body text.
const titles = new Map();
for (const post of getCanonicalPublishedPosts()) {
  const path = `/blog/${post.slug}`;
  const html = htmlFor(path);
  if (!html) { fail(`missing article page ${path}`); continue; }
  if (!locs.includes(`${SITE_URL}${path}`)) fail(`${path} missing from sitemap`);
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  if (titles.has(title)) fail(`duplicate <title> "${title}" on ${path} and ${titles.get(title)}`);
  titles.set(title, path);
  if (!html.includes('"@type":"BlogPosting"')) fail(`${path}: no BlogPosting JSON-LD`);
  const blogPosting = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => JSON.parse(m[1])).find((d) => d["@type"] === "BlogPosting");
  if (blogPosting && (blogPosting.headline !== post.title || !blogPosting.datePublished || blogPosting.url !== `${SITE_URL}${path}` || blogPosting.author?.name !== "Isra Anwar")) {
    fail(`${path}: BlogPosting headline/date/url/author mismatch`);
  }
  if (!html.includes('"@type":"BreadcrumbList"')) fail(`${path}: no BreadcrumbList JSON-LD`);
  const words = (html.match(/<article>[\s\S]*?<\/article>/)?.[0] ?? "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  if (words < 300) fail(`${path}: article body only ${words} words in initial HTML`);
  if (!/<time datetime=/.test(html) || !html.includes("Oleh ")) fail(`${path}: missing date/author in initial HTML`);
  if (htmlFor(`/blog/${post.legacy_slug}`) && post.legacy_slug) fail(`${path}: stale page still emitted at legacy slug`);
}

// 3. Homepage, blog index and category pages never link to an old slug.
const oldSlugs = Object.keys(SLUG_RENAMES);
for (const path of ["/", "/blog", ...locs.map((l) => l.slice(SITE_URL.length))]) {
  const html = htmlFor(path);
  if (!html) continue;
  for (const old of oldSlugs) {
    if (html.includes(`href="/blog/${old}"`)) fail(`${path}: links to legacy slug /blog/${old}`);
  }
}

// 4. Redirects (production is Netlify: dist/_redirects; vercel.json mirrors it
//    for the Vercel preview project). Every old slug 301s straight to its
//    canonical slug, the apex host redirects to www, and the SPA fallback is
//    last so it never shadows a rule.
const redirectsFile = resolve(distDir, "_redirects");
if (!existsSync(redirectsFile)) fail("dist/_redirects missing (Netlify redirects not shipped)");
else {
  const rules = readFileSync(redirectsFile, "utf8")
    .split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split(/\s+/));
  for (const [old, next] of Object.entries(SLUG_RENAMES)) {
    const rule = rules.find((r) => r[0] === `/blog/${old}`);
    if (!rule) fail(`_redirects: no rule for /blog/${old}`);
    else if (rule[1] !== `/blog/${next}` || rule[2] !== "301") fail(`_redirects: wrong rule for /blog/${old}`);
    if (oldSlugs.includes(next)) fail(`redirect chain: ${old} -> ${next} -> ...`);
  }
  if (!rules.some((r) => r[0] === "https://israanwar.com/*" && r[1] === `${SITE_URL}/:splat` && r[2].startsWith("301"))) {
    fail("_redirects: no apex (israanwar.com) -> www rule");
  }
  const firstFallback = rules.findIndex((r) => r[1] === "/index.html" && r[2] === "200");
  const lastRedirect = rules.map((r, i) => (r[2]?.startsWith("301") ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
  if (firstFallback === -1 || firstFallback < lastRedirect) fail("_redirects: SPA fallback missing or placed before redirects");
}
if (!existsSync(resolve(distDir, "404.html"))) fail("dist/404.html missing (unknown URLs would soft-404)");
if (!/publish\s*=\s*"dist"/.test(readFileSync(resolve(projectRoot, "netlify.toml"), "utf8"))) fail("netlify.toml: publish dir is not dist");

const vercel = JSON.parse(readFileSync(resolve(projectRoot, "vercel.json"), "utf8"));
const redirects = vercel.redirects ?? [];
for (const [old, next] of Object.entries(SLUG_RENAMES)) {
  const rule = redirects.find((r) => r.source === `/blog/${old}`);
  if (!rule || rule.destination !== `/blog/${next}` || rule.statusCode !== 301) fail(`vercel.json: missing/wrong redirect for /blog/${old}`);
}

// 5. Sitemap hygiene: the HTML /sitemap page is not listed, and <lastmod> is
//    a real per-page date (not one shared build date).
if (locs.includes(`${SITE_URL}/sitemap`)) fail("sitemap.xml still lists the HTML /sitemap page");
const lastmods = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
if (new Set(lastmods).size < 2) fail("sitemap.xml <lastmod> values are all identical");
if (lastmods.some((d) => d >= new Date().toISOString().slice(0, 10) && !getCanonicalPublishedPosts().some((p) => String(p.updated_at || p.published_at).startsWith(d)))) {
  fail("sitemap.xml has a <lastmod> that matches no real content date (build date?)");
}

// 6. Service pages: unique meta descriptions for priority pages, sane length.
const { SERVICE_META_DESCRIPTIONS } = await import(`file://${projectRoot}/src/data/serviceMeta.js`);
const seenDescriptions = new Set();
for (const [slug, description] of Object.entries(SERVICE_META_DESCRIPTIONS)) {
  if (description.length < 80 || description.length > 160) fail(`service meta for ${slug} is ${description.length} chars`);
  if (seenDescriptions.has(description)) fail(`duplicate service meta description for ${slug}`);
  seenDescriptions.add(description);
  const html = htmlFor(`/services/${slug}`);
  const rendered = html?.match(/<meta name="description" content="([^"]*)"/)?.[1];
  if (!html || rendered !== description.replace(/&/g, "&amp;")) fail(`/services/${slug}: rendered meta description differs from serviceMeta.js`);
}

// 7. llms.txt reflects reality: every article URL listed, no unsupported claims.
const llms = readFileSync(resolve(projectRoot, "public/llms.txt"), "utf8");
for (const post of getCanonicalPublishedPosts()) {
  if (!llms.includes(`${SITE_URL}${post.canonical_path}`)) fail(`llms.txt missing article ${post.canonical_path}`);
}
if (/pricing intent|case studies of shipped work/i.test(llms)) fail("llms.txt claims pricing or case studies");

// 8. About: the owner-confirmed facts and Person JSON-LD are in the initial HTML.
const about = htmlFor("/about") ?? "";
for (const needle of ["Isra Anwar", "Okka Rhys", "15+ tahun", "Jakarta / Makassar", "IBM Data Analyst Professional Certificate", "ITB Nobel Indonesia", '"@type":"Person"', '"hasCredential"', '"sameAs"']) {
  if (!about.includes(needle)) fail(`/about: missing "${needle}" in initial HTML`);
}
if ((htmlFor("/portfolio") ?? "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length < 300) fail("/portfolio: initial HTML has too little text");

if (failures.length) {
  console.error(`✗ verify:seo — ${failures.length} problem(s)`);
  failures.forEach((f) => console.error("  · " + f));
  process.exit(1);
}
console.log(`✓ verify:seo — ${locs.length} sitemap URLs and ${getCanonicalPublishedPosts().length} articles OK`);
