import { priceLabel, rupiah, serviceRate } from "./rateCard.js";

// Deterministic catalog retrieval and guided troubleshooting. No network,
// hidden documents, generated prices, or claims that a site was inspected.
const clean = (value) => String(value ?? "").toLowerCase().normalize("NFKC")
  .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const ignored = new Set("apa apakah saya aku kamu kami yang dan atau di ke dari untuk itu ini tadi berapa harga biaya price cost how much the a an of for with to is are please tolong dong bro jasa layanan service services development optimization integration setup gratis free buat bikin ingin mau butuh jelaskan detail tentang tell me".split(" "));
const words = (value) => [...new Set(clean(value).split(" ").filter((w) => w && !ignored.has(w)))];
const hasPhrase = (text, phrase) => (` ${clean(text)} `).includes(` ${clean(phrase)} `);
const aliases = {
  "Landing Page Development": ["landing page", "halaman promosi"],
  "Company Profile Website": ["company profile", "profil perusahaan"],
  "Portfolio Website Development": ["website portofolio", "web portofolio"],
  "E-Commerce Website": ["toko online", "ecommerce", "e commerce"],
  "WhatsApp Integration": ["integrasi whatsapp", "integrasi wa"],
  "Additional Page": ["halaman tambahan", "tambah halaman"],
  "Speed Optimization": ["optimasi kecepatan", "percepat website"],
  "Technical SEO": ["seo teknis"],
  "On-Page SEO": ["onpage seo", "seo onpage", "seo on page"],
  "AI Chatbot": ["chatbot ai"],
  "AI Agent": ["agen ai"],
  "image-compressor": ["kompres gambar", "kompres foto", "perkecil gambar", "compress image"],
  "image-resizer": ["ubah ukuran gambar", "resize gambar", "resize foto"],
  "invoice-builder": ["invoice", "faktur", "quotation", "buat invoice", "bikin invoice", "buat faktur", "buat quotation", "buat penawaran"],
  "whatsapp-link-generator": ["link whatsapp", "link wa", "tautan whatsapp"],
  "qr-code-generator": ["kode qr", "buat qr", "bikin qr"],
  "meta-tag-generator": ["meta tag", "meta description"],
  "schema-markup-generator": ["schema markup", "json ld"],
  "robots-txt-generator": ["robots txt"],
  "utm-builder": ["link tracking", "tracking kampanye", "utm"],
};

function rank(query, entries, name = (entry) => entry.name, key = (entry) => entry.slug || entry.name) {
  const q = clean(query);
  const tokens = new Set(words(q));
  return entries.map((entry) => {
    const label = name(entry);
    const names = [label, ...(aliases[key(entry)] || []), ...(aliases[label] || [])];
    const distinctive = words(label);
    const overlap = distinctive.filter((word) => tokens.has(word)).length;
    const exact = names.some((term) => hasPhrase(q, term));
    const aliasHit = names.slice(1).some((term) => hasPhrase(q, term));
    const score = exact ? 100 + Math.max(...names.filter((term) => hasPhrase(q, term)).map((term) => words(term).length))
      : overlap >= Math.min(2, distinctive.length) && overlap > 0 ? overlap / distinctive.length * 20 : 0;
    return { entry, score, exact, aliasHit };
  }).filter((hit) => hit.score > 0).sort((a, b) => b.score - a.score);
}

const priceIntent = (q) => /\b(harga|hrga|biaya|tarif|price|pricing|cost|budget|anggaran|estimasi|total|berapa|brp|mahal|murah|termurah|cheapest|afford|rp|ribu|juta|jutaannya)\b/.test(clean(q));
const followup = (q) => /\b(tadi|tersebut|itu|yang ini|lanjut|harganya|biayanya|detailnya|prosesnya|berapa|brp|budget|anggaran|juta|ribu|cukup|sudah|belum|termasuk|include|exclude|mahal|murah|lebih murah|that|it|its|how much|what about|include|total|tambah)\b/.test(clean(q));
const isContact = (q) => /\b(kontak|contact|email|telepon|hubungi|hubungin|nomor wa|nomor whatsapp|chat whatsapp|bicara dengan|talk to)\b/.test(clean(q));
const isId = (lang) => lang === "id";
const choose = (lang, id, en) => isId(lang) ? id : en;
const baseUrl = (k) => String(k.site?.url || "").replace(/\/$/, "");
const toolList = (k) => (k.tools || []).flatMap((g) => g.tools || []);
function priorQueries(history) {
  return (Array.isArray(history) ? history : []).filter((m) => m?.role === "user" && typeof m.content === "string")
    .slice(-12).map((m) => m.content.slice(0, 1500)).reverse();
}

