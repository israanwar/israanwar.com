# Catatan perbaikan SEO/AEO/GEO — butuh konfirmasi pemilik

Dokumen ini menyertai commit P1/P2/P3. Isinya hal-hal yang **sengaja belum diterapkan** karena menghapus, men-noindex, atau memuat data faktual yang harus dikonfirmasi pemilik situs.

## A. Data faktual yang perlu dikonfirmasi

Sumber: brief audit. Semuanya ada di `src/data/profile.js` (satu sumber untuk halaman About dan JSON-LD Person).

| Data | Nilai yang dipakai | Catatan |
| --- | --- | --- |
| Nama | Isra Anwar (alias Okka, Okka Rhys) | dari brief |
| Lokasi | Jakarta / Makassar, Indonesia | dari brief |
| Pengalaman | 15+ tahun | dari brief. CMS/seed masih berisi stat "+13 tahun"; halaman About kini menimpanya dengan nilai dari `profile.js`. Perbarui juga di CMS (Supabase `pages.about`). |
| Sertifikasi | Google, Meta, IBM Data Analyst Professional Certificate | Entri Google dan Meta di JSON-LD memakai nama sertifikat yang sudah tercantum di halaman Portfolio. Repo Portfolio mencatat sertifikat IBM yang berbeda ("Design an AI-Supported Marketing Campaign (IBM SkillsBuild)"); "IBM Data Analyst Professional Certificate" belum punya tautan verifikasi. **Mohon konfirmasi dan berikan URL verifikasinya.** |
| Pendidikan | Magister Manajemen, ITB Nobel Indonesia (sedang berjalan) | Ditampilkan sebagai teks saja, tidak dimasukkan ke `alumniOf`/`hasCredential` karena belum lulus. |
| Profil resmi (sameAs) | LinkedIn, GitHub | Hanya dua ini yang ada di repo. Tambahkan profil lain di `PROFILE.sameAs` bila ada. |
| Nama studio | "Isra Anwar" | Brief tidak menyebut nama studio terpisah, jadi Organization memakai nama brand yang sama dengan `@id` berbeda (`/#person`, `/#organization`). Beri tahu bila studio punya nama resmi lain. |
| Portfolio | Data apa adanya dari CMS/seed | Tidak ada klien, angka, atau hasil yang ditambahkan. |

## B. Halaman layanan (140 halaman di 12 kategori)

Brief menyebut 120 halaman; katalog saat ini berisi **140** layanan dan **12** halaman kategori.

### B1. Dipertahankan dan diperkaya (32 halaman)

Sudah mendapat meta description unik (`src/data/serviceMeta.js`). Isi badan halaman masih templat; pengayaan isi butuh bahan nyata dari pemilik (proses kerja, contoh deliverable, FAQ).

| Slug | Layanan | Kategori |
| --- | --- | --- |
| `web-development-landing-page-development` | Landing Page Development | Web Development |
| `search-optimization-seo-audit` | SEO Audit | Search Optimization |
| `search-optimization-technical-seo` | Technical SEO | Search Optimization |
| `search-optimization-on-page-seo` | On-Page SEO | Search Optimization |
| `search-optimization-off-page-seo` | Off-Page SEO | Search Optimization |
| `search-optimization-local-seo` | Local SEO | Search Optimization |
| `search-optimization-international-seo` | International SEO | Search Optimization |
| `search-optimization-enterprise-seo` | Enterprise SEO | Search Optimization |
| `search-optimization-e-commerce-seo` | E-Commerce SEO | Search Optimization |
| `search-optimization-seo-content-strategy` | SEO Content Strategy | Search Optimization |
| `search-optimization-answer-engine-optimization-aeo` | Answer Engine Optimization (AEO) | Search Optimization |
| `search-optimization-generative-engine-optimization-geo` | Generative Engine Optimization (GEO) | Search Optimization |
| `search-optimization-knowledge-graph-optimization` | Knowledge Graph Optimization | Search Optimization |
| `search-optimization-entity-seo` | Entity SEO | Search Optimization |
| `search-optimization-seo-recovery` | SEO Recovery | Search Optimization |
| `search-optimization-seo-monitoring-and-reporting` | SEO Monitoring & Reporting | Search Optimization |
| `ai-automation-ai-strategy-consulting` | AI Strategy Consulting | AI & Automation |
| `ai-automation-ai-workflow-automation` | AI Workflow Automation | AI & Automation |
| `ai-automation-ai-agent-development` | AI Agent Development | AI & Automation |
| `ai-automation-ai-chatbot-development` | AI Chatbot Development | AI & Automation |
| `ai-automation-prompt-engineering` | Prompt Engineering | AI & Automation |
| `ai-automation-business-process-automation` | Business Process Automation | AI & Automation |
| `ai-automation-workflow-integration` | Workflow Integration | AI & Automation |
| `ai-automation-knowledge-base-development` | Knowledge Base Development | AI & Automation |
| `ai-automation-ai-document-processing` | AI Document Processing | AI & Automation |
| `ai-automation-ai-customer-support` | AI Customer Support | AI & Automation |
| `ai-automation-ai-content-workflow` | AI Content Workflow | AI & Automation |
| `ai-automation-custom-ai-solution-development` | Custom AI Solution Development | AI & Automation |
| `content-creative-landing-page-copywriting` | Landing Page Copywriting | Content & Creative |
| `analytics-data-intelligence-google-analytics-setup` | Google Analytics Setup | Analytics & Data Intelligence |
| `analytics-data-intelligence-google-tag-manager-setup` | Google Tag Manager Setup | Analytics & Data Intelligence |
| `analytics-data-intelligence-conversion-tracking` | Conversion Tracking | Analytics & Data Intelligence |

