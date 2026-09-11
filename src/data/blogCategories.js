// 16 kategori resmi Blog Isra Anwar. Slug dipakai di URL `/blog/[slug]`,
// juga dipakai admin CMS untuk assign category ke tiap post.
// Susunan dan slug mengikuti spec resmi. Jangan ganti slug tanpa migrasi.

export const BLOG_CATEGORIES = [
  {
    slug: "search-optimization",
    name: "Search Optimization",
    short: "SEO, AEO & GEO",
    description: "Search Engine Optimization, Answer Engine Optimization, Generative Engine Optimization, Technical SEO, Entity SEO, Knowledge Graph, Search Strategy, AI Search Visibility, Structured Data, Search Experience.",
  },
  {
    slug: "ai-automation",
    name: "AI & Automation",
    short: "AI, Agent & Automation",
    description: "Artificial Intelligence, AI Workflow, AI Agent, Prompt Engineering, MCP, Business Automation, No-Code Automation, AI Productivity, AI Integration.",
  },
  {
    slug: "web-development",
    name: "Web Development",
    short: "Modern Web Stack",
    description: "Next.js, React, Laravel, WordPress, Headless CMS, API Development, UI Engineering, Performance Optimization, Security, Modern Web Architecture.",
  },
  {
    slug: "digital-marketing",
    name: "Digital Marketing",
    short: "Ads, Content & Funnels",
    description: "Google Ads, Meta Ads, TikTok Ads, Email Marketing, Content Marketing, Performance Marketing, Social Media Marketing, Funnel Strategy.",
  },
  {
    slug: "branding-marketing-selling",
    name: "Branding, Marketing & Selling",
    short: "Positioning & Growth",
    description: "Branding Strategy, Positioning, Marketing Strategy, Sales Strategy, Customer Psychology, Copywriting, Personal Branding, Business Growth.",
  },
  {
    slug: "e-commerce",
    name: "E-Commerce",
    short: "Online Store & Marketplace",
    description: "Shopify, WooCommerce, Marketplace, Digital Products, Online Business, E-Commerce CRO, Payment System, Customer Journey.",
  },
  {
    slug: "analytics-cro",
    name: "Analytics & CRO",
    short: "Data & Conversion",
    description: "Google Analytics, Search Console, Dashboard, Heatmaps, Data Analytics, A/B Testing, Conversion Rate Optimization, Business Intelligence.",
  },
  {
    slug: "case-studies",
    name: "Case Studies",
    short: "Real Projects & Experiments",
    description: "Project case studies, website audits, AI implementation, SEO growth, website development, digital transformation, before-after analysis, experiments, and real lessons learned.",
  },
  {
    slug: "business-strategy",
    name: "Business & Strategy",
    short: "Strategy & Entrepreneurship",
    description: "Business Strategy, Entrepreneurship, Startup, Business Model, Innovation, Competitive Strategy, Digital Transformation, Strategic Planning.",
  },
  {
    slug: "management-leadership",
    name: "Management & Leadership",
    short: "Team & Decision",
    description: "Strategic Management, Leadership, Human Resource, Organizational Development, Productivity, Decision Making, Change Management.",
  },
  {
    slug: "technology-innovation",
    name: "Technology & Innovation",
    short: "Frontier Tech",
    description: "Artificial Intelligence, Cloud Computing, Cybersecurity, Emerging Technology, Software Engineering, Future Technology, Digital Innovation.",
  },
  {
    slug: "research-insights",
    name: "Research & Insights",
    short: "Evidence-Based",
    description: "Journal-based articles, literature reviews, white papers, research methodology, data analysis, research summaries, and evidence-based insights.",
  },
  {
    slug: "books-reviews",
    name: "Books & Reviews",
    short: "Books & Summaries",
    description: "Book reviews, book summaries, and insights from business, technology, management, psychology, economics, and biography literature.",
  },
  {
    slug: "economics-public-policy",
    name: "Economics & Public Policy",
    short: "Economy & Regulation",
    description: "Macroeconomics, digital economy, regulation, public policy, geopolitics, industry, investment, and their impact on business and technology.",
  },
  {
    slug: "opinion-philosophy",
    name: "Opinion & Philosophy",
    short: "Essay & Reflection",
    description: "Essays, opinions, philosophy, reflection, experience, strategic thinking, constructive criticism, predictions, and personal perspective.",
  },
  {
    slug: "company-news",
    name: "Company News",
    short: "Isra Anwar Updates",
    description: "Official Isra Anwar updates, service launches, new features, partnerships, events, company milestones, and other announcements.",
  },
];

// Convenience lookup by slug — pakai kalau resolve category dari post.
export const CATEGORY_BY_SLUG = Object.fromEntries(
  BLOG_CATEGORIES.map((c) => [c.slug, c])
);

// Default fallback kalau post belum di-assign kategori (backward compat).
export const DEFAULT_CATEGORY_SLUG = "opinion-philosophy";
