const CATEGORY_MIN_WORDS = 300;
const SERVICE_MIN_WORDS = 820;

const SERVICE_CATEGORIES = [
  {
    slug: "web-development",
    name: "Web Development",
    icon: "code",
    tagline: "Enterprise-grade websites, platforms, and web applications built for trust, speed, and growth.",
    focus: "modern website engineering, scalable frontend architecture, content operations, technical SEO, accessibility, performance, conversion, maintainability, and long-term governance",
    outcomes: ["faster loading experiences", "cleaner information architecture", "stronger search visibility", "easier content management", "higher trust at the first visit"],
    services: [
      "Corporate Website Development",
      "Company Profile Website",
      "Custom Website Development",
      "Landing Page Development",
      "Portfolio Website Development",
      "Business Website Development",
      "Web Application Development",
      "CMS Development",
      "Headless CMS Development",
      "WordPress Development",
      "Website Migration & Modernization",
      "Website Maintenance",
    ],
  },
  {
    slug: "mobile-app-development",
    name: "Mobile App Development",
    icon: "code",
    tagline: "Mobile products that connect business goals, user behavior, and reliable engineering.",
    focus: "mobile product strategy, Android and iOS implementation, cross-platform delivery, app performance, product analytics, customer portals, internal workflow apps, and post-launch iteration",
    outcomes: ["clearer mobile product scope", "better user retention", "more reliable feature delivery", "cleaner customer access", "measurable app usage data"],
    services: [
      "Android App Development",
      "iOS App Development",
      "Cross-Platform App Development",
      "Progressive Web App (PWA)",
      "Business Mobile App",
      "E-Commerce Mobile App",
      "Customer Portal Mobile App",
      "Internal Company App",
      "Mobile App UI Redesign",
      "Mobile App Maintenance",
    ],
  },
  {
    slug: "ui-ux-design",
    name: "UI/UX Design",
    icon: "sparkles",
    tagline: "Interface and experience design that makes complex digital products feel obvious.",
    focus: "user research, interaction design, product usability, design systems, wireframes, prototypes, navigation structure, user flow clarity, and interface consistency",
    outcomes: ["lower user confusion", "cleaner task completion", "more consistent visual language", "faster product decisions", "interfaces that feel intentional"],
    services: [
      "UI Design",
      "UX Design",
      "UX Audit",
      "UI Audit",
      "Product Design",
      "Design System Development",
      "Wireframing",
      "Interactive Prototype",
      "User Flow Design",
      "Information Architecture",
    ],
  },
  {
    slug: "search-optimization",
    name: "Search Optimization",
    icon: "search",
    tagline: "SEO, AEO, GEO, and search visibility systems for brands that need to be found and trusted.",
    focus: "technical SEO, semantic search, entity strategy, structured data, search intent mapping, AI search visibility, answer engine optimization, local search, ecommerce SEO, and monitoring",
    outcomes: ["better crawlability", "stronger topical authority", "more qualified organic traffic", "clearer search intent coverage", "durable visibility across search surfaces"],
    services: [
      "SEO Audit",
      "Technical SEO",
      "On-Page SEO",
      "Off-Page SEO",
      "Local SEO",
      "International SEO",
      "Enterprise SEO",
      "E-Commerce SEO",
      "SEO Content Strategy",
      "Answer Engine Optimization (AEO)",
      "Generative Engine Optimization (GEO)",
      "Knowledge Graph Optimization",
      "Entity SEO",
      "SEO Recovery",
      "SEO Monitoring & Reporting",
    ],
  },
  {
    slug: "ai-automation",
    name: "AI & Automation",
    icon: "sparkles",
    tagline: "Practical AI systems that reduce operational drag without making the business weird.",
    focus: "AI strategy, workflow automation, AI agents, knowledge bases, document processing, customer support automation, prompt systems, integration design, and operational governance",
    outcomes: ["less repetitive work", "faster research and execution", "cleaner internal knowledge", "more consistent customer support", "safer AI adoption"],
    services: [
      "AI Strategy Consulting",
      "AI Workflow Automation",
      "AI Agent Development",
      "AI Chatbot Development",
      "Prompt Engineering",
      "Business Process Automation",
      "Workflow Integration",
      "Knowledge Base Development",
      "AI Document Processing",
      "AI Customer Support",
      "AI Content Workflow",
      "Custom AI Solution Development",
    ],
  },
  {
    slug: "branding-marketing-selling",
    name: "Branding, Marketing & Selling",
    icon: "zap",
    tagline: "Positioning, messaging, campaigns, and sales systems that make the market understand why you matter.",
    focus: "brand strategy, positioning, identity systems, marketing strategy, paid media, funnels, conversion optimization, personal branding, customer journey design, and sales development",
    outcomes: ["clearer market positioning", "stronger campaign messages", "better lead quality", "higher conversion confidence", "sales narratives that are easier to trust"],
    services: [
      "Brand Strategy",
      "Brand Identity",
      "Brand Positioning",
      "Marketing Strategy",
      "Digital Marketing Strategy",
      "Search Engine Marketing (SEM)",
      "Performance Marketing",
      "Social Media Marketing",
      "Content Marketing",
      "Email Marketing",
      "Sales Funnel Development",
      "Conversion Rate Optimization (CRO)",
      "Personal Branding",
      "Customer Journey Optimization",
      "Sales Strategy Development",
    ],
  },
  {
    slug: "content-creative",
    name: "Content & Creative",
    icon: "file-text",
    tagline: "Editorial, copy, and creative systems that turn expertise into market memory.",
    focus: "SEO content, website copy, editorial strategy, campaign planning, localization, blog operations, creative direction, conversion copy, content audits, and content optimization",
    outcomes: ["clearer editorial direction", "stronger organic content", "more persuasive web copy", "consistent brand voice", "content that supports sales instead of just filling a calendar"],
    services: [
      "SEO Content Writing",
      "Website Copywriting",
      "Content Strategy",
      "Editorial Planning",
      "Blog Management",
      "Content Localization",
      "Creative Campaign Planning",
      "Visual Content Design",
      "Landing Page Copywriting",
      "Email Copywriting",
      "Content Audit",
      "Content Optimization",
    ],
  },
  {
    slug: "e-commerce-solutions",
    name: "E-Commerce Solutions",
    icon: "code",
    tagline: "Commerce systems designed for trust, operational clarity, and repeatable revenue.",
    focus: "online store development, marketplace integration, digital products, subscription systems, payment gateways, inventory flows, order management, loyalty, checkout optimization, and customer experience",
    outcomes: ["more reliable checkout flow", "cleaner product operations", "better customer confidence", "less manual order handling", "commerce infrastructure ready to grow"],
    services: [
      "E-Commerce Website Development",
      "Marketplace Integration",
      "Digital Product Store",
      "Subscription Platform",
      "Membership Website",
      "Payment Gateway Integration",
      "Inventory System Integration",
      "Order Management System",
      "Customer Loyalty System",
      "Checkout Optimization",
      "Customer Experience Optimization",
      "E-Commerce Maintenance",
    ],
  },
  {
    slug: "analytics-data-intelligence",
    name: "Analytics & Data Intelligence",
    icon: "bar-chart",
    tagline: "Measurement systems that turn scattered activity into business intelligence.",
    focus: "GA4, Google Tag Manager, conversion tracking, dashboards, data visualization, marketing analytics, customer analytics, performance analysis, BI reporting, and data strategy",
    outcomes: ["cleaner measurement", "fewer reporting blind spots", "more useful dashboards", "better campaign decisions", "data that executives can actually use"],
    services: [
      "Google Analytics Setup",
      "Google Tag Manager Setup",
      "Conversion Tracking",
      "Dashboard Development",
      "Marketing Dashboard",
      "Business Intelligence Dashboard",
      "Data Visualization",
      "Customer Analytics",
      "Marketing Performance Analysis",
      "Data Strategy Consulting",
    ],
  },
  {
    slug: "digital-systems",
    name: "Digital Systems",
    icon: "settings",
    tagline: "Internal and customer-facing systems that make operations less dependent on memory.",
    focus: "CRM, ERP integration, portals, learning systems, membership platforms, booking systems, knowledge bases, internal dashboards, document management, and custom business systems",
    outcomes: ["less operational chaos", "clearer access to data", "better customer self-service", "more accountable workflows", "systems that support real work"],
    services: [
      "CRM Development",
      "ERP Integration",
      "Client Portal Development",
      "Customer Portal Development",
      "Employee Portal Development",
      "Learning Management System (LMS)",
      "Membership Platform",
      "Booking & Reservation System",
      "Knowledge Base System",
      "Internal Dashboard Development",
      "Document Management System",
      "Custom Business System Development",
    ],
  },
  {
    slug: "strategy-digital-transformation",
    name: "Strategy & Digital Transformation",
    icon: "sparkles",
    tagline: "Strategic clarity for businesses that want technology to become an advantage, not a distraction.",
    focus: "digital transformation, business process analysis, technology roadmaps, product strategy, AI adoption, innovation planning, consulting, maturity assessment, and growth strategy",
    outcomes: ["clearer transformation priorities", "better technology decisions", "less wasted implementation", "stronger digital maturity", "growth moves connected to operations"],
    services: [
      "Digital Transformation Strategy",
      "Business Process Analysis",
      "Technology Roadmap",
      "Digital Product Strategy",
      "AI Adoption Strategy",
      "Innovation Strategy",
      "Business Consulting",
      "Technology Consulting",
      "Digital Maturity Assessment",
      "Growth Strategy Consulting",
    ],
  },
  {
    slug: "support-growth",
    name: "Support & Growth",
    icon: "wrench",
    tagline: "Long-term digital partnership for improvement after launch, not silence after handover.",
    focus: "maintenance, technical support, SEO maintenance, content maintenance, performance optimization, security monitoring, growth reporting, continuous improvement, dedicated technical partnership, and long-term digital governance",
    outcomes: ["healthier digital assets", "faster issue resolution", "continuous optimization", "more secure operations", "a dependable technical partner"],
    services: [
      "Website Maintenance",
      "Technical Support",
      "SEO Maintenance",
      "Content Maintenance",
      "Performance Optimization",
      "Security Monitoring",
      "Monthly Growth Report",
      "Continuous Improvement Program",
      "Dedicated Technical Partner",
      "Long-Term Digital Partnership",
    ],
  },
];

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function countWords(value) {
  return String(value).trim().split(/\s+/).filter(Boolean).length;
}