### B2. Usulan: noindex sementara atau konsolidasi ke halaman kategori (108 halaman) — **menunggu konfirmasi**

Belum diubah. Opsi yang diusulkan: (a) `noindex, follow` dan keluarkan dari sitemap sampai halaman diperkaya, atau (b) 301 ke halaman kategori induknya. Halaman kategori tetap diindeks.

| Slug | Layanan | Kategori |
| --- | --- | --- |
| `web-development-corporate-website-development` | Corporate Website Development | Web Development |
| `web-development-company-profile-website` | Company Profile Website | Web Development |
| `web-development-custom-website-development` | Custom Website Development | Web Development |
| `web-development-portfolio-website-development` | Portfolio Website Development | Web Development |
| `web-development-business-website-development` | Business Website Development | Web Development |
| `web-development-web-application-development` | Web Application Development | Web Development |
| `web-development-cms-development` | CMS Development | Web Development |
| `web-development-headless-cms-development` | Headless CMS Development | Web Development |
| `web-development-wordpress-development` | WordPress Development | Web Development |
| `web-development-website-migration-and-modernization` | Website Migration & Modernization | Web Development |
| `web-development-website-maintenance` | Website Maintenance | Web Development |
| `mobile-app-development-android-app-development` | Android App Development | Mobile App Development |
| `mobile-app-development-ios-app-development` | iOS App Development | Mobile App Development |
| `mobile-app-development-cross-platform-app-development` | Cross-Platform App Development | Mobile App Development |
| `mobile-app-development-progressive-web-app-pwa` | Progressive Web App (PWA) | Mobile App Development |
| `mobile-app-development-business-mobile-app` | Business Mobile App | Mobile App Development |
| `mobile-app-development-e-commerce-mobile-app` | E-Commerce Mobile App | Mobile App Development |
| `mobile-app-development-customer-portal-mobile-app` | Customer Portal Mobile App | Mobile App Development |
| `mobile-app-development-internal-company-app` | Internal Company App | Mobile App Development |
| `mobile-app-development-mobile-app-ui-redesign` | Mobile App UI Redesign | Mobile App Development |
| `mobile-app-development-mobile-app-maintenance` | Mobile App Maintenance | Mobile App Development |
| `ui-ux-design-ui-design` | UI Design | UI/UX Design |
| `ui-ux-design-ux-design` | UX Design | UI/UX Design |
| `ui-ux-design-ux-audit` | UX Audit | UI/UX Design |
| `ui-ux-design-ui-audit` | UI Audit | UI/UX Design |
| `ui-ux-design-product-design` | Product Design | UI/UX Design |
| `ui-ux-design-design-system-development` | Design System Development | UI/UX Design |
| `ui-ux-design-wireframing` | Wireframing | UI/UX Design |
| `ui-ux-design-interactive-prototype` | Interactive Prototype | UI/UX Design |
| `ui-ux-design-user-flow-design` | User Flow Design | UI/UX Design |
| `ui-ux-design-information-architecture` | Information Architecture | UI/UX Design |
| `branding-marketing-selling-brand-strategy` | Brand Strategy | Branding, Marketing & Selling |
| `branding-marketing-selling-brand-identity` | Brand Identity | Branding, Marketing & Selling |
| `branding-marketing-selling-brand-positioning` | Brand Positioning | Branding, Marketing & Selling |
| `branding-marketing-selling-marketing-strategy` | Marketing Strategy | Branding, Marketing & Selling |
| `branding-marketing-selling-digital-marketing-strategy` | Digital Marketing Strategy | Branding, Marketing & Selling |
| `branding-marketing-selling-search-engine-marketing-sem` | Search Engine Marketing (SEM) | Branding, Marketing & Selling |
| `branding-marketing-selling-performance-marketing` | Performance Marketing | Branding, Marketing & Selling |
| `branding-marketing-selling-social-media-marketing` | Social Media Marketing | Branding, Marketing & Selling |
| `branding-marketing-selling-content-marketing` | Content Marketing | Branding, Marketing & Selling |
| `branding-marketing-selling-email-marketing` | Email Marketing | Branding, Marketing & Selling |
| `branding-marketing-selling-sales-funnel-development` | Sales Funnel Development | Branding, Marketing & Selling |
| `branding-marketing-selling-conversion-rate-optimization-cro` | Conversion Rate Optimization (CRO) | Branding, Marketing & Selling |
| `branding-marketing-selling-personal-branding` | Personal Branding | Branding, Marketing & Selling |
| `branding-marketing-selling-customer-journey-optimization` | Customer Journey Optimization | Branding, Marketing & Selling |
| `branding-marketing-selling-sales-strategy-development` | Sales Strategy Development | Branding, Marketing & Selling |
| `content-creative-seo-content-writing` | SEO Content Writing | Content & Creative |
| `content-creative-website-copywriting` | Website Copywriting | Content & Creative |
| `content-creative-content-strategy` | Content Strategy | Content & Creative |
| `content-creative-editorial-planning` | Editorial Planning | Content & Creative |
| `content-creative-blog-management` | Blog Management | Content & Creative |
| `content-creative-content-localization` | Content Localization | Content & Creative |
| `content-creative-creative-campaign-planning` | Creative Campaign Planning | Content & Creative |
| `content-creative-visual-content-design` | Visual Content Design | Content & Creative |
| `content-creative-email-copywriting` | Email Copywriting | Content & Creative |
| `content-creative-content-audit` | Content Audit | Content & Creative |
| `content-creative-content-optimization` | Content Optimization | Content & Creative |
| `e-commerce-solutions-e-commerce-website-development` | E-Commerce Website Development | E-Commerce Solutions |
| `e-commerce-solutions-marketplace-integration` | Marketplace Integration | E-Commerce Solutions |
| `e-commerce-solutions-digital-product-store` | Digital Product Store | E-Commerce Solutions |
| `e-commerce-solutions-subscription-platform` | Subscription Platform | E-Commerce Solutions |
| `e-commerce-solutions-membership-website` | Membership Website | E-Commerce Solutions |
| `e-commerce-solutions-payment-gateway-integration` | Payment Gateway Integration | E-Commerce Solutions |
| `e-commerce-solutions-inventory-system-integration` | Inventory System Integration | E-Commerce Solutions |
| `e-commerce-solutions-order-management-system` | Order Management System | E-Commerce Solutions |
| `e-commerce-solutions-customer-loyalty-system` | Customer Loyalty System | E-Commerce Solutions |
| `e-commerce-solutions-checkout-optimization` | Checkout Optimization | E-Commerce Solutions |
| `e-commerce-solutions-customer-experience-optimization` | Customer Experience Optimization | E-Commerce Solutions |
| `e-commerce-solutions-e-commerce-maintenance` | E-Commerce Maintenance | E-Commerce Solutions |
| `analytics-data-intelligence-dashboard-development` | Dashboard Development | Analytics & Data Intelligence |
| `analytics-data-intelligence-marketing-dashboard` | Marketing Dashboard | Analytics & Data Intelligence |
| `analytics-data-intelligence-business-intelligence-dashboard` | Business Intelligence Dashboard | Analytics & Data Intelligence |
| `analytics-data-intelligence-data-visualization` | Data Visualization | Analytics & Data Intelligence |
| `analytics-data-intelligence-customer-analytics` | Customer Analytics | Analytics & Data Intelligence |
| `analytics-data-intelligence-marketing-performance-analysis` | Marketing Performance Analysis | Analytics & Data Intelligence |
| `analytics-data-intelligence-data-strategy-consulting` | Data Strategy Consulting | Analytics & Data Intelligence |
| `digital-systems-crm-development` | CRM Development | Digital Systems |
| `digital-systems-erp-integration` | ERP Integration | Digital Systems |
| `digital-systems-client-portal-development` | Client Portal Development | Digital Systems |
| `digital-systems-customer-portal-development` | Customer Portal Development | Digital Systems |
| `digital-systems-employee-portal-development` | Employee Portal Development | Digital Systems |
| `digital-systems-learning-management-system-lms` | Learning Management System (LMS) | Digital Systems |
| `digital-systems-membership-platform` | Membership Platform | Digital Systems |
| `digital-systems-booking-and-reservation-system` | Booking & Reservation System | Digital Systems |
| `digital-systems-knowledge-base-system` | Knowledge Base System | Digital Systems |
| `digital-systems-internal-dashboard-development` | Internal Dashboard Development | Digital Systems |
| `digital-systems-document-management-system` | Document Management System | Digital Systems |
| `digital-systems-custom-business-system-development` | Custom Business System Development | Digital Systems |
| `strategy-digital-transformation-digital-transformation-strategy` | Digital Transformation Strategy | Strategy & Digital Transformation |
| `strategy-digital-transformation-business-process-analysis` | Business Process Analysis | Strategy & Digital Transformation |
| `strategy-digital-transformation-technology-roadmap` | Technology Roadmap | Strategy & Digital Transformation |
| `strategy-digital-transformation-digital-product-strategy` | Digital Product Strategy | Strategy & Digital Transformation |
| `strategy-digital-transformation-ai-adoption-strategy` | AI Adoption Strategy | Strategy & Digital Transformation |
| `strategy-digital-transformation-innovation-strategy` | Innovation Strategy | Strategy & Digital Transformation |
| `strategy-digital-transformation-business-consulting` | Business Consulting | Strategy & Digital Transformation |
| `strategy-digital-transformation-technology-consulting` | Technology Consulting | Strategy & Digital Transformation |
| `strategy-digital-transformation-digital-maturity-assessment` | Digital Maturity Assessment | Strategy & Digital Transformation |
| `strategy-digital-transformation-growth-strategy-consulting` | Growth Strategy Consulting | Strategy & Digital Transformation |
| `support-growth-website-maintenance` | Website Maintenance | Support & Growth |
| `support-growth-technical-support` | Technical Support | Support & Growth |
| `support-growth-seo-maintenance` | SEO Maintenance | Support & Growth |
| `support-growth-content-maintenance` | Content Maintenance | Support & Growth |
| `support-growth-performance-optimization` | Performance Optimization | Support & Growth |
| `support-growth-security-monitoring` | Security Monitoring | Support & Growth |
| `support-growth-monthly-growth-report` | Monthly Growth Report | Support & Growth |
| `support-growth-continuous-improvement-program` | Continuous Improvement Program | Support & Growth |
| `support-growth-dedicated-technical-partner` | Dedicated Technical Partner | Support & Growth |
| `support-growth-long-term-digital-partnership` | Long-Term Digital Partnership | Support & Growth |

