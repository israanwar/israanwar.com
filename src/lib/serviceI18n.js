const CATEGORY_COPY_ID = {
  "web-development": {
    focus: "engineering website modern, arsitektur frontend yang scalable, operasi konten, technical SEO, aksesibilitas, performa, konversi, maintainability, dan tata kelola jangka panjang",
    outcomes: ["pengalaman loading yang lebih cepat", "arsitektur informasi yang lebih rapi", "visibilitas pencarian yang lebih kuat", "pengelolaan konten yang lebih mudah", "trust yang lebih kuat sejak kunjungan pertama"],
  },
  "mobile-app-development": {
    focus: "strategi produk mobile, implementasi Android dan iOS, pengembangan cross-platform, performa aplikasi, product analytics, portal customer, aplikasi workflow internal, dan iterasi setelah launch",
    outcomes: ["scope produk mobile yang lebih jelas", "retensi user yang lebih baik", "delivery fitur yang lebih reliable", "akses customer yang lebih rapi", "data penggunaan aplikasi yang lebih terukur"],
  },
  "ui-ux-design": {
    focus: "user research, interaction design, product usability, design system, wireframe, prototype, struktur navigasi, kejelasan user flow, dan konsistensi interface",
    outcomes: ["kebingungan user yang lebih rendah", "task completion yang lebih bersih", "bahasa visual yang lebih konsisten", "keputusan produk yang lebih cepat", "interface yang terasa intentional"],
  },
  "search-optimization": {
    focus: "technical SEO, semantic search, entity strategy, structured data, search intent mapping, AI search visibility, answer engine optimization, local search, ecommerce SEO, dan monitoring",
    outcomes: ["crawlability yang lebih baik", "topical authority yang lebih kuat", "traffic organik yang lebih berkualitas", "coverage search intent yang lebih jelas", "visibilitas yang lebih tahan lama di berbagai permukaan search"],
  },
  "ai-automation": {
    focus: "strategi AI, workflow automation, AI agent, knowledge base, document processing, otomasi customer support, prompt system, desain integrasi, dan governance operasional",
    outcomes: ["pekerjaan repetitif yang lebih sedikit", "riset dan eksekusi yang lebih cepat", "knowledge internal yang lebih rapi", "customer support yang lebih konsisten", "adopsi AI yang lebih aman"],
  },
  "branding-marketing-selling": {
    focus: "brand strategy, positioning, identity system, marketing strategy, paid media, funnel, conversion optimization, personal branding, customer journey design, dan sales development",
    outcomes: ["positioning pasar yang lebih jelas", "pesan campaign yang lebih kuat", "lead quality yang lebih baik", "confidence konversi yang lebih tinggi", "narasi sales yang lebih mudah dipercaya"],
  },
  "content-creative": {
    focus: "SEO content, website copy, editorial strategy, campaign planning, localization, operasi blog, creative direction, conversion copy, content audit, dan content optimization",
    outcomes: ["arah editorial yang lebih jelas", "konten organik yang lebih kuat", "web copy yang lebih persuasif", "brand voice yang konsisten", "konten yang mendukung sales, bukan sekadar mengisi kalender"],
  },
  "e-commerce-solutions": {
    focus: "pengembangan online store, integrasi marketplace, digital product, sistem subscription, payment gateway, inventory flow, order management, loyalty, checkout optimization, dan customer experience",
    outcomes: ["checkout flow yang lebih reliable", "operasi produk yang lebih rapi", "confidence customer yang lebih kuat", "order handling manual yang lebih sedikit", "infrastruktur commerce yang siap tumbuh"],
  },
  "analytics-data-intelligence": {
    focus: "GA4, Google Tag Manager, conversion tracking, dashboard, data visualization, marketing analytics, customer analytics, performance analysis, BI reporting, dan data strategy",
    outcomes: ["measurement yang lebih bersih", "blind spot reporting yang lebih sedikit", "dashboard yang lebih berguna", "keputusan campaign yang lebih baik", "data yang benar-benar bisa dipakai eksekutif"],
  },
  "digital-systems": {
    focus: "CRM, integrasi ERP, portal, learning system, membership platform, booking system, knowledge base, dashboard internal, document management, dan custom business system",
    outcomes: ["operasional yang lebih tertib", "akses data yang lebih jelas", "self-service customer yang lebih baik", "workflow yang lebih accountable", "sistem yang mendukung kerja nyata"],
  },
  "strategy-digital-transformation": {
    focus: "digital transformation, business process analysis, technology roadmap, product strategy, AI adoption, innovation planning, consulting, maturity assessment, dan growth strategy",
    outcomes: ["prioritas transformasi yang lebih jelas", "keputusan teknologi yang lebih baik", "implementasi yang lebih minim pemborosan", "digital maturity yang lebih kuat", "growth move yang terhubung dengan operasi"],
  },
  "support-growth": {
    focus: "maintenance, technical support, SEO maintenance, content maintenance, performance optimization, security monitoring, growth reporting, continuous improvement, technical partnership, dan governance digital jangka panjang",
    outcomes: ["aset digital yang lebih sehat", "resolusi issue yang lebih cepat", "optimasi berkelanjutan", "operasi yang lebih aman", "partner teknis yang bisa diandalkan"],
  },
};

