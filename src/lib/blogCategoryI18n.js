const BLOG_CATEGORY_ID = {
  "search-optimization": {
    name: "Optimasi Pencarian",
    short: "SEO, AEO & GEO",
    description: "Search Engine Optimization, Answer Engine Optimization, Generative Engine Optimization, technical SEO, entity SEO, knowledge graph, strategi search, visibilitas AI search, structured data, dan pengalaman pencarian.",
  },
  "ai-automation": {
    name: "AI & Otomasi",
    short: "AI, Agent & Automation",
    description: "Artificial Intelligence, workflow AI, AI agent, prompt engineering, MCP, otomasi bisnis, no-code automation, produktivitas AI, dan integrasi AI untuk pekerjaan nyata.",
  },
  "web-development": {
    name: "Pengembangan Web",
    short: "Modern Web Stack",
    description: "Next.js, React, Laravel, WordPress, headless CMS, API development, UI engineering, optimasi performa, keamanan, dan arsitektur web modern.",
  },
  "digital-marketing": {
    name: "Digital Marketing",
    short: "Ads, Content & Funnels",
    description: "Google Ads, Meta Ads, TikTok Ads, email marketing, content marketing, performance marketing, social media marketing, dan strategi funnel.",
  },
  "branding-marketing-selling": {
    name: "Branding, Marketing & Selling",
    short: "Positioning & Growth",
    description: "Strategi branding, positioning, marketing strategy, sales strategy, psikologi pelanggan, copywriting, personal branding, dan pertumbuhan bisnis.",
  },
  "e-commerce": {
    name: "E-Commerce",
    short: "Toko Online & Marketplace",
    description: "Shopify, WooCommerce, marketplace, produk digital, bisnis online, CRO e-commerce, payment system, dan customer journey.",
  },
  "analytics-cro": {
    name: "Analytics & CRO",
    short: "Data & Conversion",
    description: "Google Analytics, Search Console, dashboard, heatmap, data analytics, A/B testing, conversion rate optimization, dan business intelligence.",
  },
  "case-studies": {
    name: "Studi Kasus",
    short: "Proyek & Eksperimen Nyata",
    description: "Studi kasus proyek, audit website, implementasi AI, pertumbuhan SEO, pengembangan website, transformasi digital, analisis before-after, eksperimen, dan pelajaran dari pekerjaan nyata.",
  },
  "business-strategy": {
    name: "Bisnis & Strategi",
    short: "Strategy & Entrepreneurship",
    description: "Strategi bisnis, entrepreneurship, startup, model bisnis, inovasi, competitive strategy, transformasi digital, dan strategic planning.",
  },
  "management-leadership": {
    name: "Manajemen & Kepemimpinan",
    short: "Team & Decision",
    description: "Strategic management, leadership, human resource, organizational development, produktivitas, decision making, dan change management.",
  },
  "technology-innovation": {
    name: "Teknologi & Inovasi",
    short: "Frontier Tech",
    description: "Artificial Intelligence, cloud computing, cybersecurity, emerging technology, software engineering, future technology, dan inovasi digital.",
  },
  "research-insights": {
    name: "Riset & Insight",
    short: "Evidence-Based",
    description: "Artikel berbasis jurnal, literature review, white paper, metodologi penelitian, analisis data, ringkasan riset, dan insight berbasis bukti.",
  },
  "books-reviews": {
    name: "Buku & Review",
    short: "Books & Summaries",
    description: "Review buku, ringkasan buku, dan insight dari literatur bisnis, teknologi, manajemen, psikologi, ekonomi, dan biografi.",
  },
  "economics-public-policy": {
    name: "Ekonomi & Kebijakan Publik",
    short: "Economy & Regulation",
    description: "Makroekonomi, ekonomi digital, regulasi, kebijakan publik, geopolitik, industri, investasi, dan dampaknya pada bisnis serta teknologi.",
  },
  "opinion-philosophy": {
    name: "Opini & Filosofi",
    short: "Essay & Reflection",
    description: "Esai, opini, filosofi, refleksi, pengalaman, strategic thinking, kritik konstruktif, prediksi, dan perspektif personal.",
  },
  "company-news": {
    name: "Kabar Isra Anwar",
    short: "Update Isra Anwar",
    description: "Update resmi Isra Anwar, peluncuran layanan, fitur baru, partnership, event, milestone perusahaan, dan pengumuman lain.",
  },
};

export function localizeBlogCategory(category, lang) {
  if (!category || lang !== "id") return category;
  const copy = BLOG_CATEGORY_ID[category.slug];
  if (!copy) return category;
  return { ...category, ...copy };
}

export function localizeBlogCategories(categories, lang) {
  return categories.map((category) => localizeBlogCategory(category, lang));
}
