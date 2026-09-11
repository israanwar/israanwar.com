export const BLOG_ARTWORK_THEMES = Object.freeze([
  "#240b18", "#321020", "#411526", "#541a2b", "#681e30", "#7b2939",
  "#260d2e", "#35103d", "#48134f", "#5a1760", "#6c1d6f", "#7d287f",
  "#2b1017", "#3d161b", "#51201f", "#662a25", "#7b352b", "#914332",
  "#25100f", "#381814", "#4c2119", "#612d20", "#773a29", "#8e4933",
]);

export const BLOG_ARTWORK_ICON_NAMES = Object.freeze([
  "ShieldCheck", "Code2", "BarChart3", "FileSearch2", "Globe2", "Megaphone",
  "Palette", "Bot", "Sparkles", "ShoppingBag", "Landmark", "BookOpen",
  "Brain", "Compass", "Users", "Rocket", "BriefcaseBusiness", "Lightbulb",
  "Network", "PenTool", "Scale", "Cpu", "Gem", "Search",
]);

export const BLOG_ARTWORK_COUNT = BLOG_ARTWORK_ICON_NAMES.length;

function normalizeArtworkIndex(index = 0) {
  const safeIndex = Number.isFinite(index) && index >= 0 ? Math.floor(index) : 0;
  return safeIndex % BLOG_ARTWORK_COUNT;
}

export function getBlogArtworkDescriptor(index = 0) {
  const normalizedIndex = normalizeArtworkIndex(index);
  return {
    theme: BLOG_ARTWORK_THEMES[normalizedIndex],
    iconName: BLOG_ARTWORK_ICON_NAMES[normalizedIndex],
  };
}

export function getBlogSocialArtworkPath(index = 0) {
  const artworkNumber = String(normalizeArtworkIndex(index) + 1).padStart(2, "0");
  return `/assets/blog/social/artwork-${artworkNumber}.png`;
}