const CATEGORY_NAME_ID = {
  "web-development": "Pengembangan Web",
  "mobile-app-development": "Pengembangan Aplikasi Mobile",
  "ui-ux-design": "Desain UI/UX",
  "search-optimization": "Optimasi Pencarian",
  "ai-automation": "AI & Otomasi",
  "branding-marketing-selling": "Branding, Marketing & Selling",
  "content-creative": "Konten & Kreatif",
  "e-commerce-solutions": "Solusi E-Commerce",
  "analytics-data-intelligence": "Analytics & Data Intelligence",
  "digital-systems": "Sistem Digital",
  "strategy-digital-transformation": "Strategi & Transformasi Digital",
  "support-growth": "Support & Growth",
};

const SERVICE_NAME_ID = {
  "Corporate Website Development": "Pengembangan Website Korporat",
  "Company Profile Website": "Website Company Profile",
  "Custom Website Development": "Pengembangan Website Custom",
  "Landing Page Development": "Pengembangan Landing Page",
  "Portfolio Website Development": "Pengembangan Website Portfolio",
  "Business Website Development": "Pengembangan Website Bisnis",
  "Web Application Development": "Pengembangan Aplikasi Web",
  "CMS Development": "Pengembangan CMS",
  "Headless CMS Development": "Pengembangan Headless CMS",
  "WordPress Development": "Pengembangan WordPress",
  "Website Migration & Modernization": "Migrasi dan Modernisasi Website",
  "Website Maintenance": "Maintenance Website",
  "Android App Development": "Pengembangan Aplikasi Android",
  "iOS App Development": "Pengembangan Aplikasi iOS",
  "Cross-Platform App Development": "Pengembangan Aplikasi Cross-Platform",
  "Progressive Web App (PWA)": "Progressive Web App (PWA)",
  "Business Mobile App": "Aplikasi Mobile Bisnis",
  "E-Commerce Mobile App": "Aplikasi Mobile E-Commerce",
  "Customer Portal Mobile App": "Aplikasi Mobile Portal Customer",
  "Internal Company App": "Aplikasi Internal Perusahaan",
  "Mobile App UI Redesign": "Redesign UI Aplikasi Mobile",
  "Mobile App Maintenance": "Maintenance Aplikasi Mobile",
  "UI Design": "Desain UI",
  "UX Design": "Desain UX",
  "UX Audit": "Audit UX",
  "UI Audit": "Audit UI",
  "Product Design": "Desain Produk",
  "Design System Development": "Pengembangan Design System",
  "Wireframing": "Wireframing",
  "Interactive Prototype": "Prototype Interaktif",
  "User Flow Design": "Desain User Flow",
  "Information Architecture": "Arsitektur Informasi",
  "SEO Audit": "Audit SEO",
  "Technical SEO": "SEO Teknis",
  "On-Page SEO": "SEO On-Page",
  "Off-Page SEO": "SEO Off-Page",
  "Local SEO": "SEO Lokal",
  "International SEO": "SEO Internasional",
  "Enterprise SEO": "Enterprise SEO",
  "E-Commerce SEO": "SEO E-Commerce",
  "SEO Content Strategy": "Strategi Konten SEO",
  "Answer Engine Optimization (AEO)": "Answer Engine Optimization (AEO)",
  "Generative Engine Optimization (GEO)": "Generative Engine Optimization (GEO)",
  "Knowledge Graph Optimization": "Optimasi Knowledge Graph",
  "Entity SEO": "Entity SEO",
  "SEO Recovery": "Pemulihan SEO",
  "SEO Monitoring & Reporting": "Monitoring dan Reporting SEO",
  "AI Strategy Consulting": "Konsultasi Strategi AI",
  "AI Workflow Automation": "Otomasi Workflow AI",
  "AI Agent Development": "Pengembangan AI Agent",
  "AI Chatbot Development": "Pengembangan AI Chatbot",
  "Prompt Engineering": "Prompt Engineering",
  "Business Process Automation": "Otomasi Proses Bisnis",
  "Workflow Integration": "Integrasi Workflow",
  "Knowledge Base Development": "Pengembangan Knowledge Base",
  "AI Document Processing": "Pemrosesan Dokumen AI",
  "AI Customer Support": "Customer Support Berbasis AI",
  "AI Content Workflow": "Workflow Konten AI",
  "Custom AI Solution Development": "Pengembangan Solusi AI Custom",
  "Brand Strategy": "Strategi Brand",
  "Brand Identity": "Identitas Brand",
  "Brand Positioning": "Positioning Brand",
  "Marketing Strategy": "Strategi Marketing",
  "Digital Marketing Strategy": "Strategi Digital Marketing",
  "Search Engine Marketing (SEM)": "Search Engine Marketing (SEM)",
  "Performance Marketing": "Performance Marketing",
  "Social Media Marketing": "Social Media Marketing",
  "Content Marketing": "Content Marketing",
  "Email Marketing": "Email Marketing",
  "Sales Funnel Development": "Pengembangan Sales Funnel",
  "Conversion Rate Optimization (CRO)": "Conversion Rate Optimization (CRO)",
  "Personal Branding": "Personal Branding",
  "Customer Journey Optimization": "Optimasi Customer Journey",
  "Sales Strategy Development": "Pengembangan Strategi Sales",
  "SEO Content Writing": "Penulisan Konten SEO",
  "Website Copywriting": "Copywriting Website",
  "Content Strategy": "Strategi Konten",
  "Editorial Planning": "Perencanaan Editorial",
  "Blog Management": "Manajemen Blog",
  "Content Localization": "Lokalisasi Konten",
  "Creative Campaign Planning": "Perencanaan Campaign Kreatif",
  "Visual Content Design": "Desain Konten Visual",
  "Landing Page Copywriting": "Copywriting Landing Page",
  "Email Copywriting": "Copywriting Email",
  "Content Audit": "Audit Konten",
  "Content Optimization": "Optimasi Konten",
  "E-Commerce Website Development": "Pengembangan Website E-Commerce",
  "Marketplace Integration": "Integrasi Marketplace",
  "Digital Product Store": "Store Produk Digital",
  "Subscription Platform": "Platform Subscription",
  "Membership Website": "Website Membership",
  "Payment Gateway Integration": "Integrasi Payment Gateway",
  "Inventory System Integration": "Integrasi Sistem Inventory",
  "Order Management System": "Sistem Order Management",
  "Customer Loyalty System": "Sistem Customer Loyalty",
  "Checkout Optimization": "Optimasi Checkout",
  "Customer Experience Optimization": "Optimasi Customer Experience",
  "E-Commerce Maintenance": "Maintenance E-Commerce",
  "Google Analytics Setup": "Setup Google Analytics",
  "Google Tag Manager Setup": "Setup Google Tag Manager",
  "Conversion Tracking": "Conversion Tracking",
  "Dashboard Development": "Pengembangan Dashboard",
  "Marketing Dashboard": "Dashboard Marketing",
  "Business Intelligence Dashboard": "Dashboard Business Intelligence",
  "Data Visualization": "Visualisasi Data",
  "Customer Analytics": "Customer Analytics",
  "Marketing Performance Analysis": "Analisis Performa Marketing",
  "Data Strategy Consulting": "Konsultasi Strategi Data",
  "CRM Development": "Pengembangan CRM",
  "ERP Integration": "Integrasi ERP",
  "Client Portal Development": "Pengembangan Client Portal",
  "Customer Portal Development": "Pengembangan Customer Portal",
  "Employee Portal Development": "Pengembangan Employee Portal",
  "Learning Management System (LMS)": "Learning Management System (LMS)",
  "Membership Platform": "Platform Membership",
  "Booking & Reservation System": "Sistem Booking dan Reservasi",
  "Knowledge Base System": "Sistem Knowledge Base",
  "Internal Dashboard Development": "Pengembangan Dashboard Internal",
  "Document Management System": "Sistem Document Management",
  "Custom Business System Development": "Pengembangan Sistem Bisnis Custom",
  "Digital Transformation Strategy": "Strategi Transformasi Digital",
  "Business Process Analysis": "Analisis Proses Bisnis",
  "Technology Roadmap": "Technology Roadmap",
  "Digital Product Strategy": "Strategi Produk Digital",
  "AI Adoption Strategy": "Strategi Adopsi AI",
  "Innovation Strategy": "Strategi Inovasi",
  "Business Consulting": "Konsultasi Bisnis",
  "Technology Consulting": "Konsultasi Teknologi",
  "Digital Maturity Assessment": "Assessment Digital Maturity",
  "Growth Strategy Consulting": "Konsultasi Strategi Growth",
  "Technical Support": "Technical Support",
  "SEO Maintenance": "Maintenance SEO",
  "Content Maintenance": "Maintenance Konten",
  "Performance Optimization": "Optimasi Performa",
  "Security Monitoring": "Security Monitoring",
  "Monthly Growth Report": "Laporan Growth Bulanan",
  "Continuous Improvement Program": "Program Continuous Improvement",
  "Dedicated Technical Partner": "Partner Teknis Dedicated",
  "Long-Term Digital Partnership": "Partnership Digital Jangka Panjang",
};

