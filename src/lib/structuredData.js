// JSON-LD describes the visible content, publisher, and author. It does
// not guarantee rich results, indexing, or citations by answer engines.

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
// WebSite identifies the publisher and supported languages. Do not declare
// a SearchAction: the blog does not implement the advertised ?q= endpoint.
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
    inLanguage: ["en", "id-ID"],
    publisher: { "@id": `${url}/#organization` },
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

  // Count the actual article text rather than infer it from reading time.
  function contentText(node) {
    if (typeof node === "string") return node.replace(/<[^>]*>/g, " ");
    if (!node) return "";
    return [node.text || "", ...(node.content || []).map(contentText)].join(" ");
  }
  const wordCount = contentText(post.content).trim().split(/\s+/u).filter(Boolean).length;

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
    inLanguage: (post.language || "id") === "id" ? "id-ID" : post.language,
    url: canonical,
    image: {
      "@type": "ImageObject",
      url: imageUrl,
    },
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    author: {
      "@type": "Person",
      ...(authorName === "Isra Anwar" ? { "@id": `${url}/#founder` } : {}),
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

  return article;
}

// Page metadata follows the content language and canonical URL.
export function buildWebPage(pathname, pageTitle, description, settings, language = "en", image = null) {
  const url = siteUrl(settings);
  const canonical = pathname === "/" ? `${url}/` : `${url}${pathname}`;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonical}#webpage`,
    url: canonical,
    name: pageTitle,
    description,
    inLanguage: language === "id" ? "id-ID" : language,
    isPartOf: { "@id": `${url}/#website` },
    about: { "@id": `${url}/#organization` },
    ...(image ? { primaryImageOfPage: {
      "@type": "ImageObject",
      url: absoluteUrl(image, settings),
    } } : {}),
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
    "@type": "Service",
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

// FAQPage describes questions and answers visibly included in the article.
// Google no longer displays FAQ rich results; this is semantic markup.
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

// A detail page describes the service shown on that page. Starting prices
// require a scope quote, so they are not advertised as fixed-price Offers.
export function buildService(service, settings, language = "en") {
  if (!service || service.kind === "category") return null;
  const url = absoluteUrl(`/services/${service.slug}`, settings);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    url,
    name: service.name,
    description: service.description || service.tagline || service.body,
    serviceType: service.name,
    provider: { "@id": `${siteUrl(settings)}/#organization` },
    areaServed: { "@type": "Country", name: "Indonesia" },
    mainEntityOfPage: { "@id": `${url}#webpage` },
  };
}

export function buildProduct(product, settings, image = null) {
  if (!product) return null;
  const url = absoluteUrl(`/store/${product.slug}`, settings);
  const price = Number(product.price);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    url,
    name: product.name,
    description: product.description,
    ...(image ? { image: absoluteUrl(image, settings) } : {}),
    ...(Number.isFinite(price) && product.price !== null && product.price !== undefined && price >= 0 ? {
      offers: {
        "@type": "Offer",
        url,
        price: String(price),
        priceCurrency: "IDR",
        seller: { "@id": `${siteUrl(settings)}/#organization` },
      },
    } : {}),
  };
}
