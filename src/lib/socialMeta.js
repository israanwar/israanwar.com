import { site } from "../data/site";

// Generic brand share card — used as the fallback og:image/twitter:image for
// every page that doesn't have a more specific one (Home, Services, Store,
// About, Contact, Tools, Portfolio, legal pages…) and as blog's own
// last-resort behind post cover art and per-post generated artwork. Matches
// the site's current dark/Sun/lavender identity (see Seo.jsx). The older
// "blog-share" asset (still on disk, unused) was blog-specific copy
// ("ISRA ANWAR JOURNAL") and a plain white mark predating the black-badge
// logo, so it wasn't right as a sitewide default.
export const SOCIAL_CARD_PATH = "/assets/social/israanwar-social-share.png";
export const SOCIAL_CARD_WIDTH = 1200;
export const SOCIAL_CARD_HEIGHT = 630;
export const SOCIAL_PREVIEW_VERSION = "article-artwork-v1";

export function getSocialImageUrl(imagePath = SOCIAL_CARD_PATH) {
  return new URL(imagePath, site.url).toString();
}

export function getSocialSiteName() {
  return site.domain.replace(/^www\./i, "");
}

export function getBlogShareUrl(path) {
  const url = new URL(path || "/blog", site.url);
  if (!url.pathname.endsWith("/")) url.pathname = `${url.pathname}/`;
  url.searchParams.set("share", SOCIAL_PREVIEW_VERSION);
  return url.toString();
}
