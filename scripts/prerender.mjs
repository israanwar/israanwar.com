// Prerender per-route static HTML (head only) untuk SEO/GEO/AEO.
// Dijalankan otomatis sebagai `postbuild` script setelah vite build.
//
// Strategi (zero-risk):
// - Nggak sentuh <body> — <div id="root"> tetap kosong, React tetap render
//   di client dengan cara yang sama seperti sekarang. Zero hydration
//   mismatch risk karena tidak ada content pre-rendered yang mesti match.
// - Cuma modifikasi <head>: title, meta description, OG, Twitter Card,
//   canonical, dan inject JSON-LD structured data.
// - Output per-route index.html file. Static host (Vercel/Netlify/Nginx)
//   auto-serve folder-based /path/index.html untuk URL /path.
//
// Kalau script ini gagal, dist/ tetap punya index.html SPA fallback yang
// bekerja normal. Rollback = hapus postbuild script + hapus folder.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

const { ISRA_ANWAR_BLOG_POSTS_SEED } = await import(
  `file://${projectRoot}/src/data/blogSeedIsraVoice.js`
);
const { BLOG_CATEGORIES, CATEGORY_BY_SLUG, DEFAULT_CATEGORY_SLUG } = await import(
  `file://${projectRoot}/src/data/blogCategories.js`
);
const { getBlogSocialArtworkPath } = await import(
  `file://${projectRoot}/src/data/blogArtwork.js`
);
const structuredData = await import(
  `file://${projectRoot}/src/lib/structuredData.js`
);
const { ISRA_ANWAR_SERVICES_SEED } = await import(
  `file://${projectRoot}/src/data/serviceCatalog.js`
);
const { TOOLS, TOOLS_CATALOG } = await import(
  `file://${projectRoot}/src/data/toolsCatalog.js`
);

const SITE_URL = "https://www.israanwar.com";
// SITE_NAME stays "Isra Anwar" — it only feeds the <title> tag suffix
// ("Page Title | Isra Anwar"), which needs to stay short and readable in
// a browser tab / search result blue link.
const SITE_NAME = "Isra Anwar";
// SITE_IDENTITY is the site's declared identity for search engines and AI
// answer engines specifically — og:site_name and every schema.org "name"
// field (Organization, WebSite, ProfessionalService) below, per explicit
// request to use this instead of the personal name "Isra Anwar" there.
const SITE_IDENTITY =
  "Web Development & AI Integration, Branding & Marketing, SEO, AEO & GEO.";
const SOCIAL_SITE_NAME = SITE_IDENTITY;
const DEFAULT_DESCRIPTION =
  "Web, SEO, AI workflow & content strategy for personal brands and businesses.";

// Settings context untuk schema builders (mirror struktur useLiveSettings).
// site_name here only ever reaches buildOrganization/buildWebsite/
// buildProfessionalService (see structuredData.js) — it's the search-engine
// identity, not the client app's own site_name (that's a separate,
// Supabase-backed value used for the footer/logo/copyright text).
const settings = {
  site_name: SITE_IDENTITY,
  site_url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
};

const distDir = resolve(projectRoot, "dist");
const templatePath = resolve(distDir, "index.html");

// Read template SEKALI di awal. Kita simpan ke variabel supaya kalau
// overwrite dist/index.html buat homepage prerender, template tetap
// tersedia untuk route lain.
const TEMPLATE = readFileSync(templatePath, "utf8");

// -----------------------------------------------------------------------
// HTML manipulation helpers — surgical string replace, tanpa parser.
// Aman karena template Vite deterministic + kita kontrol structure-nya.
// -----------------------------------------------------------------------

function xmlEsc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setLang(html, lang) {
  return html.replace(/<html\s+lang="[^"]*"/i, `<html lang="${xmlEsc(lang)}"`);
}

function setTitle(html, title) {
  return html.replace(/<title>[^<]*<\/title>/i, `<title>${xmlEsc(title)}</title>`);
}