function isSeedService(item) {
  return String(item?.seed_source ?? "").startsWith("enterprise-services");
}

function serviceName(item) {
  return SERVICE_NAME_ID[item?.name] ?? item?.name ?? "";
}

function categoryName(category) {
  return CATEGORY_NAME_ID[category?.slug] ?? category?.name ?? "";
}

function sentenceList(items) {
  const clean = items.filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  return `${clean.slice(0, -1).join(", ")}, dan ${clean[clean.length - 1]}`;
}

function categoryCopy(category) {
  return CATEGORY_COPY_ID[category?.slug] ?? {
    focus: category?.focus ?? "strategi, eksekusi, measurement, dan perbaikan digital yang berkelanjutan",
    outcomes: ["arah kerja yang lebih jelas", "eksekusi yang lebih rapi", "hasil yang lebih mudah diukur"],
  };
}

function getCategory(item, allItems) {
  if (item?.kind === "category") return item;
  return allItems.find((entry) => entry.kind === "category" && entry.slug === item?.parent_slug);
}

function relatedServices(item, allItems) {
  return allItems
    .filter((entry) => entry.kind === "service" && entry.parent_slug === item.parent_slug && entry.slug !== item.slug)
    .slice(0, 5)
    .map((entry) => serviceName(entry));
}