function ratesFor(query, k) {
  const rates = k.rateCard || [];
  const direct = rank(query, rates);
  // Exact service names take precedence over incidental generic overlaps.
  if (direct.some((h) => h.exact)) {
    let exact = direct.filter((h) => h.exact).map((h) => h.entry);
    const canonical = exact.filter((r) => hasPhrase(query, r.name));
    exact = exact.filter((r) => canonical.includes(r) || !canonical.some((c) =>
      (aliases[r.name] || []).some((alias) => hasPhrase(c.name, alias))));
    exact = exact.filter((r) => !exact.some((other) => other.name !== r.name && hasPhrase(other.name, r.name)));
    const anchors = exact.filter((r) => r.kind === "service" && exact.filter((other) => other.name === r.name).length === 1);
    const primaryCategories = [...new Set((anchors.length ? anchors : exact.filter((r) => r.kind === "service")).map((r) => r.category))];
    if (primaryCategories.length === 1) exact = exact.filter((r) =>
      (r.kind !== "addon" && exact.filter((other) => other.name === r.name).length === 1) || r.category === primaryCategories[0]);
    return exact;
  }
  const services = rank(query, k.services || []);
  const mapped = services.map((h) => serviceRate(rates, { ...h.entry, kind: "service", parent_slug: h.entry.parentSlug })).filter(Boolean);
  if (mapped.length) return [...new Map(mapped.map((r) => [r.id, r])).values()];
  if (direct.length && direct[0].score >= 12) return direct.filter((h) => h.score >= 12).map((h) => h.entry);
  const categoryAliases = {
    "search-optimization": /\b(seo|aeo|geo|optimasi pencarian)\b/,
    "web-development": /\b(web|website|situs)\b/,
    "mobile-app-development": /\b(android|ios|aplikasi|mobile)\b/,
    "ui-ux-design": /\b(ui|ux|desain)\b/,
    "ai-automation": /\b(ai|otomasi|automation)\b/,
    "branding-marketing-selling": /\b(branding|marketing|pemasaran|iklan)\b/,
    "content-creative": /\b(konten|content|copywriting)\b/,
    packages: /\b(paket|package|packages)\b/,
  };
  const matchedCategory = Object.entries(categoryAliases).find(([, pattern]) => pattern.test(clean(query)))?.[0];
  if (matchedCategory) {
    let list = rates.filter((r) => r.category === matchedCategory && r.kind !== "addon");
    if (matchedCategory === "search-optimization") {
      const topic = clean(query).match(/\b(seo|aeo|geo)\b/)?.[1];
      if (topic) list = list.filter((r) => hasPhrase(r.name, topic));
    }
    if (/\b(bulanan|rutin|monthly|ongoing)\b/.test(clean(query))) list = list.filter((r) => r.monthly);
    return list;
  }
  const categories = rank(query, k.categories || []);
  return categories.length ? rates.filter((r) => r.category === categories[0].entry.slug && r.kind === "service") : [];
}

function pricingRules(k, lang) {
  const rows = (k.pricingRules || []).filter(([name]) => /Advertising|APIs|AI|Hosting|Domain|Cloud|SaaS|Plugin|Backlinks|Gateway|Marketplace|Stock|Licensed/.test(name));
  return choose(lang,
    "Semua angka adalah harga mulai, bukan penawaran final. Scope, fitur, integrasi, volume, timeline, dan dukungan menentukan harga akhir.",
    "All amounts are starting prices, not a final quote. Scope, features, integrations, volume, timeline, and support determine the final price.")
    + (rows.length ? "\n" + choose(lang, "Biaya di luar jasa (sesuai kebutuhan): ", "Separate costs where applicable: ") + rows.map(([name, policy]) => `${name}: ${policy}`).join("; ") + "." : "");
}

function rateLines(rates, lang) {
  return rates.map((r) => `- ${r.name} (${r.categoryName}): ${priceLabel(r, lang)}${r.monthly && r.minMonths > 1 ? choose(lang, `; minimum ${r.minMonths} bulan (${rupiah(r.amount * r.minMonths)})`, `; minimum ${r.minMonths} months (${rupiah(r.amount * r.minMonths)})`) : ""}`).join("\n");
}

function quantityFor(query, rate) {
  const q = clean(query);
  const names = [rate.name, ...(aliases[rate.name] || [])].map(clean).sort((a, b) => b.length - a.length);
  for (const name of names) {
    const match = q.match(new RegExp(`(?:^| )([0-9]+) (?:x )?${name}(?: |$)`));
    if (match) return Number(match[1]) > 0 && Number(match[1]) <= 9999 ? Number(match[1]) : null;
  }
  const unitWords = { page: "halaman tambahan|additional pages?|pages?", screen: "screens?", article: "artikel|articles?", integration: "integrasi|integrations?", language: "bahasa|languages?" };
  if (unitWords[rate.unit]) {
    const match = q.match(new RegExp(`(?:^| )([0-9]+) (?:${unitWords[rate.unit]})(?: |$)`));
    if (match) return Number(match[1]) > 0 && Number(match[1]) <= 9999 ? Number(match[1]) : null;
    return null;
  }
  return 1;
}

function budgetFrom(query) {
  const normalized = String(query).toLowerCase().replace(/(\d)[.,](?=\d{3}(?:\D|$))/g, "$1");
  const match = normalized.match(/\b(?:budget|anggaran|dana|punya|cuma|hanya|rp)\s*(?:(?:saya|aku|my|is|sekitar|cuma|hanya)\s+)*(?:rp\s*)?(\d+(?:[.,]\d+)?)\s*(juta|jt|million|ribu|rb|k)?\b/);
  if (!match) return null;
  const amount = Number(match[1].replace(",", "."));
  return amount * (/^(juta|jt|million)$/.test(match[2]) ? 1e6 : /^(ribu|rb|k)$/.test(match[2]) ? 1000 : 1);
}