// Replace atau insert <meta name="X" content="Y" /> (atau property="X").
// Regex support multi-line format Vite (attribute di line berbeda).
function upsertMeta(html, attrName, attrValue, content) {
  const escapedName = attrName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedValue = attrValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<meta\\s+${escapedName}="${escapedValue}"\\s+content="[^"]*"\\s*/?>`,
    "is"
  );
  const replacement = `<meta ${attrName}="${attrValue}" content="${xmlEsc(content)}" />`;
  if (re.test(html)) return html.replace(re, replacement);
  return html.replace("</head>", `    ${replacement}\n  </head>`);
}

function setCanonical(html, url) {
  const re = /<link\s+rel="canonical"[^>]*\/?>/is;
  const replacement = `<link rel="canonical" href="${xmlEsc(url)}" />`;
  if (re.test(html)) return html.replace(re, replacement);
  return html.replace("</head>", `    ${replacement}\n  </head>`);
}

function injectJsonLd(html, schemas) {
  const scripts = schemas
    .filter(Boolean)
    .map(
      ({ name, data }) =>
        `    <script type="application/ld+json" data-schema="${name}">${JSON.stringify(data)}</script>`
    )
    .join("\n");
  return html.replace("</head>", `${scripts}\n  </head>`);
}

// -----------------------------------------------------------------------
// Real <body> content — see SEO audit notes (Semrush/Ubersuggest flagged
// missing H1, ~0 words of text content, and 0% social-media visibility).
// Root cause: <div id="root"> was left empty on purpose (see file header),
// so any crawler that doesn't execute JS sees a blank page.
//
// Fixed WITHOUT switching to real SSR/hydration (which would require every
// data hook to be Node-safe and main.jsx to use hydrateRoot — a much
// bigger, riskier change). main.jsx mounts via
// `ReactDOM.createRoot(...).render(...)`, which never reconciles against
// existing DOM inside #root — it just overwrites it wholesale. So writing
// real markup inside #root here carries zero hydration-mismatch risk: the
// instant client JS mounts, this is replaced exactly as before. Non-JS
// crawlers get real H1s, real article text, and real footer/social links;
// real visitors get, at most, a brief flash of this same content before
// the interactive app takes over.
// -----------------------------------------------------------------------

const REAL_SOCIAL = {
  whatsapp_url: "https://wa.me/6282189594190",
  email: "israanwarr@gmail.com",
  linkedin: "https://www.linkedin.com/in/israanwarr/",
  github: "https://github.com/israanwar/",
  instagram: "",
};

const NAV_LINKS = [
  ["/", "Home"],
  ["/about", "Tentang"],
  ["/services", "Layanan"],
  ["/portfolio", "Portfolio"],
  ["/tools", "Tools"],
  ["/store", "Store"],
  ["/blog", "Blog"],
  ["/contact", "Kontak"],
];

function renderNavHtml() {
  const items = NAV_LINKS.map(([href, label]) => `<a href="${xmlEsc(href)}">${xmlEsc(label)}</a>`).join("\n      ");
  return `<nav aria-label="Primary">\n      ${items}\n    </nav>`;
}

function renderFooterHtml() {
  const navItems = NAV_LINKS.map(([href, label]) => `<a href="${xmlEsc(href)}">${xmlEsc(label)}</a>`).join("\n      ");
  return `<footer>
    <nav aria-label="Footer">
      ${navItems}
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
      <a href="/sitemap">Sitemap</a>
    </nav>
    <p>
      <a href="mailto:${xmlEsc(REAL_SOCIAL.email)}" aria-label="Email Isra Anwar" title="Email">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
      </a>
      <a href="${xmlEsc(REAL_SOCIAL.whatsapp_url)}" rel="noreferrer">WhatsApp</a>
      ${REAL_SOCIAL.instagram ? `<a href="${xmlEsc(REAL_SOCIAL.instagram)}" rel="noreferrer">Instagram</a>` : ""}
      <a href="${xmlEsc(REAL_SOCIAL.linkedin)}" rel="noreferrer">LinkedIn</a>
      <a href="${xmlEsc(REAL_SOCIAL.github)}" rel="noreferrer">GitHub</a>
    </p>
    <p>&copy; ${new Date().getFullYear()} ${xmlEsc(SITE_NAME)}. All rights reserved.</p>
  </footer>`;
}