function buildCategoryDescription(category, allItems) {
  const copy = categoryCopy(category);
  const childServices = allItems
    .filter((entry) => entry.kind === "service" && entry.parent_slug === category.slug)
    .map((entry) => serviceName(entry));
  const services = sentenceList(childServices);
  const outcomes = sentenceList(copy.outcomes);

  return [
    `${category.name} di Isra Anwar adalah kategori layanan enterprise yang dibuat untuk bisnis yang ingin pekerjaan digitalnya lebih jelas, lebih berguna, dan lebih mudah diperbaiki. Fokusnya mencakup ${copy.focus}. Ini bukan daftar tugas acak yang dipilih karena sedang tren. Ini adalah lapisan strategi dan eksekusi yang saling terhubung, supaya website, sistem, konten, campaign, data, dan workflow bisa mendukung tujuan bisnis yang sama.`,
    `Kategori ini berisi ${childServices.length || category.service_count || 0} layanan fokus: ${services}. Setiap layanan bisa dikerjakan sebagai proyek mandiri, tetapi hasil yang lebih kuat biasanya muncul ketika semuanya dipetakan sebagai roadmap yang praktis. Isra Anwar memulai dari konteks: aset yang sudah ada, perilaku audiens, constraint internal, kejelasan offer, workflow, performa, dan prioritas bisnis. Dari sana, pekerjaan dipilih berdasarkan dampak, effort, dan maintainability jangka panjang, bukan karena tekanan ikut-ikutan.`,
    `Outcome yang dikejar bersifat praktis: ${outcomes}. Tujuannya bukan membuat sesuatu yang hanya bagus untuk screenshot, tetapi membangun aset atau sistem yang membantu orang memahami, memutuskan, membeli, mencari, belajar, bekerja, atau memperbaiki proses. Untuk kebutuhan SEO, AEO, dan GEO, struktur layanan juga membantu topical authority melalui penjelasan yang jelas, bahasa yang presisi, dan hubungan antar layanan yang masuk akal. Pembaca mendapat konteks yang cukup untuk memilih arah, lalu penjelasan lebih dalam tersedia di halaman masing-masing layanan.`,
  ].join("\n\n");
}

