// Structured-data builders — pure functions yang return JSON-LD object
// siap di-stringify. Dipakai di src/components/seo/Seo.jsx dan
// scripts/generate-sitemap.mjs (indirectly). Tidak menyentuh DOM.
//
// Kenapa struktur ini penting:
// - SEO: rich result eligibility di Google (breadcrumb, article snippet).
// - GEO: AI crawler (GPTBot, ClaudeBot, PerplexityBot) pakai schema.org
//   untuk memahami entity + relationship di halaman.
// - AEO: BreadcrumbList + Article schema meningkatkan chance halaman
//   muncul di "People also ask" / featured snippet.

import { site as SITE } from "../data/site.js";

// Ambil canonical base URL (support settings override kalau nanti ada
// custom domain). Fallback ke site.url dari data/site.js.
function siteUrl(settings) {
  return (settings?.site_url || SITE.url).replace(/\/+$/, "");
}

// Absolute-ize path (leading /).
function absoluteUrl(path, settings) {
  if (!path) return siteUrl(settings);
  if (path.startsWith("http")) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl(settings)}${clean}`;
}

// ==================================================================
// Organization — dipasang global di semua halaman. Bikin brand terlihat
// sebagai entity di Google Knowledge Graph + AI systems.
// ==================================================================
export function buildOrganization(settings) {
  const url = siteUrl(settings);
  const name = settings?.site_name || SITE.name;
  const description = settings?.description || SITE.description;

  const sameAs = [
    settings?.social_linkedin,
    settings?.social_github,
    settings?.social_instagram,
    settings?.social_twitter,
  ].filter(Boolean);

  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${url}/#organization`,
    name,
    url,
    description,
    logo: {
      "@type": "ImageObject",
      url: `${url}/assets/brand/favicon-ia-v2.png`,
    },
  };

  if (sameAs.length > 0) org.sameAs = sameAs;
  if (settings?.email) org.email = settings.email;
  if (settings?.whatsapp_number) {
    org.telephone = settings.whatsapp_number;
  }

  return org;
}

// ==================================================================
// WebSite + SearchAction — bikin sitelinks searchbox eligible di Google.
// Blog search di /blog?q= dipakai sebagai search endpoint.
// ==================================================================
export function buildWebsite(settings) {
  const url = siteUrl(settings);
  const name = settings?.site_name || SITE.name;

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}/#website`,
    name,
    url,
    inLanguage: "id-ID",
    publisher: { "@id": `${url}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/blog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ==================================================================
// BreadcrumbList — derived dari pathname. Simple heuristic:
// /blog/[slug] → Home > Blog > [pageTitle]
// /blog → Home > Blog
// /about → Home > About
// pageTitle di-inject kalau kita punya (blog detail, category).
// ==================================================================
const PATH_LABELS = {
  blog: "Blog",
  about: "Tentang",
  services: "Layanan",
  portfolio: "Portfolio",
  store: "Store",
  contact: "Kontak",
  sitemap: "Sitemap",
  privacy: "Privacy Policy",
  terms: "Terms of Service",
};

export function buildBreadcrumb(pathname, currentTitle, settings) {
  const url = siteUrl(settings);
  const segments = (pathname || "/").split("/").filter(Boolean);
  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Beranda",
      item: `${url}/`,
    },
  ];

  let cumulative = "";
  segments.forEach((seg, idx) => {
    cumulative += `/${seg}`;
    const isLast = idx === segments.length - 1;
    // Pakai currentTitle untuk segmen terakhir kalau di-provide.
    const name = isLast && currentTitle
      ? currentTitle
      : (PATH_LABELS[seg] || seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
    items.push({
      "@type": "ListItem",
      position: idx + 2,
      name,
      item: `${url}${cumulative}`,
    });
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

// ==================================================================
// Article / BlogPosting — schema untuk blog post detail.
// Menyertakan author, publisher, datePublished, dateModified,
// image, articleSection (kategori), wordCount (approx dari reading time).
// ==================================================================
export function buildArticle(post, category, settings, socialImage = null) {
  const url = siteUrl(settings);
  const canonicalPath = post.canonical_path || `/blog/${post.slug}`;
  const canonical = absoluteUrl(canonicalPath, settings);

  // Author display — sistem ini masih single-author. Kalau nanti multi,
  // resolve via usersRepo.
  const authorName = post.author_name || "Isra Anwar";

  // Cover image — pakai cover_url kalau ada; kalau belum, pakai social
  // card 1200×630 yang juga dipakai LinkedIn/X supaya crawler menerima
  // gambar artikel yang benar, bukan favicon kecil.
  const imageUrl = post.cover_url
    ? absoluteUrl(post.cover_url, settings)
    : socialImage
      ? absoluteUrl(socialImage, settings)
      : `${url}/assets/social/israanwar-blog-share.png`;

  // Approximate word count dari reading_time (200 wpm).
  const wordCount = post.reading_time ? post.reading_time * 200 : undefined;

  const article = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${canonical}#article`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
    headline: post.title,
    description: post.meta_description || post.excerpt,
    inLanguage: "id-ID",
    url: canonical,
    image: {
      "@type": "ImageObject",
      url: imageUrl,
    },
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    author: {
      "@type": "Person",
      name: authorName,
      url: `${url}/about`,
    },
    publisher: { "@id": `${url}/#organization` },
    keywords: [post.focus_keyword, ...(post.tags || [])].filter(Boolean).join(", "),
  };

  if (category?.name) {
    article.articleSection = category.name;
  }
  if (wordCount) {
    article.wordCount = wordCount;
  }

  // Speakable — bagian mana dari artikel yang layak dibacakan voice
  // assistant. Kita target title + excerpt paragraph + heading level 2.
  article.speakable = {
    "@type": "SpeakableSpecification",
    cssSelector: [".okr__post-title", ".okr__post-excerpt", ".okr__h2"],
  };

  return article;
}

