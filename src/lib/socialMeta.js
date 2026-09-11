import { site } from "../data/site";

export const SOCIAL_CARD_PATH = "/assets/social/israanwar-blog-share.png";
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