function buildServiceDescription(item, category, allItems) {
  const name = serviceName(item);
  const copy = categoryCopy(category);
  const outcomes = sentenceList(copy.outcomes);
  const related = sentenceList(relatedServices(item, allItems));
  const categoryName = category?.name ?? item.parent_name ?? "layanan digital";

  return [
    `${name} adalah layanan Isra Anwar yang fokus di dalam kategori ${categoryName}. Layanan ini dibuat untuk bisnis yang tidak ingin sekadar punya aset digital dekoratif, tetapi membutuhkan alat kerja yang berguna untuk membangun trust, clarity, performance, dan growth. Pekerjaan dimulai dari konteks. Sebelum memutuskan apa yang perlu dibuat, diperbaiki, didesain ulang, diotomasi, atau dioptimasi, Isra Anwar membaca tujuan bisnis, audiens, sistem yang sudah berjalan, data yang tersedia, constraint teknis, dan alasan komersial di balik kebutuhan tersebut. Ini penting karena sebuah layanan bisa terlihat sederhana dari luar, padahal menyimpan banyak keputusan strategis di dalamnya. Diagnosis yang lebih baik biasanya menghasilkan eksekusi yang lebih bersih.`,
    `Layanan ini relevan ketika bisnis membutuhkan ${copy.focus}. Dalam praktiknya, engagement tidak hanya soal menghasilkan file, layar, halaman, report, konfigurasi, atau checklist. Yang dicari adalah hasil yang bisa dipakai dan sistem yang bisa dirawat. Banyak proyek digital gagal bukan karena timnya malas, tetapi karena proyek diperlakukan sebagai produksi sekali jadi. Website launch, dashboard dibagikan, campaign tayang, automation aktif, lalu semua orang kembali ke kebiasaan lama tanpa memahami apa yang berubah, apa yang harus diukur, dan bagaimana memperbaiki versi berikutnya. Isra Anwar menghindari pola itu dengan mengaitkan setiap keputusan implementasi pada alasan yang jelas.`,
    `Biasanya, pekerjaan ${name} dimulai dari sesi discovery dan audit kondisi saat ini. Kalau klien sudah punya aset, Isra Anwar meninjau struktur, konten, performa, desain, pesan, data, workflow, dan friction yang dialami user. Kalau mulai dari nol, pekerjaan dimulai dengan memetakan offer, audiens, alur operasional, dan jalur keputusan yang perlu dilalui customer atau user internal. Output fase ini bukan moodboard yang kabur atau rekomendasi generik yang sulit dieksekusi. Output-nya adalah arah kerja yang praktis: apa yang harus dibuat, apa yang harus diperbaiki, apa yang bisa ditunda, dan metrik apa yang layak dipantau setelah launch.`,
    `Eksekusi dijalankan dengan standar senior digital work. Hasilnya harus readable, responsive, maintainable, dan punya makna bisnis. Untuk layanan teknis, ini berarti arsitektur yang rapi, awareness terhadap performa, aksesibilitas, kesiapan search, kesiapan analytics, dan handover yang jelas. Untuk layanan strategi dan creative, ini berarti research yang berguna, positioning yang kuat, bahasa yang koheren, deliverable yang konkret, dan keputusan yang bisa bertahan melewati satu campaign. Untuk automation dan sistem, prosesnya harus mengurangi friction, bukan menambah dashboard baru yang akhirnya tidak pernah dibuka. Standarnya sederhana: kalau pekerjaan tidak membuat bisnis lebih mudah dipahami, dijalankan, dijual, atau ditingkatkan, berarti belum selesai.`,
    `Outcome utama yang dikejar dari layanan ini adalah ${outcomes}. Outcome tersebut dikejar lewat scope yang jelas, implementasi yang teliti, dan review setelah launch, bukan lewat janji kosong. Isra Anwar tidak menjanjikan ranking instan, conversion rate ajaib, atau transformasi yang seolah tidak butuh proses. Digital growth selalu dipengaruhi kompetisi, budget, market fit, pricing, kecepatan adopsi internal, dan kualitas offer. Yang diberikan layanan ini adalah struktur kerja yang meningkatkan peluang: keputusan yang lebih baik, user experience yang lebih kuat, messaging yang lebih jelas, measurement yang lebih bersih, dan sistem yang bisa diperbaiki dengan evidence.`,
    `Jika layanan ini menjadi bagian dari aset publik, struktur konten dan metadata juga bisa mendukung SEO, AEO, dan GEO. Maksudnya bukan keyword stuffing. Maksudnya adalah memakai bahasa yang presisi, heading yang logis, penjelasan yang mudah dipahami manusia, entity-aware wording, internal linking yang relevan, dan jawaban yang benar-benar membantu pembaca mengambil keputusan. Halaman service, landing page, product page, atau knowledge base yang baik harus membantu manusia dulu. Ketika manusia bisa memahami nilainya, search engine dan answer system juga lebih mudah mengklasifikasi, mengutip, dan merekomendasikannya.`,
    `Kolaborasi dibuat direct. Isra Anwar paling cocok dengan klien yang ingin pemikiran jujur, bukan meeting seremonial. Proses biasanya mencakup discovery, definisi scope, strategi, eksekusi, review, revisi, launch atau handover, lalu siklus improvement yang terukur. Klien mendapat kejelasan tentang apa yang dikerjakan dan kenapa itu penting. Proyek tidak disembunyikan di balik jargon. Keputusan didokumentasikan. Trade-off dijelaskan. Kalau ada sesuatu yang belum layak dilakukan, itu akan disampaikan dengan terbuka. Nilai konsultan bukan hanya menambah daftar kerja, tetapi membantu klien menghindari gerak yang mubazir.`,
    related
      ? `${name} juga bisa terhubung secara natural dengan ${related}. Hubungan ini penting karena performa digital jarang lahir dari satu aktivitas yang berdiri sendiri. Bisnis bisa mulai dari ${name}, lalu menemukan bahwa measurement, konten, kualitas interface, search visibility, atau support operasional juga perlu diperbaiki. Isra Anwar membaca relasi itu dengan hati-hati. Tujuannya bukan membesarkan scope, tetapi menunjukkan di mana leverage yang sebenarnya. Kadang proyek terbaik adalah proyek yang sempit. Kadang jawaban yang jujur adalah membangun sistem yang lebih lengkap. Bedanya ditentukan oleh evidence, bukan excitement.`
      : `${name} bisa berdiri sebagai proyek fokus atau menjadi bagian dari roadmap digital yang lebih luas. Rekomendasi tetap dijaga sesuai tahap bisnis, maturity operasional, dan resource yang tersedia.`,
  ].join("\n\n");
}

