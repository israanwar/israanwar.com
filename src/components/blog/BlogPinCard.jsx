import { Link } from "react-router-dom";
import {
  BarChart3,
  Bot,
  BookOpen,
  Code2,
  Compass,
  FileText,
  FlaskConical,
  Landmark,
  Lightbulb,
  Megaphone,
  MessageCircle,
  Newspaper,
  Search,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react";
import { CATEGORY_BY_SLUG, DEFAULT_CATEGORY_SLUG } from "../../data/blogCategories";
import { localizeBlogCategory } from "../../lib/blogCategoryI18n";

// One small icon per category, purely decorative next to the label on each
// pin card — matches the visual language of the Certifications board.
const BLOG_CATEGORY_ICONS = {
  "search-optimization": Search,
  "ai-automation": Bot,
  "web-development": Code2,
  "digital-marketing": Megaphone,
  "branding-marketing-selling": Sparkles,
  "e-commerce": ShoppingCart,
  "analytics-cro": BarChart3,
  "case-studies": FileText,
  "business-strategy": Compass,
  "management-leadership": Users,
  "technology-innovation": Lightbulb,
  "research-insights": FlaskConical,
  "books-reviews": BookOpen,
  "economics-public-policy": Landmark,
  "opinion-philosophy": MessageCircle,
  "company-news": Newspaper,
};

// Small, fixed per-card tilt/lift so the grid reads as an organic pinboard
// rather than a perfect grid — same technique as the Certifications board,
// deliberately modest so a title never risks overlapping its neighbor.
const BLOG_PIN_TILT = [-2.4, 1.8, -1.6, 2.2, -2, 1.4, -1.8, 2];
const BLOG_PIN_LIFT = [0, 10, 4, 14, 2, 8, 5, 12];

// Shared between the homepage "Latest notes" section and the full /blog
// listing page — same pinboard style everywhere a post appears as a card.
export function BlogPinCard({ post, index, lang, t }) {
  const rawCategory = CATEGORY_BY_SLUG[post.category] ?? CATEGORY_BY_SLUG[DEFAULT_CATEGORY_SLUG];
  const category = localizeBlogCategory(rawCategory, lang);
  const Icon = BLOG_CATEGORY_ICONS[rawCategory?.slug] || FileText;

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="okr__blog-pin-card"
      style={{
        "--tilt": `${BLOG_PIN_TILT[index % BLOG_PIN_TILT.length]}deg`,
        "--lift": `${BLOG_PIN_LIFT[index % BLOG_PIN_LIFT.length]}px`,
      }}
      aria-label={`${post.title} — ${category?.name || t("blog_all")}`}
    >
      <span className="okr__blog-pin-dot" aria-hidden="true" />
      <span className="okr__blog-pin-category">
        <Icon size={13} aria-hidden="true" />
        {category?.name || t("blog_all")}
      </span>
      <h3 className="okr__blog-pin-title">{post.title}</h3>
      <span className="okr__blog-pin-index" aria-hidden="true">[ {index + 1} ]</span>
    </Link>
  );
}
