const CATEGORY_ID = {
  Templates: "Template",
  Ebooks: "Ebook",
  Guidelines: "Panduan",
  "Prompt Collections": "Koleksi Prompt",
  Checklists: "Checklist",
  Workbooks: "Workbook",
  Planners: "Planner",
  Worksheets: "Worksheet",
  Frameworks: "Framework",
  Playbooks: "Playbook",
  Blueprints: "Blueprint",
  SOP: "SOP",
  "Swipe Files": "Swipe File",
  "Business Documents": "Dokumen Bisnis",
  "Research Resources": "Resource Riset",
  "Marketing Resources": "Resource Marketing",
  "Branding Resources": "Resource Branding",
  "Productivity Resources": "Resource Produktivitas",
  Printables: "Printable",
  "Digital Bundles": "Paket Digital",
  Modules: "Modul",
  Modul: "Modul",
};

const PRODUCT_ID = {
  "modul-google-adsense": {
    name: "Modul: Google AdSense",
    description: `Google AdSense bukan sekadar memasang iklan di website lalu menunggu klik. Modul ini menjelaskan logika uang di balik AdSense: bagaimana niche, search intent, kedalaman konten, struktur website, perilaku pembaca, RPM, CPC, CTR, kualitas traffic, dan kepatuhan policy bekerja bersama untuk membangun aset publishing yang bisa dimonetisasi.

Bagian konseptual membantu Anda memahami mengapa sebagian website bisa menghasilkan secara konsisten sementara sebagian lain hanya ramai tetapi tidak menghasilkan. Anda akan belajar memilih niche dengan demand komersial, memetakan cluster konten, menghindari thin content, menyusun arsitektur website yang mudah dirayapi Google, dan membedakan traffic besar dengan traffic yang benar-benar punya potensi pendapatan.

Bagian praktikum berjalan dari A-Z: persiapan domain dan hosting, setup WordPress atau Blogger, halaman penting, Search Console, Analytics, sitemap, robots, speed, dasar penempatan iklan, kalender konten, persiapan approval, dan optimasi setelah approval. Modul ini juga membahas eksperimen yang aman, reporting dasar, dan kesalahan umum yang bisa membuat earning rendah atau berisiko policy. Tujuannya bukan uang instan; tujuannya membangun sistem publishing yang bisa tumbuh menjadi revenue dengan eksekusi disiplin.`,
  },
  "modul-google-adsense-advanced": {
    name: "Modul: Google AdSense - Mode Advanced",
    description: `Google AdSense Mode Advanced dibuat untuk orang yang sudah paham dasar dan ingin memperlakukan AdSense seperti bisnis media yang serius. Konsepnya dimulai dari arsitektur revenue: RPM, page RPM, session RPM, CPC, viewability, ad density, user journey, intent konten, perilaku perangkat, kualitas traffic, dan hubungan antara strategi SEO dengan yield iklan.

Modul ini masuk lebih dalam ke optimasi praktis. Anda akan belajar mengaudit halaman yang sudah ada, menemukan artikel dengan potensi earning, memperbaiki internal linking, membangun cluster evergreen, menguji placement iklan, membaca data AdSense dan GA4, menurunkan risiko accidental click, menjaga compliance policy, dan memutuskan kapan fokus menaikkan traffic atau kapan fokus menaikkan RPM.

Praktikumnya disusun dari A-Z: audit website, pruning konten, ekspansi topical authority, testing layout halaman, keputusan above-the-fold, perilaku iklan mobile, Core Web Vitals, kontrol CTR, sheet tracking RPM, log eksperimen bulanan, dan roadmap scaling. Ini modul monetisasi, tetapi tidak menjual mimpi instan. Isinya metode kerja untuk membangun, mengukur, dan memperbaiki aset AdSense secara profesional.`,
  },
  "modul-tunecore-soundon": {
    name: "Modul: Tunecore & SoundOn",
    description: `Tunecore dan SoundOn bukan cuma tombol upload lagu. Keduanya adalah sistem distribusi dan monetisasi musik. Modul ini menjelaskan konsepnya dulu: hak master, publishing dasar, distributor digital, ISRC, UPC, metadata rilis, royalti streaming, payout platform, discovery dari short video, nilai katalog, dan mengapa lagu membutuhkan sistem rilis, bukan hanya file audio yang diunggah.

Praktikum teknis berjalan dari A-Z untuk musisi, kreator, label kecil, dan digital marketer yang ingin memahami monetisasi musik dengan benar. Anda akan belajar menyiapkan audio, artwork, profil artist, metadata, jadwal rilis, lirik, credit, pilihan territory, pengiriman ke platform, aset pre-save, logika distribusi TikTok/SoundOn, presence di Spotify dan Apple Music, pemanfaatan YouTube, dan tracking setelah rilis.

Modul ini juga membahas mekanik growth: membuat konten pendek dari lagu, menyusun kalender rilis, menghindari kesalahan metadata, membaca data stream, memahami siklus royalti, dan membangun katalog kecil yang bisa terus punya nilai. Tidak semua lagu pasti menghasilkan uang. Tetapi modul ini memberi sistem agar lagu punya peluang komersial yang jauh lebih rapi.`,
  },
  "modul-ternak-blog": {
    name: "Modul: Ternak Blog",
    description: `Ternak Blog adalah modul praktis untuk membangun beberapa aset konten dengan disiplin, bukan spam. Konsepnya dimulai dari melihat blog sebagai properti digital: pilihan niche, topical authority, kekuatan domain, kecepatan produksi konten, search intent, model monetisasi, biaya operasional, workflow editorial, dan manajemen risiko.

Bagian teknis berjalan dari A-Z: memilih niche, validasi keyword demand, membeli domain, setup hosting, memilih WordPress atau Blogger, membuat halaman dasar, memasang analytics, membangun cluster konten, menulis brief, publikasi konsisten, internal linking, indexing, optimasi speed, dan tracking halaman mana yang layak diperbaiki.

Anda juga akan belajar mengelola portofolio blog: metrik apa yang penting, kapan sebuah site dihentikan, kapan perlu digandakan, bagaimana menghindari konten tipis, dan bagaimana menjaga operasi tetap sederhana. Modul ini untuk orang yang ingin membangun mesin publishing berulang, bukan trik satu malam.`,
  },
  "modul-search-engine-marketing": {
    name: "Modul: Search Engine Marketing",
    description: `Search Engine Marketing bukan sekadar membeli traffic. Modul ini menjelaskan logika uang di balik paid acquisition: ekonomi offer, margin, conversion rate, cost per click, cost per acquisition, kualitas landing page, tracking, remarketing, testing creative, dan disiplin menghentikan campaign yang hanya terlihat ramai tetapi tidak menghasilkan bisnis.

Praktikum mencakup Google Ads, Meta Ads, TikTok Ads, YouTube Ads, dan persiapan campaign berbantuan AI dari A-Z. Anda akan belajar mendefinisikan offer, memetakan customer journey, menyiapkan tracking, menyusun campaign, menulis ad copy, memilih keyword dan audience, menentukan budget, membuat landing page, launch dengan aman, membaca sinyal awal, memotong pemborosan, scaling winner, dan membuat laporan yang mudah dipahami pemilik bisnis.

Modul ini berguna untuk konsultan, founder, marketer, dan tim kecil yang perlu sistem praktis sebelum mengeluarkan budget iklan. Yang diajarkan bukan blind boosting, tetapi paid traffic sebagai eksperimen terukur: setiap rupiah harus punya tugas.`,
  },
  "modul-affiliate-marketing": {
    name: "Modul: Affiliate Marketing",
    description: `Affiliate Marketing adalah model monetisasi ketika trust, intent, dan distribusi bertemu. Modul ini menjelaskan cara memilih niche, memahami buyer intent, memilih program affiliate, membaca struktur komisi, membuat konten review, membuat comparison page, membangun email capture, melacak klik, dan menjaga kredibilitas agar audiens tidak merasa dimanipulasi.

Praktikumnya berjalan dari A-Z: riset market, seleksi produk, keyword mapping, format konten, struktur review, tabel perbandingan, bridge page, tracking link, disclosure, dasar SEO, distribusi sosial, follow-up email, pengukuran conversion, dan perbaikan performa.

Tujuannya membangun sistem affiliate yang bisa bertumbuh. Aset affiliate yang baik bukan hanya link; ia adalah mesin rekomendasi yang dipercaya, didukung konten, search intent, dan positioning yang jujur.`,
  },
  "modul-email-marketing": {
    name: "Modul: Email Marketing",
    description: `Email Marketing adalah salah satu cara paling langsung mengubah perhatian menjadi revenue karena relasinya tidak sepenuhnya dikendalikan algoritma sosial. Modul ini membahas permission, kualitas list, segmentasi, deliverability, lead magnet, lifecycle pelanggan, nurture sequence, broadcast, offer, dan mengapa email bekerja paling baik sebagai kanal trust jangka panjang.

Praktikumnya dimulai dari A-Z: memilih platform email, membuat opt-in form, mendesain lead magnet, membangun welcome sequence, tagging subscriber, menulis subject line, menghindari spam trigger, membuat automation sederhana, menghubungkan landing page, membaca open rate, click rate, conversion, dan membersihkan list saat engagement turun.

Anda juga akan belajar workflow revenue: abandoned cart email, sequence edukasi produk, follow-up inquiry jasa, launch email, reactivation campaign, dan newsletter mingguan yang sederhana. Intinya bukan blast; intinya membangun database yang percaya dan siap membeli ketika offer relevan.`,
  },
  "modul-ecommerce-marketplace": {
    name: "Modul: E-Commerce & Marketplace",
    description: `E-Commerce dan Marketplace adalah modul untuk menjual produk lewat Shopee, Tokopedia, TikTok Shop, dan toko online mandiri dengan sistem. Konsepnya dimulai dari product-market fit, margin, inventory, perceived value, psikologi listing, search behavior di marketplace, promo, review, repeat purchase, serta perbedaan traffic, conversion, dan profit.

Bagian praktis berjalan dari A-Z: riset produk, audit kompetitor, pricing, penamaan produk, arahan foto, SEO listing, struktur deskripsi, voucher, marketplace ads, loop konten TikTok, checkout friction, template customer service, ekspektasi pengiriman, review generation, tracking stok, dan reporting sederhana.

Modul ini membantu Anda tidak hanya jualan karena diskon. Tujuannya membangun toko yang kredibel, mudah ditemukan, mudah dipercaya, dan mudah dibeli.`,
  },
  "modul-youtube-monetization": {
    name: "Modul: Konten Video & Monetisasi YouTube",
    description: `Konten Video dan Monetisasi YouTube menjelaskan YouTube sebagai aset media, bukan hanya tempat upload video. Konsepnya mencakup niche, janji channel, retention, watch time, click-through rate, thumbnail, psikologi judul, authority channel, YouTube Partner Program, AdSense YouTube, sponsorship, affiliate, digital product, dan peran Shorts dalam discovery.

Praktikumnya berjalan dari A-Z: setup channel, branding, topic mapping, struktur script, workflow recording, standar editing, checklist thumbnail, metadata, playlist, cadence publikasi, membaca analytics, diagnosis retention, iterasi konten, dan kesiapan monetisasi.

Modul ini berguna untuk kreator, edukator, musisi, konsultan, dan pemilik bisnis yang ingin menjadikan video sebagai aset jangka panjang. Tidak ada janji viral; yang ada adalah mekanik konsistensi, audience fit, dan jalur monetisasi.`,
  },
  "modul-digital-sales-funnel": {
    name: "Modul: Digital Sales Funnel & Automation",
    description: `Digital Sales Funnel dan Automation membahas cara membangun jalur dari perhatian menuju pembelian tanpa semua proses harus dikerjakan manual. Konsepnya meliputi awareness, lead capture, qualification, trust building, offer presentation, checkout, follow-up, retention, dan bagaimana automation membantu penjualan tanpa membuat brand terasa dingin.

Praktikumnya berjalan dari A-Z: mendefinisikan offer, memetakan objection, membuat lead magnet, membangun landing page, menghubungkan form, menulis sequence email atau WhatsApp, menyusun tahap CRM, membuat checkout flow, retargeting visitor, tagging lead, mengukur conversion, dan memperbaiki setiap tahap berdasarkan data.

Modul ini bisa dipakai untuk produk digital, jasa konsultasi, offer layanan, dan penjualan bisnis kecil. Tujuannya adalah mesin jualan yang tetap manusiawi: offer jelas, follow-up rapi, konten berguna, dan revenue bisa diukur.`,
  },
  "modul-business-automation": {
    name: "Modul: Business Automation",
    description: `Business Automation bukan tentang mengganti manusia dengan tools. Ini tentang menghapus pekerjaan berulang agar bisnis bisa merespons lebih cepat, membuat lebih sedikit kesalahan, dan menjual dengan lebih konsisten. Konsepnya mencakup workflow mapping, trigger-action logic, CRM, routing tugas, invoice flow, follow-up pelanggan, content operation, reporting, dan perbedaan automation berguna dengan automation yang hanya rumit.

Praktikumnya berjalan dari A-Z: audit pekerjaan berulang, memilih proses yang layak diotomasi, mendesain field data, menghubungkan form, spreadsheet, email, WhatsApp, CRM, konfirmasi pembayaran, order management, dan dashboard reporting.

Nilainya praktis: hemat waktu, respons lebih cepat, pipeline lebih jelas, dan operasi revenue lebih konsisten.`,
  },
  "modul-seo-a-z": {
    name: "Modul: Search Engine Optimization (SEO) A-Z",
    description: `SEO A-Z menjelaskan SEO sebagai sistem pertumbuhan bisnis, bukan checklist trik. Konsepnya mencakup search intent, topical authority, crawlability, indexing, internal link, kualitas konten, performa teknis, backlink, entity trust, analytics, dan bagaimana organic visibility bisa menjadi revenue ketika terhubung dengan offer, lead, iklan, affiliate, atau penjualan produk.

Bagian praktis berjalan dari A-Z: keyword research, topic clustering, arsitektur website, struktur on-page, title dan meta, content brief, technical audit, sitemap, robots, schema, Core Web Vitals, internal linking, strategi backlink, analisis Search Console, content refresh, dan reporting bulanan.

Modul ini untuk pemilik website, writer, konsultan, marketer, dan tim kecil yang membutuhkan metode kerja nyata. SEO tidak instan, tetapi sistem yang bersih bisa compounding.`,
  },
  "modul-seo-copywriting": {
    name: "Modul: SEO Copywriting",
    description: `SEO Copywriting adalah titik temu antara perilaku pencarian dan persuasi manusia. Modul ini menjelaskan mengapa ranking saja tidak cukup: halaman harus cocok dengan intent, membangun trust, menjawab pertanyaan, memandu pembaca, dan tetap mengarah pada action yang masuk akal.

Praktikumnya berjalan dari A-Z: memilih keyword, analisis SERP, membuat outline, menulis intro, mengatur alur heading, membuat FAQ, meta title, meta description, CTA, proof point, editing, dan perbaikan setelah publish.

Yang dikejar bukan keyword stuffing. Yang dikejar adalah tulisan yang bisa dipahami Google dan tetap enak dibaca manusia.`,
  },
  "modul-copywriting-content-marketing": {
    name: "Modul: Copywriting & Content Marketing",
    description: `Copywriting dan Content Marketing mengajarkan menulis sebagai instrumen bisnis. Konsepnya mencakup attention, desire, trust, objection handling, offer clarity, story, proof, positioning, distribusi, dan mengapa konten harus berguna untuk menjual, mengedukasi, atau menggerakkan orang lebih dekat ke keputusan.

Praktikumnya berjalan dari A-Z: audience research, message mapping, hook, headline, body copy, landing page copy, ad copy, email copy, caption, storytelling framework, kalender konten, repurposing, dan review performa.

Modul ini untuk kreator, konsultan, marketer, founder, dan tim yang ingin cara menulis lebih tajam tanpa terasa agresif.`,
  },
  "modul-ai-tools-digital-business": {
    name: "Modul: AI Tools untuk Bisnis Digital",
    description: `AI Tools untuk Bisnis Digital menjelaskan cara memakai AI sebagai keunggulan workflow, bukan pengganti berpikir. Konsepnya mencakup percepatan riset, ideasi, drafting copy, ringkasan data, customer support, content operation, automation, quality control, dan risiko output generik ketika prompt tidak dipandu strategi.

Praktikumnya berjalan dari A-Z: memilih tools, membuat reusable prompt, membangun workflow riset, membuat content brief, drafting landing copy, menyiapkan ads, menganalisis feedback pelanggan, membuat automation sederhana, mengecek akurasi, dan membangun sistem review manusia.

Tujuannya bukan terlihat seperti AI. Tujuannya bekerja lebih cepat sambil menjaga output tetap tajam, manusiawi, dan berguna secara komersial.`,
  },
  "modul-blogging-platform": {
    name: "Modul: Blogging (WordPress, Blogger, Wix, dll.)",
    description: `Blogging Platform membahas WordPress, Blogger, Wix, dan sistem publishing lain dari sudut pandang monetisasi. Konsepnya membantu Anda memilih platform berdasarkan ownership, speed, kontrol SEO, fleksibilitas theme, ekosistem plugin, biaya, risiko migrasi, dan pertumbuhan jangka panjang.

Praktikumnya berjalan dari A-Z: domain, hosting, theme, halaman penting, struktur menu, kategori, template post, plugin dasar, Analytics, Search Console, speed, backup, security, migrasi, dan optimasi konten.

Modul ini cocok untuk orang yang ingin mulai dengan fondasi benar atau memperbaiki blog yang sudah berantakan.`,
  },
  "modul-backlink-building": {
    name: "Modul: Backlink Building",
    description: `Backlink Building mengajarkan cara membangun authority tanpa berpura-pura semua link punya nilai yang sama. Konsepnya mencakup relevansi domain, topical trust, anchor text, placement, outreach, digital PR, guest post, citation, natural link earning, toxic link, dan risiko shortcut agresif.

Praktikumnya berjalan dari A-Z: audit backlink, competitor link gap, prospecting, email outreach, persiapan aset konten, workflow guest post, tracking brand mention, citation lokal, scoring kualitas link, disavow awareness, dan reporting authority bulanan.

Tujuannya authority yang rapi, relevan, dan terdokumentasi; bukan kumpulan link acak.`,
  },
  "modul-social-media-marketing": {
    name: "Modul: Social Media Marketing",
    description: `Social Media Marketing menjelaskan bagaimana kanal sosial mendukung branding, demand generation, dan sales tanpa menjadi posting acak. Konsepnya mencakup positioning, perilaku audiens, content pillar, perbedaan platform, ritme distribusi, community signal, social proof, integrasi offer, dan bagaimana attention bergerak menjadi lead atau pembelian.

Praktikumnya berjalan dari A-Z: audit profil, bio positioning, desain content pillar, rencana konten mingguan, format carousel/script/caption, engagement workflow, kalender campaign, social selling, analytics, dan routing lead lewat DM, landing page, WhatsApp, atau email.

Modul ini mengejar social media sebagai channel bisnis, bukan sekadar vanity metric.`,
  },
  "modul-social-media-optimization": {
    name: "Modul: Social Media Optimization",
    description: `Social Media Optimization fokus membuat akun lebih mudah dipahami, dipercaya, dan ditindaklanjuti. Konsepnya mencakup kejelasan profil, struktur bio, konsistensi visual, keyword, highlight, pinned content, CTA, waktu posting, hashtag, packaging konten, dan sinyal engagement.

Praktikumnya berjalan dari A-Z: checklist audit, rewrite profil, struktur link-in-bio, organisasi highlight, feed hygiene, testing format konten, jadwal posting, engagement window, penanganan komentar, pembacaan analytics, dan rutinitas optimasi bulanan.

Ini modul ringan untuk merapikan pintu depan brand di media sosial.`,
  },
  "modul-ai-prompting": {
    name: "Modul: AI Prompting",
    description: `AI Prompting mengajarkan proses berpikir di balik output AI yang kuat. Konsepnya mencakup konteks, role, task framing, constraint, contoh, kriteria evaluasi, iterasi, memory, tool use, dan mengapa prompt yang baik lebih mirip brief yang jelas daripada kalimat ajaib.

Praktikumnya berjalan dari A-Z: anatomi prompt, template reusable, prompt riset, copy, SEO, visual, analisis data, kritik, automation, dan quality control.

Modul ini ringan tetapi penting untuk membuat output AI lebih berguna, konsisten, dan tidak generik.`,
  },
  "modul-desain-branding-digital-strategist": {
    name: "Modul: Desain, Digital Branding & Strategist",
    description: `Desain, Digital Branding, dan Strategist mengajarkan bagaimana identitas visual, pesan, dan keputusan channel bekerja bersama. Konsepnya mencakup positioning, brand personality, visual system, tone of voice, persepsi audiens, touchpoint digital, arah konten, dan mengapa branding harus mendukung trust serta clarity komersial.

Praktikumnya berjalan dari A-Z: brand audit, competitor mapping, moodboard, arah logo usage, keputusan warna dan typography, content style, arah website, ekspresi social media, angle campaign, dan brand guideline sederhana.

Modul ini untuk founder, kreator, designer, dan konsultan yang ingin branding terasa sengaja, bukan sekadar dekorasi.`,
  },
};