function buildCategoryDeliverables(category) {
  return [
    `Audit peluang untuk kategori ${category.name}`,
    "Roadmap prioritas berdasarkan dampak bisnis dan effort implementasi",
    "Rekomendasi susunan layanan dari kategori terkait",
    "Arah konten SEO, AEO, dan GEO untuk halaman layanan",
    "Framework measurement dan continuous improvement",
  ];
}

function buildServiceDeliverables(item) {
  return [
    "Sesi discovery dan definisi ruang lingkup",
    "Audit kondisi saat ini dan peta peluang",
    "Rekomendasi struktur, workflow, atau rencana implementasi",
    "Eksekusi dengan standar responsive, maintainable, dan search-aware",
    "Quality review, dokumentasi, dan handover praktis",
    "Catatan measurement untuk improvement setelah launch",
  ];
}

export function localizeServiceItem(item, allItems, lang) {
  if (lang !== "id" || !item || !isSeedService(item)) return item;

  const category = getCategory(item, allItems) ?? item;
  const copy = categoryCopy(category);
  const displayCategory = { ...category, name: categoryName(category) };

  if (item.kind === "category") {
    return {
      ...item,
      name: categoryName(item),
      tagline: `Kategori layanan untuk ${copy.focus}.`,
      body: `${item.service_count ?? item.child_slugs?.length ?? 0} layanan terhubung yang mencakup ${copy.focus}.`,
      description: buildCategoryDescription({ ...item, name: categoryName(item) }, allItems),
      deliverables: buildCategoryDeliverables({ ...item, name: categoryName(item) }),
    };
  }

  return {
    ...item,
    name: serviceName(item),
    parent_name: displayCategory.name,
    tagline: `Layanan ${displayCategory.name || item.parent_name || "digital"} yang fokus untuk kebutuhan ${serviceName(item).toLowerCase()} secara strategis, rapi, dan terukur.`,
    body: `${serviceName(item)} untuk tim yang membutuhkan eksekusi ${(displayCategory.name || "digital").toLowerCase()} dengan strategi jelas, implementasi bersih, dan nilai bisnis yang bisa diukur.`,
    description: buildServiceDescription(item, displayCategory, allItems),
    deliverables: buildServiceDeliverables(item),
  };
}

