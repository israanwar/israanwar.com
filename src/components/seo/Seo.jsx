import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { site } from "../../data/site";
import { useLiveSettings } from "../../hooks/usePageData";
import { useI18n } from "../../lib/i18n";
import { localizeSiteDescription } from "../../lib/pageI18n";
import {
  getSocialImageUrl,
  getSocialSiteName,
  SOCIAL_CARD_HEIGHT,
  SOCIAL_CARD_WIDTH,
} from "../../lib/socialMeta";
import {
  buildOrganization,
  buildWebsite,
  buildBreadcrumb,
  buildArticle,
  buildFaqPage,
  buildWebPage,
  buildPerson,
  buildProfessionalService,
} from "../../lib/structuredData";

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });
}

function upsertLink(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });
}

function removeMeta(selector) {
  document.head.querySelector(selector)?.remove();
}

// Upsert JSON-LD script tag di <head>. Idempotent via data-schema
// attribute — kalau schema dengan nama sama sudah ada, isinya di-replace.
// Kalau content = null, script di-remove (untuk halaman yang nggak perlu
// schema tertentu, misal Article schema di halaman non-blog).
function upsertJsonLd(schemaName, content) {
  const selector = `script[type="application/ld+json"][data-schema="${schemaName}"]`;
  let element = document.head.querySelector(selector);

  if (content === null || content === undefined) {
    if (element) element.remove();
    return;
  }

  if (!element) {
    element = document.createElement("script");
    element.setAttribute("type", "application/ld+json");
    element.setAttribute("data-schema", schemaName);
    document.head.appendChild(element);
  }

  element.textContent = JSON.stringify(content);
}

function makeCanonicalUrl(pathname) {
  const normalizedPath = pathname && pathname !== "/" ? pathname.replace(/\/+$/, "") : "/";
  return new URL(normalizedPath, site.url).toString();
}

function normalizePageTitle(title) {
  const cleanTitle = title?.trim();
  if (!cleanTitle) return "";

  return cleanTitle
    .replace(/\s+(?:[—\-|·]\s*)?(?:isra\s+anwar|israanwar)$/i, "")
    .trim();
}

// `article` prop opsional — kalau di-provide (dari BlogDetailPage),
// akan inject Article schema. Shape: { post, category }.
export function Seo({
  title,
  description,
  path,
  noindex = false,
  article = null,
  socialTitle = null,
  socialImage = null,
}) {
  const location = useLocation();
  const settings = useLiveSettings();
  const { lang } = useI18n();
  const siteName = settings.seo_default_title || settings.site_name || site.name;
  const metaDescription = description
    ? localizeSiteDescription(description, lang)
    : localizeSiteDescription(
      settings.seo_default_description || settings.description || site.description,
      lang,
      settings.seo_default_description_id || settings.description_id,
    );

  useEffect(() => {
    const canonicalUrl = makeCanonicalUrl(path || location.pathname);
    const cleanTitle = normalizePageTitle(title);
    const pageTitle = cleanTitle && cleanTitle.toLowerCase() !== siteName.toLowerCase()
      ? `${cleanTitle} | ${siteName}`
      : siteName;
    const shareTitle = socialTitle?.trim() || pageTitle;
    const shareImage = socialImage ? getSocialImageUrl(socialImage) : null;
    const robots = noindex ? "noindex, nofollow" : "index, follow";

    document.title = pageTitle;

    upsertMeta('meta[name="description"]', { name: "description", content: metaDescription });
    upsertMeta('meta[name="robots"]', { name: "robots", content: robots });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: article?.post ? "article" : "website" });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: settings.site_name || getSocialSiteName() });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: shareTitle });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: metaDescription });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: shareImage ? "summary_large_image" : "summary" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: shareTitle });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: metaDescription });
    upsertLink('link[rel="canonical"]', { rel: "canonical", href: canonicalUrl });

    if (shareImage) {
      upsertMeta('meta[property="og:image"]', { property: "og:image", content: shareImage });
      upsertMeta('meta[property="og:image:secure_url"]', { property: "og:image:secure_url", content: shareImage });
      upsertMeta('meta[property="og:image:type"]', { property: "og:image:type", content: "image/png" });
      upsertMeta('meta[property="og:image:width"]', { property: "og:image:width", content: String(SOCIAL_CARD_WIDTH) });
      upsertMeta('meta[property="og:image:height"]', { property: "og:image:height", content: String(SOCIAL_CARD_HEIGHT) });
      upsertMeta('meta[property="og:image:alt"]', { property: "og:image:alt", content: shareTitle });
      upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: shareImage });
      upsertMeta('meta[name="twitter:image:alt"]', { name: "twitter:image:alt", content: shareTitle });
    } else {
      removeMeta('meta[property="og:image"]');
      removeMeta('meta[property="og:image:secure_url"]');
      removeMeta('meta[property="og:image:type"]');
      removeMeta('meta[property="og:image:width"]');
      removeMeta('meta[property="og:image:height"]');
      removeMeta('meta[property="og:image:alt"]');
      removeMeta('meta[name="twitter:image"]');
      removeMeta('meta[name="twitter:image:alt"]');
    }

    // ==============================================================
    // JSON-LD structured data (SEO / GEO / AEO). Semua idempotent via
    // data-schema attribute. Kalau halaman noindex, semua schema di-clear
    // supaya nggak ngasih sinyal ke crawler.
    // ==============================================================
    if (noindex) {
      upsertJsonLd("organization", null);
      upsertJsonLd("website", null);
      upsertJsonLd("breadcrumb", null);
      upsertJsonLd("article", null);
      upsertJsonLd("faq", null);
      upsertJsonLd("webpage", null);
      upsertJsonLd("person", null);
      upsertJsonLd("service", null);
      return;
    }

    // Global entities — di-inject di semua halaman supaya AI systems dan
    // Google Knowledge Graph tahu ini brand + person + service yang sama
    // di setiap page. WebPage adds per-page Speakable spec for AEO.
    upsertJsonLd("organization", buildOrganization(settings));
    upsertJsonLd("website", buildWebsite(settings));
    upsertJsonLd("person", buildPerson(settings));
    upsertJsonLd("service", buildProfessionalService(settings));
    upsertJsonLd(
      "webpage",
      buildWebPage(path || location.pathname, pageTitle, metaDescription, settings),
    );

    // Per-page: BreadcrumbList (auto dari pathname).
    // Untuk blog detail, currentTitle = post title supaya breadcrumb
    // bilang "Home > Blog > Website yang Tajam" (bukan slug mentah).
    const currentTitle = article?.post?.title || cleanTitle || null;
    upsertJsonLd(
      "breadcrumb",
      buildBreadcrumb(path || location.pathname, currentTitle, settings)
    );

    // Article schema — cuma di halaman post detail (kalau prop dikasih).
    if (article?.post) {
      upsertJsonLd(
        "article",
        buildArticle(article.post, article.category, settings, shareImage)
      );
      // FAQPage schema — kalau post punya faqs array. buildFaqPage return
      // null kalau array kosong, upsertJsonLd handle null dengan remove tag.
      upsertJsonLd("faq", buildFaqPage(article.post.faqs));
    } else {
      upsertJsonLd("article", null);
      upsertJsonLd("faq", null);
    }
  }, [location.pathname, metaDescription, noindex, path, siteName, title, article, settings, socialTitle, socialImage]);

  return null;
}