function priceAnswer(query, k, lang, subject) {
  const rates = ratesFor(subject, k);
  const budget = budgetFrom(query);
  const all = /\b(semua|seluruh|lengkap|all|complete)\b/.test(clean(query));
  if (/\b(termasuk|include|included|exclude|tambahan)\b/.test(clean(query)) && /\b(hosting|domain|api|saas|plugin|cloud|backlink|iklan|ad spend)\b/.test(clean(query))) return pricingRules(k, lang) + "\n\n" + choose(lang, "Untuk memastikan scope, layanan mana yang ingin dipilih dan komponen apa yang dibutuhkan?", "Which service and components do you need so we can clarify the scope?");
  if (!rates.length && !all && budget === null) {
    const meaningful = words(query).filter((w) => !["berapa", "brp", "hrga", "estimasi", "daftar", "paket", "paketan", "semuanya", "all", "pricing", "list", "harganya", "biayanya"].includes(w));
    if (meaningful.length) return choose(lang,
      "Aku belum menemukan kecocokan yang cukup jelas di rate card untuk nama itu. Aku tidak akan mengganti dengan harga layanan lain. Sebutkan nama layanan/kategori, fitur yang dibutuhkan, atau tujuan proyek; kita cocokkan scope-nya dulu.",
      "I could not confidently match that name to the rate card. I will not substitute another service's price. Tell me the service/category, required features, or project goal so we can match its scope.");
  }
  const pool = rates.length ? rates : (k.rateCard || []).filter((r) => all || r.kind === "service");
  if (!pool.length) return choose(lang, "Harga resmi belum tersedia di data yang terbaca. Sebutkan nama layanan dan cakupannya; aku bisa bantu menguraikan kebutuhan tanpa mengarang nominal.", "Official prices are not available in the loaded data. Tell me the service and scope so we can break down the requirements without inventing a price.");
  let selected = pool;
  let alternativeNote = "";
  if (/\b(lebih murah|cheaper)\b/.test(clean(query)) && rates.length) {
    const priced = rates.filter((r) => !r.custom && r.kind === "service");
    if (priced.length) {
      const reference = priced.reduce((best, r) => r.amount < best.amount ? r : best);
      const alternatives = (k.rateCard || []).filter((r) => r.category === reference.category && r.kind === "service" && !r.custom && r.unit === reference.unit && r.amount < reference.amount);
      if (alternatives.length) {
        selected = alternatives.sort((a, b) => a.amount - b.amount);
        alternativeNote = choose(lang, "Alternatif dengan harga awal lebih rendah di kategori yang sama; scope-nya berbeda dan perlu dicocokkan dengan kebutuhan:\n", "Lower starting-price alternatives in the same category; their scopes differ and must fit your needs:\n");
      } else alternativeNote = choose(lang, "Belum ada layanan sejenis dengan harga awal lebih rendah dalam kategori ini. Kita bisa kurangi fitur atau gunakan tools gratis; harga resmi tidak aku ubah.\n", "No comparable lower starting-price service is listed in this category. We can reduce features or use free tools; official prices remain unchanged.\n");
    }
  }
  if (budget !== null) {
    const wantsMonthly = /\b(bulanan|rutin|monthly|ongoing|per bulan)\b/.test(clean(subject));
    selected = pool.filter((r) => !r.custom && (wantsMonthly ? r.monthly : !r.monthly && r.unit === "project") && r.amount <= budget).sort((a, b) => a.amount - b.amount);
  }
  if (/\b(termurah|cheapest)\b/.test(clean(query))) selected = selected.filter((r) => !r.custom).sort((a, b) => a.amount - b.amount).slice(0, 1);
  // A complete list is grouped, never silently truncated to a few rows.
  const shown = all ? selected : selected.slice(0, 8);
  let result = choose(lang, "Acuan rate card resmi:\n", "Official rate card:\n") + alternativeNote + (shown.length ? rateLines(shown, lang) : choose(lang, `Belum ada layanan dalam pilihan ini yang harga awalnya masuk anggaran ${rupiah(budget)}. Kita bisa mengurangi scope atau mulai dari tools gratis; aku tidak bisa menjanjikan diskon.`, `No matching service has a listed starting price within ${rupiah(budget)}. We can reduce scope or start with free tools; I cannot promise a discount.`));
  if (selected.length > shown.length) result += choose(lang, `\nMenampilkan ${shown.length} dari ${selected.length} pilihan. Sebutkan kategori atau minta semua harga agar aku tampilkan sisanya.`, `\nShowing ${shown.length} of ${selected.length} options. Name a category or ask for all prices to see the rest.`);
  const exact = shown.filter((r) => rates.some((candidate) => candidate.id === r.id));
  const ambiguous = new Set(exact.map((r) => clean(r.name))).size < exact.length;
  const sumIntent = /\b(total|gabung|combine|plus|ditambah|tambah|dan|and)\b/.test(clean(query));
  const quantityIntent = /\b(total|hitung|calculate|estimate)\b/.test(clean(query));
  const quantities = exact.map((r) => quantityFor(query, r));
  if ((sumIntent || quantityIntent) && exact.length >= 1 && exact.length <= 5 && !ambiguous && !exact.some((r) => r.custom || r.kind === "package") && quantities.every((quantity) => quantity !== null)) {
    const rows = exact.map((rate, index) => ({ ...rate, quantity: quantities[index] }));
    const project = rows.filter((r) => !r.monthly).reduce((sum, r) => sum + r.amount * r.quantity, 0);
    const monthly = rows.filter((r) => r.monthly).reduce((sum, r) => sum + r.amount * r.quantity, 0);
    const commitment = rows.filter((r) => r.monthly).reduce((sum, r) => sum + r.amount * r.quantity * r.minMonths, 0);
    result += "\n" + choose(lang, "Asumsi jumlah: ", "Quantity assumptions: ") + rows.map((r) => `${r.name} × ${r.quantity}`).join("; ");
    if (rows.some((r) => !r.monthly)) result += choose(lang, `\nSubtotal aritmetika biaya sekali jadi: ${rupiah(project)}.`, `\nArithmetic one-off subtotal: ${rupiah(project)}.`);
    if (monthly) result += choose(lang, `\nBiaya rutin: ${rupiah(monthly)}/bulan; total komitmen minimum komponen rutin: ${rupiah(commitment)}.`, `\nRecurring fees: ${rupiah(monthly)}/month; minimum commitment across recurring components: ${rupiah(commitment)}.`);
    result += choose(lang, "\nBelum memastikan kecocokan atau tumpang tindih scope.", "\nScope compatibility and overlap still need review.");
  } else if (quantityIntent && quantities.some((quantity) => quantity === null)) {
    result += choose(lang, "\nUntuk menghitung subtotal, berapa jumlah halaman, screen, artikel, bahasa, atau integrasi yang diperlukan?", "\nTo calculate the subtotal, how many pages, screens, articles, languages, or integrations are needed?");
  }
  if (ambiguous) result += choose(lang, "\nNama ini ada di beberapa kategori dengan scope berbeda. Pilih kategorinya dahulu; nominal tersebut bukan harga yang bisa saling menggantikan.", "\nThis name appears in multiple categories with different scopes. Choose a category first; those amounts are not interchangeable.");
  return result + "\n\n" + pricingRules(k, lang) + `\n${baseUrl(k)}/services` + "\n\n" + choose(lang, "Untuk memilih scope: apa target hasilnya, fitur wajibnya, dan apakah ini proyek sekali jadi atau dukungan rutin?", "To choose a scope: what outcome and required features do you need, and is this a one-off project or ongoing support?");
}