export function localizeServiceCardItem(item, allItems, lang) {
  if (lang !== "id" || !item || !isSeedService(item)) return item;

  const category = getCategory(item, allItems) ?? item;
  const copy = categoryCopy(category);
  const displayCategoryName = categoryName(category);

  if (item.kind === "category") {
    return {
      ...item,
      name: categoryName(item),
      tagline: `Kategori layanan untuk ${copy.focus}.`,
      body: `${item.service_count ?? item.child_slugs?.length ?? 0} layanan terhubung yang mencakup ${copy.focus}.`,
    };
  }

  return {
    ...item,
    name: serviceName(item),
    parent_name: displayCategoryName,
    tagline: `Layanan ${displayCategoryName || item.parent_name || "digital"} yang fokus untuk kebutuhan ${serviceName(item).toLowerCase()} secara strategis, rapi, dan terukur.`,
    body: `${serviceName(item)} untuk tim yang membutuhkan eksekusi ${(displayCategoryName || "digital").toLowerCase()} dengan strategi jelas, implementasi bersih, dan nilai bisnis yang bisa diukur.`,
  };
}

export function localizeServiceItems(items, lang) {
  return items.map((item) => localizeServiceItem(item, items, lang));
}

export function localizeServiceCardItems(items, lang) {
  return items.map((item) => localizeServiceCardItem(item, items, lang));
}