// ==================================================================
// WebPage + Speakable — inject per-page. Speakable memberitahu voice
// assistants (Google Assistant, Siri lewat schema pickup, dsb) bagian
// halaman mana yang layak dibacakan. Kita target elemen dengan
// class `.okr__h2` dan `.okr__hero-title` — heading + subtitle utama.
//
// AEO angle: halaman dengan Speakable schema lebih mudah muncul di
// hasil "read aloud" / voice answer.
// ==================================================================
export function buildWebPage(pathname, pageTitle, description, settings) {
  const url = siteUrl(settings);
  const canonical = pathname === "/" ? `${url}/` : `${url}${pathname}`;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonical}#webpage`,
    url: canonical,
    name: pageTitle,
    description,
    inLanguage: "id-ID",
    isPartOf: { "@id": `${url}/#website` },
    about: { "@id": `${url}/#organization` },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${url}/assets/brand/favicon-ia-v2.png`,
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".okr__hero-title", ".okr__hero-sub", ".okr__h2"],
    },
  };
}

// ==================================================================
// Person — founder / owner schema. Dipakai di /about + di publisher
// context artikel. Bikin author trust naik di AI answer engine — GPT,
// Claude, Perplexity semua ambil sinyal "who wrote this" dari Person.
// ==================================================================
export function buildPerson(settings) {
  const url = siteUrl(settings);
  const founderName = settings?.founder_name || "Isra Anwar";

  const sameAs = [
    settings?.social_linkedin,
    settings?.social_github,
    settings?.social_instagram,
    settings?.social_twitter,
  ].filter(Boolean);

  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${url}/#founder`,
    name: founderName,
    url: `${url}/about`,
    jobTitle: "Digital Consultant",
    worksFor: { "@id": `${url}/#organization` },
    image: `${url}/assets/brand/favicon-ia-v2.png`,
  };

  if (sameAs.length > 0) person.sameAs = sameAs;

  return person;
}

// ==================================================================
// ProfessionalService — spesifikasi bisnis lo. Lebih spesifik dari
// Organization saja; Google & AI engine pakai ini buat memahami
// service catalog + service area.
// ==================================================================
export function buildProfessionalService(settings) {
  const url = siteUrl(settings);
  const name = settings?.site_name || SITE.name;
  const description = settings?.description || SITE.description;

  const service = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${url}/#service`,
    name,
    url,
    description,
    provider: { "@id": `${url}/#organization` },
    serviceType: [
      "Web Development",
      "Search Engine Optimization",
      "AI Workflow Consulting",
      "Content Strategy",
    ],
    areaServed: {
      "@type": "Country",
      name: "Indonesia",
    },
  };

  if (settings?.email) service.email = settings.email;
  return service;
}

// ==================================================================
// FAQPage — untuk section "Pertanyaan yang sering muncul" di artikel.
// Bikin post eligible untuk "People also ask" & featured snippet di Google.
// AI answer engine (GPTBot, ClaudeBot, PerplexityBot) juga pakai FAQ schema
// buat direct-answer extraction.
//
// Input: array [{ question, answer }]. Kembalikan null kalau kosong
// supaya Seo.jsx bisa clear schema tag tanpa error.
// ==================================================================
export function buildFaqPage(faqs) {
  if (!Array.isArray(faqs) || faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}
