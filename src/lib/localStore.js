// Local-only data store for israanwar admin.
// Semua data disimpan di localStorage browser (per device).
// Tidak ada request network sama sekali.

import { ISRA_ANWAR_BLOG_POSTS_SEED } from "../data/blogSeedIsraVoice";
import { ISRA_ANWAR_SERVICES_SEED } from "../data/serviceCatalog";
import { applyProductPriceDiscount } from "./productPricing";
import { normalizePortfolioProjects } from "./portfolioProjects";
import { DEFAULT_QRIS_SETTINGS, normalizePaymentSettings } from "./paymentSettings";
import { generateStoreCover } from "./storePlaceholder";

const KEYS = {
  session: "okr:session",
  users: "okr:users",
  settings: "okr:settings",
  homepage: "okr:homepage",
  posts: "okr:posts",
  media: "okr:media",
  products: "okr:products",
  orders: "okr:orders",
  cart: "okr:cart",
  services: "okr:services",
  contacts: "okr:contacts",
  pages: "okr:pages",
};

const HERO_HEADLINE = "Build what conventional minds miss before the market moves.";
const HERO_SUBTITLE = "Strategy, design, technology, and AI engineered into sharper systems that turn early insight into measurable business momentum.";

// -------------- helpers --------------
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function write(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("okr:local-store-change", { detail: { key } }));
  }
}
function uid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }

function rebrandStoredValue(value) {
  if (typeof value === "string") {
    return value
      .replace(/www\.okkarhys\.com/gi, "www.israanwar.com")
      .replace(/okkarhys\.com/gi, "israanwar.com")
      .replace(/([/-])okkarhys\b/gi, "$1israanwar")
      .replace(/\bOkkarhys\b/gi, "Isra Anwar")
      .replace(/\bOkka Rhys\b/g, "Isra Anwar")
      .replace(/\bISRA ANWAR\b/g, "Isra Anwar");
  }
  if (Array.isArray(value)) return value.map(rebrandStoredValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, rebrandStoredValue(item)]),
    );
  }
  return value;
}

