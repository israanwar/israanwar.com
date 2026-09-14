// Real, substantive SEO knowledge for Balao to draw on, not the generic
// auto-generated service-catalog boilerplate (see buildServiceDescription
// in serviceCatalog.js, which reuses near-identical templated paragraphs
// across every service in the whole catalog regardless of topic). Search
// is explicitly one of this site's core areas ("SEO, AEO & GEO" is part of
// the site's own declared identity, see prerender.mjs's SITE_IDENTITY), so
// it earns hand-written, comprehensive content instead of a template.
//
// Keyed by the real service slug (search-optimization-<slugified-name>,
// matching src/data/serviceCatalog.js's slugify()) so balaoKnowledge.js's
// serviceAnswer()/comparisonAnswer() can look it up directly. Each language
// carries a `full` explanation and a short `oneLiner` (used to open a
// comparison between two services without just concatenating both full
// explanations back to back). Indonesian and English only, consistent
// with the rest of this project's real (non-scaffolding) content, which
// only exists in the language it was actually written in.
export const SEO_EXPERTISE = {
  "search-optimization-seo-audit": {
    en: {
      oneLiner: "a full health check of a site's search performance, used to prioritize what to fix first",
      full: "A full health check of a website's search performance: crawlability, indexing, site architecture, on-page signals, backlink profile, Core Web Vitals, and content gaps, all cross-referenced against competitors. The goal isn't just spotting broken things (404s, duplicate content, missing meta tags, orphaned pages). It's building a prioritized roadmap ranked by real business impact, not just technical severity. A good audit reviews server logs to see how Googlebot actually crawls the site, checks canonical tags and hreflang setup, reviews internal linking depth, and benchmarks organic visibility against direct competitors. It's usually the first step before any other SEO work, since fixing things in the wrong order wastes budget.",
    },
    id: {
      oneLiner: "pemeriksaan menyeluruh performa pencarian situs, buat nentuin prioritas apa yang perlu dibenerin duluan",
      full: "Pemeriksaan menyeluruh performa pencarian sebuah website: mulai dari crawlability, indexing, arsitektur situs, sinyal on-page, profil backlink, Core Web Vitals, sampai celah konten, semuanya dibandingkan juga sama kompetitor. Tujuannya bukan cuma nemuin yang rusak (404, konten duplikat, meta tag hilang, halaman yatim), tapi bikin roadmap prioritas berdasarkan dampak bisnis nyata, bukan cuma tingkat keparahan teknis. Audit yang bagus itu ngecek server log buat liat gimana Googlebot beneran nge-crawl situs, cek canonical tag & setup hreflang, review kedalaman internal linking, dan bandingin visibilitas organik sama kompetitor langsung. Biasanya ini langkah pertama sebelum kerjaan SEO lain, soalnya kalau urutannya salah, budgetnya kebuang percuma.",
    },
  },
  "search-optimization-technical-seo": {
    en: {
      oneLiner: "making sure search engines can actually crawl, render, and index the site properly",
      full: "The infrastructure layer of SEO: making sure search engines can actually crawl, render, and index a site properly before content or links even matter. Covers site speed and Core Web Vitals (LCP, INP, CLS), mobile-friendliness, XML sitemaps, robots.txt rules, canonicalization, structured data (schema markup), HTTPS/security, crawl budget efficiency, and JavaScript rendering issues (a big one for modern React/Vue sites, since Googlebot has to execute JS to see the real content). If technical SEO is broken, even the best content and backlinks won't rank. It's the foundation everything else stands on.",
    },
    id: {
      oneLiner: "mastiin search engine bisa crawl, render, dan index situsnya dengan bener",
      full: "Lapisan infrastruktur dari SEO: mastiin search engine beneran bisa crawl, render, dan index situs dengan bener sebelum konten atau link jadi relevan. Nyakup kecepatan situs & Core Web Vitals (LCP, INP, CLS), mobile-friendliness, XML sitemap, aturan robots.txt, canonicalization, structured data (schema markup), HTTPS/keamanan, efisiensi crawl budget, dan masalah rendering JavaScript (ini penting banget buat situs modern React/Vue, soalnya Googlebot harus eksekusi JS dulu buat liat konten aslinya). Kalau technical SEO berantakan, konten sebagus apapun sama backlink sebanyak apapun tetep gak bakal naik ranking. Ini fondasi yang nopang semua yang lain.",
    },
  },
  "search-optimization-on-page-seo": {
    en: {
      oneLiner: "optimizing what's directly on one page, like titles, headings, and content, to match search intent",
      full: "Everything you control directly on a page to help it rank and get clicked: title tags, meta descriptions, header structure (H1-H6), keyword placement that reads naturally (not stuffed), internal linking, image alt text, URL structure, and content depth that actually satisfies search intent. Modern on-page SEO isn't about hitting a keyword density percentage. It's about matching what the searcher actually wants (informational, transactional, navigational) and structuring the page so both humans and search engines immediately understand what it's about. A well-optimized page also considers E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) signals like author bios and citations.",
    },
    id: {
      oneLiner: "optimasi apa yang ada langsung di satu halaman, kayak judul, heading, dan konten, biar nyocok sama search intent",
      full: "Semua hal yang bisa dikontrol langsung di sebuah halaman biar bisa naik ranking dan diklik: title tag, meta description, struktur heading (H1-H6), penempatan keyword yang natural (bukan dijejelin), internal linking, alt text gambar, struktur URL, dan kedalaman konten yang beneran jawab search intent. On-page SEO jaman sekarang bukan soal ngejar persentase keyword density, tapi soal nyocokin apa yang beneran dicari orang (informasi, mau beli, atau nyari halaman tertentu) dan nyusun halamannya biar manusia maupun search engine langsung ngerti itu tentang apa. Halaman yang dioptimasi dengan bener juga mikirin sinyal E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) kayak bio penulis dan sitasi sumber.",
    },
  },
  "search-optimization-off-page-seo": {
    en: {
      oneLiner: "building a site's authority from outside itself, mainly through backlinks and brand mentions",
      full: "Everything that builds a site's authority and trust from outside the site itself: mainly backlinks (links from other credible sites pointing to yours), but also brand mentions, digital PR, guest posting, social signals, and reviews. Google treats a backlink like a vote of confidence, but not all votes count equally: a link from a relevant, high-authority site matters far more than dozens of low-quality ones (which can actually hurt rankings). Good off-page SEO focuses on earning links through genuinely useful content, real relationships, and digital PR, not buying links or spammy directory submissions, which risk a manual penalty.",
    },
    id: {
      oneLiner: "ngebangun otoritas situs dari luar, utamanya lewat backlink dan brand mention",
      full: "Semua hal yang ngebangun otoritas dan kepercayaan sebuah situs dari luar situsnya sendiri: utamanya backlink (link dari situs kredibel lain yang ngarah ke situs kita), tapi juga brand mention, digital PR, guest posting, sinyal sosial, dan review. Google nganggep backlink kayak \"vote kepercayaan\", tapi gak semua vote nilainya sama: satu link dari situs relevan yang otoritasnya tinggi jauh lebih berharga daripada puluhan link kualitas rendah (yang malah bisa nurunin ranking). Off-page SEO yang bener fokus ke dapetin link secara organik lewat konten yang beneran berguna, relasi asli, dan digital PR, bukan beli link atau submit ke direktori spam, yang risikonya kena penalti manual dari Google.",
    },
  },
  "search-optimization-local-seo": {
    en: {
      oneLiner: "optimizing for location-based searches like Google Business Profile and \"near me\" queries",
      full: "Optimizing for \"near me\" and location-based searches, critical for any business with a physical location or service area. Centers around Google Business Profile optimization (accurate categories, photos, hours, posts), NAP consistency (Name, Address, Phone matching everywhere online), local citations, location-specific landing pages, and reviews management. Google's local algorithm weighs relevance, distance, and prominence, so a well-optimized profile with consistent citations and genuine reviews often outranks a bigger competitor with a weaker local presence.",
    },
    id: {
      oneLiner: "optimasi buat pencarian berbasis lokasi kayak Google Business Profile dan pencarian \"di dekat sini\"",
      full: "Optimasi buat pencarian \"di dekat sini\" dan yang berbasis lokasi, penting banget buat bisnis yang punya lokasi fisik atau area layanan tertentu. Fokusnya di optimasi Google Business Profile (kategori yang bener, foto, jam operasional, postingan), konsistensi NAP (Nama, Alamat, Nomor telepon yang sama di mana-mana), sitasi lokal, landing page khusus per lokasi, dan pengelolaan review. Algoritma lokal Google nimbang relevansi, jarak, dan prominence (seberapa dikenal), jadi profil yang dioptimasi dengan bener plus sitasi konsisten dan review asli sering ngalahin kompetitor lebih besar yang presence lokalnya lemah.",
    },
  },
  "search-optimization-international-seo": {
    en: {
      oneLiner: "making a site rank correctly across different countries and languages, mainly via hreflang",
      full: "Making a site work in search results across multiple countries and languages. The technical core is hreflang tags, which tell search engines which language/region version of a page to show whom. Beyond that: choosing the right URL structure (ccTLD, subdomain, or subdirectory), avoiding duplicate-content issues between language versions, adapting keyword research per market (direct translation often misses how people actually search locally), and respecting regional search engines (Baidu, Yandex, Naver matter in their markets, Google isn't universal). Get hreflang wrong and you risk the wrong country's page ranking in the wrong market, or search engines ignoring your international pages entirely.",
    },
    id: {
      oneLiner: "bikin situs ranking dengan bener di berbagai negara dan bahasa, utamanya lewat hreflang",
      full: "Bikin situs bisa muncul di hasil pencarian di berbagai negara dan bahasa. Intinya secara teknis ada di tag hreflang, yang ngasih tau search engine versi bahasa/wilayah mana yang harus ditampilin ke siapa. Selain itu: milih struktur URL yang tepat (ccTLD, subdomain, atau subdirectory), ngehindarin masalah duplicate content antar versi bahasa, nyesuaiin riset keyword per market (terjemahan langsung sering meleset dari cara orang lokal beneran nyari), dan ngehargain search engine regional (Baidu, Yandex, Naver penting di market masing-masing, Google bukan satu-satunya). Kalau hreflang-nya salah, risikonya halaman negara yang salah malah muncul di market yang salah, atau lebih parah, search engine malah ngabaiin halaman internasionalnya sama sekali.",
    },
  },
  "search-optimization-enterprise-seo": {
    en: {
      oneLiner: "SEO practices built for very large sites with thousands of pages and multiple teams",
      full: "SEO at scale for large sites: thousands or millions of pages, multiple teams, and complex approval workflows. The challenges are different from small-site SEO: managing crawl budget across a huge site, handling faceted navigation and pagination without creating duplicate-content chaos, coordinating SEO requirements across dev, content, and legal teams, and building governance systems (style guides, technical SEO checklists) so quality stays consistent when hundreds of pages get published monthly. Enterprise SEO also leans heavily on automation and structured data at scale, since manually optimizing each page isn't feasible.",
    },
    id: {
      oneLiner: "praktik SEO yang dirancang buat situs raksasa dengan ribuan halaman dan banyak tim",
      full: "SEO dalam skala besar buat situs raksasa: bayangin ribuan atau jutaan halaman, banyak tim, dan proses approval yang kompleks. Tantangannya beda sama SEO situs kecil: ngatur crawl budget di situs yang gede banget, nanganin faceted navigation dan pagination tanpa bikin kekacauan duplicate content, koordinasi kebutuhan SEO lintas tim dev, konten, dan legal, sampai bikin sistem governance (style guide, checklist technical SEO) biar kualitasnya tetep konsisten pas ratusan halaman diterbitin tiap bulan. Enterprise SEO juga banyak ngandelin otomasi dan structured data dalam skala besar, soalnya ngoptimasi satu-satu halaman manual udah gak mungkin lagi.",
    },
  },
  "search-optimization-e-commerce-seo": {
    en: {
      oneLiner: "SEO tailored for online stores, focused heavily on product and category pages",
      full: "SEO tailored for online stores, where the biggest challenges are usually thin/duplicate product descriptions, faceted filter URLs creating index bloat, out-of-stock page handling, and product schema markup (so rich results show price, ratings, and availability directly in search). Category page optimization matters more than most stores realize: they're often the real revenue drivers, not just individual product pages. Good e-commerce SEO also handles pagination properly, avoids canonical conflicts from filter/sort parameters, and treats site search and internal linking as a way to guide both users and crawlers to money pages.",
    },
    id: {
      oneLiner: "SEO yang disesuaikan buat toko online, fokusnya banyak di halaman produk dan kategori",
      full: "SEO yang disesuaikan buat toko online, tantangan terbesarnya biasanya deskripsi produk yang tipis/duplikat, URL filter faceted yang bikin index bloat, penanganan halaman produk yang stoknya habis, dan schema markup produk (biar rich result nampilin harga, rating, dan ketersediaan langsung di hasil pencarian). Optimasi halaman kategori itu lebih penting dari yang banyak toko sadari, sering justru itu yang beneran ngedatengin revenue, bukan cuma halaman produk satuan. E-commerce SEO yang bagus juga nanganin pagination dengan bener, ngehindarin konflik canonical dari parameter filter/sort, dan manfaatin pencarian internal serta internal linking buat ngarahin user maupun crawler ke halaman yang menghasilkan uang.",
    },
  },
  "search-optimization-seo-content-strategy": {
    en: {
      oneLiner: "planning content around real search demand, organized into topic clusters",
      full: "Planning content around real search demand and topical authority, not just publishing blindly and hoping to rank. Starts with keyword and search-intent research, then maps content into topic clusters: a pillar page covering a broad topic, linked to supporting articles that cover subtopics in depth. This structure signals expertise to search engines and keeps readers engaged longer. A solid strategy also plans for content gaps competitors haven't covered, decides what to update versus create new, and builds in measurement (which pieces actually drive traffic, leads, or sales) rather than treating publishing volume as the goal.",
    },
    id: {
      oneLiner: "ngerencanain konten berdasarkan permintaan pencarian nyata, disusun jadi topic cluster",
      full: "Ngerencanain konten berdasarkan permintaan pencarian yang nyata dan topical authority, bukan asal nerbitin terus berharap naik ranking. Mulai dari riset keyword dan search intent, terus dipetain jadi topic cluster: satu pillar page yang nyakup topik luas, dihubungin ke artikel-artikel pendukung yang bahas subtopik lebih dalam. Struktur ini nunjukin keahlian ke search engine dan bikin pembaca betah lebih lama. Strategi yang bagus juga ngeliat celah konten yang belum digarap kompetitor, mutusin mana yang perlu diupdate versus dibikin baru, dan ada pengukurannya (konten mana yang beneran ndatengin traffic, leads, atau penjualan), bukan cuma ngejar jumlah postingan.",
    },
  },
  "search-optimization-answer-engine-optimization-aeo": {
    en: {
      oneLiner: "optimizing content to be picked as THE direct answer, like in featured snippets or voice search",
      full: "Optimizing content to be picked up directly as the answer: in featured snippets, voice search results, and \"People Also Ask\" boxes, instead of just being one of ten blue links. This means structuring content around clear, direct question-and-answer formats, using FAQPage schema markup, writing concise definitional answers near the top of a page before going deeper, and understanding the exact phrasing people actually ask (often conversational, since voice and chat-style search behave differently from typed keyword search). AEO overlaps heavily with structured data and semantic clarity. An answer engine needs to extract a clean, unambiguous answer, not infer one from a wall of vague text.",
    },
    id: {
      oneLiner: "optimasi konten biar langsung diambil jadi jawaban utama, kayak di featured snippet atau voice search",
      full: "Optimasi konten biar langsung diambil jadi jawaban utama: di featured snippet, hasil voice search, dan kotak \"People Also Ask\", bukan cuma jadi salah satu dari sepuluh link biru. Artinya nyusun konten dalam format tanya-jawab yang jelas dan langsung, pake schema markup FAQPage, nulis jawaban definitif yang ringkas di bagian atas halaman sebelum masuk lebih dalam, dan ngerti persis gimana cara orang beneran nanya (sering lebih ngobrol/conversational, soalnya voice search dan chat-style search caranya beda sama pencarian keyword yang diketik). AEO ini nyambung banget sama structured data dan kejelasan semantik. Answer engine butuh nge-extract jawaban yang bersih dan gak ambigu, bukan nebak-nebak dari tulisan yang muter-muter.",
    },
  },
  "search-optimization-generative-engine-optimization-geo": {
    en: {
      oneLiner: "optimizing so AI tools like ChatGPT or Perplexity actually cite your content in their answers",
      full: "Optimizing so AI answer engines (ChatGPT, Google AI Overviews, Perplexity, Claude) actually cite and recommend your content when generating an answer, a newer, fast-growing discipline as more searches get answered directly by AI instead of a list of links. Key factors: being genuinely citable (clear facts, original data, unambiguous statements an AI can quote confidently), strong entity clarity (the AI needs to understand exactly who or what you are, which ties into schema and consistent brand mentions across the web), and demonstrable expertise/trust signals, since generative engines tend to favor sources they can verify. Unlike traditional SEO, ranking #1 doesn't guarantee a citation. Being the clearest, most quotable source often matters more than sheer position.",
    },
    id: {
      oneLiner: "optimasi biar tools AI kayak ChatGPT beneran ngutip konten kita di jawaban mereka",
      full: "Optimasi biar AI answer engine (ChatGPT, Google AI Overview, Perplexity, Claude) beneran ngutip dan merekomendasiin konten kita pas mereka bikin jawaban, disiplin yang relatif baru dan lagi berkembang pesat, soalnya makin banyak pencarian yang dijawab langsung sama AI, bukan daftar link. Faktor kuncinya: bener-bener bisa dikutip (fakta yang jelas, data orisinal, pernyataan yang gak ambigu biar AI bisa ngutip dengan percaya diri), kejelasan entitas yang kuat (AI-nya harus ngerti persis siapa/apa kita, ini nyambung ke schema dan brand mention yang konsisten di seluruh web), dan sinyal keahlian/kepercayaan yang jelas, soalnya generative engine cenderung milih sumber yang bisa mereka verifikasi. Beda sama SEO tradisional, ranking #1 gak jamin dikutip. Jadi sumber yang paling jelas dan paling gampang dikutip sering lebih penting daripada posisi doang.",
    },
  },
  "search-optimization-knowledge-graph-optimization": {
    en: {
      oneLiner: "helping search engines recognize a brand as a distinct, verified entity",
      full: "Helping search engines understand a business, person, or brand as a distinct, verified entity in their knowledge graph: the system behind Google's info panels and \"things, not strings\" understanding. This involves structured data (Organization, Person, LocalBusiness schema), a consistent Wikidata/Wikipedia presence where relevant, consistent NAP and brand info across authoritative sources, and building genuine topical associations, so the entity is reliably linked to the right topics, industries, and related entities. A strong knowledge graph presence makes a brand more likely to appear in knowledge panels, get correctly cited by AI systems, and be trusted as a real, verifiable entity rather than just a website.",
    },
    id: {
      oneLiner: "bantuin search engine ngenalin brand sebagai entitas yang jelas dan terverifikasi",
      full: "Bantuin search engine ngerti sebuah bisnis, orang, atau brand sebagai entitas yang jelas dan terverifikasi di knowledge graph mereka: sistem yang ada di balik info panel Google dan konsep \"things, not strings\" (mikirin entitas beneran, bukan cuma rangkaian teks). Ini nyakup structured data (schema Organization, Person, LocalBusiness), presence yang konsisten di Wikidata/Wikipedia kalau relevan, info NAP dan brand yang konsisten di berbagai sumber yang kredibel, dan ngebangun asosiasi topikal yang beneran, biar entitasnya konsisten dikaitin ke topik, industri, dan entitas terkait yang tepat. Knowledge graph presence yang kuat bikin brand lebih gampang muncul di knowledge panel, lebih gampang dikutip dengan benar sama sistem AI, dan lebih dipercaya sebagai entitas nyata yang bisa diverifikasi, bukan cuma sekadar website.",
    },
  },
  "search-optimization-entity-seo": {
    en: {
      oneLiner: "making sure search engines correctly identify and disambiguate entities mentioned in content",
      full: "A close relative of knowledge graph optimization, focused specifically on making sure search engines correctly identify and disambiguate the \"entities\" (people, places, organizations, concepts) mentioned in content, and connect them to the right real-world entity rather than confusing them with something similarly named. Techniques include schema markup with explicit @id references, internal linking with clear anchor text, mentioning entities alongside their well-known associations (which helps disambiguation), and building external validation through citations on authoritative, entity-aware sources. Strong entity SEO makes content easier for both search engines and AI systems to parse semantically, not just keyword-match.",
    },
    id: {
      oneLiner: "mastiin search engine bener-bener ngenalin dan bedain entitas yang disebut di konten",
      full: "Masih sodaraan sama knowledge graph optimization, tapi fokusnya lebih spesifik ke mastiin search engine bener-bener ngenalin dan bedain \"entitas\" (orang, tempat, organisasi, konsep) yang disebut di konten, dan ngaitinnya ke entitas dunia nyata yang tepat, bukan ketuker sama sesuatu yang namanya mirip. Teknik yang dipake termasuk schema markup dengan referensi @id yang eksplisit, internal linking dengan anchor text yang jelas, nyebut entitas bareng asosiasi terkenalnya (ini bantu disambiguasi), dan ngebangun validasi eksternal lewat sitasi di sumber-sumber kredibel yang entity-aware. Entity SEO yang kuat bikin konten lebih gampang diparsing secara semantik sama search engine maupun sistem AI, bukan cuma dicocokin kata per kata doang.",
    },
  },
  "search-optimization-seo-recovery": {
    en: {
      oneLiner: "diagnosing and fixing a real traffic or ranking drop",
      full: "Diagnosing and fixing a real traffic or ranking drop: whether from a Google algorithm update, a manual penalty, a botched site migration, or accidental technical damage (a bad robots.txt push, deindexed pages, broken canonicals). Recovery starts with pinpointing the exact cause using traffic graphs cross-referenced against known algorithm update dates, Search Console manual action reports, and crawl comparisons before and after the drop. The fix depends entirely on the cause. A content-quality algorithm hit needs genuine content improvement, not quick technical patches, while a technical accident needs the specific broken thing fixed and then patience, since recovery is rarely instant even after the root cause is resolved.",
    },
    id: {
      oneLiner: "mendiagnosis dan benerin penurunan traffic atau ranking yang beneran kejadian",
      full: "Mendiagnosis dan benerin penurunan traffic/ranking yang beneran kejadian: entah dari algorithm update Google, penalti manual, migrasi situs yang berantakan, atau kerusakan teknis gak sengaja (push robots.txt yang salah, halaman ke-deindex, canonical yang rusak). Recovery dimulai dari nemuin penyebab pastinya, pake grafik traffic yang dibandingin sama tanggal algorithm update yang diketahui, laporan manual action di Search Console, dan perbandingan crawl sebelum-sesudah penurunan. Solusinya tergantung banget sama penyebabnya. Kalau kena algoritma soal kualitas konten butuh perbaikan konten yang beneran, bukan tambal-sulam teknis doang, sedangkan kecelakaan teknis butuh perbaikan spesifik di bagian yang rusak terus sabar, soalnya recovery jarang instan meskipun akar masalahnya udah kelar.",
    },
  },
  "search-optimization-seo-monitoring-and-reporting": {
    en: {
      oneLiner: "ongoing tracking of rankings and traffic, turned into business-relevant reports",
      full: "Ongoing tracking of what's actually working: rankings, organic traffic, click-through rate, conversions from organic search, crawl errors, and Core Web Vitals, turned into reports that connect SEO activity to real business outcomes, not vanity metrics. Good monitoring catches problems early (a sudden indexing drop, a competitor overtaking a key term, a technical error spiking) before they become a crisis, and good reporting translates \"we moved from position 8 to position 3\" into \"this is worth roughly X more monthly visitors and Y potential leads.\" That's the kind of framing that keeps SEO work understood and funded internally.",
    },
    id: {
      oneLiner: "pemantauan berkelanjutan soal ranking dan traffic, diubah jadi laporan yang relevan buat bisnis",
      full: "Pemantauan berkelanjutan soal apa yang beneran works: ranking, traffic organik, click-through rate, konversi dari pencarian organik, error crawl, sama Core Web Vitals, yang diubah jadi laporan yang ngaitin aktivitas SEO ke hasil bisnis nyata, bukan cuma metrik yang keliatan bagus doang. Monitoring yang bagus nangkep masalah lebih awal (penurunan indexing tiba-tiba, kompetitor yang nyalip di keyword penting, error teknis yang tiba-tiba naik) sebelum jadi krisis, dan reporting yang bagus nerjemahin \"kita naik dari posisi 8 ke posisi 3\" jadi \"ini setara kira-kira sekian pengunjung tambahan per bulan dan sekian potensi leads.\" Jenis framing yang bikin kerjaan SEO tetep dipahami dan didanai secara internal.",
    },
  },
};