const playbooks = [
  { id: "speed", triggers: /\b(lambat|lemot|lelet|slow|lcp|pagespeed|berat|kecepatan)\b/, category: "web-development", rate: "Speed Optimization", tools: ["image-compressor", "image-resizer"],
    idSteps: ["Ukur halaman yang bermasalah di mobile dan desktop; catat LCP, INP, CLS, serta ukuran gambar dan skrip.", "Jika gambar besar, kompres dan sesuaikan dimensi. Jika skrip berat, kurangi skrip pihak ketiga dan muat fitur saat diperlukan.", "Uji ulang halaman yang sama dan alur utama; bandingkan hasil sebelum dan sesudah."],
    enSteps: ["Measure the affected page on mobile and desktop; record LCP, INP, CLS, image sizes, and scripts.", "If images are large, compress and resize them. If scripts are heavy, reduce third-party scripts and load optional features when needed.", "Retest the same page and main user flow; compare before and after."],
    questionId: "Halaman mana yang lambat, di perangkat apa, dan sudah ada hasil pengukurannya?", questionEn: "Which page and device are affected, and do you have measurement results?" },
  { id: "search", triggers: /\b(sepi|trafik|traffic|ranking|peringkat|index|indexing|terindeks|google|seo|aeo|geo)\b/, category: "search-optimization", rate: "Technical SEO", tools: ["robots-txt-generator", "sitemap-generator", "meta-tag-generator"],
    idSteps: ["Pisahkan masalah tidak terindeks dari masalah sudah terindeks tetapi impresi atau klik rendah. Periksa URL Inspection dan laporan Search Console.", "Jika tidak terindeks, cek status HTTP, robots/noindex, canonical, sitemap, dan apakah isi utama bisa dibaca crawler.", "Jika sudah terindeks, bandingkan kueri, intent, judul, isi, dan internal link. Nilai impresi, klik, serta leads; tidak ada jaminan peringkat."],
    enSteps: ["Separate indexing problems from indexed pages with low impressions or clicks. Check URL Inspection and Search Console reports.", "If not indexed, check HTTP status, robots/noindex, canonicals, sitemap, and crawler-readable content.", "If indexed, review queries, intent, titles, content, and internal links. Measure impressions, clicks, and leads; rankings are not guaranteed."],
    questionId: "Sudah punya website? Masalahnya URL tidak terindeks, impresi rendah, atau ada trafik tetapi belum menghasilkan leads?", questionEn: "Do you have a website? Is the issue indexing, low impressions, or traffic without leads?" },
  { id: "conversion", triggers: /\b(konversi|conversion|leads|closing|penjualan|jualan|sales|iklan|ads|checkout|abandon|pelanggan)\b/, category: "branding-marketing-selling", rate: "CRO", tools: ["utm-builder"],
    idSteps: ["Petakan funnel: impresi → klik → kunjungan → klik CTA → formulir/checkout → pembelian. Cari tahap dengan penurunan terbesar.", "Periksa kesesuaian pesan iklan dengan landing page, kejelasan penawaran, bukti kepercayaan, dan hambatan formulir atau checkout.", "Perbaiki satu hambatan utama dan ukur perubahan conversion rate serta biaya per lead. Jangan menambah belanja iklan sebelum pelacakan dan halaman tujuan jelas."],
    enSteps: ["Map impressions → clicks → visits → CTA clicks → form/checkout → purchase. Find the largest drop-off.", "Check ad-to-page message consistency, offer clarity, trust evidence, and form or checkout friction.", "Fix one major obstacle and measure conversion rate and cost per lead. Establish tracking and destination-page quality before increasing ad spend."],
    questionId: "Orang belum datang, sudah datang tetapi tidak klik CTA, atau sudah mengisi formulir tetapi tidak closing?", questionEn: "Are visitors missing, not clicking the CTA, or submitting forms without closing?" },
  { id: "automation", triggers: /\b(manual|berulang|otomasi|otomatis|automation|workflow|chatbot|crm|input data|follow up)\b/, category: "ai-automation", rate: "AI Workflow Automation", tools: [],
    idSteps: ["Pilih satu pekerjaan berulang. Tulis pemicu, input, aturan keputusan, output, dan siapa yang menyetujui hasilnya.", "Mulai dari otomasi berbasis aturan untuk pekerjaan terstruktur. AI hanya diperlukan bila tugas membutuhkan pemahaman teks atau keputusan yang tidak cukup diwakili aturan.", "Uji contoh normal, data kosong, duplikat, kegagalan integrasi, dan jalur pemeriksaan manusia sebelum diperluas."],
    enSteps: ["Pick one repeated task. Define its trigger, input, decision rules, output, and approver.", "Use rule-based automation for structured tasks. AI is only needed where text understanding or decisions cannot be represented adequately by rules.", "Test normal input, missing data, duplicates, integration failure, and human review before expanding."],
    questionId: "Pekerjaan apa yang masih manual, memakai aplikasi apa, dan berapa kali dilakukan sehari?", questionEn: "Which task is manual, what applications are involved, and how often does it run?" },
  { id: "launch", triggers: /\b(belum punya website|bikin website|buat website|website baru|mulai bisnis|bisnis baru|new website|start a business)\b/, category: "web-development", rate: "Landing Page Development", tools: [],
    idSteps: ["Tentukan satu tujuan awal: menerima pertanyaan, menjelaskan perusahaan, menjual produk, atau menjalankan aplikasi.", "Untuk menguji satu penawaran, mulai dari halaman yang menjelaskan manfaat, bukti, dan satu CTA. Jika butuh katalog, transaksi, akun, atau admin, rinci fiturnya terpisah.", "Siapkan konten, alur calon pelanggan, dan pengukuran keberhasilan sebelum menambah fitur."],
    enSteps: ["Choose one initial goal: inquiries, company information, selling products, or running an application.", "To test one offer, start with a page explaining benefits, evidence, and one CTA. List catalogs, transactions, accounts, or admin features separately if needed.", "Prepare content, the customer journey, and success measures before adding features."],
    questionId: "Apa jenis bisnisnya, tujuan website, dan fitur wajib untuk versi pertama?", questionEn: "What is the business, the website goal, and the minimum required feature set?" },
  { id: "design", triggers: /\b(ui|ux|desain|design|tampilan|navigasi|navigation|wireframe)\b/, category: "ui-ux-design", rate: "UI/UX Audit", tools: ["contrast-checker"],
    idSteps: ["Tentukan tugas pengguna yang paling penting, lalu catat langkah dari halaman masuk sampai tugas selesai.", "Periksa keterbacaan, hirarki informasi, label tombol, navigasi, kondisi error, dan akses pada layar kecil.", "Buat perbaikan atau prototipe alur itu dahulu, lalu uji dengan pengguna; perubahan warna saja belum membuktikan alur lebih mudah."],
    enSteps: ["Define the user's main task and map every step from entry to completion.", "Check readability, information hierarchy, button labels, navigation, error states, and small-screen access.", "Prototype that flow first and test with users; color changes alone do not prove better usability."],
    questionId: "Tugas apa yang sulit diselesaikan pengguna, dan di langkah mana mereka berhenti?", questionEn: "Which task is hard for users, and at which step do they stop?" },
  { id: "analytics", triggers: /\b(analytics|analitik|tracking|ga4|gtm|dashboard|laporan|data berantakan|ukur hasil)\b/, category: "analytics-data-intelligence", rate: "GA4 Setup", tools: ["utm-builder"],
    idSteps: ["Tentukan keputusan bisnis dan metrik yang dibutuhkan sebelum membuat dashboard.", "Petakan event penting (kunjungan, CTA, formulir, pembelian), sumber data, dan definisi konversi agar tidak menghitung ganda.", "Uji event dan parameter dengan contoh transaksi/aksi; bedakan data terukur dari asumsi dan pastikan persetujuan privasi sesuai kebutuhan."],
    enSteps: ["Define the business decision and required metrics before building a dashboard.", "Map key events (visits, CTA, forms, purchases), data sources, and conversion definitions to avoid double counting.", "Validate events and parameters with sample actions; separate measurements from assumptions and address consent requirements."],
    questionId: "Keputusan apa yang ingin kamu ambil dari data, dan aplikasi pelacak apa yang sudah dipakai?", questionEn: "What decision should the data support, and which tracking tools do you already use?" },
  { id: "content", triggers: /\b(konten|content|copywriting|caption|artikel|brand|branding|positioning)\b/, category: "content-creative", rate: "Copywriting", tools: ["caption-formatter", "color-palette-generator"],
    idSteps: ["Tentukan audiens, masalah yang diselesaikan, penawaran, bukti, dan tindakan yang diharapkan.", "Susun pesan utama dan format sesuai kanal; pisahkan fakta produk dari klaim yang belum terbukti.", "Mulai dari satu materi dan ukur respons yang relevan (klik, pertanyaan berkualitas, atau pembelian), lalu perbaiki pesannya."],
    enSteps: ["Define the audience, problem, offer, evidence, and desired action.", "Write the main message in the channel's format and separate product facts from unverified claims.", "Start with one asset, measure useful responses (clicks, qualified inquiries, or purchases), and refine the message."],
    questionId: "Siapa audiensnya, apa yang ditawarkan, dan materi akan dipakai di kanal mana?", questionEn: "Who is the audience, what is the offer, and which channel will use the material?" },
];

