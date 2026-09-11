import {
  AppWindow,
  BarChart3,
  Blocks,
  Bot,
  Braces,
  BriefcaseBusiness,
  Building2,
  ChartNoAxesCombined,
  Code2,
  Compass,
  Database,
  FileCog,
  FileText,
  GalleryVerticalEnd,
  Gauge,
  Globe2,
  LayoutTemplate,
  Megaphone,
  Palette,
  PanelsTopLeft,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Workflow,
  Wrench,
} from "lucide-react";

const CATEGORY_ICONS = {
  "web-development": Code2,
  "mobile-app-development": Smartphone,
  "ui-ux-design": Palette,
  "search-optimization": Search,
  "ai-automation": Bot,
  "branding-marketing-selling": Megaphone,
  "content-creative": FileText,
  "e-commerce-solutions": ShoppingCart,
  "analytics-data-intelligence": BarChart3,
  "digital-systems": Settings,
  "strategy-digital-transformation": Compass,
  "support-growth": Wrench,
};

const CATEGORY_ORDER = Object.keys(CATEGORY_ICONS);

const CHILD_ICONS = [
  PanelsTopLeft,
  Building2,
  Braces,
  LayoutTemplate,
  GalleryVerticalEnd,
  BriefcaseBusiness,
  AppWindow,
  Database,
  Blocks,
  FileCog,
  RefreshCw,
  Gauge,
  ShieldCheck,
  Workflow,
  ChartNoAxesCombined,
];

export function getServiceCategoryIcon(slug) {
  return CATEGORY_ICONS[slug] || Globe2;
}

export function getServiceChildIcon(index, parentSlug) {
  const categoryOffset = Math.max(0, CATEGORY_ORDER.indexOf(parentSlug));
  return CHILD_ICONS[(index + categoryOffset) % CHILD_ICONS.length];
}
