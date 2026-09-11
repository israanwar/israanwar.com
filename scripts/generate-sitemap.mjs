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
const { ISRA_ANWAR_BLOG_POSTS_SEED } = await import(
  `file://${projectRoot}/src/data/blogSeedIsraVoice.js`
);
const { BLOG_CATEGORIES } = await import(
  `file://${projectRoot}/src/data/blogCategories.js`
);
const { TOOLS } = await import(
  `file://${projectRoot}/src/data/toolsCatalog.js`
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
function fmtDate(iso) {
  if (!iso) return new Date().toISOString().slice(0, 10);
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

// Build satu <url> entry.
function urlEntry({ loc, lastmod, changefreq, priority }) {
  const parts = [
    `    <loc>${xmlEsc(loc)}</loc>`,
    `    <lastmod>${fmtDate(lastmod)}</lastmod>`,
  ];
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority !== undefined) parts.push(`    <priority>${priority.toFixed(1)}</priority>`);
  return `  <url>\n${parts.join("\n")}\n  </url>`;
}

// Susun semua URL yang boleh di-crawl (kalau pindah domain / tambah page,
// edit di sini). Blog list & posts adalah prioritas utama.
const today = new Date().toISOString();

const staticPages = [
  { path: "/",          priority: 1.0, changefreq: "weekly"  },
  { path: "/about",     priority: 0.7, changefreq: "monthly" },
  { path: "/services",  priority: 0.8, changefreq: "monthly" },
  { path: "/portfolio", priority: 0.7, changefreq: "monthly" },
  { path: "/tools",     priority: 0.6, changefreq: "monthly" },
  { path: "/store",     priority: 0.7, changefreq: "weekly"  },
  { path: "/blog",      priority: 0.9, changefreq: "daily"   },
  { path: "/sitemap",   priority: 0.4, changefreq: "weekly"  },
  { path: "/contact",   priority: 0.6, changefreq: "yearly"  },
  { path: "/privacy",   priority: 0.3, changefreq: "yearly"  },
  { path: "/terms",     priority: 0.3, changefreq: "yearly"  },
];

const staticEntries = staticPages.map((p) =>
  urlEntry({
    loc: `${SITE_URL}${p.path}`,
    lastmod: today,
    changefreq: p.changefreq,
    priority: p.priority,
  })
);

const categoryEntries = BLOG_CATEGORIES.map((c) =>
  urlEntry({
    loc: `${SITE_URL}/blog/${c.slug}`,
    lastmod: today,
    changefreq: "weekly",
    priority: 0.8,
  })
);

const toolEntries = TOOLS.map((tool) =>
  urlEntry({
    loc: `${SITE_URL}/tools/${tool.slug}`,
    lastmod: today,
    changefreq: "monthly",
    priority: 0.7,
  })
);

// Sort blog posts: newest first supaya crawler prioritas ke content baru.
const sortedPosts = [...ISRA_ANWAR_BLOG_POSTS_SEED]
  .filter((p) => p.status === "published")
  .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));

const postEntries = sortedPosts.map((p) =>
  urlEntry({
    loc: `${SITE_URL}/blog/${p.slug}`,
    lastmod: p.updated_at || p.published_at,
    changefreq: "monthly",
    priority: 0.7,
  })
);

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  [...staticEntries, ...toolEntries, ...categoryEntries, ...postEntries].join("\n") +
  `\n</urlset>\n`;

const outPath = resolve(projectRoot, "public/sitemap.xml");
writeFileSync(outPath, xml, "utf8");

const total = staticEntries.length + toolEntries.length + categoryEntries.length + postEntries.length;
console.log(`✓ sitemap.xml regenerated → ${total} URLs`);
console.log(`  · ${staticEntries.length} static pages`);
console.log(`  · ${toolEntries.length} working tools`);
console.log(`  · ${categoryEntries.length} blog categories`);
console.log(`  · ${postEntries.length} blog posts`);