// --- Tiptap JSON -> HTML string, Node-safe mirror of RenderTiptap.jsx --
function renderInlineNode(node) {
  if (node.type !== "text") return "";
  let html = xmlEsc(node.text);
  for (const m of node.marks ?? []) {
    if (m.type === "bold") html = `<strong>${html}</strong>`;
    else if (m.type === "italic") html = `<em>${html}</em>`;
    else if (m.type === "strike") html = `<s>${html}</s>`;
    else if (m.type === "code") html = `<code>${html}</code>`;
    else if (m.type === "link") {
      const href = m.attrs?.href ?? "#";
      const external = !(href.startsWith("/") || href.startsWith("#"));
      html = `<a href="${xmlEsc(href)}"${external ? ' target="_blank" rel="noreferrer"' : ""}>${html}</a>`;
    }
  }
  return html;
}

function renderTiptapNode(node) {
  switch (node.type) {
    case "paragraph":
      return `<p>${(node.content ?? []).map(renderInlineNode).join("")}</p>`;
    case "heading": {
      const level = Math.min(6, Math.max(2, node.attrs?.level ?? 2));
      return `<h${level}>${(node.content ?? []).map(renderInlineNode).join("")}</h${level}>`;
    }
    case "bulletList":
      return `<ul>${(node.content ?? []).map(renderTiptapNode).join("")}</ul>`;
    case "orderedList":
      return `<ol>${(node.content ?? []).map(renderTiptapNode).join("")}</ol>`;
    case "listItem":
      return `<li>${(node.content ?? []).map(renderTiptapNode).join("")}</li>`;
    case "blockquote":
      return `<blockquote>${(node.content ?? []).map(renderTiptapNode).join("")}</blockquote>`;
    case "hardBreak":
      return "<br />";
    default:
      return "";
  }
}

function renderTiptapDoc(doc) {
  if (!doc?.content) return "";
  return doc.content.map(renderTiptapNode).join("\n");
}

