// Default content for the CMS-editable pages (about, contact, privacy,
// portfolio, terms). Lives in its own dependency-free module so build-time
// scripts (scripts/prerender.mjs) can read it in Node; localStore.js — which
// touches localStorage — re-imports it for the browser fallback store.
const now = () => new Date().toISOString();

export const PAGES_SEED = {
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
        items: "TADCO, SMAK Makassar, UPRI Makassar, Pemerintah Kota Ambon, IRIS SMAKMA, Manajemen Sumber Daya Manusia, MetodePenelitian, Electra Junction, Situasi ID, CoreFold, Centra Actual, Zapgaze, Blockchain Essential, Radarpedia, Datacore, Technura, Technify, Teknold, Oktekno, Bytecrux, Playrift, Cyberix, Cloudix, Byteindo, Funzonez, Protechz, Techindo, Coredata, Rayatekno, Techroom, Gamebolt, Skillwin, Bytearc, Netina, Techloom, Learnflix, Datacipta, Skillzy, Netforge, Techgrid, Gamenest, Indodata, Tutorgo, SMAN 1 Takalar, AC Dive Club, Kopi Break, Handuk Pink, Citrus Online, Daewong, Gear Flare, Glow Charm, Pro Media, Play Now!, Play Gamehub, Caripondokan, Daengkuliner.",
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