function problemAnswer(query, k, lang, previous = "") {
  const current = clean(query);
  const needsHelp = /\b(masalah|bantu|solusi|kenapa|mengapa|bagaimana|gimana|gmn|cara|atasi|perbaiki|tidak|gak|ga|nggak|belum|susah|sulit|bingung|sepi|lambat|lemot|manual|help|fix|why|slow|problem|troubleshoot)\b/.test(current);
  if (!needsHelp && !previous) return null;
  const matched = playbooks.filter((p) => p.triggers.test(current));
  let candidates = matched.length ? matched : (previous ? playbooks.filter((p) => p.triggers.test(clean(previous))) : []);
  if (/\b(trafik|traffic|pengunjung|visitors)\b/.test(current) && /\b(leads|closing|konversi|conversion|pembelian|membeli)\b/.test(current)) candidates = candidates.filter((p) => p.id === "conversion");
  if (!candidates.length) return null;
  return candidates.slice(0, 2).map((p) => {
    let steps = isId(lang) ? p.idSteps : p.enSteps;
    if (p.id === "search" && /\b(sudah terindeks|already indexed)\b/.test(current)) steps = isId(lang)
      ? ["Karena kamu menyebut sudah terindeks, fokus berikutnya adalah performa pencarian, bukan mengirim ulang indexing.", "Di Search Console, lihat per halaman dan kueri: jika impresi rendah, evaluasi relevansi/intent dan cakupan konten; jika impresi ada tetapi CTR rendah, evaluasi judul dan kecocokan penawaran.", "Jika klik sudah masuk tetapi tidak ada leads, periksa CTA, formulir, dan tracking konversi. Bandingkan periode yang setara sebelum menyimpulkan hasil."]
      : ["Since you say the page is indexed, focus on search performance rather than resubmitting indexing.", "Review pages and queries in Search Console: low impressions suggest checking relevance/intent and content coverage; impressions with low CTR suggest checking titles and offer fit.", "If clicks arrive without leads, check CTAs, forms, and conversion tracking. Compare equivalent periods before judging results."];
    const rate = (k.rateCard || []).find((r) => r.name === p.rate);
    const tools = toolList(k).filter((t) => p.tools.includes(t.slug));
    return choose(lang, "Langkah pemeriksaan yang bisa dicoba (belum merupakan diagnosis website kamu):", "Checks to try (these are not a diagnosis of your website):") + "\n" + steps.map((s, i) => `${i + 1}. ${s}`).join("\n")
      + (tools.length ? "\n\n" + choose(lang, "Tools gratis yang relevan:\n", "Relevant free tools:\n") + tools.map((t) => `- ${t.name}: ${baseUrl(k)}/tools/${t.slug}`).join("\n") : "")
      + (rate ? "\n\n" + choose(lang, "Jika membutuhkan jasa: ", "If you need a service: ") + rate.name + " — " + priceLabel(rate, lang) + `\n${baseUrl(k)}/services/${p.category}` : "")
      + "\n\n" + (isId(lang) ? p.questionId : p.questionEn);
  }).join("\n\n");
}