function fallbackDescription(product, category) {
  return `Produk digital Isra Anwar untuk kategori ${category}: ${product.name}. Materinya dibuat sebagai alat kerja praktis yang membantu Anda memahami konsep, menata workflow, dan mengeksekusi pekerjaan digital dengan lebih rapi. Gunakan produk ini sebagai starting point, template, atau panduan operasional agar proses belajar dan implementasi tidak selalu dimulai dari nol.`;
}

function translateName(name) {
  return String(name ?? "")
    .replace(/^Module:/, "Modul:")
    .replace(/^Bundle:/, "Paket:")
    .replace(/\bChecklist\b/g, "Checklist")
    .replace(/\bTemplate\b/g, "Template")
    .replace(/\bBlueprint\b/g, "Blueprint")
    .replace(/\bPlaybook\b/g, "Playbook")
    .replace(/\bFramework\b/g, "Framework");
}

export function storeCategoryLabel(category, lang) {
  if (lang !== "id") return category;
  return CATEGORY_ID[category] ?? category;
}

export function localizeProduct(product, lang) {
  if (!product || lang !== "id") {
    return {
      ...product,
      original_name: product?.name,
      original_category: product?.category,
      original_description: product?.description,
    };
  }

  const category = storeCategoryLabel(product.category, lang);
  const copy = PRODUCT_ID[product.slug];
  const name = copy?.name ?? translateName(product.name);
  const description = copy?.description ?? fallbackDescription({ ...product, name }, category);

  return {
    ...product,
    name,
    category,
    description,
    original_name: product.name,
    original_category: product.category,
    original_description: product.description,
  };
}