// -------------- seed data (jalan sekali saat pertama) --------------
// No local admin user is seeded here. Local (non-Supabase) admin login is
// intentionally unavailable — see auth.signIn/signUp below.
function ensureSeed() {
  const DEFAULT_SETTINGS = {
    site_name: "Isra Anwar",
    tagline: HERO_HEADLINE,
    description: HERO_SUBTITLE,
    whatsapp_number: "082189594190",
    whatsapp_url: "https://wa.me/6282189594190",
    email: "israanwarr@gmail.com",
    social_linkedin: "https://www.linkedin.com/in/israanwarr/",
    social_github: "https://github.com/israanwar/",
    social_instagram: "",
    social_twitter: "",
    seo_default_title: "Isra Anwar — Web Development, SEO & AI Workflow",
    seo_default_description: "Isra Anwar is a digital consulting studio in Indonesia helping personal brands and businesses grow through web development, SEO, AI-driven workflows, and content strategy built for measurable results.",
    ...DEFAULT_QRIS_SETTINGS,
    admin_email: "israanwarr@gmail.com",
    admin_whatsapp: "082189594190",
    admin_whatsapp_url: "https://wa.me/6282189594190",
    updated_at: now(),
  };
  if (!read(KEYS.settings)) {
    write(KEYS.settings, DEFAULT_SETTINGS);
  } else if (localStorage.getItem("okr:migrated:settings:v3") !== "1") {
    // Migrasi: update kontak admin & clean broken qris_image path lama
    const s = read(KEYS.settings);
    const migrated = { ...s };
    if (!s.admin_whatsapp || s.admin_whatsapp === "+6281200000000") {
      migrated.admin_whatsapp = DEFAULT_SETTINGS.admin_whatsapp;
      migrated.admin_whatsapp_url = DEFAULT_SETTINGS.admin_whatsapp_url;
    }
    if (!s.admin_email || s.admin_email === "hello@israanwar.com") {
      migrated.admin_email = DEFAULT_SETTINGS.admin_email;
    }
    if (!s.whatsapp_number || s.whatsapp_number === "+6281200000000") {
      migrated.whatsapp_number = DEFAULT_SETTINGS.whatsapp_number;
      migrated.whatsapp_url = DEFAULT_SETTINGS.whatsapp_url;
    }
    if (!s.email || s.email === "hello@israanwar.com") {
      migrated.email = DEFAULT_SETTINGS.email;
    }
    // Pulihkan qris_image kalau masih pakai broken placeholder path
    if (s.qris_image === "/assets/qris/israanwar-qris.png") {
      migrated.qris_image = DEFAULT_SETTINGS.qris_image;
    }
    migrated.updated_at = now();
    write(KEYS.settings, migrated);
    localStorage.setItem("okr:migrated:settings:v3", "1");
    localStorage.setItem("okr:migrated:settings:v2", "1");
  }
  if (localStorage.getItem("okr:migrated:settings:v5") !== "1") {
    const s = read(KEYS.settings);
    const migrated = { ...s };
    if (!s.seo_default_title || s.seo_default_title === "israanwar" || /Design,\s*code/i.test(s.seo_default_title)) {
      migrated.seo_default_title = DEFAULT_SETTINGS.seo_default_title;
      migrated.updated_at = now();
      write(KEYS.settings, migrated);
    }
    localStorage.setItem("okr:migrated:settings:v5", "1");
    localStorage.setItem("okr:migrated:settings:v4", "1");
  }
  if (localStorage.getItem("okr:migrated:settings:qris-default:v1") !== "1") {
    const current = read(KEYS.settings);
    const migrated = normalizePaymentSettings(current);
    if (JSON.stringify(current) !== JSON.stringify(migrated)) {
      write(KEYS.settings, { ...migrated, updated_at: now() });
    }
    localStorage.setItem("okr:migrated:settings:qris-default:v1", "1");
  }
  if (localStorage.getItem("okr:migrated:settings:v6") !== "1") {
    // Backfill footer social links for anyone who already had settings
    // written to localStorage before these were set.
    const s = read(KEYS.settings);
    const migrated = { ...s };
    if (!s.social_linkedin) migrated.social_linkedin = DEFAULT_SETTINGS.social_linkedin;
    if (!s.social_github) migrated.social_github = DEFAULT_SETTINGS.social_github;
    if (!s.social_instagram) migrated.social_instagram = DEFAULT_SETTINGS.social_instagram;
    migrated.updated_at = now();
    write(KEYS.settings, migrated);
    localStorage.setItem("okr:migrated:settings:v6", "1");
  }
  if (localStorage.getItem("okr:migrated:settings:v7") !== "1") {
    const s = read(KEYS.settings);
    const migrated = { ...s };
    if (!s.email || s.email === "admin@israanwar.com") {
      migrated.email = DEFAULT_SETTINGS.email;
    }
    if (!s.admin_email || s.admin_email === "admin@israanwar.com") {
      migrated.admin_email = DEFAULT_SETTINGS.admin_email;
    }
    migrated.updated_at = now();
    write(KEYS.settings, migrated);
    localStorage.setItem("okr:migrated:settings:v7", "1");
  }
  if (localStorage.getItem("okr:migrated:settings:hero-copy:v1") !== "1") {
    const s = read(KEYS.settings, {}) ?? {};
    const migrated = { ...s };
    const oldTagline = "Design, code & strategy at the speed of AI";
    const oldDescription = "Building smarter digital systems for stronger visibility, efficient operations, and sustainable business growth.";
    if (!s.tagline || s.tagline === oldTagline) migrated.tagline = DEFAULT_SETTINGS.tagline;
    if (!s.description || s.description === oldDescription) migrated.description = DEFAULT_SETTINGS.description;
    migrated.updated_at = now();
    write(KEYS.settings, migrated);
    localStorage.setItem("okr:migrated:settings:hero-copy:v1", "1");
  }
  if (localStorage.getItem("okr:migrated:israanwar-brand:v2") !== "1") {
    const collections = [
      KEYS.users,
      KEYS.settings,
      KEYS.homepage,
      KEYS.posts,
      KEYS.products,
      KEYS.services,
      KEYS.pages,
    ];
    collections.forEach((key) => {
      const current = read(key, null);
      if (current !== null) write(key, rebrandStoredValue(current));
    });

    const currentSettings = read(KEYS.settings, {}) ?? {};
    write(KEYS.settings, {
      ...currentSettings,
      site_name: DEFAULT_SETTINGS.site_name,
      seo_default_title: DEFAULT_SETTINGS.seo_default_title,
      seo_default_description: DEFAULT_SETTINGS.seo_default_description,
      social_instagram: DEFAULT_SETTINGS.social_instagram,
      updated_at: now(),
    });
    localStorage.setItem("okr:migrated:israanwar-brand:v2", "1");
  }
  const HOMEPAGE_DEFAULT = {
    hero: {
      kicker: "// MADE TO OUTTHINK THE DEFAULT.",
      title_line1: "Build what conventional minds miss",
      title_line2: "before the market moves.",
      subtitle: HERO_SUBTITLE,
      cta_primary_label: "Consult",
      cta_secondary_label: "View all services",
    },
    cta: {
      title: "Ready to build a stronger digital foundation?",
      subtitle: "Let's talk — it's free. We'll discuss the direction that makes most sense for your brand.",
      button_label: "Contact via WhatsApp",
    },
    process: { title: "Five stages. No zigzag.", items: [
      {
        n: "01",
        title: "Audit",
        body: "Data first.",
        detail: "Before any design, code, campaign, or automation starts, Isra Anwar audits the business context first. We look at the current website, offer clarity, search visibility, customer journey, analytics, content, technical friction, and the gap between what the brand says and what the market actually needs. The goal is to avoid guessing. Audit turns a blurry request into a clean problem map.",
        points: [
          "Website, SEO, content, and analytics review",
          "Audience, offer, and conversion friction mapping",
          "Technical risks, missed opportunities, and quick wins",
        ],
      },
      {
        n: "02",
        title: "Strategy",
        body: "Set direction.",
        detail: "Strategy translates the audit into a clear direction. Isra Anwar defines what should be built, what should be ignored, which channel deserves priority, and how the work connects to business outcomes. This stage protects the project from random ideas, overbuilt features, and campaigns that look busy but do not move the business forward.",
        points: [
          "Positioning, message, and offer direction",
          "Channel priority, roadmap, and execution order",
          "Clear success metrics before production begins",
        ],
      },
      {
        n: "03",
        title: "Execution",
        body: "Ship clean.",
        detail: "Execution is where strategy becomes a real asset. Isra Anwar builds with clean structure, responsive layout, performance awareness, SEO readiness, analytics readiness, and a handover mindset. The work must look sharp, load fast, make sense to users, and stay maintainable after launch.",
        points: [
          "Clean design, code, content, and system implementation",
          "Responsive, accessible, and search-aware delivery",
          "Practical handover so the asset can keep growing",
        ],
      },
      {
        n: "04",
        title: "Optimization",
        body: "Iterate.",
        detail: "Optimization starts after the first version meets real users. Isra Anwar reads behavior, search data, conversion signals, speed issues, content gaps, and customer questions to improve the system. The point is not endless tweaking; the point is disciplined iteration based on evidence.",
        points: [
          "Performance, SEO, CRO, and content improvement",
          "Behavioral signals turned into practical revisions",
          "Better conversion paths without making the site heavier",
        ],
      },
      {
        n: "05",
        title: "Reporting",
        body: "Transparent.",
        detail: "Reporting closes the loop. Isra Anwar explains what was done, why it mattered, what changed, and what should happen next. Reports are written for decision-making, not decoration. The client should understand the progress, the tradeoffs, the numbers, and the next intelligent move.",
        points: [
          "Clear progress, result, and decision summaries",
          "Readable metrics connected to business context",
          "Next-step recommendations without excessive jargon",
        ],
      },
    ]},
    services: { items: [] },
    cases: { title: "Real results.", items: [] },
  };
  if (!read(KEYS.homepage)) write(KEYS.homepage, HOMEPAGE_DEFAULT);
  if (localStorage.getItem("okr:migrated:homepage:hero-copy:v1") !== "1") {
    const h = read(KEYS.homepage, {}) ?? {};
    const currentHero = h.hero ?? {};
    const oldFullTitle = [currentHero.title_line1, currentHero.title_line2].filter(Boolean).join(" ").trim();
    const oldSubtitle = "Building smarter digital systems for stronger visibility, efficient operations, and sustainable business growth.";
    const titleIsLegacy = !oldFullTitle || oldFullTitle === "Design, code & strategy at the speed of AI";
    const subtitleIsLegacy = !currentHero.subtitle || currentHero.subtitle === oldSubtitle;
    if (titleIsLegacy || subtitleIsLegacy) {
      write(KEYS.homepage, {
        ...h,
        hero: {
          ...currentHero,
          ...(titleIsLegacy ? {
            title_line1: HOMEPAGE_DEFAULT.hero.title_line1,
            title_line2: HOMEPAGE_DEFAULT.hero.title_line2,
          } : {}),
          ...(subtitleIsLegacy ? { subtitle: HOMEPAGE_DEFAULT.hero.subtitle } : {}),
        },
      });
    }
    localStorage.setItem("okr:migrated:homepage:hero-copy:v1", "1");
  }
  if (localStorage.getItem("okr:migrated:homepage:v4") !== "1") {
    const oldDescriptions = new Set([
      "Web, SEO, AI workflow & content strategy for personal brands and businesses.",
      "Web, SEO, workflow AI, dan strategi konten untuk personal brand dan bisnis.",
    ]);
    const s = read(KEYS.settings, {}) ?? {};
    const h = read(KEYS.homepage, {}) ?? {};
    const nextSettings = { ...s };
    let settingsChanged = false;
    if (oldDescriptions.has(String(s.description ?? "").trim())) {
      nextSettings.description = DEFAULT_SETTINGS.description;
      settingsChanged = true;
    }
    if (oldDescriptions.has(String(s.seo_default_description ?? "").trim())) {
      nextSettings.seo_default_description = DEFAULT_SETTINGS.seo_default_description;
      settingsChanged = true;
    }
    if (settingsChanged) {
      nextSettings.updated_at = now();
      write(KEYS.settings, nextSettings);
    }
    if (oldDescriptions.has(String(h.hero?.subtitle ?? "").trim())) {
      write(KEYS.homepage, {
        ...h,
        hero: {
          ...(h.hero ?? {}),
          subtitle: HOMEPAGE_DEFAULT.hero.subtitle,
        },
      });
    }
    localStorage.setItem("okr:migrated:homepage:v4", "1");
  }
  if (localStorage.getItem("okr:migrated:homepage:kicker:v1") !== "1") {
    const h = read(KEYS.homepage, {}) ?? {};
    const oldKicker = String(h.hero?.kicker ?? "").trim().toLowerCase();
    if (oldKicker === "// isra anwar · indonesia") {
      write(KEYS.homepage, {
        ...h,
        hero: {
          ...(h.hero ?? {}),
          kicker: HOMEPAGE_DEFAULT.hero.kicker,
        },
      });
    }
    localStorage.setItem("okr:migrated:homepage:kicker:v1", "1");
  }
  // Force reset homepage kalau masih pakai text Indonesia dari default lama
  if (localStorage.getItem("okr:migrated:homepage:v2") !== "1") {
    const h = read(KEYS.homepage, {}) ?? {};
    const oldIdMarkers = [
      h.hero?.cta_primary_label === "Konsultasi",
      h.hero?.cta_secondary_label === "Lihat semua layanan",
      h.hero?.subtitle?.includes("untuk personal brand dan bisnis"),
      h.cta?.button_label === "Hubungi via WhatsApp",
      h.cta?.title?.startsWith("Siap membangun"),
      h.process?.title === "Lima tahap. Tanpa zig-zag.",
      h.cases?.title === "Hasil nyata.",
    ];
    if (oldIdMarkers.some(Boolean)) {
      write(KEYS.homepage, HOMEPAGE_DEFAULT);
    }
    localStorage.setItem("okr:migrated:homepage:v2", "1");
  }
  if (localStorage.getItem("okr:migrated:homepage:v3") !== "1") {
    const h = read(KEYS.homepage, {}) ?? {};
    const defaultSteps = HOMEPAGE_DEFAULT.process.items;
    const defaultByNumber = new Map(defaultSteps.map((step) => [step.n, step]));
    const defaultByTitle = new Map(defaultSteps.map((step) => [step.title, step]));
    const currentSteps = Array.isArray(h.process?.items) ? h.process.items : [];
    let changed = false;
    const nextSteps = currentSteps.map((step, index) => {
      const fallback = defaultByNumber.get(step.n) ?? defaultByTitle.get(step.title) ?? defaultSteps[index];
      if (!fallback) return step;
      const next = {
        ...step,
        detail: step.detail || fallback.detail,
        points: Array.isArray(step.points) && step.points.length ? step.points : fallback.points,
      };
      if (next.detail !== step.detail || next.points !== step.points) changed = true;
      return next;
    });
    if (changed) {
      write(KEYS.homepage, {
        ...h,
        process: {
          ...(h.process ?? {}),
          items: nextSteps,
        },
      });
    }
    localStorage.setItem("okr:migrated:homepage:v3", "1");
  }
  if (!read(KEYS.posts)) write(KEYS.posts, []);
  // v6 = PHASE 2 SEO fields (category, focus_keyword, meta_title, canonical_path,
  //      image_alt, image_caption, reading_time) + punctuation audit (hapus — : ;)
  if (localStorage.getItem("okr:seeded:blog:editorial:v6") !== "1") {
    const existing = read(KEYS.posts, []);
    const seedBySlug = new Map(ISRA_ANWAR_BLOG_POSTS_SEED.map((post) => [post.slug, post]));
    const existingSlugs = new Set(existing.map((post) => post.slug));
    const refreshedPosts = existing.map((post) => {
      const seeded = seedBySlug.get(post.slug);
      if (!seeded) return post;
      return {
        ...post,
        ...seeded,
        id: post.id ?? seeded.id,
        author_id: post.author_id ?? seeded.author_id,
        updated_at: now(),
      };
    });
    const missingPosts = ISRA_ANWAR_BLOG_POSTS_SEED.filter((post) => !existingSlugs.has(post.slug));
    write(KEYS.posts, [...refreshedPosts, ...missingPosts]);
    localStorage.setItem("okr:seeded:blog:editorial:v1", "1");
    localStorage.setItem("okr:seeded:blog:editorial:v2", "1");
    localStorage.setItem("okr:seeded:blog:editorial:v3", "1");
    localStorage.setItem("okr:seeded:blog:editorial:v4", "1");
    localStorage.setItem("okr:seeded:blog:editorial:v5", "1");
    localStorage.setItem("okr:seeded:blog:editorial:v6", "1");
  }
  // v7 = fix legacy posts yang published_at/created_at nya missing atau
  //      malformed (root cause "Invalid Date" di card). Runs additively.
  if (localStorage.getItem("okr:seeded:blog:editorial:v7") !== "1") {
    const existing = read(KEYS.posts, []);
    const seedBySlug = new Map(ISRA_ANWAR_BLOG_POSTS_SEED.map((p) => [p.slug, p]));
    const isValidIso = (s) => s && !Number.isNaN(new Date(s).getTime());
    const fixed = existing.map((post) => {
      const seeded = seedBySlug.get(post.slug);
      // Prioritas: value existing valid → seed value → NOW.
      const validPub = isValidIso(post.published_at)
        ? post.published_at
        : (seeded && isValidIso(seeded.published_at) ? seeded.published_at : null);
      const validCre = isValidIso(post.created_at)
        ? post.created_at
        : (seeded && isValidIso(seeded.created_at) ? seeded.created_at : validPub ?? now());
      return {
        ...post,
        published_at: validPub ?? validCre,
        created_at: validCre,
      };
    });
    write(KEYS.posts, fixed);
    localStorage.setItem("okr:seeded:blog:editorial:v7", "1");
  }
  // v8 = FORCE overwrite published_at & created_at dari seed untuk semua
  //      seeded post. Root cause: PHASE 1 punctuation transform ternyata
  //      juga mengubah `:` di timestamp ISO (12:30:00 → 12.30.00) di seed,
  //      bikin Date parser return Invalid Date. Sudah difix di seed, tapi
  //      state user yang duluan tersimpan perlu di-refresh ulang. v7
  //      preserve valid value, jadi kalau existing state punya value valid
  //      (misal now() dari admin edit), value seed tidak menang. v8 paksa.
  if (localStorage.getItem("okr:seeded:blog:editorial:v8") !== "1") {
    const existing = read(KEYS.posts, []);
    const seedBySlug = new Map(ISRA_ANWAR_BLOG_POSTS_SEED.map((p) => [p.slug, p]));
    const fixed = existing.map((post) => {
      const seeded = seedBySlug.get(post.slug);
      if (!seeded) return post; // admin-created post, biarkan
      return {
        ...post,
        published_at: seeded.published_at,
        created_at: seeded.created_at,
      };
    });
    write(KEYS.posts, fixed);
    localStorage.setItem("okr:seeded:blog:editorial:v8", "1");
  }
  // v9 = tambah cluster kategori kosong (E-Commerce, Analytics & CRO,
  // Case Studies, Technology & Innovation, Research & Insights, Company News)
  // sekaligus refresh SEO metadata seed yang sudah ada.
  if (localStorage.getItem("okr:seeded:blog:editorial:v9") !== "1") {
    const existing = read(KEYS.posts, []);
    const seedBySlug = new Map(ISRA_ANWAR_BLOG_POSTS_SEED.map((post) => [post.slug, post]));
    const refreshedPosts = existing.map((post) => {
      const seeded = seedBySlug.get(post.slug);
      if (!seeded) return post;
      return {
        ...post,
        ...seeded,
        id: post.id ?? seeded.id,
        author_id: post.author_id ?? seeded.author_id,
        updated_at: now(),
      };
    });
    const refreshedSlugs = new Set(refreshedPosts.map((post) => post.slug));
    const missingPosts = ISRA_ANWAR_BLOG_POSTS_SEED.filter((post) => !refreshedSlugs.has(post.slug));
    write(KEYS.posts, [...refreshedPosts, ...missingPosts]);
    localStorage.setItem("okr:seeded:blog:editorial:v9", "1");
  }
  // v10 = humanize legacy article titles, excerpts, meta titles, and
  // internal-link anchors while keeping slugs/canonicals stable.
  if (localStorage.getItem("okr:seeded:blog:editorial:v10") !== "1") {
    const existing = read(KEYS.posts, []);
    const seedBySlug = new Map(ISRA_ANWAR_BLOG_POSTS_SEED.map((post) => [post.slug, post]));
    const refreshedPosts = existing.map((post) => {
      const seeded = seedBySlug.get(post.slug);
      if (!seeded) return post;
      return {
        ...post,
        ...seeded,
        id: post.id ?? seeded.id,
        author_id: post.author_id ?? seeded.author_id,
        updated_at: now(),
      };
    });
    const refreshedSlugs = new Set(refreshedPosts.map((post) => post.slug));
    const missingPosts = ISRA_ANWAR_BLOG_POSTS_SEED.filter((post) => !refreshedSlugs.has(post.slug));
    write(KEYS.posts, [...refreshedPosts, ...missingPosts]);
    localStorage.setItem("okr:seeded:blog:editorial:v10", "1");
  }
  // v11 = tambah field `faqs` ke setiap seeded post (untuk FAQPage schema
  // & section accordion di BlogDetailPage). Merge non-destructive supaya
  // edit admin (title, body, dst) tidak overwrite.
  if (localStorage.getItem("okr:seeded:blog:editorial:v11") !== "1") {
    const existing = read(KEYS.posts, []);
    const seedBySlug = new Map(ISRA_ANWAR_BLOG_POSTS_SEED.map((post) => [post.slug, post]));
    const refreshed = existing.map((post) => {
      const seeded = seedBySlug.get(post.slug);
      if (!seeded) return post;
      // Cuma inject faqs kalau existing post belum punya (non-destructive).
      if (Array.isArray(post.faqs) && post.faqs.length > 0) return post;
      return { ...post, faqs: seeded.faqs ?? [] };
    });
    write(KEYS.posts, refreshed);
    localStorage.setItem("okr:seeded:blog:editorial:v11", "1");
  }
  // v12 = tambah artikel baru "Website yang Bagus Juga Bisa Sepi Pengunjung"
  // (search-optimization) + judul artikel "kenapa-banyak-website-gagal-
  // menjual-walau-tampil-bagus" diganti (dulu "Website Bagus Tapi Sepi
  // Leads?") supaya tidak lagi mirip dengan judul artikel baru ini.
  if (localStorage.getItem("okr:seeded:blog:editorial:v12") !== "1") {
    const existing = read(KEYS.posts, []);
    const seedBySlug = new Map(ISRA_ANWAR_BLOG_POSTS_SEED.map((post) => [post.slug, post]));
    const refreshSlugs = new Set([
      "website-yang-bagus-juga-bisa-sepi-pengunjung",
      "kenapa-banyak-website-gagal-menjual-walau-tampil-bagus",
    ]);
    const refreshedPosts = existing.map((post) => {
      const seeded = seedBySlug.get(post.slug);
      if (!seeded || !refreshSlugs.has(post.slug)) return post;
      return {
        ...post,
        ...seeded,
        id: post.id ?? seeded.id,
        author_id: post.author_id ?? seeded.author_id,
        updated_at: now(),
      };
    });
    const refreshedSlugs = new Set(refreshedPosts.map((post) => post.slug));
    const missingPosts = ISRA_ANWAR_BLOG_POSTS_SEED.filter((post) => !refreshedSlugs.has(post.slug));
    write(KEYS.posts, [...refreshedPosts, ...missingPosts]);
    localStorage.setItem("okr:seeded:blog:editorial:v12", "1");
  }
  if (!read(KEYS.media)) write(KEYS.media, []);
  if (!read(KEYS.products)) write(KEYS.products, []);
  if (!read(KEYS.orders)) write(KEYS.orders, []);
  // Migrasi order status lama → PENDING_PAYMENT
  if (localStorage.getItem("okr:migrated:orders:v2") !== "1") {
    const list = read(KEYS.orders, []);
    let changed = false;
    for (const o of list) {
      const legacy = ["pending", "paid", "shipped", "completed", "cancelled"];
      if (legacy.includes(o.status)) {
        if (o.status === "pending") { o.status = "pending_payment"; changed = true; }
        else if (o.status === "paid" || o.status === "shipped" || o.status === "completed") { o.status = "paid"; changed = true; }
        else if (o.status === "cancelled") { o.status = "cancelled"; changed = true; }
      }
      if (!o.payment_deadline) {
        o.payment_deadline = new Date(new Date(o.created_at ?? Date.now()).getTime() + 30 * 60 * 1000).toISOString();
        changed = true;
      }
    }
    if (changed) write(KEYS.orders, list);
    localStorage.setItem("okr:migrated:orders:v2", "1");
  }
  if (!read(KEYS.cart)) write(KEYS.cart, []);
  if (!read(KEYS.contacts)) write(KEYS.contacts, []);
  if (!read(KEYS.pages)) write(KEYS.pages, PAGES_SEED);
  // Migration v3: add missing keys + reset portfolio ke empty (user request)
  if (localStorage.getItem("okr:migrated:pages:v4") !== "1") {
    const existing = read(KEYS.pages, {}) ?? {};
    let changed = false;
    for (const [key, val] of Object.entries(PAGES_SEED)) {
      if (!existing[key]) { existing[key] = val; changed = true; }
    }
    // Force reset portfolio kalau masih mengandung data seed CV lama (Isra Anwar dst)
    if (existing.portfolio?.hero_title === "Isra Anwar, SM"
        || existing.portfolio?.contact?.email === "israanwarr@gmail.com"
        || (existing.portfolio?.experience ?? []).some((j) => j.org === "Kharisma College")) {
      existing.portfolio = JSON.parse(JSON.stringify(PAGES_SEED.portfolio));
      changed = true;
    }
    // Force reset about/contact ke English kalau masih pakai teks Indonesia seed lama
    if (existing.about?.hero_kicker === "// TENTANG" || existing.about?.story_title === "Cerita singkat.") {
      existing.about = JSON.parse(JSON.stringify(PAGES_SEED.about));
      changed = true;
    }
    if (existing.contact?.hero_kicker === "// KONTAK" || existing.contact?.hero_title === "Mari ngobrol.") {
      existing.contact = JSON.parse(JSON.stringify(PAGES_SEED.contact));
      changed = true;
    }
    // Force reset privacy/terms kalau masih pakai konten Indonesia lama
    if (existing.privacy?.updated === "5 Agustus 2026" || existing.privacy?.body?.includes("Kami hanya mengumpulkan")) {
      existing.privacy = JSON.parse(JSON.stringify(PAGES_SEED.privacy));
      changed = true;
    }
    if (existing.terms?.updated === "5 Agustus 2026" || existing.terms?.body?.includes("Dengan menggunakan layanan")) {
      existing.terms = JSON.parse(JSON.stringify(PAGES_SEED.terms));
      changed = true;
    }
    if (changed) write(KEYS.pages, existing);
    localStorage.setItem("okr:migrated:pages:v4", "1");
    localStorage.setItem("okr:migrated:pages:v2", "1");
  }
  if (localStorage.getItem("okr:migrated:pages:v5") !== "1") {
    const existing = read(KEYS.pages, {}) ?? {};
    const about = existing.about ?? {};
    const aboutText = [
      about.hero_kicker,
      about.hero_title,
      about.hero_subtitle,
      about.story_title,
      about.story_body,
      ...(about.values ?? []).flatMap((value) => [value.title, value.body]),
      ...(about.stats ?? []).flatMap((stat) => [stat.value, stat.label]),
    ]
      .filter(Boolean)
      .join(" ");

    const hasIndonesianAbout =
      about.hero_kicker === "// TENTANG"
      || about.story_title === "Cerita singkat."
      || /\b(tentang|membangun|fondasi|bertahan|adalah|membantu|kehadiran digital|cerita singkat|dimulai|ditemukan|asumsi|transparan|iterasi|proyek selesai|pengalaman|komitmen kualitas)\b/i.test(aboutText);

    if (hasIndonesianAbout) {
      existing.about = JSON.parse(JSON.stringify(PAGES_SEED.about));
      write(KEYS.pages, existing);
    }
    localStorage.setItem("okr:migrated:pages:v5", "1");
  }
  if (localStorage.getItem("okr:migrated:about:experience:v1") !== "1") {
    const existing = read(KEYS.pages, {}) ?? {};
    const about = existing.about ?? {};
    if (Array.isArray(about.stats)) {
      let changed = false;
      about.stats = about.stats.map((stat) => {
        const isExperience = /^(experience|pengalaman)$/i.test(String(stat.label ?? "").trim());
        const isOldValue = /^(3 years|3 tahun)$/i.test(String(stat.value ?? "").trim());
        if (isExperience && isOldValue) {
          changed = true;
          return { ...stat, value: "+13 years", label: "Experience" };
        }
        return stat;
      });
      if (changed) {
        existing.about = { ...about, updated_at: now() };
        write(KEYS.pages, existing);
      }
    }
    localStorage.setItem("okr:migrated:about:experience:v1", "1");
  }
  if (localStorage.getItem("okr:migrated:about:projects-delivered:v1") !== "1") {
    const existing = read(KEYS.pages, {}) ?? {};
    const about = existing.about ?? {};
    if (Array.isArray(about.stats)) {
      let changed = false;
      about.stats = about.stats.map((stat) => {
        const isProjectsDelivered = /^projects delivered$/i.test(String(stat.label ?? "").trim());
        const isOldValue = /^50\+$/i.test(String(stat.value ?? "").trim());
        if (isProjectsDelivered && isOldValue) {
          changed = true;
          return { ...stat, value: "150+" };
        }
        return stat;
      });
      if (changed) {
        existing.about = { ...about, updated_at: now() };
        write(KEYS.pages, existing);
      }
    }
    localStorage.setItem("okr:migrated:about:projects-delivered:v1", "1");
  }
  if (localStorage.getItem("okr:migrated:contact:english:v1") !== "1") {
    const existing = read(KEYS.pages, {}) ?? {};
    const contact = existing.contact ?? {};
    const contactText = [
      contact.hero_kicker,
      contact.hero_title,
      contact.hero_subtitle,
      contact.address,
      contact.hours,
      contact.response_time,
    ]
      .filter(Boolean)
      .join(" ");

    const hasIndonesianContact =
      contact.hero_kicker === "// KONTAK"
      || contact.hero_title === "Mari ngobrol."
      || /\b(kontak|mari ngobrol|punya proyek|pertanyaan|kolaborasi|formulir|senin|jumat|hari kerja|kami balas|hubungi)\b/i.test(contactText);

    if (hasIndonesianContact) {
      existing.contact = JSON.parse(JSON.stringify(PAGES_SEED.contact));
      write(KEYS.pages, existing);
    }
    localStorage.setItem("okr:migrated:contact:english:v1", "1");
  }
  if (localStorage.getItem("okr:migrated:portfolio:projects:v1") !== "1") {
    const existing = read(KEYS.pages, {}) ?? {};
    const portfolio = existing.portfolio ?? {};
    const isEmptyPortfolio = !portfolio.hero_title && !portfolio.hero_subtitle && !portfolio.profile
      && !(portfolio.core_expertise?.length) && !(portfolio.experience?.length)
      && !(portfolio.consulting?.length) && !(portfolio.portfolio_groups?.length)
      && !(portfolio.education?.length) && !(portfolio.certifications?.length)
      && !(portfolio.tools?.length) && !(portfolio.languages?.length);
    const hasOldCvData = portfolio.hero_title === "Isra Anwar, SM"
      || portfolio.contact?.email === "israanwarr@gmail.com"
      || (portfolio.experience ?? []).some((j) => j.org === "Kharisma College");
    if (isEmptyPortfolio || hasOldCvData) {
      existing.portfolio = JSON.parse(JSON.stringify(PAGES_SEED.portfolio));
      write(KEYS.pages, existing);
    }
    localStorage.setItem("okr:migrated:portfolio:projects:v1", "1");
  }
  if (localStorage.getItem("okr:migrated:portfolio:projects:v2") !== "1") {
    const existing = read(KEYS.pages, {}) ?? {};
    const portfolio = existing.portfolio ?? {};
    const groups = portfolio.portfolio_groups ?? [];
    let changed = false;
    const nextGroups = groups.map((group) => {
      const before = group.items ?? "";
      let items = String(before)
        .replace(/\.$/, "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .filter((item) => item !== "Kharisma College" && item !== "Sheila On 7");

      if (group.label === "Website Development & SEO" && !items.includes("Pergolafr.com")) {
        const afterInvestoft = items.indexOf("Investoft.com");
        items.splice(afterInvestoft >= 0 ? afterInvestoft + 1 : items.length, 0, "Pergolafr.com");
      }

      const nextItems = `${items.join(", ")}.`;
      if (nextItems !== before) changed = true;
      return { ...group, items: nextItems };
    });

    if (changed) {
      existing.portfolio = { ...portfolio, portfolio_groups: nextGroups, updated_at: now() };
      write(KEYS.pages, existing);
    }
    localStorage.setItem("okr:migrated:portfolio:projects:v2", "1");
  }
  if (localStorage.getItem("okr:migrated:portfolio:projects:v3") !== "1") {
    const existing = read(KEYS.pages, {}) ?? {};
    const portfolio = existing.portfolio ?? {};
    const consulting = portfolio.consulting ?? [];
    const nextConsulting = consulting.filter((item) => (
      item.org !== "Institut Teknologi dan Bisnis Nobel Indonesia"
    ));

    if (nextConsulting.length !== consulting.length) {
      existing.portfolio = { ...portfolio, consulting: nextConsulting, updated_at: now() };
      write(KEYS.pages, existing);
    }
    localStorage.setItem("okr:migrated:portfolio:projects:v3", "1");
  }
  if (localStorage.getItem("okr:migrated:portfolio:projects:v4") !== "1") {
    const existing = read(KEYS.pages, {}) ?? {};
    const portfolio = existing.portfolio ?? {};
    const groups = portfolio.portfolio_groups ?? [];
    let changed = false;
    const additions = {
      "Website Development & SEO": [
        "Electra Junction",
        "Situasi ID",
        "CoreFold",
        "Centra Actual",
        "Zapgaze",
        "Blockchain Essential",
        "Radarpedia",
      ],
      "Event & Brand Campaigns": [
        "R24 Studio",
        "Eunoia",
        "Belika ID",
        "Crumbs Cakes",
        "Aco Makassar",
      ],
    };
    const nextGroups = groups.map((group) => {
      const before = group.items ?? "";
      const items = String(before)
        .replace(/\.$/, "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      for (const item of additions[group.label] ?? []) {
        if (!items.includes(item)) {
          items.push(item);
          changed = true;
        }
      }
      return { ...group, items: `${items.join(", ")}.` };
    });

    if (changed) {
      existing.portfolio = { ...portfolio, portfolio_groups: nextGroups, updated_at: now() };
      write(KEYS.pages, existing);
    }
    localStorage.setItem("okr:migrated:portfolio:projects:v4", "1");
  }
  if (localStorage.getItem("okr:migrated:portfolio:projects:v5") !== "1") {
    const existing = read(KEYS.pages, {}) ?? {};
    const portfolio = existing.portfolio ?? {};
    const groups = portfolio.portfolio_groups ?? [];
    let changed = false;
    const nextGroups = groups.map((group) => {
      if (group.label !== "Event & Brand Campaigns") return group;

      const before = group.items ?? "";
      const items = String(before)
        .replace(/\.$/, "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (!items.includes("The Great Journey of NOAH")) {
        items.push("The Great Journey of NOAH");
        changed = true;
      }

      return { ...group, items: `${items.join(", ")}.` };
    });

    if (changed) {
      existing.portfolio = { ...portfolio, portfolio_groups: nextGroups, updated_at: now() };
      write(KEYS.pages, existing);
    }
    localStorage.setItem("okr:migrated:portfolio:projects:v5", "1");
  }
  if (localStorage.getItem("okr:migrated:portfolio:projects:v6") !== "1") {
    const existing = read(KEYS.pages, {}) ?? {};
    const portfolio = existing.portfolio ?? {};
    const groups = portfolio.portfolio_groups ?? [];
    const nicheBrands = [
      "Datacore",
      "Technura",
      "Technify",
      "Teknold",
      "Oktekno",
      "Bytecrux",
      "Playrift",
      "Cyberix",
      "Cloudix",
      "Byteindo",
      "Funzonez",
      "Protechz",
      "Techindo",
      "Coredata",
      "Rayatekno",
      "Techroom",
      "Gamebolt",
      "Skillwin",
      "Bytearc",
      "Netina",
      "Techloom",
      "Learnflix",
      "Datacipta",
      "Skillzy",
      "Netforge",
      "Techgrid",
      "Gamenest",
      "Indodata",
      "Tutorgo",
    ];
    let changed = false;
    let hasNicheGroup = false;
    const nextGroups = groups.map((group) => {
      if (group.label !== "SEO, Niche & AdSense Sites") return group;
      hasNicheGroup = true;

      const before = group.items ?? "";
      const items = String(before)
        .replace(/\.$/, "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item === "Situasi.id" ? "Situasi ID" : item);

      for (const brand of nicheBrands) {
        if (!items.includes(brand)) {
          items.push(brand);
          changed = true;
        }
      }

      const nextItems = `${Array.from(new Set(items)).join(", ")}.`;
      if (nextItems !== before) changed = true;
      return { ...group, items: nextItems };
    });
    if (!hasNicheGroup) {
      nextGroups.push({
        label: "SEO, Niche & AdSense Sites",
        items: `${nicheBrands.join(", ")}.`,
      });
      changed = true;
    }

    if (changed) {
      existing.portfolio = { ...portfolio, portfolio_groups: nextGroups, updated_at: now() };
      write(KEYS.pages, existing);
    }
    localStorage.setItem("okr:migrated:portfolio:projects:v6", "1");
  }
  if (localStorage.getItem("okr:migrated:portfolio:projects:v7") !== "1") {
    const existing = read(KEYS.pages, {}) ?? {};
    const portfolio = existing.portfolio ?? {};
    const groups = portfolio.portfolio_groups ?? [];
    const websiteBrands = [
      "Datacore",
      "Technura",
      "Technify",
      "Teknold",
      "Oktekno",
      "Bytecrux",
      "Playrift",
      "Cyberix",
      "Cloudix",
      "Byteindo",
      "Funzonez",
      "Protechz",
      "Techindo",
      "Coredata",
      "Rayatekno",
      "Techroom",
      "Gamebolt",
      "Skillwin",
      "Bytearc",
      "Netina",
      "Techloom",
      "Learnflix",
      "Datacipta",
      "Skillzy",
      "Netforge",
      "Techgrid",
      "Gamenest",
      "Indodata",
      "Tutorgo",
    ];
    let changed = false;
    let hasWebsiteGroup = false;
    const nextGroups = groups.map((group) => {
      if (group.label === "Products & Platforms") {
        const before = group.items ?? "";
        const items = String(before)
          .replace(/\.$/, "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => item === "OKKA.AI" ? "OKKA AI" : item)
          .map((item) => item === "Isra Anwar.com" ? "Isra Anwar" : item);
        const nextItems = `${Array.from(new Set(items)).join(", ")}.`;
        if (nextItems !== before) changed = true;
        return { ...group, items: nextItems };
      }

      if (group.label !== "Website Development & SEO") return group;
      hasWebsiteGroup = true;

      const before = group.items ?? "";
      const items = String(before)
        .replace(/\.$/, "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item === "Investoft.com" ? "Investoft" : item)
        .map((item) => item === "Pergolafr.com" ? "Pergolafr" : item)
        .map((item) => item === "MetodePenelitian.com" ? "MetodePenelitian" : item)
        .map((item) => item === "ManajemenSumberDayaManusia.com" ? "Manajemen Sumber Daya Manusia" : item);

      for (const brand of websiteBrands) {
        if (!items.includes(brand)) {
          items.push(brand);
          changed = true;
        }
      }

      const nextItems = `${Array.from(new Set(items)).join(", ")}.`;
      if (nextItems !== before) changed = true;
      return { ...group, items: nextItems };
    });
    const nextConsulting = (portfolio.consulting ?? []).map((item) => {
      const nextOrg = item.org === "Investoft.com"
        ? "Investoft"
        : item.org === "MetodePenelitian.com"
          ? "MetodePenelitian"
          : item.org;
      if (nextOrg !== item.org) changed = true;
      return { ...item, org: nextOrg };
    });
    if (!hasWebsiteGroup) {
      nextGroups.push({
        label: "Website Development & SEO",
        items: `${websiteBrands.join(", ")}.`,
      });
      changed = true;
    }

    if (changed) {
      existing.portfolio = { ...portfolio, consulting: nextConsulting, portfolio_groups: nextGroups, updated_at: now() };
      write(KEYS.pages, existing);
    }
    localStorage.setItem("okr:migrated:portfolio:projects:v7", "1");
  }
  if (localStorage.getItem("okr:migrated:portfolio:projects:v8") !== "1") {
    const existing = read(KEYS.pages, {}) ?? {};
    const portfolio = existing.portfolio ?? {};
    const groups = portfolio.portfolio_groups ?? [];
    const additions = {
      "Event & Brand Campaigns": [
        "Debat Kandidat Kepala Daerah Sulawesi Selatan - KPU RI",
        "Live Streaming PSM Makassar",
        "Festival Ekonomi Syariah (FESyar) - Bank Indonesia",
        "Warnata Kreasi Indonesia",
        "99 Entertainment",
        "PT Multi Bintang Indonesia Tbk",
        "Akraga TV",
        "Entropy Coffee",
        "Kharisma College",
        "SMAK Makassar",
        "Ilagaligo Studio",
        "Toyota Kalla Urip Sumoharjo",
        "Direktorat Jenderal Pajak Provinsi Jawa Tengah",
      ],
      "Website Development & SEO": [
        "SMAN 1 Takalar",
        "AC Dive Club",
        "Kopi Break",
        "Handuk Pink",
        "Citrus Online",
        "Daewong",
        "Gear Flare",
        "Glow Charm",
        "Pro Media",
        "Play Now!",
        "Play Gamehub",
        "Caripondokan",
        "Daengkuliner",
      ],
      "SEO, Niche & AdSense Sites": [
        "Citrus Online",
        "Daewong",
      ],
    };
    let changed = false;
    const seenGroups = new Set();
    const nextGroups = groups.map((group) => {
      const groupAdditions = additions[group.label];
      if (!groupAdditions) return group;
      seenGroups.add(group.label);

      const before = group.items ?? "";
      const items = String(before)
        .replace(/\.$/, "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item === "Caripondokan.com" ? "Caripondokan" : item)
        .map((item) => item === "Daengkuliner.com" ? "Daengkuliner" : item);

      for (const item of groupAdditions) {
        if (!items.includes(item)) {
          items.push(item);
          changed = true;
        }
      }

      const nextItems = `${Array.from(new Set(items)).join(", ")}.`;
      if (nextItems !== before) changed = true;
      return { ...group, items: nextItems };
    });

    for (const [label, items] of Object.entries(additions)) {
      if (!seenGroups.has(label)) {
        nextGroups.push({ label, items: `${items.join(", ")}.` });
        changed = true;
      }
    }

    if (changed) {
      existing.portfolio = { ...portfolio, portfolio_groups: nextGroups, updated_at: now() };
      write(KEYS.pages, existing);
    }
    localStorage.setItem("okr:migrated:portfolio:projects:v8", "1");
  }
  if (localStorage.getItem("okr:migrated:portfolio:projects:v9") !== "1") {
    const existing = read(KEYS.pages, {}) ?? {};
    const portfolio = existing.portfolio ?? {};
    const groups = portfolio.portfolio_groups ?? [];
    let changed = false;
    const nextGroups = groups.map((group) => {
      if (group.label !== "Event & Brand Campaigns") return group;
      const before = group.items ?? "";
      const nextItems = String(before).replaceAll("Event PT Multi Bintang Indonesia Tbk", "PT Multi Bintang Indonesia Tbk");
      if (nextItems !== before) changed = true;
      return { ...group, items: nextItems };
    });
    if (changed) {
      existing.portfolio = { ...portfolio, portfolio_groups: nextGroups, updated_at: now() };
      write(KEYS.pages, existing);
    }
    localStorage.setItem("okr:migrated:portfolio:projects:v9", "1");
  }
  if (localStorage.getItem("okr:migrated:portfolio:projects:v10") !== "1") {
    const existing = read(KEYS.pages, {}) ?? {};
    const portfolio = existing.portfolio ?? {};
    const groups = portfolio.portfolio_groups ?? [];
    let changed = false;

    const nextConsulting = (portfolio.consulting ?? []).filter((item) => {
      const org = String(item.org ?? "").trim();
      const keep = org !== "MetodePenelitian" && org !== "MetodePenelitian.com";
      if (!keep) changed = true;
      return keep;
    });

    let hasProductsGroup = false;
    const nextGroups = groups.map((group) => {
      if (group.label !== "Products & Platforms") return group;
      hasProductsGroup = true;
      const before = group.items ?? "";
      const items = String(before)
        .replace(/\.$/, "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item === "MetodePenelitian.com" ? "MetodePenelitian" : item);
      if (!items.includes("MetodePenelitian")) {
        items.push("MetodePenelitian");
        changed = true;
      }
      const nextItems = `${Array.from(new Set(items)).join(", ")}.`;
      if (nextItems !== before) changed = true;
      return { ...group, items: nextItems };
    });

    if (!hasProductsGroup) {
      nextGroups.unshift({
        label: "Products & Platforms",
        items: "MetodePenelitian.",
      });
      changed = true;
    }

    if (changed) {
      existing.portfolio = { ...portfolio, consulting: nextConsulting, portfolio_groups: nextGroups, updated_at: now() };
      write(KEYS.pages, existing);
    }
    localStorage.setItem("okr:migrated:portfolio:projects:v10", "1");
  }
  if (localStorage.getItem("okr:migrated:portfolio:projects:v11") !== "1") {
    const existing = read(KEYS.pages, {}) ?? {};
    const portfolio = existing.portfolio ?? {};
    const nextPortfolio = normalizePortfolioProjects(portfolio);
    if (JSON.stringify(nextPortfolio.consulting ?? []) !== JSON.stringify(portfolio.consulting ?? [])) {
      existing.portfolio = { ...portfolio, ...nextPortfolio, updated_at: now() };
      write(KEYS.pages, existing);
    }
    localStorage.setItem("okr:migrated:portfolio:projects:v11", "1");
  }
  if (localStorage.getItem("okr:migrated:portfolio:projects:v12") !== "1") {
    const existing = read(KEYS.pages, {}) ?? {};
    const portfolio = existing.portfolio ?? {};
    const consulting = Array.isArray(portfolio.consulting) ? portfolio.consulting : [];
    let changed = false;
    const nextConsulting = consulting
      .filter((item) => {
        const org = String(item.org ?? "").trim();
        const keep = !/^PT Manufakt(?:or|ur) Kreasi Sejahtera$/i.test(org);
        if (!keep) changed = true;
        return keep;
      })
      .map((item) => {
        if (String(item.org ?? "").trim() !== "PT Tri Ariesta Dinamika (TADCO)") return item;
        const nextItem = {
          ...item,
          year: "2024-Now",
          role: "Web Development & IT Consultant",
          desc: "Web development and IT consulting for reliable, maintainable websites and practical business systems.",
        };
        if (JSON.stringify(nextItem) !== JSON.stringify(item)) changed = true;
        return nextItem;
      });
    if (changed) {
      existing.portfolio = { ...portfolio, consulting: nextConsulting, updated_at: now() };
      write(KEYS.pages, existing);
    }
    localStorage.setItem("okr:migrated:portfolio:projects:v12", "1");
  }
  if (localStorage.getItem("okr:migrated:portfolio:projects:v13") !== "1") {
    const existing = read(KEYS.pages, {}) ?? {};
    const portfolio = existing.portfolio ?? {};
    const consulting = Array.isArray(portfolio.consulting) ? portfolio.consulting : [];
    const tadcoIndex = consulting.findIndex(
      (item) => String(item.org ?? "").trim() === "PT Tri Ariesta Dinamika (TADCO)"
    );
    if (tadcoIndex !== -1 && tadcoIndex !== 1) {
      const nextConsulting = consulting.slice();
      const [tadco] = nextConsulting.splice(tadcoIndex, 1);
      nextConsulting.splice(1, 0, tadco);
      existing.portfolio = { ...portfolio, consulting: nextConsulting, updated_at: now() };
      write(KEYS.pages, existing);
    }
    localStorage.setItem("okr:migrated:portfolio:projects:v13", "1");
  }
  if (localStorage.getItem("okr:migrated:portfolio:certifications:v1") !== "1") {
    const existing = read(KEYS.pages, {}) ?? {};
    const portfolio = existing.portfolio ?? {};
    if (!(portfolio.certifications?.length)) {
      existing.portfolio = {
        ...portfolio,
        certifications: PAGES_SEED.portfolio.certifications,
        updated_at: now(),
      };
      write(KEYS.pages, existing);
    }
    localStorage.setItem("okr:migrated:portfolio:certifications:v1", "1");
  }
  if (localStorage.getItem("okr:migrated:portfolio:certifications:v2") !== "1") {
    const existing = read(KEYS.pages, {}) ?? {};
    const portfolio = existing.portfolio ?? {};
    if (!(portfolio.training_workshops?.length)) {
      existing.portfolio = {
        ...portfolio,
        training_workshops: PAGES_SEED.portfolio.training_workshops,
        updated_at: now(),
      };
      write(KEYS.pages, existing);
    }
    localStorage.setItem("okr:migrated:portfolio:certifications:v2", "1");
  }
  // Services seed (v5 = shorter category summaries + long service detail pages)
  if (localStorage.getItem("okr:seeded:services:v5") !== "1") {
    const LEGACY_SERVICE_SLUGS = new Set([
      "seo-audit-optimization",
      "ai-digital-strategy",
      "blog-content-strategy",
      "technical-seo",
      "analytics-performance",
      "landing-page-optimization",
      "wordpress-maintenance",
    ]);
    const existing = read(KEYS.services, []).filter((s) => !LEGACY_SERVICE_SLUGS.has(s.slug));
    const bySlug = new Map(existing.map((s) => [s.slug, s]));
    const merged = ISRA_ANWAR_SERVICES_SEED.map((s) => {
      const old = bySlug.get(s.slug);
      return old
        ? { ...old, ...s, updated_at: now() }
        : { id: uid(), created_at: now(), updated_at: now(), status: "active", ...s };
    });
    const userAdded = existing.filter((s) => !ISRA_ANWAR_SERVICES_SEED.some((x) => x.slug === s.slug));
    write(KEYS.services, [...merged, ...userAdded]);
    localStorage.setItem("okr:seeded:services:v5", "1");
    localStorage.setItem("okr:seeded:services:v4", "1");
    localStorage.setItem("okr:seeded:services:v3", "1");
  }
  // v6 = integrity pass. If a previous localStorage write was interrupted,
  // make sure every seeded service/category exists and keeps its stable order.
  if (localStorage.getItem("okr:seeded:services:v6") !== "1") {
    const existing = read(KEYS.services, []);
    const bySlug = new Map(existing.map((s) => [s.slug, s]));
    const seedSlugs = new Set(ISRA_ANWAR_SERVICES_SEED.map((s) => s.slug));
    const merged = ISRA_ANWAR_SERVICES_SEED.map((s) => {
      const old = bySlug.get(s.slug);
      return old
        ? { ...old, ...s, id: old.id ?? s.id, created_at: old.created_at ?? now(), updated_at: now() }
        : { id: s.id ?? uid(), created_at: now(), updated_at: now(), status: "active", ...s };
    });
    const userAdded = existing.filter((s) => !seedSlugs.has(s.slug));
    write(KEYS.services, [...merged, ...userAdded]);
    localStorage.setItem("okr:seeded:services:v6", "1");
    localStorage.setItem("okr:seeded:services:v5", "1");
    localStorage.setItem("okr:seeded:services:v4", "1");
    localStorage.setItem("okr:seeded:services:v3", "1");
  }

  // Store items seed (versioned — v17 = requested final prices for selected modules)
  if (localStorage.getItem("okr:seeded:store:v17") !== "1") {
    // Slug legacy dari seed v1 (kategori lama "Metode Kerja", "Template") — dibuang
    const LEGACY_SLUGS = new Set([
      "metode-content-ops-playbook",
      "metode-seo-audit-framework",
      "template-notion-personal-cms",
    ]);
    const existing = read(KEYS.products, []).filter((p) => !LEGACY_SLUGS.has(p.slug));
    const bySlug = new Map(existing.map((p) => [p.slug, p]));
    const merged = STORE_SEED.map((s) => {
      const old = bySlug.get(s.slug);
      if (old) {
        return { ...old, name: s.name, category: s.category, price: s.price,
          sold_count: s.sold_count, rating: s.rating,
          description: s.description, image_url: s.image_url, updated_at: now() };
      }
      return { id: uid(), created_at: now(), updated_at: now(), status: "active", ...s };
    });
    // Simpan item yang admin buat sendiri (tidak ada di seed & bukan legacy)
    const userAdded = existing
      .filter((p) => !STORE_SEED.some((s) => s.slug === p.slug))
      .map((p) => {
        const price = capStorePrice(Number(p.price) || 0);
        if (p.sold_count && p.rating) return { ...p, price, updated_at: now() };
        return {
          ...p,
          price,
          ...productSocialProof({
            slug: p.slug,
            category: p.category,
            name: p.name,
            description: p.description,
            price,
          }),
          updated_at: now(),
        };
      });
    write(KEYS.products, [...merged, ...userAdded]);
    localStorage.setItem("okr:seeded:store:v17", "1");
    localStorage.setItem("okr:seeded:store:v16", "1");
    localStorage.setItem("okr:seeded:store:v15", "1");
    localStorage.setItem("okr:seeded:store:v14", "1");
    localStorage.setItem("okr:seeded:store:v13", "1");
    localStorage.setItem("okr:seeded:store:v12", "1");
    localStorage.setItem("okr:seeded:store:v11", "1");
    localStorage.setItem("okr:seeded:store:v10", "1");
    localStorage.setItem("okr:seeded:store:v2", "1");
    localStorage.setItem("okr:seeded:store", "1");
  }
}

// Cover otomatis per produk — inline SVG, dijamin unik & relevan (kategori + nama)
// Palet per kategori: gradient warna khas + ikon simbolik.
const CATEGORY_STYLE = {
  "Templates":              { c1: "#0891b2", c2: "#0e7490", icon: "▤" },  // grid
  "Ebooks":                 { c1: "#7c3aed", c2: "#5b21b6", icon: "📖" },
  "Guidelines":             { c1: "#059669", c2: "#065f46", icon: "✓" },
  "Prompt Collections":     { c1: "#ec4899", c2: "#be185d", icon: "✦" },
  "Checklists":             { c1: "#f59e0b", c2: "#b45309", icon: "☑" },
  "Workbooks":              { c1: "#dc2626", c2: "#991b1b", icon: "✎" },
  "Planners":               { c1: "#6366f1", c2: "#4338ca", icon: "▦" },
  "Worksheets":             { c1: "#84cc16", c2: "#4d7c0f", icon: "▤" },
  "Frameworks":             { c1: "#06b6d4", c2: "#0e7490", icon: "◈" },
  "Playbooks":              { c1: "#a855f7", c2: "#6b21a8", icon: "▶" },
  "Blueprints":             { c1: "#2563eb", c2: "#1e3a8a", icon: "◱" },
  "SOP":                    { c1: "#475569", c2: "#1e293b", icon: "§" },
  "Swipe Files":            { c1: "#f43f5e", c2: "#9f1239", icon: "❝" },
  "Business Documents":     { c1: "#1e40af", c2: "#1e3a8a", icon: "☰" },
  "Research Resources":     { c1: "#10b981", c2: "#047857", icon: "⌕" },
  "Marketing Resources":    { c1: "#e11d48", c2: "#9f1239", icon: "◎" },
  "Branding Resources":     { c1: "#d946ef", c2: "#a21caf", icon: "◐" },
  "Productivity Resources": { c1: "#0ea5e9", c2: "#0369a1", icon: "◉" },
  "Printables":             { c1: "#eab308", c2: "#a16207", icon: "▨" },
  "Digital Bundles":        { c1: "#8b5cf6", c2: "#4c1d95", icon: "◆" },
  "Modules":                { c1: "#56636f", c2: "#30363d", icon: "▷" },
  "Modul":                  { c1: "#56636f", c2: "#30363d", icon: "▷" }, // legacy
};

export function coverSvg(product) {
  return generateStoreCover(product);
}

const STORE_MAX_PRICE = 999000;

const STORE_PRICE_INCREASE_RULES = {
  "Templates":              { factor: 0.28, min: 20000,  max: 70000 },
  "Ebooks":                 { factor: 0.35, min: 30000,  max: 90000 },
  "Guidelines":             { factor: 0.35, min: 30000,  max: 90000 },
  "Prompt Collections":     { factor: 0.25, min: 20000,  max: 60000 },
  "Checklists":             { factor: 0.28, min: 10000,  max: 30000 },
  "Workbooks":              { factor: 0.28, min: 20000,  max: 70000 },
  "Planners":               { factor: 0.22, min: 10000,  max: 40000 },
  "Worksheets":             { factor: 0.22, min: 10000,  max: 40000 },
  "Frameworks":             { factor: 0.45, min: 50000,  max: 160000 },
  "Playbooks":              { factor: 0.5,  min: 70000,  max: 180000 },
  "Blueprints":             { factor: 0.55, min: 100000, max: 260000 },
  "SOP":                    { factor: 0.35, min: 40000,  max: 100000 },
  "Swipe Files":            { factor: 0.25, min: 20000,  max: 60000 },
  "Business Documents":     { factor: 0.28, min: 20000,  max: 80000 },
  "Research Resources":     { factor: 0.28, min: 20000,  max: 80000 },
  "Marketing Resources":    { factor: 0.42, min: 50000,  max: 140000 },
  "Branding Resources":     { factor: 0.42, min: 50000,  max: 140000 },
  "Productivity Resources": { factor: 0.22, min: 10000,  max: 40000 },
  "Printables":             { factor: 0.2,  min: 10000,  max: 20000 },
  "Digital Bundles":        { factor: 0.45, min: 90000,  max: 250000 },
  "Modules":                { factor: 0.35, min: 20000,  max: 120000 },
};

const STORE_FINAL_PRICE_OVERRIDES = {
  "bundle-seo-professional-toolkit": 798000,
  "bundle-ai-workflow-mastery": 742000,
  "bundle-freelancer-complete-kit": 687000,
  "bundle-small-business-ops": 594000,
  "bundle-content-creator-starter": 386000,
  "blueprint-ai-agency-from-zero": 793000,
  "blueprint-ecommerce-growth-loop": 587000,
  "blueprint-digital-product-launch": 381000,

  "modul-social-media-optimization": 9000,
  "modul-ai-prompting": 17000,
  "modul-blogging-platform": 23000,
  "modul-seo-copywriting": 47000,
  "modul-email-marketing": 64000,
  "modul-backlink-building": 73000,
  "modul-tunecore-soundon": 389000,
  "modul-social-media-marketing": 121000,
  "modul-desain-branding-digital-strategist": 136000,
  "modul-copywriting-content-marketing": 158000,
  "modul-affiliate-marketing": 173000,
  "modul-ai-tools-digital-business": 187000,
  "modul-ecommerce-marketplace": 196000,
  "modul-business-automation": 198000,
  "modul-youtube-monetization": 247000,
  "modul-google-adsense": 296000,
  "modul-ternak-blog": 347000,
  "modul-seo-a-z": 391000,
  "modul-digital-sales-funnel": 486000,
  "modul-search-engine-marketing": 587000,
  "modul-google-adsense-advanced": 989000,
};

const STORE_PRICE_INCREASE_OVERRIDES = {
  "playbook-product-launch": 250000,
  "playbook-seo-audit": 180000,
  "playbook-content-ops": 180000,
  "playbook-customer-retention": 190000,
  "playbook-cold-outreach-b2b": 160000,
  "framework-ai-adoption-roadmap": 160000,
  "framework-personal-branding-pyramid": 140000,
  "framework-content-pillar": 120000,
  "mkt-analytics-dashboard": 160000,
  "mkt-plan-12-bulan": 120000,
  "brand-rebranding-playbook": 250000,
  "brand-strategy-workbook": 160000,
};

function clampPriceIncrease(value) {
  return Math.min(250000, Math.max(10000, value));
}

function capStorePrice(value) {
  const price = Number(value) || 0;
  const capped = Math.min(STORE_MAX_PRICE, Math.max(0, Math.round(price / 1000) * 1000));
  const tail = Math.floor((capped % 10000) / 1000);
  if (capped > 0 && tail === 0) return Math.max(1000, capped - 1000);
  return capped;
}

function naturalStorePrice(slug, value) {
  const capped = capStorePrice(value);
  if (capped < 10000) return capped;
  const thousands = Math.round(capped / 1000);
  const tenThousands = Math.floor(thousands / 10) * 10;
  const tail = (hashStoreValue(`price-tail:${slug}`) % 9) + 1;
  return capStorePrice((tenThousands + tail) * 1000);
}

function premiumStorePrice({ slug, category, price }) {
  const finalOverride = STORE_FINAL_PRICE_OVERRIDES[slug];
  if (finalOverride) return capStorePrice(finalOverride);
  const override = STORE_PRICE_INCREASE_OVERRIDES[slug];
  const rule = STORE_PRICE_INCREASE_RULES[category] ?? { factor: 0.5, min: 50000, max: 180000 };
  if (override) return naturalStorePrice(slug, price + clampPriceIncrease(override));
  const rawIncrease = Math.min(Math.max(price * rule.factor, rule.min), rule.max);
  const increase = clampPriceIncrease(Math.min(Math.round(rawIncrease / 10000) * 10000, rule.max));
  return naturalStorePrice(slug, price + increase);
}

function hashStoreValue(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hasCommercialPull({ slug, category, name, description }) {
  const text = `${slug} ${category} ${name} ${description}`.toLowerCase();
  return [
    "adsense", "seo", "sem", "search engine", "funnel", "sales", "selling",
    "ecommerce", "marketplace", "affiliate", "automation", "monetization",
    "revenue", "growth", "agency", "business", "freelancer", "bundle",
    "blueprint", "roadmap", "launch", "dashboard", "marketing",
  ].some((term) => text.includes(term));
}

export function productSocialProof({ slug, category, name, description, price }) {
  const highValueCategories = new Set(["Modules", "Digital Bundles", "Blueprints", "Playbooks", "Frameworks", "Marketing Resources"]);
  const midValueCategories = new Set(["Branding Resources", "Research Resources", "Business Documents", "SOP", "Workbooks", "Guidelines"]);
  const hash = hashStoreValue(`${slug}:${category}:${price}`);
  const pull = hasCommercialPull({ slug, category, name, description });
  const high = highValueCategories.has(category) || pull || price >= 600000;
  const mid = !high && (midValueCategories.has(category) || price >= 250000);
  const soldMin = high ? 720 : mid ? 320 : 122;
  const soldMax = high ? 1408 : mid ? 980 : 520;
  const sold = soldMin + (hash % (soldMax - soldMin + 1));
  const ratingBase = high ? 48 : mid ? 46 : 44;
  const ratingSpread = high ? 2 : mid ? 3 : 4;
  const rating = Math.min(5, (ratingBase + ((hash >>> 8) % (ratingSpread + 1))) / 10);
  return { sold_count: sold, rating };
}

const STORE_DESCRIPTION_OVERRIDES = {
  "modul-google-adsense": `Google AdSense is not only about placing ads on a website and waiting for clicks. This module explains the full money logic behind AdSense: how niche choice, search intent, content depth, site structure, user behavior, RPM, CPC, CTR, traffic quality, and policy compliance work together to create a monetizable publishing asset.

The conceptual section helps you understand why some sites earn consistently while others stay busy but empty. You will learn how to choose a niche with commercial demand, map content clusters, avoid thin content, design a site architecture that Google can crawl, and read the difference between traffic that looks big and traffic that can actually produce revenue.

The practical section walks from A to Z: domain and hosting preparation, WordPress or Blogger setup, essential pages, Search Console, Analytics, sitemap, robots, speed, ad placement basics, content calendar, approval preparation, and post-approval optimization. It also covers safe experimentation, basic reporting, and common mistakes that can trigger low earnings or policy issues. The goal is not instant money; the goal is a repeatable publishing system that can grow into revenue with disciplined execution.`,

  "modul-google-adsense-advanced": `Google AdSense Advanced Mode is built for people who already understand the basics and want to treat AdSense like a serious media business. The concept begins with revenue architecture: RPM, page RPM, session RPM, CPC, viewability, ad density, user journey, content intent, device behavior, traffic source quality, and the relationship between SEO strategy and advertising yield.

This module goes deeper into practical optimization. You will learn how to audit existing pages, identify articles with earning potential, improve internal linking, build evergreen clusters, split test ad placements, read AdSense and GA4 data, reduce accidental clicks risk, protect policy compliance, and decide when to prioritize traffic growth versus RPM improvement. It also explains why high traffic does not automatically mean high income, and why content with clear commercial context often outperforms generic viral traffic.

The practicum is arranged from A to Z: site audit, content pruning, topical expansion, page layout testing, above-the-fold decisions, mobile ad behavior, Core Web Vitals, CTR control, RPM tracking sheet, monthly experiment log, and scaling roadmap. This is a monetization module, but it avoids fantasy promises. It gives you the operating method to build, measure, and improve an AdSense asset professionally.`,

  "modul-tunecore-soundon": `Tunecore and SoundOn are not just upload buttons for songs. They are distribution and monetization systems. This module explains the concept first: music rights, master ownership, publishing basics, digital distributors, ISRC, UPC, release metadata, streaming royalties, platform payouts, short-video discovery, catalog value, and why a song needs a release system instead of only a file upload.

The technical practicum walks from A to Z for artists, creators, small labels, and digital marketers who want to understand music monetization properly. You will learn how to prepare audio files, artwork, artist profile, metadata, release schedule, lyrics, credits, territory choices, platform delivery, pre-save assets, TikTok/SoundOn distribution logic, Spotify and Apple Music presence, YouTube usage, and post-release tracking.

The module also covers growth mechanics: how to create short-form content around a song, how to plan a release calendar, how to avoid metadata mistakes, how to read stream data, how royalty cycles work, and how to build a small catalog that can keep earning over time. It does not promise every song will make money. It teaches the system behind giving a song the best commercial chance.`,

  "modul-ternak-blog": `Blog Farming is a practical module for building multiple content assets with discipline, not spam. The concept starts with understanding blogs as digital properties: niche selection, topical authority, domain strength, content velocity, search intent, monetization model, operating cost, editorial workflow, and risk management. The point is to build useful sites that can attract search traffic and convert attention into income through AdSense, affiliate offers, lead generation, or digital products.

The technical section walks from A to Z: choosing a niche, validating keyword demand, buying domains, setting up hosting, choosing WordPress or Blogger, building basic pages, installing analytics, creating content clusters, writing briefs, publishing consistently, interlinking, indexing, optimizing speed, and tracking which pages deserve improvement.

You will also learn how to manage a blog portfolio: which metrics matter, when to kill a site, when to double down, how to avoid duplicated thin content, how to keep operations simple, and how to protect the asset from lazy shortcuts. This module is for people who want a repeatable publishing machine, not a one-night trick.`,

  "modul-search-engine-marketing": `Search Engine Marketing is not simply buying traffic. This module explains the money logic behind paid acquisition: offer economics, margin, conversion rate, cost per click, cost per acquisition, landing page quality, tracking, remarketing, creative testing, and the discipline of stopping campaigns that only look busy but do not produce business value.

The practicum covers Google Ads, Meta Ads, TikTok Ads, YouTube Ads, and AI-assisted campaign preparation from A to Z. You will learn how to define the offer, map the customer journey, prepare tracking, structure campaigns, write ad copy, choose keywords and audiences, set budgets, build landing pages, launch safely, read early signals, cut waste, scale winners, and report results in a way a business owner can understand.

This module is especially useful for consultants, founders, marketers, and small teams who need a practical system before spending money on ads. It does not teach blind boosting. It teaches paid traffic as a controlled experiment where every rupiah must have a job.`,

  "modul-affiliate-marketing": `Affiliate Marketing is a monetization model where trust, intent, and distribution meet. This module explains the concept clearly: choosing a niche, understanding buyer intent, selecting affiliate programs, evaluating commission structure, building comparison content, creating review pages, using email capture, tracking clicks, and protecting credibility so the audience does not feel manipulated.

The technical practicum walks from A to Z: market research, product selection, keyword mapping, content formats, review structure, comparison tables, bridge pages, tracking links, disclosure placement, SEO basics, social distribution, email follow-up, conversion measurement, and performance improvement. You will also learn how to avoid the common beginner mistake of promoting everything without owning a clear angle.

The goal is to build an affiliate system that can compound. A good affiliate asset is not just a link; it is a trusted recommendation engine supported by content, search intent, and honest positioning. Income depends on traffic, trust, product fit, and execution, but this module gives you the practical operating map.`,

  "modul-email-marketing": `Email Marketing is one of the most direct ways to turn attention into revenue because the relationship is not fully controlled by social algorithms. This module explains the concept first: permission, list quality, segmentation, deliverability, lead magnets, customer lifecycle, nurture sequences, broadcast strategy, offers, and why email works best when it is treated as a long-term trust channel.

The technical practicum starts from A to Z: choosing an email platform, creating opt-in forms, designing lead magnets, building welcome sequences, tagging subscribers, writing subject lines, avoiding spam triggers, setting up simple automation, connecting landing pages, measuring open rate, click rate, conversion, and cleaning the list when engagement drops.

You will also learn revenue workflows: abandoned cart emails, product education sequences, service inquiry follow-ups, launch emails, reactivation campaigns, and simple weekly newsletters. The module is practical, but it stays ethical. The point is not to blast people. The point is to build a database that trusts you enough to buy when the offer is relevant.`,

  "modul-ecommerce-marketplace": `E-Commerce and Marketplace is a module for people who want to sell products through Shopee, Tokopedia, TikTok Shop, and standalone online stores with a system. The concept begins with product-market fit, margin, inventory, perceived value, product listing psychology, search behavior inside marketplaces, promo mechanics, reviews, repeat purchase, and the difference between traffic, conversion, and profit.

The practical section walks from A to Z: product research, competitor audit, pricing, product naming, photo direction, listing SEO, description structure, voucher strategy, marketplace ads, TikTok content loop, checkout friction, customer service templates, shipping expectations, review generation, stock tracking, and simple reporting.

You will learn how to avoid selling only because of discounts. The module helps build a store that looks credible, is easier to find, easier to trust, and easier to buy from. It also covers when to move from marketplace dependence into your own landing page, email list, or website so the business is not trapped by one platform.`,

  "modul-youtube-monetization": `Video Content and YouTube Monetization explains YouTube as a media asset, not just a place to upload videos. The concept covers niche selection, viewer promise, retention, watch time, click-through rate, thumbnail strategy, title psychology, channel authority, YouTube Partner Program, AdSense for YouTube, sponsorship, affiliate links, digital products, and the role of Shorts in discovery.

The technical practicum walks from A to Z: channel setup, branding, topic mapping, script structure, recording workflow, editing standards, thumbnail checklist, metadata, playlists, publishing cadence, analytics reading, retention diagnosis, content iteration, and monetization readiness. You will also learn how to build a content backlog so the channel does not depend on mood alone.

This module is useful for creators, educators, musicians, consultants, and business owners who want to turn video into a long-term asset. It does not promise viral success. It teaches the mechanics behind consistency, audience fit, and monetization pathways so every video has a strategic reason to exist.`,

  "modul-digital-sales-funnel": `Digital Sales Funnel and Automation is about building a path from attention to purchase without forcing every sale manually. The concept explains awareness, lead capture, qualification, trust building, offer presentation, checkout, follow-up, retention, and how automation supports selling without making the brand feel cold.

The practicum walks from A to Z: defining the offer, mapping customer objections, creating lead magnets, building landing pages, connecting forms, writing email or WhatsApp sequences, setting up CRM stages, adding checkout flow, retargeting visitors, tagging leads, measuring conversion, and improving each step based on data.

You will learn how to design funnels for digital products, services, consultation offers, and small business sales. The module also covers simple automation with tools like forms, spreadsheets, email platforms, CRM, Zapier, or n8n. The goal is to create a selling machine that remains human: clear offer, clean follow-up, useful content, and measurable revenue movement.`,

  "modul-business-automation": `Business Automation is not about replacing people with tools. It is about removing repetitive work so a business can respond faster, make fewer mistakes, and sell with better consistency. The concept covers workflow mapping, trigger-action logic, CRM, task routing, invoice flow, customer follow-up, content operations, reporting, and the difference between useful automation and complicated automation.

The technical practicum walks from A to Z: auditing repetitive work, choosing which process to automate, designing the data fields, connecting forms, spreadsheets, email, WhatsApp, CRM, payment confirmation, order management, and reporting dashboards. It includes practical patterns for lead capture, customer onboarding, proposal follow-up, purchase confirmation, content publishing, and internal task reminders.

You will learn how to calculate whether automation is worth building, how to avoid fragile workflows, and how to document every automation so the business can maintain it. The value is practical: saved time, faster response, clearer pipeline, and more consistent revenue operations.`,

  "modul-seo-a-z": `Search Engine Optimization A-Z explains SEO as a business growth system, not a checklist of tricks. The concept covers search intent, topical authority, crawlability, indexing, internal links, content quality, technical performance, backlinks, entity trust, analytics, and how organic visibility can become revenue when connected to offers, leads, ads, affiliate, or product sales.

The practical section walks from A to Z: keyword research, topic clustering, site architecture, on-page structure, title and meta optimization, content brief, technical audit, sitemap, robots, schema, Core Web Vitals, internal linking, backlink strategy, Search Console analysis, content refresh, and monthly reporting.

This module is built for website owners, writers, consultants, marketers, and small teams who need a real operating method. You will learn what to do first, what to ignore, how to diagnose traffic drops, and how to turn SEO work into measurable business movement. SEO is not instant, but a clean system compounds.`,

  "modul-seo-copywriting": `SEO Copywriting is where search behavior meets human persuasion. The concept explains why ranking alone is not enough: a page must match intent, earn trust, answer the question, guide the reader, and still move them toward a meaningful action. You will learn keyword intent, headline logic, content depth, hooks, readability, internal linking, EEAT signals, and conversion copy basics.

The practicum walks from A to Z: keyword selection, SERP analysis, outline building, introduction writing, section flow, FAQ creation, meta title, meta description, CTA placement, proof points, editing, and post-publish improvement. It also shows how to write for informational, commercial, local, and product-led pages.

This module is useful for bloggers, business owners, SEO writers, agencies, and anyone selling through content. The aim is not robotic keyword stuffing. The aim is clear writing that Google can understand and humans actually want to continue reading.`,

  "modul-copywriting-content-marketing": `Copywriting and Content Marketing teaches writing as a business instrument. The concept covers attention, desire, trust, objection handling, offer clarity, story, proof, positioning, distribution, and why content should not only be beautiful but useful for selling, educating, or moving people closer to a decision.

The technical practicum walks from A to Z: audience research, message mapping, hook creation, headline formulas, body copy, landing page copy, ad copy, email copy, social captions, storytelling frameworks, content calendar, repurposing, and performance review. You will also learn how to connect content with a funnel so every piece has a role.

This module is for creators, consultants, marketers, founders, and teams who want a sharper way to write. It does not make copy feel aggressive. It makes copy clearer, more persuasive, and easier to measure.`,

  "modul-ai-tools-digital-business": `AI Tools for Digital Business explains how to use AI as a workflow advantage, not as a lazy replacement for thinking. The concept covers research acceleration, ideation, copy drafting, data summarization, customer support, content operations, automation, quality control, and the risks of generic output when prompts are not guided by strategy.

The practicum walks from A to Z: choosing tools, writing reusable prompts, building research workflows, creating content briefs, drafting landing copy, preparing ads, analyzing customer feedback, building simple automations, checking accuracy, and creating a human review system. It also covers how to combine AI with spreadsheets, docs, website workflows, and marketing operations.

This module is especially useful for small teams and solo operators who want to produce more without losing judgment. The goal is not to look like AI. The goal is to work faster while keeping the final output sharp, human, and commercially useful.`,

  "modul-blogging-platform": `Blogging Platforms covers WordPress, Blogger, Wix, and other publishing systems from a monetization perspective. The concept helps you choose a platform based on ownership, speed, SEO control, theme flexibility, plugin ecosystem, cost, migration risk, and long-term growth. A blogging platform should support the business model, not trap it.

The technical practicum walks from A to Z: domain setup, hosting, theme selection, essential pages, menu structure, category planning, post templates, plugin basics, analytics, Search Console, speed optimization, backup, security, migration, and content optimization. You will also learn how platform choice affects AdSense, affiliate, SEO, lead capture, and digital product sales.

This module is for people who want to start properly or repair a messy blog foundation. It helps you understand what matters before publishing hundreds of articles on a weak structure.`,

  "modul-backlink-building": `Backlink Building teaches authority building without pretending that every link is equal. The concept covers domain relevance, topical trust, anchor text, link placement, outreach, digital PR, guest posts, citations, natural link earning, toxic links, and why aggressive shortcuts can damage a site instead of helping it.

The practicum walks from A to Z: backlink audit, competitor link gap, prospecting, outreach email, content asset preparation, guest post workflow, brand mention tracking, local citation building, link quality scoring, disavow awareness, and monthly authority reporting.

This module is designed for SEO practitioners, website owners, and content teams who want to build search authority carefully. Backlinks can support revenue because they can improve organic visibility, but the method must be selective, relevant, and documented. The aim is a cleaner authority system, not a random pile of links.`,

  "modul-social-media-marketing": `Social Media Marketing explains how social channels can support branding, demand generation, and sales without becoming random posting. The concept covers positioning, audience behavior, content pillars, platform differences, distribution rhythm, community signals, social proof, offer integration, and how attention can move into leads or purchases.

The practicum walks from A to Z: profile audit, bio positioning, content pillar design, weekly content planning, carousel/script/caption formats, engagement workflow, campaign calendar, social selling, analytics review, and simple lead routing through DM, landing page, WhatsApp, or email.

This module is for businesses, consultants, creators, and local brands that want a more strategic social presence. It does not teach vanity metrics as the final goal. It teaches social media as a business channel with clear signals, experiments, and follow-up.`,

  "modul-social-media-optimization": `Social Media Optimization focuses on making each account easier to understand, easier to trust, and easier to act on. The concept covers profile clarity, bio structure, visual consistency, keywords, highlights, pinned content, CTA, posting timing, hashtag logic, content packaging, and how platform algorithms read engagement patterns.

The practicum walks from A to Z: audit checklist, profile rewrite, link-in-bio structure, highlight organization, feed hygiene, content format testing, posting schedule, engagement windows, comment handling, analytics reading, and monthly optimization routine.

This module is useful when a brand already posts but the account feels scattered. It helps turn the profile into a cleaner front door for discovery, trust, and conversion.`,

  "modul-ai-prompting": `AI Prompting teaches the thinking process behind strong AI output. The concept covers context, role, task framing, constraints, examples, evaluation criteria, iteration, memory, tool use, and why a good prompt is closer to a clear brief than a magic sentence.

The practicum walks from A to Z: prompt anatomy, reusable prompt templates, research prompts, copy prompts, SEO prompts, image prompts, data analysis prompts, critique prompts, automation prompts, and quality control prompts. You will learn how to build prompt systems for business work, not just one-off experiments.

This module is practical for writers, marketers, founders, students, consultants, and teams. It helps make AI output more useful, more consistent, and less generic because the human still controls the judgment.`,

  "modul-desain-branding-digital-strategist": `Design, Digital Branding and Strategist teaches how visual identity, message, and channel decisions work together. The concept covers positioning, brand personality, visual system, tone of voice, audience perception, digital touchpoints, content direction, and why branding should support trust and commercial clarity.

The practicum walks from A to Z: brand audit, competitor mapping, moodboard, logo usage direction, color and typography decisions, content style, website direction, social media expression, campaign angle, and simple brand guideline creation. It also explains how to connect design choices with marketing goals so the brand does not only look nice but becomes easier to remember and easier to buy from.

This module is for founders, creators, designers, and consultants who want branding that feels deliberate rather than decorative.`,

  "bundle-seo-professional-toolkit": `The SEO Professional Toolkit is a complete operating pack for people who want to sell, manage, or execute SEO work seriously. It combines conceptual understanding with practical assets: audit framework, keyword mapping worksheet, technical checklist, content brief template, reporting sheet, and client-ready explanation structure.

The bundle helps you move from scattered SEO tasks into a repeatable service workflow. You can use it to audit websites, plan content clusters, explain priorities to clients, monitor Search Console signals, document fixes, and connect SEO work to traffic, leads, AdSense, affiliate, or product revenue.

It is especially useful for consultants, agencies, bloggers, and business owners who need a professional SEO system without building every document from scratch.`,

  "bundle-ai-workflow-mastery": `AI Workflow Mastery is a bundle for turning AI into a practical business operating system. It includes prompts, workflow maps, adoption framework, and implementation playbook for research, content, marketing, sales support, documentation, and automation.

The concept is simple: AI becomes valuable when it is embedded into a repeatable workflow with inputs, review standards, and clear business goals. The technical layer shows how to build prompt libraries, QA loops, content pipelines, customer insight summaries, and small automations that save time or improve output quality.

This bundle is built for founders, consultants, marketers, creators, and teams that want speed without losing taste, accuracy, or control.`,

  "blueprint-ecommerce-growth-loop": `Ecommerce Growth Loop Blueprint explains how an online store grows beyond one-time campaigns. The concept covers acquisition, product page conversion, marketplace discovery, paid traffic, email and WhatsApp retention, reviews, repeat purchase, referral, and the metrics that show whether growth is healthy.

The practical blueprint walks through product positioning, listing improvement, offer design, traffic channel selection, ad testing, checkout optimization, customer follow-up, review generation, and retention campaign planning. It also includes the logic for deciding when to push marketplace ads, when to improve product pages, and when to build owned channels.

This is for store owners who want a repeatable growth loop instead of random promos.`,

  "blueprint-ai-agency-from-zero": `AI Agency from Zero is a blueprint for building an AI-assisted service business from positioning to delivery. The concept covers service packaging, client pain points, offer ladder, workflow automation, pricing, proof, prospecting, delivery standards, and retainer logic.

The practical section walks from A to Z: choosing a niche, designing services, preparing demo assets, writing outreach, handling discovery calls, scoping projects, delivering the first result, documenting SOPs, and turning one-off work into recurring value. It also explains what should stay human: judgment, strategy, client trust, and final quality control.

This blueprint does not sell fantasy. It gives a clear operating map for building a modern service business with AI as leverage.`,

  "blueprint-digital-product-launch": `Digital Product Launch Blueprint is a practical map for turning expertise into a sellable digital product. The concept covers audience problem, product promise, format choice, validation, pricing, sales page, funnel, launch calendar, distribution, payment flow, and post-purchase experience.

The practicum walks from A to Z: idea selection, market proof, outline creation, production workflow, asset packaging, checkout setup, email sequence, social launch content, affiliate or partner push, feedback collection, and iteration after the first buyers.

This blueprint is useful for consultants, creators, educators, and small business owners who want to sell knowledge products without guessing every step.`,

  "bundle-freelancer-complete-kit": `The Freelancer Complete Kit is built for freelancers who want a cleaner business operation, not only better-looking documents. It combines contracts, proposals, invoices, client onboarding, project workflow, finance tracking, and a Notion operating system.

The concept teaches how freelancers make money more consistently: clearer scope, better pricing, faster follow-up, fewer revision conflicts, documented delivery, and a visible pipeline. The technical layer gives editable templates and workflows from first inquiry to paid invoice.

It is useful for designers, writers, marketers, developers, consultants, and solo operators who want to look more professional while protecting their time and margin.`,
};

const P = (slug, name, category, price, description) => {
  const premiumPrice = premiumStorePrice({ slug, category, price });
  const productDescription = STORE_DESCRIPTION_OVERRIDES[slug] ?? description;
  const proof = productSocialProof({ slug, category, name, description: productDescription, price: premiumPrice });
  return {
    slug,
    name,
    category,
    price: premiumPrice,
    sold_count: proof.sold_count,
    rating: proof.rating,
    description: productDescription,
    image_url: generateStoreCover({ name, category, description: productDescription }),
  };
};

const STORE_SEED = [
  // 1. Templates
  P("tpl-notion-freelancer-os", "Notion Freelancer OS", "Templates", 129000,
    "Complete Notion workspace for freelancers: clients, projects, invoices, timesheets, and knowledge base. Ready to fork."),
  P("tpl-excel-financial-dashboard", "Excel Financial Dashboard 2026", "Templates", 149000,
    "Business finance dashboard in Excel: cashflow, P&L, budget vs actual, forecasting. Auto-formula, ready to fill."),
  P("tpl-ppt-pitch-deck-investor", "PowerPoint Pitch Deck Investor", "Templates", 99000,
    "20-slide narrative pitch deck template: problem, solution, market, model, traction, ask."),
  P("tpl-canva-instagram-feed-kit", "Canva Instagram Feed Kit (30)", "Templates", 79000,
    "30 original Instagram feed & carousel templates for personal brands & SMEs. Canva format, just edit."),
  P("tpl-word-proposal-konsultan", "Consultant Proposal Word Template", "Templates", 89000,
    "Ready-to-use consultant proposal template: cover, executive summary, scope, timeline, investment."),

  // 2. Ebooks
  P("ebook-blueprint-seo-2026", "Blueprint SEO 2026", "Ebooks", 149000,
    "120-page guide covering on-page + technical + off-page SEO for 2026. Actionable checklist, no jargon."),
  P("ebook-ai-workflow-handbook", "AI Workflow Handbook", "Ebooks", 129000,
    "Practical AI workflow templates for research, drafting, and quality control. 40+ ready-to-use prompts."),
  P("ebook-personal-branding-2026", "Personal Branding Blueprint", "Ebooks", 159000,
    "Build a long-lasting personal brand: positioning, content pillars, distribution, monetization."),
  P("ebook-freelance-financial-playbook", "Freelance Financial Playbook", "Ebooks", 119000,
    "Manage freelancer finances: pricing, taxes, emergency fund, and a stable income pipeline."),
  P("ebook-linkedin-growth-guide", "LinkedIn Growth Guide", "Ebooks", 99000,
    "Grow on LinkedIn without spam: content pillars, posting cadence, network building."),

  // 3. Guidelines
  P("guideline-design-system-starter", "Design System Starter", "Guidelines", 199000,
    "Design system foundation: color tokens, typography, spacing, base components. Figma + Markdown."),
  P("guideline-landing-page-framework", "Landing Page Framework", "Guidelines", 179000,
    "High-conversion landing structure + 12 wireframe patterns. Great for SaaS, services, digital products."),
  P("guideline-remote-work-sop", "Remote Work Best Practice", "Guidelines", 149000,
    "Remote team guide: async communication, meeting rhythm, docs first, and performance rituals."),
  P("guideline-client-onboarding", "Client Onboarding Playbook", "Guidelines", 179000,
    "Service client onboarding flow from contract → kickoff → deliverable → billing that delights clients."),
  P("guideline-content-style-guide", "Content Style Guide Template", "Guidelines", 129000,
    "Content style guide template: tone of voice, terminology, format, editorial rules."),

  // 4. Prompt Collections
  P("prompt-500-chatgpt-business", "500 Business ChatGPT Prompts", "Prompt Collections", 149000,
    "500 ready-to-use prompts across marketing, sales, ops, HR, and product. Modular format, easy to modify."),
  P("prompt-seo-content-100", "100 SEO Content Writing Prompts", "Prompt Collections", 99000,
    "Prompts for keyword research, outlines, drafting, and on-page optimization. Tuned for GPT-4/Claude."),
  P("prompt-design-branding", "Prompt Pack: Design & Branding", "Prompt Collections", 89000,
    "Prompts for brand briefs, moodboards, naming, taglines, and design critique. Great for solo designers."),
  P("prompt-educator-trainer", "Prompt Pack: Educator & Trainer", "Prompt Collections", 79000,
    "Prompts for building curricula, lesson plans, quizzes, and AI-assisted student feedback."),
  P("prompt-marketing-automation", "Prompt Pack: Marketing Automation", "Prompt Collections", 119000,
    "Prompts to automate email sequences, ad copy, retargeting messages, and nurture flows."),

  // 5. Checklists
  P("checklist-prelaunch-website", "Pre-Launch Website Checklist (100)", "Checklists", 59000,
    "100 must-check items before launch: SEO, performance, security, content, analytics, legal."),
  P("checklist-technical-seo-audit", "Technical SEO Audit Checklist", "Checklists", 49000,
    "Technical audit checklist: crawlability, indexing, sitemap, robots, canonical, structured data."),
  P("checklist-product-launch", "Product Launch Marketing Checklist", "Checklists", 69000,
    "8-week timeline & tasks before a digital product launch. Includes copy, ads, PR, email."),
  P("checklist-daily-productivity", "Daily & Weekly Productivity Checklist", "Checklists", 39000,
    "Morning ritual, weekly review, and daily focus session — printable cards + digital."),
  P("checklist-content-publishing-qa", "Content Publishing QA Checklist", "Checklists", 49000,
    "Pre-publish QA checklist: facts, tone, SEO, accessibility, image, meta, distribution."),

  // 6. Workbooks
  P("workbook-positioning-brand", "Personal Brand Positioning Workbook", "Workbooks", 129000,
    "7-session exercise to find a clear, memorable personal brand positioning."),
  P("workbook-90-day-content-plan", "90-Day Content Plan Workbook", "Workbooks", 149000,
    "Build a 90-day content plan from topical research, pillars, and calendar. Printable workbook format."),
  P("workbook-life-goals-vision", "Life Goals & Vision Workbook", "Workbooks", 99000,
    "Reflection + goal setting based on personal values. OKR framework for life, not just work."),
  P("workbook-startup-validation", "Startup Validation Workbook", "Workbooks", 179000,
    "Test a startup idea from problem → solution → market fit in 4 structured weeks."),
  P("workbook-freelance-rate-calc", "Freelance Rate Calculator Workbook", "Workbooks", 89000,
    "Calculate hourly / project fees for freelancers based on costs, income targets, and value."),

  // 7. Planners
  P("planner-daily-digital-2026", "Daily Digital Planner 2026", "Planners", 79000,
    "Daily planner for iPad / Notability. 365 linked pages, one-click navigation."),
  P("planner-weekly-deep-work", "Weekly Deep Work Planner", "Planners", 59000,
    "Weekly planner focused on deep work: time-blocking, energy tracking, weekly review."),
  P("planner-monthly-content", "Monthly Content Planner", "Planners", 69000,
    "Monthly content planner: theme, pillar, format, channel, publishing date, KPI."),
  P("planner-annual-business", "Annual Business Planner", "Planners", 149000,
    "Annual business planner: goals, OKRs, quarterly reviews, financial targets, roadmap."),
  P("planner-habit-goal-bundle", "Habit + Goal Planner Bundle", "Planners", 99000,
    "Combined habit tracker + goal setting kit in digital and printable formats."),

  // 8. Worksheets
  P("worksheet-business-model-canvas", "Business Model Canvas Worksheet", "Worksheets", 59000,
    "BMC + Value Proposition Canvas ready to fill. A3 print format + editable Figma."),
  P("worksheet-customer-persona", "Customer Persona Worksheet", "Worksheets", 49000,
    "3 persona templates: demographic, psychographic, jobs-to-be-done. Includes case examples."),
  P("worksheet-swot-analysis", "SWOT + PESTLE Analysis Worksheet", "Worksheets", 49000,
    "SWOT + PESTLE + Porter's 5 Forces. One-page worksheet, print & fill immediately."),
  P("worksheet-research-methodology", "Research Methodology Worksheet", "Worksheets", 79000,
    "Quantitative + qualitative research methodology worksheet. Great for thesis / dissertation."),
  P("worksheet-seo-keyword-mapping", "SEO Keyword Mapping Worksheet", "Worksheets", 69000,
    "Map keywords to intent, cluster, and page. Ready-to-use spreadsheet."),

  // 9. Frameworks
  P("framework-4c-marketing", "4C Marketing Model Framework", "Frameworks", 179000,
    "Alternative to 4P: Customer, Cost, Convenience, Communication. Template + case study."),
  P("framework-personal-branding-pyramid", "Personal Branding Pyramid Framework", "Frameworks", 199000,
    "Pyramid model from core values → positioning → offer → distribution → community."),
  P("framework-ai-adoption-roadmap", "AI Adoption Roadmap Framework", "Frameworks", 249000,
    "AI adoption roadmap for small teams: audit process → pilot → scale → govern."),
  P("framework-okr-setup-kit", "OKR Setup Kit Framework", "Frameworks", 149000,
    "OKR setup kit from scratch: template, facilitation guide, cadence review, common pitfalls."),
  P("framework-content-pillar", "Content Pillar System Framework", "Frameworks", 179000,
    "System for building interconnected content pillars for topical authority."),

  // 10. Playbooks
  P("playbook-content-ops", "Content Ops Playbook", "Playbooks", 249000,
    "End-to-end editorial SOP: research → outline → draft → review → publish → distribution."),
  P("playbook-seo-audit", "SEO Audit Playbook", "Playbooks", 219000,
    "12-step SEO audit framework + spreadsheet templates + client-ready deliverable report."),
  P("playbook-product-launch", "Product Launch Playbook", "Playbooks", 299000,
    "90-day launch playbook: pre-launch, launch week, post-launch retention loop."),
  P("playbook-customer-retention", "Customer Retention Ops Playbook", "Playbooks", 269000,
    "Cohort analysis, churn triggers, win-back sequences, and a referral engine."),
  P("playbook-cold-outreach-b2b", "Cold Outreach B2B Playbook", "Playbooks", 229000,
    "Ethical, converting cold email + LinkedIn DM strategy. Includes 30 templates."),

  // 11. Blueprints
  P("blueprint-saas-mvp-90d", "SaaS MVP in 90 Days Blueprint", "Blueprints", 349000,
    "Week-by-week blueprint to build a SaaS MVP: validation, tech stack, pricing, launch."),
  P("blueprint-personal-brand-website", "Personal Brand Website Blueprint", "Blueprints", 249000,
    "Architecture & content for a personal brand website: sitemap, wireframe, copy framework."),
  P("blueprint-ecommerce-growth-loop", "Ecommerce Growth Loop Blueprint", "Blueprints", 399000,
    "Ecommerce growth loop: paid → email → retention → referral. Includes metric dashboard."),
  P("blueprint-ai-agency-from-zero", "AI Agency from Zero Blueprint", "Blueprints", 499000,
    "Build an AI agency from 0 clients to 6 retainer clients: positioning, service ladder, delivery."),
  P("blueprint-digital-product-launch", "Digital Product Launch Blueprint", "Blueprints", 279000,
    "Launch your first digital product: validation, production, pricing, funnel, distribution."),

  // 12. SOP
  P("sop-content-team-editorial", "Content Team Editorial SOP", "SOP", 199000,
    "Content team SOP: roles, workflow status, deliverable format, review rubric."),
  P("sop-customer-support-ticketing", "Customer Support Ticketing SOP", "SOP", 179000,
    "Support ticket SOP: categorization, SLAs, escalation, standard response templates."),
  P("sop-client-project-kickoff", "Client Project Kickoff SOP", "SOP", 149000,
    "Client project kickoff procedure: agenda, documents, timeline, roles & responsibilities."),
  P("sop-social-media-publishing", "Social Media Publishing SOP", "SOP", 129000,
    "Social content production & publishing SOP: approval flow, brand guardrails, crisis playbook."),
  P("sop-onboarding-remote-employee", "Remote Employee Onboarding SOP", "SOP", 199000,
    "30-60-90 day remote employee onboarding SOP: tools, rituals, milestones, feedback."),

  // 13. Swipe Files
  P("swipe-100-email-subject", "Swipe: 100 High-Converting Email Subjects", "Swipe Files", 89000,
    "100 email marketing subject lines proven across industries. Categorized + benchmark rates."),
  P("swipe-50-landing-hero-copy", "Swipe: 50 Landing Page Hero Copy", "Swipe Files", 99000,
    "50 hooks + subhooks + landing page CTAs from well-known SaaS, services, and digital products."),
  P("swipe-cta-buttons-200", "Swipe: 200 CTA Button Copy", "Swipe Files", 79000,
    "200 CTA button variations with usage context (sales, signup, download, etc.)."),
  P("swipe-cold-dm-outreach", "Swipe: Cold DM & Outreach Messages", "Swipe Files", 119000,
    "LinkedIn/Instagram/Email DM templates that aren't spammy and still convert."),
  P("swipe-ad-copy-library", "Swipe: Ad Copy Library (Meta + Google)", "Swipe Files", 149000,
    "Battle-tested Meta Ads + Google Ads copy library, grouped by objective."),

  // 14. Business Documents
  P("bizdoc-kontrak-freelance-bundle", "Freelance Contract Bundle (5)", "Business Documents", 149000,
    "5 freelance contract templates: NDA, service agreement, retainer, revision, termination."),
  P("bizdoc-invoice-quotation-pro", "Invoice & Quotation Pro", "Business Documents", 89000,
    "Professional invoice, quotation, and receipt templates. Word, Excel, and fillable PDF."),
  P("bizdoc-proposal-konsultan", "Business Consultant Proposal", "Business Documents", 119000,
    "Complete business consultant proposal template: scope, methodology, timeline, investment."),
  P("bizdoc-mou-kerja-sama", "Business Cooperation MoU", "Business Documents", 99000,
    "Memorandum of Understanding (MoU) template for various cooperation schemes."),
  P("bizdoc-business-plan-lengkap", "Complete Business Plan Template", "Business Documents", 179000,
    "40-page business plan with canvas model, financial projections, and pitch deck."),

  // 15. Research Resources
  P("research-proposal-skripsi", "Thesis & Dissertation Proposal Template", "Research Resources", 149000,
    "Thesis/dissertation proposal template in APA format aligned with common Indonesian campus guidelines."),
  P("research-kuesioner-kit", "Research Instrument: Questionnaire Kit", "Research Resources", 129000,
    "Questionnaire kit: Likert scale, semantic differential, validity & reliability tests."),
  P("research-coding-sheet-kualitatif", "Qualitative Analysis Coding Sheet", "Research Resources", 99000,
    "Coding sheet template for thematic & content analysis. Includes coding examples."),
  P("research-analisis-spss-r", "SPSS & R Data Analysis Templates", "Research Resources", 179000,
    "Analysis templates & scripts: t-tests, correlation, regression, PLS-SEM. Includes tutorial."),
  P("research-systematic-review-toolkit", "Systematic Review Toolkit", "Research Resources", 199000,
    "Systematic literature review toolkit: PRISMA protocol, data extraction, quality assessment."),

  // 16. Marketing Resources
  P("mkt-plan-12-bulan", "12-Month Marketing Plan Template", "Marketing Resources", 179000,
    "Annual marketing plan: audit, positioning, strategy, channel plan, budget, KPIs."),
  P("mkt-campaign-planner-multichannel", "Multi-Channel Campaign Planner", "Marketing Resources", 149000,
    "Multi-channel campaign planner: brief, timeline, assets, distribution, measurement."),
  P("mkt-content-editorial-calendar", "Content Editorial Calendar", "Marketing Resources", 129000,
    "12-month editorial calendar with theme, pillar, format, channel, and performance tracking."),
  P("mkt-analytics-dashboard", "Marketing Analytics Dashboard", "Marketing Resources", 199000,
    "Multi-source marketing analytics dashboard: GA4, Meta Ads, Google Ads, email. Google Sheet + Looker."),
  P("mkt-persona-kit", "Marketing Persona Kit", "Marketing Resources", 149000,
    "Marketing persona kit: B2C & B2B templates, interview scripts, empathy maps, JTBD."),

  // 17. Branding Resources
  P("brand-strategy-workbook", "Brand Strategy Workbook", "Branding Resources", 249000,
    "Workbook to build brand strategy: core values, positioning, personality, brand story."),
  P("brand-guideline-template", "Editable Brand Guideline Template", "Branding Resources", 199000,
    "30-page editable Figma brand guideline template: logo, color, typography, tone."),
  P("brand-voice-tone-kit", "Brand Voice & Tone Kit", "Branding Resources", 149000,
    "Kit for defining voice & tone: worksheet, do/don't examples, applied writing examples."),
  P("brand-logo-presentation-deck", "Logo Presentation Deck Template", "Branding Resources", 179000,
    "Client logo presentation deck template: concept, moodboard, mockup, rationale."),
  P("brand-rebranding-playbook", "Rebranding Playbook", "Branding Resources", 299000,
    "Complete rebranding playbook: audit, strategy, execution, launch, internal alignment."),

  // 18. Productivity Resources
  P("prod-habit-tracker-notion", "Habit Tracker Notion 2026", "Productivity Resources", 79000,
    "Notion habit tracker with streaks, analytics, and weekly review integration."),
  P("prod-goal-tracker-okr", "Goal Tracker OKR System", "Productivity Resources", 99000,
    "Personal & team OKR tracking system: cascade goals, check-ins, scoring."),
  P("prod-project-planner-kanban", "Project Planner Kanban Pro", "Productivity Resources", 89000,
    "Complete Kanban project planner: backlog, sprint, retrospective, capacity."),
  P("prod-life-dashboard-notion", "Life Dashboard Notion", "Productivity Resources", 119000,
    "Notion life dashboard: goals, habits, budget, journal, reading list — all in one place."),
  P("prod-weekly-review-template", "Weekly Review Template", "Productivity Resources", 59000,
    "4-quadrant weekly review template: wins, blockers, insights, priorities for next week."),

  // 19. Printables
  P("print-kalender-minimalis-2026", "Minimalist Print Calendar 2026", "Printables", 39000,
    "Minimalist A4 print calendar, 12 months + weekly view. Print-ready PDF."),
  P("print-jurnal-morning-pages", "Morning Pages Print Journal", "Printables", 49000,
    "90-day morning pages journal + reflection prompts. A5 print format."),
  P("print-planner-weekly-a5", "Weekly Print Planner (A5)", "Printables", 59000,
    "A5 weekly planner with time-blocking, priorities, and reflection section."),
  P("print-worksheet-focus-day", "Focus Day Print Worksheet", "Printables", 39000,
    "One-page printable to design your focus day: MITs, deep work blocks, energy check."),
  P("print-habit-tracker-set", "Habit Tracker Printable Set", "Printables", 49000,
    "Printable habit tracker set: daily, weekly, monthly. 12 different layouts."),

  // 20. Digital Bundles
  P("bundle-freelancer-complete-kit", "Bundle: Freelancer Complete Kit", "Digital Bundles", 499000,
    "30+ freelancer templates & guides: contracts, invoices, proposals, workflow, Notion OS. Save 60%."),
  P("bundle-content-creator-starter", "Bundle: Content Creator Starter Pack", "Digital Bundles", 349000,
    "Content creator toolkit: content planner, feed templates, prompt collection, review template."),
  P("bundle-seo-professional-toolkit", "Bundle: SEO Professional Toolkit", "Digital Bundles", 599000,
    "Professional SEO bundle: ebook, audit framework, checklist, worksheet, dashboard."),
  P("bundle-small-business-ops", "Bundle: Small Business Ops Bundle", "Digital Bundles", 449000,
    "SME operating bundle: SOPs, invoice, proposal, marketing plan, finance dashboard."),
  P("bundle-ai-workflow-mastery", "Bundle: AI Workflow Mastery", "Digital Bundles", 549000,
    "AI workflow mastery bundle: ebook, prompt pack, adoption framework, implementation playbook."),

  // 21. Modules (learning modules)
  P("modul-google-adsense", "Module: Google AdSense", "Modules", 199000,
    "Earn from Google AdSense — from niche research, approval, ad setup, to basic SEO."),
  P("modul-tunecore-soundon", "Module: Tunecore & SoundOn", "Modules", 179000,
    "Music monetization on Spotify, Apple Music, YouTube, and other digital platforms."),
  P("modul-ternak-blog", "Module: Blog Farming", "Modules", 249000,
    "Build a blog from A–Z into a digital asset that generates passive income."),
  P("modul-seo-copywriting", "Module: SEO Copywriting", "Modules", 199000,
    "Write articles that are Google-friendly and reader-friendly — structure, keywords, hooks."),
  P("modul-social-media-marketing", "Module: Social Media Marketing (SMM)", "Modules", 229000,
    "Branding & sales strategy via social media: content pillars, posting cadence, engagement loops."),
  P("modul-search-engine-marketing", "Module: Search Engine Marketing (Google, Meta, TikTok, AI Ads)", "Modules", 299000,
    "Master Google Ads, Meta Ads, TikTok Ads, YouTube Ads, and AI Ads from setup, targeting, to scaling."),
  P("modul-affiliate-marketing", "Module: Affiliate Marketing", "Modules", 199000,
    "Earn commissions promoting others' products — niche selection, funnels, tracking."),
  P("modul-email-marketing", "Module: Email Marketing", "Modules", 179000,
    "Build a customer database and convert with email funnels: opt-in, sequence, segmentation, deliverability."),
  P("modul-copywriting-content-marketing", "Module: Copywriting & Content Marketing", "Modules", 219000,
    "The craft of writing content and ads that sell — headlines, body copy, CTAs, storytelling frameworks."),
  P("modul-desain-branding-digital-strategist", "Module: Design, Digital Branding & Strategist", "Modules", 249000,
    "Build a consistent visual identity & digital strategy: brand system, tone, channel roadmap."),
  P("modul-ecommerce-marketplace", "Module: E-Commerce & Marketplace", "Modules", 249000,
    "Selling strategies for Shopee, Tokopedia, TikTok Shop, and standalone (custom) online stores."),
  P("modul-ai-tools-digital-business", "Module: AI Tools for Digital Business", "Modules", 229000,
    "Using AI to speed up work & online business — from research and copywriting to automation."),
  P("modul-backlink-building", "Module: Backlink Building", "Modules", 179000,
    "Strategies to build quality backlinks for SEO — outreach, guest posts, PBN awareness, disavow."),
  P("modul-social-media-optimization", "Module: Social Media Optimization (SMO)", "Modules", 179000,
    "Optimize social accounts for max audience reach — bio, hashtags, timing, algorithm."),
  P("modul-seo-a-z", "Module: Search Engine Optimization (SEO) A–Z", "Modules", 299000,
    "Learn SEO end-to-end from basic to advanced — on-page, off-page, technical, content, analytics."),
  P("modul-google-adsense-advanced", "Module: Google AdSense - Advanced Mode", "Modules", 249000,
    "Advanced optimization for scaling AdSense income — RPM, A/B ad placement, evergreen content, policy."),
  P("modul-blogging-platform", "Module: Blogging (WordPress, Blogger, Wix, etc.)", "Modules", 199000,
    "Complete guide to popular blogging platforms — install, themes, plugins, migration, and content optimization."),
  P("modul-ai-prompting", "Module: AI Prompting", "Modules", 199000,
    "Master the craft of effective AI prompts (text & visual) — frameworks, patterns, iteration."),
  P("modul-business-automation", "Module: Business Automation", "Modules", 249000,
    "Using tools and software to automate digital work — end-to-end."),
  P("modul-youtube-monetization", "Module: Video Content & YouTube Monetization", "Modules", 249000,
    "Building a YouTube channel & monetizing it — niche, content, thumbnails, algorithm, YT AdSense."),
  P("modul-digital-sales-funnel", "Module: Digital Sales Funnel & Automation", "Modules", 299000,
    "Build automated sales flows with funnels & tools — awareness, lead, nurture, close, retention."),
];
// ensureSeed() dipindah ke akhir file — SERVICES_SEED & PAGES_SEED dideklarasikan lebih jauh ke bawah.

// -------------- auth --------------
const authListeners = new Set();

export const auth = {
  getSession() {
    return read(KEYS.session, null);
  },
  onChange(fn) {
    authListeners.add(fn);
    return () => authListeners.delete(fn);
  },
  _emit() { authListeners.forEach((fn) => fn(this.getSession())); },

  // Local (non-Supabase) admin login is intentionally unavailable: there is
  // no safe way to authenticate a user against a password stored — and
  // compared — in plain text inside client-side code. Configure Supabase
  // (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY) to enable real
  // authentication; useAuth.jsx already routes to Supabase auth whenever
  // it's configured, so this fallback only runs when it isn't.
  async signIn() {
    throw new Error("Admin login isn't available yet. Configure Supabase to enable authentication.");
  },

  async signUp() {
    throw new Error("Admin sign-up isn't available yet. Configure Supabase to enable authentication.");
  },

  async signOut() {
    localStorage.removeItem(KEYS.session);
    this._emit();
  },
};

// -------------- users --------------
export const usersRepo = {
  list() { return read(KEYS.users, []).map(({ password: _p, ...u }) => u); },
  updateRole(id, role) {
    const list = read(KEYS.users, []);
    const i = list.findIndex((u) => u.id === id);
    if (i >= 0) { list[i].role = role; write(KEYS.users, list); }
    return list[i];
  },
};

// -------------- settings --------------
export const settingsRepo = {
  get() { return normalizePaymentSettings(read(KEYS.settings)); },
  update(patch) {
    const cur = normalizePaymentSettings(read(KEYS.settings));
    const next = normalizePaymentSettings({ ...cur, ...patch, updated_at: now() });
    write(KEYS.settings, next);
    return next;
  },
};

// -------------- homepage --------------
export const homepageRepo = {
  getAll() {
    const stored = read(KEYS.homepage, null);
    return stored ? JSON.parse(JSON.stringify(stored)) : {};
  },
  update(sectionKey, data) {
    const cur = read(KEYS.homepage, {}) ?? {};
    cur[sectionKey] = JSON.parse(JSON.stringify(data));
    write(KEYS.homepage, cur);
    return cur;
  },
};

// -------------- posts --------------
export const postsRepo = {
  list(filter) {
    const getDate = (post) => post.published_at ?? post.created_at ?? "";
    const all = read(KEYS.posts, []).sort((a, b) => (
      getDate(b).localeCompare(getDate(a))
      || (b.created_at ?? "").localeCompare(a.created_at ?? "")
    ));
    return filter?.status ? all.filter((p) => p.status === filter.status) : all;
  },
  get(id) { return read(KEYS.posts, []).find((p) => p.id === id || p.slug === id); },
  getBySlug(slug) { return read(KEYS.posts, []).find((p) => p.slug === slug); },
  create(payload) {
    const list = read(KEYS.posts, []);
    const post = { id: uid(), created_at: now(), updated_at: now(), ...payload };
    list.push(post);
    write(KEYS.posts, list);
    return post;
  },
  update(id, patch) {
    const list = read(KEYS.posts, []);
    const i = list.findIndex((p) => p.id === id || p.slug === id);
    if (i < 0) throw new Error("Post not found");
    list[i] = { ...list[i], ...patch, updated_at: now() };
    write(KEYS.posts, list);
    return list[i];
  },
  delete(id) {
    write(KEYS.posts, read(KEYS.posts, []).filter((p) => p.id !== id && p.slug !== id));
  },
};

// -------------- media --------------
// File disimpan sebagai data URL (base64) di localStorage. Cocok untuk gambar kecil.
export const mediaRepo = {
  list() { return read(KEYS.media, []).sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")); },
  async upload(file, uploadedBy) {
    const dataUrl = await fileToDataUrl(file);
    const item = {
      id: uid(),
      path: `local/${uid()}-${file.name}`,
      url: dataUrl,
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: uploadedBy ?? null,
      created_at: now(),
    };
    const list = read(KEYS.media, []);
    list.push(item);
    try { write(KEYS.media, list); }
    catch (e) {
      throw new Error("Gagal menyimpan — mungkin localStorage penuh. Coba gambar yang lebih kecil (< 500KB).");
    }
    return item;
  },
  delete(id) {
    write(KEYS.media, read(KEYS.media, []).filter((m) => m.id !== id));
  },
  count() { return read(KEYS.media, []).length; },
};

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// -------------- products --------------
export const productsRepo = {
  list(filter) {
    const all = read(KEYS.products, []).sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    return filter?.status ? all.filter((p) => p.status === filter.status) : all;
  },
  get(id) { return read(KEYS.products, []).find((p) => p.id === id || p.slug === id); },
  getBySlug(slug) { return read(KEYS.products, []).find((p) => p.slug === slug); },
  create(payload) {
    const list = read(KEYS.products, []);
    const item = { id: uid(), created_at: now(), updated_at: now(), status: "active", ...payload, price: capStorePrice(payload.price) };
    list.push(item);
    write(KEYS.products, list);
    return item;
  },
  update(id, patch) {
    const list = read(KEYS.products, []);
    const i = list.findIndex((p) => p.id === id || p.slug === id);
    if (i < 0) throw new Error("Product not found");
    const pricePatch = patch.price == null ? {} : { price: capStorePrice(patch.price) };
    list[i] = { ...list[i], ...patch, ...pricePatch, updated_at: now() };
    write(KEYS.products, list);
    return list[i];
  },
  delete(id) { write(KEYS.products, read(KEYS.products, []).filter((p) => p.id !== id && p.slug !== id)); },
};

// -------------- cart (browser session) --------------
const cartListeners = new Set();
export const cartRepo = {
  list() { return read(KEYS.cart, []); },
  onChange(fn) { cartListeners.add(fn); return () => cartListeners.delete(fn); },
  _emit() { cartListeners.forEach((fn) => fn(this.list())); },
  add(productId, qty = 1) {
    const list = read(KEYS.cart, []);
    const i = list.findIndex((it) => it.product_id === productId);
    if (i >= 0) list[i].qty += qty;
    else list.push({ product_id: productId, qty });
    write(KEYS.cart, list); this._emit();
    return list;
  },
  setQty(productId, qty) {
    const list = read(KEYS.cart, []);
    const i = list.findIndex((it) => it.product_id === productId);
    if (i < 0) return list;
    if (qty <= 0) list.splice(i, 1);
    else list[i].qty = qty;
    write(KEYS.cart, list); this._emit();
    return list;
  },
  remove(productId) {
    write(KEYS.cart, read(KEYS.cart, []).filter((it) => it.product_id !== productId));
    this._emit();
  },
  clear() { write(KEYS.cart, []); this._emit(); },
  count() { return read(KEYS.cart, []).reduce((s, it) => s + it.qty, 0); },
  detail() {
    const items = read(KEYS.cart, []);
    const products = read(KEYS.products, []);
    const rows = items.map((it) => {
      const p = products.find((x) => x.id === it.product_id);
      if (!p) return null;
      const product = applyProductPriceDiscount(p);
      return { ...it, product, subtotal: (product.price ?? 0) * it.qty };
    }).filter(Boolean);
    const total = rows.reduce((s, r) => s + r.subtotal, 0);
    return { rows, total };
  },
};

// -------------- orders --------------
// Status flow: PENDING_PAYMENT → WAITING_VERIFICATION → PAID / REJECTED / CANCELLED
export const ORDER_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  WAITING_VERIFICATION: "waiting_verification",
  PAID: "paid",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

function genOrderNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const seq = String(Date.now()).slice(-6);
  return `OKR-${y}${m}${day}-${seq}`;
}

export const ordersRepo = {
  list() { return read(KEYS.orders, []).sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")); },
  get(id) { return read(KEYS.orders, []).find((o) => o.id === id || o.order_number === id); },
  getByNumber(orderNumber) { return read(KEYS.orders, []).find((o) => o.order_number === orderNumber); },
  create(payload) {
    const list = read(KEYS.orders, []);
    const order = {
      id: uid(),
      order_number: genOrderNumber(),
      status: ORDER_STATUS.PENDING_PAYMENT,
      created_at: now(),
      payment_deadline: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
      payment_proof: null,
      payment_proof_uploaded_at: null,
      admin_note: null,
      ...payload,
    };
    list.push(order);
    write(KEYS.orders, list);
    return order;
  },
  updateStatus(id, status, extra = {}) {
    const list = read(KEYS.orders, []);
    const i = list.findIndex((o) => o.id === id || o.order_number === id);
    if (i < 0) throw new Error("Order not found");
    list[i] = { ...list[i], status, ...extra, updated_at: now() };
    write(KEYS.orders, list);
    return list[i];
  },
  uploadProof(id, dataUrl) {
    return this.updateStatus(id, ORDER_STATUS.WAITING_VERIFICATION, {
      payment_proof: dataUrl,
      payment_proof_uploaded_at: now(),
    });
  },
  approve(id, note) {
    return this.updateStatus(id, ORDER_STATUS.PAID, { admin_note: note ?? null });
  },
  reject(id, note) {
    return this.updateStatus(id, ORDER_STATUS.REJECTED, { admin_note: note ?? null });
  },
};

// -------------- services --------------
export const servicesRepo = {
  list(filter) {
    const all = read(KEYS.services, []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return filter?.status ? all.filter((s) => s.status === filter.status) : all;
  },
  get(id) { return read(KEYS.services, []).find((s) => s.id === id || s.slug === id); },
  getBySlug(slug) { return read(KEYS.services, []).find((s) => s.slug === slug); },
  create(payload) {
    const list = read(KEYS.services, []);
    const item = { id: uid(), created_at: now(), updated_at: now(), status: "active", ...payload };
    list.push(item); write(KEYS.services, list); return item;
  },
  update(id, patch) {
    const list = read(KEYS.services, []);
    const i = list.findIndex((s) => s.id === id || s.slug === id);
    if (i < 0) throw new Error("Service not found");
    list[i] = { ...list[i], ...patch, updated_at: now() };
    write(KEYS.services, list); return list[i];
  },
  delete(id) { write(KEYS.services, read(KEYS.services, []).filter((s) => s.id !== id && s.slug !== id)); },
};

// -------------- contacts (form submissions) --------------
export const contactsRepo = {
  list() { return read(KEYS.contacts, []).sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")); },
  get(id) { return read(KEYS.contacts, []).find((c) => c.id === id); },
  create(payload) {
    const list = read(KEYS.contacts, []);
    const item = { id: uid(), created_at: now(), status: "new", ...payload };
    list.push(item); write(KEYS.contacts, list); return item;
  },
  updateStatus(id, status) {
    const list = read(KEYS.contacts, []);
    const i = list.findIndex((c) => c.id === id);
    if (i < 0) return;
    list[i].status = status; write(KEYS.contacts, list); return list[i];
  },
  delete(id) { write(KEYS.contacts, read(KEYS.contacts, []).filter((c) => c.id !== id)); },
  unreadCount() { return read(KEYS.contacts, []).filter((c) => c.status === "new").length; },
};

// -------------- pages (about, contact, privacy, terms) --------------
function pagesRead() {
  const stored = read(KEYS.pages, null);
  return stored ? JSON.parse(JSON.stringify(stored)) : JSON.parse(JSON.stringify(PAGES_SEED));
}
export const pagesRepo = {
  getAll() { return pagesRead(); },
  get(key) { return pagesRead()[key]; },
  update(key, data) {
    const all = pagesRead();
    // Deep clone data juga, biar tidak share ref dengan state React
    const cleanData = JSON.parse(JSON.stringify(data));
    all[key] = { ...(all[key] ?? {}), ...cleanData, updated_at: now() };
    write(KEYS.pages, all);
    // Verifikasi write berhasil dengan re-read
    const verified = pagesRead()[key];
    return verified;
  },
};

// -------------- stats --------------
export function getStats() {
  return {
    posts: read(KEYS.posts, []).length,
    media: read(KEYS.media, []).length,
    users: read(KEYS.users, []).length,
    products: read(KEYS.products, []).length,
    orders: read(KEYS.orders, []).length,
    services: read(KEYS.services, []).length,
    contacts: read(KEYS.contacts, []).length,
    contactsUnread: read(KEYS.contacts, []).filter((c) => c.status === "new").length,
  };
}

// ================================================================
// SEED DATA
// ================================================================
const PAGES_SEED = {
  about: {
    hero_kicker: "// ABOUT",
    hero_title: "Building a digital foundation that lasts.",
    hero_subtitle: "israanwar is a digital studio focused on web development, SEO, and AI-powered content strategy. We help personal brands and businesses build a digital presence that isn't just beautiful, but productive.",
    story_title: "The short story.",
    story_body: "It started from watching great websites go undiscovered on Google, and smart content never reach the right audience. israanwar exists to bridge that gap — good-looking design, fast code, and grounded strategy.",
    values: [
      { title: "Data first", body: "Every decision starts from data, not assumptions. Audit first, then act." },
      { title: "Transparent", body: "You know what we're working on, why, and what the results look like. No excessive jargon." },
      { title: "Iterate", body: "Digital isn't one-and-done. We keep optimizing after launch, not hands-off." },
    ],
    stats: [
      { value: "150+", label: "Projects delivered" },
      { value: "+13 years", label: "Experience" },
      { value: "100%", label: "Quality commitment" },
    ],
    updated_at: now(),
  },
  contact: {
    hero_kicker: "// CONTACT",
    hero_title: "Let's talk.",
    hero_subtitle: "Have a project, question, or collaboration in mind? Send a message via the form below or reach us on WhatsApp / email.",
    address: "Indonesia (remote-first, working with clients worldwide)",
    hours: "Monday–Friday, 09:00–18:00 WIB",
    response_time: "We reply within 24 hours on business days.",
    updated_at: now(),
  },
  privacy: {
    title: "Privacy Policy",
    updated: "August 5, 2026",
    body: `israanwar ("we") respect the privacy of every visitor and user of our services. This Privacy Policy explains how we collect, use, store, and protect your information.

**1. Data We Collect**

We only collect data that is genuinely necessary:
- Contact data (name, email, phone number) — only when you send a message via the contact form or place an order.
- Transaction data — if you purchase digital products from our store.
- Technical data (browser type, pages visited) — for analytics and service improvement.

**2. Data Usage**

Your data is used to:
- Respond to your questions or requests.
- Process orders and deliver digital products.
- Send important updates related to your order (not marketing spam).
- Analyze site usage in aggregate (no personal identification).

**3. Data Sharing**

We do NOT sell, rent, or share your personal data with third parties for marketing purposes. Data is only shared when:
- Required by law (e.g. court order).
- Necessary to process payments (via trusted processors).

**4. Security**

Data is stored with industry-standard encryption. However, no system is 100% secure — we continuously improve our protection.

**5. Your Rights**

You have the right to:
- Access personal data we store about you.
- Request corrections or deletion.
- Withdraw consent for data usage at any time.

For such requests, contact us via the email or WhatsApp listed on the contact page.

**6. Policy Changes**

This policy may be updated at any time. The latest version will always be available on this page.`,
    updated_at: now(),
  },
  portfolio: {
    hero_kicker: "// PORTFOLIO",
    hero_title: "Selected Projects",
    hero_subtitle: "A compact portfolio of web, SEO, content, monetization, and digital growth projects handled as a consultant.",
    profile: "",
    contact: { phone: "", email: "", web: "", linkedin: "", location: "" },
    core_expertise: [
      "Consultant",
      "Web Development",
      "SEO Architecture",
      "Content Strategy",
      "Google AdSense",
      "SEM",
      "Social Media",
      "Digital Branding",
    ],
    experience: [],
    consulting: [
      {
        year: "2023-Now",
        role: "AdSense, SEO & Website Development Consultant",
        org: "PT Cipta Jasa Digital",
        desc: "Web development advisory, SEO architecture, content monetization, and Google AdSense optimization.",
      },
      {
        year: "2024-Now",
        role: "Web Development & IT Consultant",
        org: "PT Tri Ariesta Dinamika (TADCO)",
        desc: "Web development and IT consulting for reliable, maintainable websites and practical business systems.",
      },
      {
        year: "2024-Now",
        role: "AdSense YouTube & SEM Consultant",
        org: "PT Nisdar Digital Group",
        desc: "YouTube monetization, search engine marketing, audience growth, and digital campaign optimization.",
      },
      {
        year: "2023-Now",
        role: "Brand, Creative & Music Consultant",
        org: "Walk Alone Studio",
        desc: "Brand direction, creative identity, audiovisual content production, and release strategy for music and creative projects.",
      },
      {
        year: "2024-Now",
        role: "Web Development & SEO Consultant",
        org: "R24 Studio",
        desc: "Website development, SEO architecture, and organic visibility optimization.",
      },
      {
        year: "2024-Now",
        role: "YouTube Sports Channel Consultant",
        org: "Akraga TV",
        desc: "Sports YouTube channel strategy, content direction, channel optimization, monetization, and audience growth.",
      },
    ],
    portfolio_groups: [
      {
        label: "Products & Platforms",
        items: "OkkaLabs, OKKA AI, Isra Anwar, MetodePenelitian.",
      },
      {
        label: "Website Development & SEO",
        items: "TADCO, SMAK Makassar, UPRI Makassar, Pemerintah Kota Ambon, IRIS SMAKMA, Manajemen Sumber Daya Manusia, Investoft, Pergolafr, MetodePenelitian, Electra Junction, Situasi ID, CoreFold, Centra Actual, Zapgaze, Blockchain Essential, Radarpedia, Datacore, Technura, Technify, Teknold, Oktekno, Bytecrux, Playrift, Cyberix, Cloudix, Byteindo, Funzonez, Protechz, Techindo, Coredata, Rayatekno, Techroom, Gamebolt, Skillwin, Bytearc, Netina, Techloom, Learnflix, Datacipta, Skillzy, Netforge, Techgrid, Gamenest, Indodata, Tutorgo, SMAN 1 Takalar, AC Dive Club, Kopi Break, Handuk Pink, Citrus Online, Daewong, Gear Flare, Glow Charm, Pro Media, Play Now!, Play Gamehub, Caripondokan, Daengkuliner.",
      },
      {
        label: "SEO, Niche & AdSense Sites",
        items: "Cracks Geek, Deaf Tech News, TechWire, Trending Topics ID, Toraja Culture, Divescovery, Gadget Wins, Akraga, Sourcing Electricals, Situasi ID, Centraaktual, Radarpedia, Travelinfo, Biayanesia, JPCloud, Sixweb, Politico, Momtastic, Lifehacker, Indietraveller, Datacore, Technura, Technify, Teknold, Oktekno, Bytecrux, Playrift, Cyberix, Cloudix, Byteindo, Funzonez, Protechz, Techindo, Coredata, Rayatekno, Techroom, Gamebolt, Skillwin, Bytearc, Netina, Techloom, Learnflix, Datacipta, Skillzy, Netforge, Techgrid, Gamenest, Indodata, Tutorgo, Citrus Online, Daewong.",
      },
      {
        label: "Event & Brand Campaigns",
        items: "MKS Fest, Creative Industries Talkshow, Slank Luwuk, Hijrahfest Makassar, Creativepreneur Fest, Jappa Jokka Cap Go Meh, Sevenfest, Aseera, The Clinic Beautylosophy, Kopi Break, R24 Studio, Eunoia, Belika ID, Crumbs Cakes, Aco Makassar, The Great Journey of NOAH, Debat Kandidat Kepala Daerah Sulawesi Selatan - KPU RI, Live Streaming PSM Makassar, Festival Ekonomi Syariah (FESyar) - Bank Indonesia, Warnata Kreasi Indonesia, 99 Entertainment, PT Multi Bintang Indonesia Tbk, Akraga TV, Entropy Coffee, Kharisma College, SMAK Makassar, Ilagaligo Studio, Toyota Kalla Urip Sumoharjo, Direktorat Jenderal Pajak Provinsi Jawa Tengah.",
      },
    ],
    education: [],
    certifications: [
      {
        slug: "anthropic",
        name: "Anthropic",
        logo: "/assets/brand-logos/anthropic.svg",
        items: [
          { name: "Claude 101", url: "https://verify.skilljar.com/c/nuevewitxf89" },
          { name: "Claude Code 101", url: "https://verify.skilljar.com/c/fhtkrxhzqhxc" },
          { name: "Claude Cowork", url: "https://academy.claude.com/verify/031c71a72121835abc8b66d1ba1c6c14" },
          { name: "AI Capabilities and Limitations", url: "https://academy.claude.com/verify/9f76d33420da71607a1dff2bbc9c3183" },
          { name: "Building with the Claude API", url: "https://academy.claude.com/verify/737ef965805e087af65b72c28b57b8ab" },
        ],
      },
      {
        slug: "openai",
        name: "OpenAI",
        logo: "/assets/brand-logos/openai.svg",
        items: [
          { name: "OpenAI Academy — Agents and Workflows", url: "https://academy.openai.com/home/certificate/vrllcwxs89" },
          { name: "OpenAI Academy — Applied AI Foundations", url: "https://academy.openai.com/home/certificate/hgila7fxlo" },
        ],
      },
      {
        slug: "google",
        name: "Google",
        logo: "/assets/brand-logos/google.svg",
        items: [
          { name: "Google Analytics", url: "https://skillshop.credential.net/29adf04b-326a-4d42-ac16-765f7ee7a0bb#acc.JmcydX6U" },
          { name: "Grow Your Monetization with Google Ad Manager", url: "https://skillshop.credential.net/b6fbba7a-31c6-48a9-9a5d-192a4bcae472#acc.QBfDIdjt" },
        ],
      },
      {
        slug: "ahrefs",
        name: "Ahrefs",
        logo: "/assets/brand-logos/ahrefs.svg",
        items: [
          { name: "Certified in Ahrefs Marketing Platform", url: "https://ahrefs.com/academy/certificate/97dcdd8085c04f8aa6e45cf7767bb6b6" },
        ],
      },
      {
        slug: "semrush",
        name: "Semrush",
        logo: "/assets/brand-logos/semrush.svg",
        items: [
          { name: "Semrush AI Search Operating System", url: "https://static.semrush.com/academy/certificates/2325cb8d30/isra-anwar_37.pdf" },
          { name: "AI Visibility Essentials with Semrush", url: "https://static.semrush.com/academy/certificates/e26bbacddc/isra-anwar_25.pdf" },
          { name: "Technical SEO and AI Search Essentials with Semrush", url: "https://static.semrush.com/academy/certificates/1ed4632abf/isra-anwar_25.pdf" },
        ],
      },
      {
        slug: "linkedin",
        name: "LinkedIn",
        logo: "/assets/brand-logos/linkedin.svg",
        items: [
          { name: "LinkedIn Marketing Measurement Certification", url: "https://training.marketing.linkedin.com/verify/yffmqqh862i5" },
          { name: "LinkedIn Content and Creative Design Certification", url: "https://training.marketing.linkedin.com/verify/xu4q9q7ivaya" },
          { name: "LinkedIn Marketing Strategy Certification", url: "https://training.marketing.linkedin.com/verify/vr83zspwu2fk" },
        ],
      },
      {
        slug: "apple",
        name: "Apple",
        logo: "/assets/brand-logos/apple.svg",
        items: [
          { name: "Apple Ads Certified", url: "https://certification-ads.apple.com/certificate/EpppzS2EvG" },
        ],
      },
      {
        slug: "spotify",
        name: "Spotify",
        logo: "/assets/brand-logos/spotify.svg",
        items: [
          { name: "Spotify Advertising Fundamentals Certification", url: "https://advertisingacademy.byspotify.com/student/award/7S5tCgaHTZBdpDHAo1Rh9eWg" },
          { name: "Spotify Advertising Strategy & Planning Certification", url: "https://advertisingacademy.byspotify.com/student/award/HbjLmcPaH3oqpDMmBFYag7Rz" },
          { name: "Spotify Advertising Media Buying", url: "https://advertisingacademy.byspotify.com/student/award/5fT4p7ZwBd2Ncg6zqvJ54umm" },
        ],
      },
      {
        slug: "amazon",
        name: "Amazon",
        logo: "/assets/brand-logos/amazon.svg",
        items: [
          { name: "Amazon Ads Programmatic Solutions Advanced Certification", url: "https://advertising.amazon.com/academy/certificates/b09f2050-bbcd-461c-8a7b-c9a8cc21a385" },
          { name: "The Brand Builder — Amazon Ads", url: "https://advertising.amazon.com/academy/certificates/d8407a9b-68c9-4af4-a9b7-ab5bca92e782" },
          { name: "The Performance Expert — Amazon Ads", url: "https://advertising.amazon.com/academy/certificates/3899eabd-213f-4862-a87a-8f9b670fc2c1" },
        ],
      },
      {
        slug: "meta",
        name: "Meta",
        logo: "/assets/brand-logos/meta.svg",
        items: [
          { name: "Opportunity Score: Experimentally Proven Recommendations to Help Improve Your Campaign Performance", url: "https://github.com/israanwar/israanwar/raw/main/assets/certifications/meta-opportunity-score.png" },
          { name: "Meta Advertising Standards and Brand Safety", url: "https://github.com/israanwar/israanwar/raw/main/assets/certifications/meta-advertising-standards.png" },
          { name: "Data Privacy and Policies at Meta", url: "https://github.com/israanwar/israanwar/raw/main/assets/certifications/meta-data-privacy.png" },
          { name: "Advertising Solutions and AI", url: "https://github.com/israanwar/israanwar/raw/main/assets/certifications/meta-advertising-ai.png" },
          { name: "Campaign Evaluation and Measurement Strategies", url: "https://github.com/israanwar/israanwar/raw/main/assets/certifications/meta-campaign-evaluation.png" },
          { name: "Business Management Tools and Ads Resources", url: "https://github.com/israanwar/israanwar/raw/main/assets/certifications/meta-business-tools.png" },
          { name: "Advertising Solutions Across the Marketing Funnel", url: "https://github.com/israanwar/israanwar/raw/main/assets/certifications/meta-advertising-funnel.png" },
        ],
      },
      {
        slug: "ibm",
        name: "IBM",
        logo: "/assets/brand-logos/ibm.svg",
        items: [
          { name: "Design an AI-Supported Marketing Campaign (IBM SkillsBuild)", url: "https://github.com/israanwar/israanwar/raw/main/assets/certifications/ibm-ai-marketing-campaign.jpg" },
        ],
      },
    ],
    // Separate from `certifications` on purpose: that array also feeds the
    // Portfolio page's "Certified by" logo marquee (one entry per brand
    // logo), and these three don't have a single brand mark to show there.
    // Only the homepage credentials board reads this field.
    training_workshops: [
      {
        name: "Implementasi Data Science dalam Sepak Bola — Shift Talks (Shift Academy x Ruang Taktik), 2022",
        url: "https://github.com/israanwar/israanwar/raw/main/assets/certifications/shift-talks-data-science.png",
      },
      {
        name: "Cara Mudah Membuat Situs untuk Bisnis Anda — Google x Gapura Digital, 2019",
        url: "https://github.com/israanwar/israanwar/raw/main/assets/certifications/google-gapura-cara-membuat-situs.png",
      },
      {
        name: "Tips Membuat Situs Bisnis yang Efektif — Google x Gapura Digital, 2019",
        url: "https://github.com/israanwar/israanwar/raw/main/assets/certifications/google-gapura-tips-situs-bisnis.png",
      },
    ],
    tools: [
      "Ahrefs",
      "SEMrush",
      "Screaming Frog",
      "GA4",
      "Search Console",
      "Google Ads",
      "Meta Ads Manager",
      "Google AdSense",
      "WordPress",
      "Supabase",
      "n8n",
      "Figma",
      "Vercel",
    ],
    languages: [],
    updated_at: now(),
  },
  terms: {
    title: "Terms of Service",
    updated: "August 5, 2026",
    body: `By using israanwar services, you agree to the following terms:

**1. Service Usage**

The israanwar.com website provides information, digital products, and consultant services. You agree to use this site for lawful purposes that do not harm others.

**2. Digital Content**

- All digital products (ebooks, templates, guidelines, etc.) are licensed for personal or internal business use.
- **You may not** resell, redistribute, or share purchased products with third parties.
- Copyright remains with israanwar.

**3. Payment & Refunds**

- Payments are processed via QRIS.
- Once payment is verified, digital products are delivered via email or a download link.
- **Refund policy:** because products are digital and immediately downloadable, refunds are only granted for technical faults on our end, and requests must be submitted within 24 hours of purchase.

**4. Consulting Services**

The scope, timeline, and investment for services (web development, SEO, etc.) are governed by a separate contract agreed upon before the project begins.

**5. Limitation of Liability**

Services are provided "as is". We strive to deliver the best results but do not guarantee specific SEO rankings, conversion rates, or business outcomes beyond our control.

**6. Changes to Terms**

These terms may change at any time. The latest version will always be available on this page.

**7. Governing Law**

These terms are governed by the laws of the Republic of Indonesia. Any disputes will be resolved amicably first, and if no agreement is reached, through the appropriate legal channels.`,
    updated_at: now(),
  },
};


// Init seed data — dipanggil setelah semua const SEED dideklarasikan (menghindari TDZ)
ensureSeed();
