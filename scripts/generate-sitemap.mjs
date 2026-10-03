// Generate sitemap.xml dari blog data + kategori + static pages.
// Dijalankan otomatis sebelum vite build (via package.json script "prebuild").
// Output: public/sitemap.xml
//
// Kenapa build-time bukan runtime: aplikasi ini SPA statis (Vite). Tidak ada
// server yang bisa render endpoint /sitemap.xml on-demand. Solusi paling
// waras adalah generate saat build, commit hasilnya, dan biarkan robot
// crawl file statis di /public.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

// Dynamic-import seed & kategori (pure ES modules, tidak import React).
const { getCanonicalPublishedPosts } = await import(
  `file://${projectRoot}/src/lib/canonicalPosts.js`
);
const { BLOG_CATEGORIES } = await import(
  `file://${projectRoot}/src/data/blogCategories.js`
);
const { TOOLS } = await import(
  `file://${projectRoot}/src/data/toolsCatalog.js`
);
const { ISRA_ANWAR_SERVICES_SEED } = await import(
  `file://${projectRoot}/src/data/serviceCatalog.js`
);

// Konfigurasi domain — sesuaikan kalau pindah host.
const SITE_URL = "https://www.israanwar.com";

// XML-escape untuk URL & content string.
function xmlEsc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Format ISO date jadi YYYY-MM-DD (spec sitemap.xml prefer date-only).
// Returns null for a missing/invalid date: <lastmod> must be the real date a
// page last changed, so a page with no known change date simply omits it
// rather than advertising the build date for everything.
function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

// Build satu <url> entry.
function urlEntry({ loc, lastmod, changefreq, priority }) {
  const parts = [`    <loc>${xmlEsc(loc)}</loc>`];
  const date = fmtDate(lastmod);
  if (date) parts.push(`    <lastmod>${date}</lastmod>`);
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority !== undefined) parts.push(`    <priority>${priority.toFixed(1)}</priority>`);
  return `  <url>\n${parts.join("\n")}\n  </url>`;
}

// Susun semua URL yang boleh di-crawl (kalau pindah domain / tambah page,
// edit di sini). Blog list & posts adalah prioritas utama.
// Canonical posts (new slugs, newest first) — same resolver the prerender uses,
// so every <loc> here is a page that really exists at that exact URL.
const sortedPosts = getCanonicalPublishedPosts();

const postDate = (p) => p.updated_at || p.published_at;
const latestDate = (posts) => posts.map(postDate).filter(Boolean).sort().at(-1);

// The only pages with a genuinely known change date are the ones driven by
// blog posts: each article (its own date), its category page and /blog and
// the homepage "latest notes" list (newest post in scope). Everything else
// (services, tools, About, legal pages…) has no tracked modification date,
// so it carries no <lastmod> instead of a fake build date.
const lastmodByStaticPath = { "/": latestDate(sortedPosts), "/blog": latestDate(sortedPosts) };

const staticPages = [
  { path: "/",          priority: 1.0, changefreq: "weekly"  },
  { path: "/about",     priority: 0.7, changefreq: "monthly" },
  { path: "/services",  priority: 0.8, changefreq: "monthly" },
  { path: "/portfolio", priority: 0.7, changefreq: "monthly" },
  { path: "/tools",     priority: 0.6, changefreq: "monthly" },
  { path: "/store",     priority: 0.7, changefreq: "weekly"  },
  { path: "/blog",      priority: 0.9, changefreq: "daily"   },
  // /sitemap (the human-readable HTML page) is intentionally not listed here:
  // it is a navigation aid linked from the footer, not a page to rank.
  { path: "/contact",   priority: 0.6, changefreq: "yearly"  },
  { path: "/privacy",   priority: 0.3, changefreq: "yearly"  },
  { path: "/terms",     priority: 0.3, changefreq: "yearly"  },
];

const staticEntries = staticPages.map((p) =>
  urlEntry({
    loc: `${SITE_URL}${p.path}`,
    lastmod: lastmodByStaticPath[p.path],
    changefreq: p.changefreq,
    priority: p.priority,
  })
);

const categoryEntries = BLOG_CATEGORIES.map((c) =>
  urlEntry({
    loc: `${SITE_URL}/blog/${c.slug}`,
    lastmod: latestDate(sortedPosts.filter((p) => p.category === c.slug)),
    changefreq: "weekly",
    priority: 0.8,
  })
);

const toolEntries = TOOLS.map((tool) =>
  urlEntry({
    loc: `${SITE_URL}/tools/${tool.slug}`,
    changefreq: "monthly",
    priority: 0.7,
  })
);

// Service category + individual service pages — these previously had no
// sitemap entries at all (only /services itself did), matching the same
// gap fixed in prerender.mjs (see its comment there for the full story).
const serviceCategoryEntries = ISRA_ANWAR_SERVICES_SEED
  .filter((s) => s.kind === "category")
  .map((cat) =>
    urlEntry({
      loc: `${SITE_URL}/services/${cat.slug}`,
      changefreq: "monthly",
      priority: 0.7,
    })
  );

const serviceEntries = ISRA_ANWAR_SERVICES_SEED
  .filter((s) => s.kind === "service")
  .map((svc) =>
    urlEntry({
      loc: `${SITE_URL}/services/${svc.slug}`,
      changefreq: "monthly",
      priority: 0.6,
    })
  );

const postEntries = sortedPosts.map((p) =>
  urlEntry({
    loc: `${SITE_URL}${p.canonical_path}`,
    lastmod: postDate(p),
    changefreq: "monthly",
    priority: 0.7,
  })
);

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  [...staticEntries, ...toolEntries, ...serviceCategoryEntries, ...serviceEntries, ...categoryEntries, ...postEntries].join("\n") +
  `\n</urlset>\n`;

const outPath = resolve(projectRoot, "public/sitemap.xml");
writeFileSync(outPath, xml, "utf8");

const total = staticEntries.length + toolEntries.length + serviceCategoryEntries.length + serviceEntries.length + categoryEntries.length + postEntries.length;
console.log(`✓ sitemap.xml regenerated → ${total} URLs`);
console.log(`  · ${staticEntries.length} static pages`);
console.log(`  · ${toolEntries.length} working tools`);
console.log(`  · ${serviceCategoryEntries.length} service categories`);
console.log(`  · ${serviceEntries.length} individual services`);
console.log(`  · ${categoryEntries.length} blog categories`);
console.log(`  · ${postEntries.length} blog posts`);
