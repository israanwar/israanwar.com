export const SERVICE_FOLDER_VISUALS = [
  {
    slug: "web-development",
    gradient: "linear-gradient(145deg, #72A7FF, #AFCBFF)",
    accent: "#AFCBFF",
  },
  {
    slug: "ui-ux-design",
    gradient: "linear-gradient(145deg, #C7B5FF, #EEE9FF)",
    accent: "#EEE9FF",
  },
  {
    slug: "search-optimization",
    gradient: "linear-gradient(145deg, #55C9B5, #A5E4D8)",
    accent: "#A5E4D8",
  },
  {
    slug: "ai-automation",
    gradient: "linear-gradient(145deg, #7357B5, #B397E8)",
    accent: "#B397E8",
  },
  {
    slug: "branding-marketing-selling",
    gradient: "linear-gradient(145deg, #E68FB5, #F4BDD3)",
    accent: "#F4BDD3",
  },
  {
    slug: "content-creative",
    gradient: "linear-gradient(145deg, #D6A56F, #F1D1A8)",
    accent: "#F1D1A8",
  },
  {
    slug: "mobile-app-development",
    gradient: "linear-gradient(145deg, #49BCD8, #A8E8F4)",
    accent: "#A8E8F4",
  },
  {
    slug: "e-commerce-solutions",
    gradient: "linear-gradient(145deg, #E98453, #FFD1AF)",
    accent: "#FFD1AF",
  },
  {
    slug: "analytics-data-intelligence",
    gradient: "linear-gradient(145deg, #8196AF, #D3DFEC)",
    accent: "#D3DFEC",
  },
  {
    slug: "digital-systems",
    gradient: "linear-gradient(145deg, #CB6579, #F1A8B4)",
    accent: "#F1A8B4",
  },
  {
    slug: "strategy-digital-transformation",
    gradient: "linear-gradient(145deg, #A2B65A, #DDEAA8)",
    accent: "#DDEAA8",
  },
  {
    slug: "support-growth",
    gradient: "linear-gradient(145deg, #6373C6, #B9C3F5)",
    accent: "#B9C3F5",
  },
];

export function getServiceFolderVisual(slug, index = 0, total = 1) {
  const parent = SERVICE_FOLDER_VISUALS.find(visual => visual.slug === slug) || SERVICE_FOLDER_VISUALS[0];
  const base = parent.gradient.match(/#[0-9A-F]{6}/i)[0];
  const position = total > 1 ? index / (total - 1) : 0.5;
  const shade = 82 + position * 18;
  const tint = 98 - position * 16;
  return {
    gradient: `linear-gradient(145deg, color-mix(in srgb, ${base} ${shade}%, black), color-mix(in srgb, ${parent.accent} ${tint}%, white))`,
    accent: parent.accent,
  };
}