function toolAnswer(query, k, lang, previous) {
  const tools = toolList(k);
  const hits = rank(query, tools);
  const toolIntent = /\b(tools?|alat|gratis|free)\b/.test(clean(query));
  if (!hits.length && !toolIntent) return null;
  const ranked = hits.some((h) => h.exact) ? hits.filter((h) => h.exact) : hits;
  if (!ranked.length && previous && followup(query)) return toolAnswer(previous, k, lang);
  const shown = ranked.length ? ranked.map((h) => h.entry) : tools;
  if (!shown.length) return choose(lang, "Katalog tools belum terbaca. Tools apa yang kamu butuhkan: gambar, invoice, link, atau metadata?", "The tools catalog is not loaded. Do you need image, invoice, link, or metadata tools?");
  return choose(lang, "Tools yang bisa dipakai gratis:\n", "Free tools you can use:\n") + shown.map((t) => `- ${t.name}: ${t.description}\n  ${baseUrl(k)}/tools/${t.slug}`).join("\n") + "\n\n" + choose(lang, "Buka tool yang sesuai, masukkan file atau data yang diminta, lalu gunakan opsi hasil/ekspor yang tersedia. Format input dan hasil mengikuti kemampuan masing-masing tool. Kamu mau membuat atau mengubah apa?", "Open the matching tool, provide its requested file or data, and use its available output/export options. Input and output formats depend on the tool. What do you want to create or change?");
}

