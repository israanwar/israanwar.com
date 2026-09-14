import { useMemo } from "react";
import {
  useLivePage,
  useLivePosts,
  useLiveProducts,
  useLiveServices,
  useLiveSettings,
} from "./usePageData";
import { TOOLS_CATALOG, TOOLS_TOTAL_COUNT } from "../data/toolsCatalog";
import { BLOG_CATEGORIES } from "../data/blogCategories";
import { site } from "../data/site";

// Assembles everything Balao (the chat widget) is allowed to know, from the
// exact same live data sources every real page on the site already reads
// from — so its answers can never drift out of sync with what a visitor
// would see by actually browsing (edit a service in the admin CMS, Balao
// picks it up the same way ServicesPage.jsx does), and it can never leak
// anything that isn't already public (there's no separate/hidden data
// source here, just the public content hooks).
export function useBalaoKnowledge() {
  const rawServices = useLiveServices({ status: "active" });
  const posts = useLivePosts({ status: "published" });
  const products = useLiveProducts({ status: "active" });
  const about = useLivePage("about");
  const portfolio = useLivePage("portfolio");
  const settings = useLiveSettings();

  return useMemo(() => {
    const categories = rawServices
      .filter((s) => s.kind === "category")
      .map((cat) => ({
        slug: cat.slug,
        name: cat.name,
        tagline: cat.tagline || cat.body || "",
        children: rawServices
          .filter((s) => s.kind === "service" && s.parent_slug === cat.slug)
          .map((s) => s.name),
      }));

    // Individual child services (e.g. "On-Page SEO", "Technical SEO" under
    // Search Optimization) — kept separate from `categories` so Balao can
    // answer a specific-service question with that service's own
    // slug/tagline/description/deliverables instead of only the parent
    // category's generic overview.
    const services = rawServices
      .filter((s) => s.kind === "service")
      .map((s) => ({
        slug: s.slug,
        name: s.name,
        parentSlug: s.parent_slug,
        parentName: s.parent_name || "",
        tagline: s.tagline || "",
        description: s.description || s.body || "",
        deliverables: Array.isArray(s.deliverables) ? s.deliverables : [],
      }));

    return {
      categories,
      services,
      tools: TOOLS_CATALOG,
      toolsTotalCount: TOOLS_TOTAL_COUNT,
      blogCategories: BLOG_CATEGORIES,
      posts: posts.map((p) => ({
        title: p.title,
        excerpt: p.excerpt || "",
        category: p.category,
        slug: p.slug,
        tags: p.tags || [],
      })),
      products: products.map((p) => ({
        name: p.name,
        price: p.price ?? 0,
        description: p.description || "",
        slug: p.slug,
      })),
      about: {
        heroSubtitle: about?.hero_subtitle || "",
        storyTitle: about?.story_title || "",
        storyBody: about?.story_body || "",
        values: Array.isArray(about?.values) ? about.values : [],
      },
      portfolio: {
        heroSubtitle: portfolio?.hero_subtitle || "",
        coreExpertise: Array.isArray(portfolio?.core_expertise) ? portfolio.core_expertise : [],
        consulting: Array.isArray(portfolio?.consulting) ? portfolio.consulting : [],
        certifications: Array.isArray(portfolio?.certifications) ? portfolio.certifications : [],
      },
      contact: {
        email: settings?.email || "israanwarr@gmail.com",
        whatsappNumber: settings?.whatsapp_number || "",
        whatsappUrl: settings?.whatsapp_url || "https://wa.me/6282189594190",
      },
      site: {
        name: settings?.site_name || site.name,
        url: site.url,
        description: settings?.description || site.description,
      },
    };
  }, [rawServices, posts, products, about, portfolio, settings]);
}