### B3. Usulan penggabungan duplikasi — **menunggu konfirmasi**

| Pertahankan | 301 dari |
| --- | --- |
| `support-growth-website-maintenance` (Website Maintenance) | `web-development-website-maintenance` (Website Maintenance) |
| `digital-systems-membership-platform` (Membership Platform) | `e-commerce-solutions-membership-website` (Membership Website) |
| `ai-automation-knowledge-base-development` (Knowledge Base Development) | `digital-systems-knowledge-base-system` (Knowledge Base System) |
| `ai-automation-ai-chatbot-development` (AI Chatbot Development) | `ai-automation-ai-customer-support` (AI Customer Support) |

Sementara belum digabung, dua halaman "Website Maintenance" diberi judul berbeda dengan menambahkan nama kategori agar `<title>` tidak kembar.

## C. Kategori blog dengan kurang dari 3 artikel — **menunggu konfirmasi**

Usulan brief: noindex atau gabungkan, dan keluarkan dari `sitemap.xml`. Saat ini hanya satu kategori yang punya 3 artikel atau lebih, jadi 15 dari 16 halaman kategori terkena. Belum diterapkan.

| Kategori | Artikel |
| --- | --- |
| `search-optimization` | 2 |
| `ai-automation` | 2 |
| `web-development` | 2 |
| `digital-marketing` | 1 |
| `branding-marketing-selling` | 3 |
| `e-commerce` | 1 |
| `analytics-cro` | 1 |
| `case-studies` | 1 |
| `business-strategy` | 2 |
| `management-leadership` | 2 |
| `technology-innovation` | 1 |
| `research-insights` | 1 |
| `books-reviews` | 0 |
| `economics-public-policy` | 0 |
| `opinion-philosophy` | 2 |
| `company-news` | 1 |