function fmtDateID(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

// publishedPosts is assigned later in this file (module top-level, before
// routes.forEach runs) — safe to reference here since this function body
// only evaluates at call time, not at definition time.
function renderBodyHtml(route) {
  const nav = renderNavHtml();
  const footer = renderFooterHtml();
  let main;

  if (route.article) {
    const { post, category } = route.article;
    const tagsLine = post.tags?.length ? `<p>${xmlEsc(post.tags.join(" · ").toUpperCase())}</p>` : "";
    const metaBits = [fmtDateID(post.published_at || post.created_at), post.reading_time ? `${post.reading_time} min read` : ""].filter(Boolean);
    const excerptHtml = post.excerpt ? `<p>${xmlEsc(post.excerpt)}</p>` : "";
    main = `<main>
    <p><a href="/">Home</a> / <a href="/blog">Blog</a>${category ? ` / <a href="/blog/${xmlEsc(category.slug)}">${xmlEsc(category.name)}</a>` : ""}</p>
    ${tagsLine}
    <h1>${xmlEsc(post.title)}</h1>
    <p>${xmlEsc(metaBits.join(" · "))}</p>
    ${excerptHtml}
    <article>${renderTiptapDoc(post.content)}</article>
  </main>`;
  } else if (route.path.startsWith("/blog/")) {
    const catSlug = route.path.replace("/blog/", "");
    const items = publishedPosts
      .filter((p) => p.category === catSlug)
      .map((p) => `<li><a href="/blog/${xmlEsc(p.slug)}">${xmlEsc(p.title)}</a></li>`)
      .join("\n      ");
    main = `<main>
    <p><a href="/">Home</a> / <a href="/blog">Blog</a></p>
    <h1>${xmlEsc(route.title)}</h1>
    <p>${xmlEsc(route.description)}</p>
    <ul>
      ${items}
    </ul>
  </main>`;
  } else if (route.path === "/blog") {
    const items = publishedPosts
      .map((p) => `<li><a href="/blog/${xmlEsc(p.slug)}">${xmlEsc(p.title)}</a></li>`)
      .join("\n      ");
    main = `<main>
    <h1>${xmlEsc(route.title)}</h1>
    <p>${xmlEsc(route.description)}</p>
    <ul>
      ${items}
    </ul>
  </main>`;
  } else if (route.path === "/services") {
    // Real service catalog data (src/data/serviceCatalog.js) — one H2 +
    // tagline + service list per category, not the full ~820-word body
    // each individual service carries (that belongs on its own detail
    // page, which isn't prerendered yet — see file-level TODO note).
    const categories = ISRA_ANWAR_SERVICES_SEED.filter((s) => s.kind === "category");
    const sections = categories
      .map((cat) => {
        const services = ISRA_ANWAR_SERVICES_SEED
          .filter((s) => s.kind === "service" && s.parent_slug === cat.slug)
          .map((s) => `<li>${xmlEsc(s.name)}</li>`)
          .join("\n        ");
        return `<section>
        <h2>${xmlEsc(cat.name)}</h2>
        <p>${xmlEsc(cat.tagline)}</p>
        <ul>
          ${services}
        </ul>
      </section>`;
      })
      .join("\n    ");
    main = `<main>
    <h1>${xmlEsc(route.h1 || route.title)}</h1>
    <p>${xmlEsc(route.description)}</p>
    ${sections}
  </main>`;
  } else if (route.path === "/tools") {
    // Mirrors TOOLS_CATALOG in toolsCatalog.js — same data, imported directly
    // (not duplicated) so this can never drift from the real page.
    const sections = TOOLS_CATALOG
      .map((cat) => {
        const body = `<ul>\n          ${cat.tools.map((tool) => `<li><a href="/tools/${xmlEsc(tool.slug)}">${xmlEsc(tool.name)}</a> — ${xmlEsc(tool.description)}</li>`).join("\n          ")}\n        </ul>`;
        return `<section id="${xmlEsc(cat.slug)}">
        <h2>${xmlEsc(cat.name)}</h2>
        ${body}
      </section>`;
      })
      .join("\n    ");
    main = `<main>
    <h1>${xmlEsc(route.h1 || route.title)}</h1>
    <p>${xmlEsc(route.description)}</p>
    ${sections}
  </main>`;
  } else if (route.tool) {
    main = `<main>
    <p><a href="/">Home</a> / <a href="/tools">Tools</a> / ${xmlEsc(route.tool.name)}</p>
    <h1>${xmlEsc(route.tool.name)}</h1>
    <p>${xmlEsc(route.tool.description)}</p>
    <p>This tool runs locally in your browser. No account is required.</p>
  </main>`;
  } else if (route.path === "/") {
    // Real recent-posts list (same data as the /blog page) — gives the
    // homepage real internal links + text instead of just one paragraph.
    const recent = publishedPosts
      .slice(0, 6)
      .map((p) => `<li><a href="/blog/${xmlEsc(p.slug)}">${xmlEsc(p.title)}</a></li>`)
      .join("\n      ");
    main = `<main>
    <h1>${xmlEsc(route.h1 || route.title)}</h1>
    <p>${xmlEsc(route.description)}</p>
    <section>
      <h2>Latest notes</h2>
      <ul>
        ${recent}
      </ul>
    </section>
  </main>`;
  } else {
    main = `<main>
    <h1>${xmlEsc(route.h1 || route.title)}</h1>
    <p>${xmlEsc(route.description)}</p>
  </main>`;
  }

  return `<div id="ssg-shell" data-ssg="1">
  <header>${nav}</header>
  ${main}
  ${footer}
</div>`;
}

// -----------------------------------------------------------------------
// Per-route builder — turn route object jadi final HTML string.
// -----------------------------------------------------------------------

function buildRouteHtml(route) {
  let html = TEMPLATE;

  // Language tag — semua konten lo bahasa Indonesia.
  html = setLang(html, "id-ID");

  // Title format: "Page | ISRA ANWAR", kecuali homepage cuma "ISRA ANWAR".
  const pageTitle =
    route.title === SITE_NAME ? SITE_NAME : `${route.title} | ${SITE_NAME}`;
  // Keep the browser title branded, but keep share headlines clean. LinkedIn
  // already displays the domain below the headline, so repeating an uppercase
  // brand suffix makes the preview noisier than necessary.
  const socialTitle = route.socialTitle || pageTitle;
  html = setTitle(html, pageTitle);

  // Canonical URL — hilangkan trailing slash kecuali root.
  const canonical =
    route.path === "/" ? `${SITE_URL}/` : `${SITE_URL}${route.path}`;
  html = setCanonical(html, canonical);

  // Meta tags (update existing atau insert).
  html = upsertMeta(html, "name", "description", route.description);
  html = upsertMeta(html, "property", "og:title", socialTitle);
  html = upsertMeta(html, "property", "og:description", route.description);
  html = upsertMeta(html, "property", "og:url", canonical);
  html = upsertMeta(html, "property", "og:type", route.ogType || "website");
  html = upsertMeta(html, "property", "og:site_name", SOCIAL_SITE_NAME);
  html = upsertMeta(html, "name", "twitter:title", socialTitle);
  html = upsertMeta(html, "name", "twitter:description", route.description);
  html = upsertMeta(html, "name", "twitter:card", route.socialImage ? "summary_large_image" : "summary");

  if (route.socialImage) {
    html = upsertMeta(html, "property", "og:image", route.socialImage);
    html = upsertMeta(html, "property", "og:image:secure_url", route.socialImage);
    html = upsertMeta(html, "property", "og:image:type", "image/png");
    html = upsertMeta(html, "property", "og:image:width", "1200");
    html = upsertMeta(html, "property", "og:image:height", "630");
    html = upsertMeta(html, "property", "og:image:alt", route.socialImageAlt || socialTitle);
    html = upsertMeta(html, "name", "twitter:image", route.socialImage);
    html = upsertMeta(html, "name", "twitter:image:alt", route.socialImageAlt || socialTitle);
  }

  // Article-specific OG (untuk blog post).
  if (route.article) {
    const { post } = route.article;
    html = upsertMeta(html, "property", "article:published_time", post.published_at || "");
    html = upsertMeta(html, "property", "article:modified_time", post.updated_at || post.published_at || "");
    if (post.tags && post.tags.length > 0) {
      html = upsertMeta(html, "property", "article:tag", post.tags.join(", "));
    }
  }

  // JSON-LD structured data. Idempotent via data-schema attribute:
  // Seo.jsx runtime injection ketemu tag ini, replace bukan duplikat.
  const schemas = [
    { name: "organization", data: structuredData.buildOrganization(settings) },
    { name: "website", data: structuredData.buildWebsite(settings) },
    { name: "person", data: structuredData.buildPerson(settings) },
    { name: "service", data: structuredData.buildProfessionalService(settings) },
    {
      name: "webpage",
      data: structuredData.buildWebPage(route.path, pageTitle, route.description, settings),
    },
    {
      name: "breadcrumb",
      data: structuredData.buildBreadcrumb(route.path, route.currentTitle, settings),
    },
  ];
  if (route.article) {
    schemas.push({
      name: "article",
      data: structuredData.buildArticle(
        route.article.post,
        route.article.category,
        settings,
        route.socialImage,
      ),
    });
    if (route.article.post.faqs && route.article.post.faqs.length > 0) {
      schemas.push({
        name: "faq",
        data: structuredData.buildFaqPage(route.article.post.faqs),
      });
    }
  }
  html = injectJsonLd(html, schemas);

  // Real body content for crawlers that don't execute JS — see the
  // REAL_SOCIAL/renderBodyHtml block above for why this is zero-risk.
  //
  // The shell is plain semantic HTML with no class names, so it renders
  // completely unstyled — a real visitor on a cold cache would stare at a
  // wall of raw text for as long as the JS bundle takes to arrive. So it
  // is hidden from anything that can run JavaScript, using the classic
  // no-JS fallback pattern: the inline <head> script stamps `js-on` on
  // <html> before the body is even parsed (so there is no paint of the
  // shell, ever), and the inline rule hides it from that point on.
  //
  // Crawlers that don't execute JS never get the `js-on` class, so for
  // them the rule doesn't match and the content stays fully visible and
  // countable. Crawlers that DO execute JS (Googlebot) render the real
  // React app, which contains the same content — so nothing is hidden
  // from anyone that isn't shown the equivalent in another form.
  html = html.replace(
    "</head>",
    `    <style>html.js-on #ssg-shell{display:none!important}</style>\n` +
    `    <script>document.documentElement.classList.add("js-on")</script>\n  </head>`,
  );
  html = html.replace('<div id="root"></div>', `<div id="root">${renderBodyHtml(route)}</div>`);

  return html;
}

// -----------------------------------------------------------------------
// Route definitions — 10 static + 16 kategori + 21 posts = 47 route.
// Match dengan sitemap.xml.
// -----------------------------------------------------------------------

const routes = [
  {
    path: "/",
    title: "Web Development, SEO & AI Workflow Studio",
    h1: "Build what conventional minds miss before the market moves.",
    description:
      "Isra Anwar is a digital consulting studio in Indonesia helping personal brands and businesses grow through web development, SEO, AI-driven workflows, and content strategy built for measurable results.",
    ogType: "website",
  },
  {
    path: "/about",
    title: "Tentang Isra Anwar, Studio Konsultasi Digital",
    description:
      "Tentang Isra Anwar — studio konsultasi digital untuk web development, SEO, AI workflow, dan strategi konten bagi personal brand dan bisnis di Indonesia.",
    ogType: "website",
  },
  {
    path: "/services",
    title: "Layanan Web Development, SEO & AI Workflow",
    description:
      "Layanan Isra Anwar — audit website, SEO, AI workflow, dan strategi konten untuk membantu personal brand dan bisnis tumbuh dengan hasil yang terukur di Indonesia.",
    ogType: "website",
  },
  {
    path: "/portfolio",
    title: "Portfolio Proyek Web, SEO & Brand Campaign",
    description:
      "Portfolio proyek Isra Anwar — web development, SEO growth, event, dan brand campaign untuk personal brand dan bisnis di berbagai industri di Indonesia.",
    ogType: "website",
  },
  {
    path: "/tools",
    title: "Free Online Image, Web & SEO Tools",
    h1: "Useful by design. Private by default.",
    description:
      "Free browser-based image, website, creative, and SEO tools by Isra Anwar. Every listed tool is live and ready to use.",
    ogType: "website",
  },
  {
    path: "/store",
    title: "Store Template, Playbook & Resource Digital",
    description:
      "Store Isra Anwar — template, playbook, dan resource digital siap pakai untuk personal brand serta bisnis yang ingin tumbuh lebih cepat dan efisien.",
    ogType: "website",
  },
  {
    path: "/blog",
    title: "Blog — Insight SEO, AI & Strategi Bisnis",
    description:
      "Blog Isra Anwar — analisis, opini, case study, dan esai seputar SEO, AI, branding, dan strategi bisnis digital untuk personal brand dan bisnis di Indonesia.",
    ogType: "website",
  },
  {
    path: "/sitemap",
    title: "Sitemap Lengkap Halaman & Artikel Isra Anwar",
    description:
      "Peta situs Isra Anwar — daftar lengkap halaman utama dan seluruh artikel blog per kategori untuk memudahkan navigasi dan pencarian konten.",
    ogType: "website",
  },
  {
    path: "/contact",
    title: "Kontak Konsultasi Web, SEO & AI Workflow",
    description:
      "Hubungi Isra Anwar untuk konsultasi web development, SEO, AI workflow, dan strategi konten bagi personal brand serta bisnis kamu di Indonesia.",
    ogType: "website",
  },
  {
    path: "/privacy",
    title: "Privacy Policy — Kebijakan Privasi Isra Anwar",
    description:
      "Kebijakan privasi resmi Isra Anwar — cara kami mengumpulkan, menggunakan, dan melindungi data pengunjung serta klien di seluruh layanan digital kami.",
    ogType: "website",
  },
  {
    path: "/terms",
    title: "Terms of Service — Syarat Layanan Isra Anwar",
    description:
      "Syarat dan ketentuan resmi penggunaan layanan Isra Anwar — mengatur hak, kewajiban, dan batasan tanggung jawab antara Isra Anwar dan klien.",
    ogType: "website",
  },
];

TOOLS.forEach((tool) => {
  routes.push({
    path: `/tools/${tool.slug}`,
    title: `${tool.name} — Free Online Tool`,
    description: tool.description,
    currentTitle: tool.name,
    ogType: "website",
    tool,
  });
});

// Kategori pages — filter list per kategori.
BLOG_CATEGORIES.forEach((c) => {
  routes.push({
    path: `/blog/${c.slug}`,
    title: c.name,
    description: c.description,
    currentTitle: c.name,
    ogType: "website",
  });
});

// Blog post pages — dengan Article + FAQPage schema.
const publishedPosts = ISRA_ANWAR_BLOG_POSTS_SEED
  .filter((p) => p.status === "published")
  .sort((a, b) => (
    String(b.published_at ?? b.created_at ?? "").localeCompare(String(a.published_at ?? a.created_at ?? ""))
    || String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
  ));
publishedPosts.forEach((post, postIndex) => {
  const category =
    CATEGORY_BY_SLUG[post.category] || CATEGORY_BY_SLUG[DEFAULT_CATEGORY_SLUG];
  routes.push({
    path: `/blog/${post.slug}`,
    title: post.meta_title || post.title,
    socialTitle: post.title,
    description: post.meta_description || post.excerpt,
    socialImage: post.cover_url
      ? new URL(post.cover_url, SITE_URL).toString()
      : new URL(getBlogSocialArtworkPath(postIndex), SITE_URL).toString(),
    socialImageAlt: post.image_alt || post.title,
    currentTitle: post.title,
    ogType: "article",
    article: { post, category },
  });
});

// -----------------------------------------------------------------------
// Execute — generate + write per-route HTML.
// -----------------------------------------------------------------------

let staticCount = 0;
let categoryCount = 0;
let postCount = 0;

routes.forEach((route) => {
  const html = buildRouteHtml(route);
  const outputPath =
    route.path === "/"
      ? resolve(distDir, "index.html")
      : resolve(distDir, route.path.slice(1), "index.html");

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, html, "utf8");

  if (route.article) postCount++;
  else if (route.path.startsWith("/blog/")) categoryCount++;
  else staticCount++;
});

console.log(`✓ prerender complete → ${routes.length} HTML files`);
console.log(`  · ${staticCount} static pages`);
console.log(`  · ${categoryCount} blog categories`);
console.log(`  · ${postCount} blog posts`);