function sentenceList(items) {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function ensureMinimumWords(text, minimum, additions) {
  let output = text.trim();
  let i = 0;
  while (countWords(output) < minimum) {
    output += `\n\n${additions[i % additions.length]}`;
    i += 1;
  }
  return output;
}

function buildCategoryDescription(category) {
  const services = sentenceList(category.services);
  const outcomes = sentenceList(category.outcomes);
  const base = [
    `${category.name} at Isra Anwar is a compact enterprise service category for teams that need digital work to become clearer, more useful, and easier to improve. It covers ${category.focus}. The category is not designed as a random menu of tasks. It is designed as a connected layer of strategy and execution, so the work can support business goals, customer trust, search visibility, conversion, and operational clarity at the same time.`,
    `This category includes ${category.services.length} focused services: ${services}. Each service can be handled as a standalone project, but the stronger result usually comes when the services are mapped as one practical roadmap. Isra Anwar starts by understanding the current assets, audience behavior, internal constraints, offer clarity, workflow, and performance gaps. From there, the work is prioritized based on impact, effort, and long-term maintainability, not trend pressure.`,
    `The expected outcomes are practical: ${outcomes}. The goal is not to create something impressive for a screenshot, but to build a digital asset or system that helps people decide, buy, search, learn, operate, or improve. For SEO, AEO, and GEO, the category also supports topical authority through clear service structure, precise language, useful explanations, and internal links between related services. This gives potential clients enough context to understand the category, while the deeper explanation is handled inside each individual service page.`,
  ].join("\n\n");

  return ensureMinimumWords(base, CATEGORY_MIN_WORDS, [
    `This shorter overview gives the client enough context to choose a direction without forcing them to read the full strategic explanation before seeing the actual services.`,
  ]);
}

function buildServiceDescription(category, serviceName) {
  const outcomes = sentenceList(category.outcomes);
  const related = category.services.filter((name) => name !== serviceName).slice(0, 5);
  const relatedText = sentenceList(related);
  const base = [
    `${serviceName} is a focused Isra Anwar service inside the ${category.name} category. It is built for businesses that do not want a decorative digital asset, but a useful operating tool that can support trust, clarity, performance, and growth. The work begins with context. Before deciding what to build, improve, redesign, automate, or optimize, Isra Anwar studies the business goal, the audience, the current system, the existing data, the technical constraints, and the commercial reason behind the request. This matters because a service can look simple from the outside while hiding strategic decisions underneath. The better the diagnosis, the cleaner the execution.`,
    `The service is especially relevant when a business needs ${category.focus}. In practice, that means the engagement is not only about producing files, screens, pages, reports, or configurations. It is about creating a result that people can use and a system that the business can maintain. Many digital projects fail because they are treated as one-time production jobs. The page is launched, the dashboard is shared, the campaign is published, or the automation is activated, but nobody can explain what changed, what should be measured, or how to improve the next version. Isra Anwar avoids that by connecting every implementation choice to a clear reason.`,
    `A typical ${serviceName} engagement starts with a discovery session and an audit of the current situation. If the client already has assets, Isra Anwar reviews structure, content, performance, design, messaging, data, workflow, and user friction. If the client is starting from zero, the work begins by mapping the offer, the audience, the operational flow, and the decision path that customers or internal users need to follow. The output of this phase is not a vague mood board or a pile of generic recommendations. It is a practical direction: what should be created, what should be fixed, what should be ignored for now, and what should be measured after launch.`,
    `Execution is handled with a senior digital standard. The work must be readable, responsive, maintainable, and commercially meaningful. For technical services, that means clean architecture, performance awareness, accessibility, search readiness, analytics readiness, and clear handover. For strategic and creative services, that means useful research, strong positioning, coherent language, concrete deliverables, and decisions that can survive beyond one campaign. For automation and systems services, that means the process should reduce friction rather than create another dashboard that nobody opens. The standard is simple: if the work does not make the business easier to understand, operate, sell, or improve, it is not finished.`,
    `The main outcomes expected from this service are ${outcomes}. These outcomes are pursued through clear scope, careful implementation, and post-launch review, not through empty guarantees. Isra Anwar does not promise instant rankings, magical conversion rates, or effortless transformation. Digital growth is affected by competition, budget, market fit, pricing, speed of internal adoption, and the quality of the offer. What this service does provide is a disciplined structure that improves the client's odds: better decisions, stronger user experience, clearer messaging, cleaner measurement, and a system that can be improved with evidence.`,
    `This service also supports SEO, AEO, and GEO when it is part of a public-facing digital asset. The content, structure, and metadata are designed to be understandable by humans, search engines, and answer systems. That does not mean keyword stuffing. It means using precise language, logical headings, clear explanations, entity-aware wording, internal linking opportunities, and useful answers to real questions. A service page, landing page, product page, or knowledge base should help a reader make a decision. When it does that well, it also becomes easier for search systems to classify, cite, and recommend.`,
    `Collaboration is designed to be direct. Isra Anwar works best with clients who want honest thinking, not ceremonial meetings. The process usually includes discovery, scope definition, strategy, execution, review, revision, launch or handover, and a measured improvement cycle. The client gets clarity on what is being done and why it matters. The project does not disappear into jargon. Decisions are documented. Trade-offs are explained. If something is not worth doing, it is said plainly. That is part of the value: a consultant should protect the client from wasted motion, not just sell more tasks.`,
    related.length
      ? `${serviceName} can also connect naturally with ${relatedText}. Those related services matter because digital performance is rarely created by one isolated activity. A business might begin with ${serviceName}, then discover that measurement, content, interface quality, search visibility, or operational support needs to be improved as well. Isra Anwar uses this relationship carefully. The goal is not to inflate scope, but to show the client where the real leverage sits. Sometimes the best project is narrow. Sometimes the honest answer is that the business needs a more complete system. The difference is decided by evidence, not excitement.`
      : `${serviceName} can stand as a focused project or become part of a larger digital roadmap. Isra Anwar keeps the recommendation grounded in the client's business stage, operational maturity, and available resources.`,
  ].join("\n\n");

  return ensureMinimumWords(base, SERVICE_MIN_WORDS, [
    `The final deliverable is meant to be usable, not ceremonial. That means the client should understand what was done, how to use it, what to watch next, and which decisions will matter after the project is delivered. Documentation is kept practical: enough to support continuity, not so much that nobody reads it. This is important for teams that need to grow without becoming dependent on a single person or hidden technical knowledge.`,
    `Risk is also handled openly. Every service has constraints: timeline, data quality, stakeholder alignment, technical debt, budget, competitive pressure, and internal adoption. Isra Anwar names those constraints early so the project does not become theater. A mature digital partner does not pretend that everything is easy. A mature partner makes complexity easier to manage and turns unclear work into a sequence of decisions that can actually be executed.`,
    `After delivery, the work should create a better starting point for the next decision. That is the quiet advantage of doing ${serviceName} properly. The business gains a clearer asset, a better process, stronger evidence, and a more coherent digital direction. It becomes easier to brief future work, easier to evaluate performance, and easier to explain the value of the digital system to customers, team members, or stakeholders.`,
  ]);
}

function buildDeliverables(category, serviceName) {
  return [
    `${serviceName} discovery and scope definition`,
    "Current-state audit and opportunity map",
    "Recommended structure, workflow, or implementation plan",
    "Execution with responsive, maintainable, and search-aware standards",
    "Quality review, documentation, and practical handover",
    "Measurement notes for post-launch improvement",
  ];
}

function buildCategoryDeliverables(category) {
  return [
    `${category.name} opportunity audit`,
    "Priority roadmap based on business impact and implementation effort",
    "Recommended service stack from the category",
    "SEO, AEO, and GEO content direction for related service pages",
    "Measurement and improvement framework",
  ];
}

function buildServiceBody(category, serviceName) {
  return `${serviceName} for teams that need ${category.name.toLowerCase()} work with clear strategy, clean execution, and measurable business value.`;
}

const categoryEntries = SERVICE_CATEGORIES.map((category, index) => ({
  id: `seed-service-category-${category.slug}`,
  slug: category.slug,
  name: category.name,
  kind: "category",
  icon: category.icon,
  tagline: category.tagline,
  body: `${category.services.length} connected services covering ${category.focus}.`,
  description: buildCategoryDescription(category),
  deliverables: buildCategoryDeliverables(category),
  service_count: category.services.length,
  child_slugs: category.services.map((serviceName) => `${category.slug}-${slugify(serviceName)}`),
  status: "active",
  order: (index + 1) * 100,
  seed_source: "enterprise-services-v5",
}));

const serviceEntries = SERVICE_CATEGORIES.flatMap((category, categoryIndex) =>
  category.services.map((serviceName, serviceIndex) => ({
    id: `seed-service-${category.slug}-${slugify(serviceName)}`,
    slug: `${category.slug}-${slugify(serviceName)}`,
    name: serviceName,
    kind: "service",
    parent_slug: category.slug,
    parent_name: category.name,
    icon: category.icon,
    tagline: `A focused ${category.name} service for ${serviceName.toLowerCase()} projects.`,
    body: buildServiceBody(category, serviceName),
    description: buildServiceDescription(category, serviceName),
    deliverables: buildDeliverables(category, serviceName),
    status: "active",
    order: (categoryIndex + 1) * 100 + serviceIndex + 1,
    seed_source: "enterprise-services-v5",
  }))
);

export const ISRA_ANWAR_SERVICE_CATEGORIES = SERVICE_CATEGORIES;
export const ISRA_ANWAR_SERVICES_SEED = [...categoryEntries, ...serviceEntries];