function productAnswer(query, k, lang, previous) {
  const products = k.products || [];
  const hits = rank(query, products);
  if (!hits.length && !/\b(produk|products?|store|toko|template|ebook|playbook|beli|buy)\b/.test(clean(query))) return null;
  if (!products.length) return choose(lang, "Belum ada produk aktif yang terbaca. Aku tidak akan mengarang stok atau harga. Kamu mencari template, materi belajar, atau solusi yang dikerjakan sebagai jasa?", "No active products are available in the loaded data. I will not invent stock or prices. Are you looking for a template, learning material, or a done-for-you service?") + `\n${baseUrl(k)}/store`;
  if (!hits.length && previous && followup(query)) return productAnswer(previous, k, lang);
  const shown = hits.length ? hits.filter((h) => h.score === hits[0].score).map((h) => h.entry) : products;
  return choose(lang, "Dari katalog produk aktif:\n", "From the active product catalog:\n") + shown.map((p) => {
    const validPrice = p.price !== null && p.price !== undefined && p.price !== "" && Number.isFinite(Number(p.price)) && Number(p.price) >= 0;
    return `- ${p.name}: ${validPrice ? rupiah(Number(p.price)) : choose(lang, "harga belum tersedia", "price unavailable")}${p.description ? `\n  ${String(p.description).replace(/<[^>]*>/g, " ").slice(0, 450)}` : ""}\n  ${baseUrl(k)}/store/${p.slug}`;
  }).join("\n") + "\n\n" + choose(lang, "Harga mengikuti katalog saat ini. Kamu butuh yang siap dipakai sendiri atau bantuan implementasinya?", "Prices follow the current catalog. Do you need a resource to use yourself or implementation help?");
}

export function clarificationAnswer(lang) {
  return choose(lang,
    "Bisa kita uraikan dulu. Apa hasil yang ingin dicapai, kondisi sekarang, dan hambatan utamanya? Misalnya: website lambat, belum muncul di Google, pengunjung belum menjadi pelanggan, pekerjaan masih manual, atau butuh tools/produk tertentu. Ceritakan satu kasus; aku bantu susun pemeriksaan dan pilihan yang relevan tanpa menebak fakta atau harga.",
    "Let's break it down. What outcome do you want, what is happening now, and what is the main obstacle? For example: a slow website, missing search visibility, visitors not converting, manual work, or a specific tool/product need. Share one case and I can suggest checks and relevant options without guessing facts or prices.");
}

export function answerCatalogQuestion(raw, lang, k, history = []) {
  if (lang !== "id" && lang !== "en") return null;
  const query = String(raw ?? "").slice(0, 4000);
  if (/\b(berapa|jumlah|how many|count)\b/.test(clean(query)) && !/\b(harga|harganya|biaya|biayanya|tarif|price|cost|budget|anggaran|lama|hari)\b/.test(clean(query))) {
    const q = clean(query);
    const count = /\b(tools?|alat)\b/.test(q) ? toolList(k).length
      : /\b(sertifikat|sertifikasi|certificates?|credentials?)\b/.test(q) ? (k.portfolio?.certifications || []).reduce((n, p) => n + (p.items?.length || 0), 0)
      : /\b(produk|products?)\b/.test(q) ? (k.products || []).length
      : /\b(artikel|articles?|posts?)\b/.test(q) ? (k.posts || []).length
      : /\b(kategori|categories)\b/.test(q) ? (k.categories || []).length
      : /\b(layanan|jasa|services?)\b/.test(q) ? (k.services || []).length : null;
    if (count !== null) return choose(lang, `Dari katalog publik yang terbaca saat ini, jumlahnya ${count}. Mau daftar lengkap atau rekomendasi untuk kebutuhan tertentu?`, `The currently loaded public catalog contains ${count}. Would you like the full list or recommendations for a specific need?`);
  }
  if (/\b(kontak|hubungi|hubungin|nomor wa|nomor whatsapp|telepon|contact isra|contact you|your email)\b/.test(clean(query)) && !/\b(integrasi|integration|generator|otomatis|automation)\b/.test(clean(query))) return null;
  const prior = priorQueries(history);
  // Never use assistant text as an authority for prices or past context.
  const previous = followup(query) ? prior.find((q) => ratesFor(q, k).length || rank(q, toolList(k)).length || rank(q, k.products || []).length || playbooks.some((p) => p.triggers.test(clean(q)))) : "";
  if (!previous && /\b(tadi|tersebut|harganya|biayanya|that one|its price)\b/.test(clean(query)) && !ratesFor(query, k).length && !rank(query, toolList(k)).length && !rank(query, k.products || []).length) return choose(lang,
    "Aku belum punya konteks pilihan yang dimaksud dalam percakapan ini. Sebutkan nama layanan, tool, atau produknya agar aku bisa menjawab dengan tepat.",
    "I do not have the referenced choice in this conversation. Name the service, tool, or product so I can answer accurately.");
  const additive = /\b(tambah|ditambah|tambahkan|add|plus)\b/.test(clean(query));
  const subject = previous && additive ? `${previous} ${query}` : ratesFor(query, k).length ? query : previous || query;
  if (/\b(jamin|garansi|guarantee|pasti)\b/.test(clean(query)) && /\b(ranking|peringkat|omzet|sales|roi|leads|hasil)\b/.test(clean(query))) return choose(lang,
    "Aku tidak bisa menjamin ranking, omzet, ROI, atau jumlah leads. Kita bisa menyepakati scope, baseline, target pengukuran, dan langkah evaluasi. Target hasil apa yang ingin kamu ukur, dan kondisi awalnya seperti apa?",
    "I cannot guarantee rankings, revenue, ROI, or lead counts. We can define scope, a baseline, measurement targets, and evaluation steps. Which outcome do you want to measure, and what is the starting point?");
  if (/\b(berapa lama|berapa hari|durasi|timeline|how long|deadline)\b/.test(clean(query))) return choose(lang,
    "Durasi pasti belum tersedia dari data ini, jadi aku tidak akan mengarang tanggal selesai. Kita perlu menentukan jumlah halaman/fitur, kesiapan konten, integrasi, dan proses persetujuan. Apa scope utamanya dan kapan ingin mulai?",
    "A confirmed duration is not available in this data, so I will not invent a completion date. We need page/feature counts, content readiness, integrations, and approvals. What is the scope and preferred start date?");
  const exactProduct = rank(query, k.products || []).some((h) => h.exact);
  const exactRates = rank(query, k.rateCard || []).some((h) => h.exact);
  const wantsFreeTool = /\b(tools?|alat|gratis|free)\b/.test(clean(query));
  // "Product Design", "Invoice System", and "App Store Deployment" are
  // paid services, not store products or free tools. Resolve named offerings
  // before generic words like product, store, or invoice can steal the intent.
  if (exactRates && !exactProduct && !wantsFreeTool && priceIntent(query)) return priceAnswer(query, k, lang, subject);
  // Resource names containing WhatsApp must be resolved before contact intent.
  const tool = toolAnswer(query, k, lang, previous);
  if (tool && (rank(query, toolList(k)).some((h) => h.exact) || /\b(tools?|alat|gratis|free)\b/.test(clean(query)))) return tool;
  const product = productAnswer(query, k, lang, previous);
  if (product && (rank(query, k.products || []).some((h) => h.exact) || /\b(produk|products?|store|template|ebook|playbook)\b/.test(clean(query)))) return product;
  if (isContact(query) && !ratesFor(query, k).length && !/\b(integrasi|integration|otomatis|automation|generator)\b/.test(clean(query))) return null;
  if (previous && !ratesFor(query, k).length) {
    if (rank(previous, toolList(k)).some((h) => h.exact)) return toolAnswer(previous, k, lang);
    if (rank(previous, k.products || []).some((h) => h.exact)) return productAnswer(previous, k, lang);
  }
  if (/\b(termasuk|include|exclude|sudah termasuk)\b/.test(clean(query)) && previous) return priceAnswer(query, k, lang, subject);
  if (priceIntent(query)) return priceAnswer(query, k, lang, subject);
  const problem = problemAnswer(query, k, lang, previous);
  if (problem) return problem;
  // Exact rate-card entries also cover add-ons and packages absent from CMS.
  const rateHits = rank(query, k.rateCard || []).filter((h) => h.exact);
  if (/\b(detail|detailnya|scope|fitur|proses|prosesnya|mencakup|cakupan|deliverables|langkah|next)\b/.test(clean(query))) {
    const directServices = rank(query, k.services || []);
    const hits = directServices.length ? directServices : rank(previous || "", k.services || []);
    if (hits.length) {
      const service = hits[0].entry;
      return `${service.name}${service.tagline ? `: ${service.tagline}` : ""}\n`
        + (service.deliverables?.length ? choose(lang, "Cakupan yang tercantum:\n", "Listed scope:\n") + service.deliverables.map((d) => `- ${typeof d === "string" ? d : d.title || d.name || ""}`).join("\n") : choose(lang, "Detail scope belum tercantum di data yang terbaca. Kita perlu mendefinisikan fitur dan hasil kerja sebelum menyimpulkan yang termasuk.", "The loaded data does not specify the scope. We need to define features and deliverables before stating what is included."))
        + `\n${baseUrl(k)}/services/${service.slug}\n\n` + choose(lang, "Bagian mana yang wajib ada untuk kebutuhanmu?", "Which parts are essential for your needs?");
    }
  }
  if (rateHits.length && !/\b(beda|bedanya|perbedaan|compare|difference|vs)\b/.test(clean(query))) return priceAnswer(query, k, lang, query);
  if (tool) return tool;
  return null;
}
