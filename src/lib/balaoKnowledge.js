// Balao — the site's chat widget — answers purely from this file, with
// zero external API calls. No AI provider, no API key, no ongoing cost:
// keyword/token matching against a `knowledge` object assembled by
// useBalaoKnowledge() (see src/hooks/useBalaoKnowledge.js) from the exact
// same live data every real page on the site renders from — services,
// tools, blog posts, store products, About, Portfolio, and contact
// settings. Nothing here is invented, and nothing here is internal/code —
// only what a visitor could already see by browsing the site.
//
// Language focus: Indonesian first, since that's how most real visitors
// actually type (informal, shorthand-heavy, mixed with a few English
// loanwords) — English phrasing still works, just with a smaller synonym
// set for now.

// Casual Indonesian chat shorthand, expanded to its canonical word before
// any matching happens. Without this, every keyword list below would also
// need to separately spell out "yg"/"gak"/"gmn"/"krn"/"gw"/... and would
// still miss whatever shorthand wasn't anticipated — expanding once up
// front means every keyword list only ever needs the one real spelling.
const SLANG_MAP = {
  yg: "yang", dr: "dari", dri: "dari", dgn: "dengan", utk: "untuk",
  krn: "karena", karna: "karena", tdk: "tidak", gak: "tidak", ga: "tidak",
  nggak: "tidak", enggak: "tidak", kagak: "tidak", ngga: "tidak",
  gmn: "bagaimana", gimana: "bagaimana", gmna: "bagaimana", bgmn: "bagaimana",
  knp: "kenapa", knapa: "kenapa", dmn: "dimana", dimn: "dimana",
  kpn: "kapan", brp: "berapa", brapa: "berapa", sm: "sama", trs: "terus",
  jd: "jadi", skrg: "sekarang", kalo: "kalau", klo: "kalau", tp: "tapi",
  jgn: "jangan", sy: "saya", km: "kamu", kmu: "kamu", lu: "kamu",
  lo: "kamu", loe: "kamu", ente: "kamu", elu: "kamu",
  gw: "aku", gue: "aku", gua: "aku", ane: "aku",
  pgn: "ingin", pengen: "ingin", mau: "ingin", pengin: "ingin",
  cmn: "cuma", cuman: "cuma", emg: "memang", emang: "memang",
  bs: "bisa", bsa: "bisa", udh: "sudah", udah: "sudah",
  blm: "belum", blum: "belum", tau: "tahu", nemu: "menemukan",
  nyari: "mencari", cr: "mencari", org: "orang", byk: "banyak",
  hrga: "harga", byr: "bayar", bgt: "banget", bngt: "banget",
  jgnkan: "jangankan", pengennya: "ingin", kayak: "seperti", kyk: "seperti",
  gitu: "begitu", gt: "begitu", spt: "seperti", tuk: "untuk",
  dgnkan: "dengan", makasih: "terima kasih", mksh: "terima kasih",
};

// Stopwords excluded when matching a free-form question against blog post
// titles/excerpts, and when scoring keyword overlap generally — otherwise
// near-every message would "match" through shared connector/filler words
// alone (this list grows with the SLANG_MAP above, since slang now expands
// into these same canonical connector words).
const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "do", "does", "you", "your", "for", "and", "or", "to", "of", "in", "on",
  "yang", "apa", "ada", "itu", "ini", "di", "ke", "dari", "dan", "atau", "untuk", "saja", "dengan", "kalian",
  "tidak", "karena", "kalau", "bisa", "sudah", "belum", "ingin", "sekarang", "kapan", "sama", "terus",
  "jadi", "tapi", "jangan", "saya", "kamu", "aku", "memang", "cuma", "banyak", "orang", "tahu",
  "mencari", "menemukan", "juga", "masih", "akan", "pada", "dalam", "oleh", "adalah", "nya", "seperti",
  "begitu", "bagaimana", "kenapa", "dimana", "berapa",
]);

// Manually curated keyword synonyms (ID-first, EN as a fallback) per service
// category slug — auto-extracting words from the tagline gave too many
// generic filler words ("and", "for") to be useful for matching real
// visitor phrasing. Multi-word phrases are matched as plain substrings
// (safe — they're specific enough not to collide); single words are
// matched as whole tokens only (see matches()/bestCategoryMatch() below) so
// a short token like "ai" can't false-match inside an unrelated word like
// "bagaimana" or "santai".
const CATEGORY_KEYWORDS = {
  "web-development": ["web", "website", "situs", "landing page", "wordpress", "cms", "bikin website", "bikin web", "situs web", "company profile"],
  "mobile-app-development": ["mobile", "app", "aplikasi", "android", "ios", "bikin aplikasi", "bikin app"],
  "ui-ux-design": ["ui", "ux", "desain", "design", "wireframe", "prototype", "tampilan", "antarmuka"],
  "search-optimization": ["seo", "search", "pencarian", "optimasi", "aeo", "geo", "ranking", "peringkat", "muncul di google", "cari di google"],
  "ai-automation": ["ai", "automation", "otomasi", "otomatis", "chatbot", "workflow", "prompt", "kecerdasan buatan", "asisten ai", "integrasi ai"],
  "branding-marketing-selling": ["brand", "branding", "marketing", "pemasaran", "campaign", "kampanye", "funnel", "penjualan", "sales", "iklan", "promosi", "jualan", "closing"],
  "content-creative": ["content", "konten", "copywriting", "creative", "kreatif", "caption", "naskah"],
  "e-commerce-solutions": ["ecommerce", "e-commerce", "toko online", "marketplace", "checkout", "payment", "jualan online"],
  "analytics-data-intelligence": ["analytics", "data", "dashboard", "tracking", "ga4", "laporan", "statistik"],
  "digital-systems": ["system", "sistem", "crm", "erp", "portal", "lms", "booking", "sistem internal"],
  "strategy-digital-transformation": ["strategy", "strategi", "transformation", "transformasi", "konsultasi", "consulting", "roadmap", "transformasi digital"],
  "support-growth": ["maintenance", "perawatan", "support", "dukungan", "growth", "pertumbuhan", "perawatan website", "update rutin"],
};

const CONTACT_KEYWORDS = ["kontak", "contact", "hubungi", "hubungin", "whatsapp", "wa", "email", "telepon", "reach", "nomor wa", "nomor whatsapp", "narahubung", "cara hubungi"];
const PRICING_KEYWORDS = ["harga", "price", "biaya", "cost", "berapa", "tarif", "budget", "mahal", "murah", "estimasi", "paketan", "biayanya", "bayar"];
const SERVICES_OVERVIEW_KEYWORDS = ["layanan", "services", "jasa", "what do you", "what can you", "offer", "bisa bantu apa", "bantu apa", "nawarin apa", "jasa apa", "kerjain apa", "layanan apa", "ngerjain apa"];
const TOOLS_KEYWORDS = ["tools", "tool", "alat", "utility", "alat gratis", "tools gratis", "tools online"];
const BLOG_KEYWORDS = ["blog", "artikel", "article", "insight", "tulisan", "baca", "postingan", "bacaan"];
const PORTFOLIO_KEYWORDS = ["portofolio", "portfolio", "karya", "case study", "hasil kerja", "contoh project", "contoh kerjaan", "pernah bikin apa"];
const CLIENTS_KEYWORDS = ["klien", "client", "proyek", "project", "pernah kerja", "worked with", "kerja sama siapa", "partner", "bantu siapa"];
const CERT_KEYWORDS = ["sertifikat", "certificate", "certified", "certification", "kredensial", "credential", "sertifikasi", "diakui oleh"];
const ABOUT_KEYWORDS = ["tentang", "about", "siapa kalian", "siapa kamu", "who are you", "profil", "company", "perusahaan", "founder", "pendiri", "ini bisnis apa", "usaha apa", "latar belakang", "cerita kalian"];
const STORE_KEYWORDS = ["store", "toko", "produk", "product", "beli", "buy", "ebook", "template", "playbook", "jual apa", "ada dijual"];
// Exact-word matches only — a substring check would let "bro" false-match
// inside words like "browser" or "brochure" (see isGreeting below).
const GREETING_KEYWORDS = [
  "halo", "hai", "hi", "hello", "hey", "pagi", "siang", "sore", "malam",
  "bro", "gan", "min", "sis", "bang", "cuy", "kak",
];

// A short casual opener ("bro", "halo", "gan"...) with nothing else in the
// message — checked last, before the generic fallback, so a lone "bro"
// reads as a friendly opener instead of "I don't have an answer for that".
function isGreeting(tokens) {
  if (tokens.length === 0 || tokens.length > 4) return false;
  return tokens.some((w) => GREETING_KEYWORDS.includes(w));
}

// The site's current UI language only tells us what language the visitor
// last chose to browse in — not what language they're typing a given
// message in. Since the site is bilingual, a visitor browsing in English
// can still ask a question in Indonesian (or the reverse); replying in the
// wrong language reads as broken. This is a cheap marker-word heuristic,
// not real language detection, but it's enough to catch the common case —
// and since SLANG_MAP already normalizes shorthand into these same
// canonical words, it also catches "gmn"/"yg"/"krn"/etc, not just the
// words visitors happen to spell out in full.
const ID_MARKERS = [
  "apa", "saja", "berapa", "bagaimana", "kalian", "kami", "dengan",
  "yang", "bisa", "harga", "layanan", "kontak", "hubungi", "tolong", "mohon",
  "kenapa", "dimana", "untuk", "dan", "nya", "halo", "hai", "pagi", "siang",
  "sore", "malam", "tidak", "karena", "kalau", "sudah", "belum", "ingin",
  "sekarang", "kapan", "sama", "terus", "jadi", "tapi", "jangan", "saya",
  "kamu", "aku", "memang", "cuma", "banyak", "orang", "tahu", "mencari",
  "bayar", "seperti", "begitu",
];

// Splits raw input into lowercase word tokens (punctuation stripped), then
// expands any recognized Indonesian shorthand to its canonical spelling —
// everything downstream (intent keywords, category keywords, language
// detection, post search) matches against these expanded tokens, not the
// raw text, so slang only ever needs to be taught once, here.
function tokenize(rawText) {
  const words = String(rawText ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
  return words.map((w) => SLANG_MAP[w] || w);
}

// Indonesian tacks enclitic suffixes straight onto the root word
// ("sertifikasi" + "nya" -> "sertifikasinya", "harga" + "kah" -> "hargakah"),
// so an exact-token check against the bare keyword otherwise misses very
// common real phrasing like "sertifikasinya apa aja?". This adds the
// de-suffixed form alongside the original token (never replacing it) so
// either form can match a keyword; the length-3 floor keeps it from mangling
// short words that only coincidentally end the same way (e.g. "punya").
const ENCLITIC_SUFFIXES = ["nya", "kah", "lah", "pun"];

function withStemVariants(tokens) {
  const set = new Set(tokens);
  for (const t of tokens) {
    for (const suf of ENCLITIC_SUFFIXES) {
      if (t.endsWith(suf) && t.length - suf.length >= 3) {
        set.add(t.slice(0, -suf.length));
      }
    }
  }
  return set;
}

// A single keyword either is a whole word (matched as an exact token, so
// "ai" can't false-match inside "bagaimana") or a specific multi-word
// phrase (matched as a plain substring — safe, since a real phrase like
// "toko online" or "case study" essentially never appears by accident).
function hasKeyword(tokenSet, text, keyword) {
  return keyword.includes(" ") ? text.includes(keyword) : tokenSet.has(keyword);
}

function matchesAny(tokenSet, text, keywords) {
  return keywords.some((kw) => hasKeyword(tokenSet, text, kw));
}

function detectLang(tokenSet, fallbackLang) {
  let hits = 0;
  for (const w of ID_MARKERS) {
    if (tokenSet.has(w)) hits += 1;
  }
  return hits > 0 ? "id" : fallbackLang;
}

function bestCategoryMatch(tokenSet, text, categories) {
  let best = null;
  let bestScore = 0;
  for (const cat of categories) {
    const keywords = CATEGORY_KEYWORDS[cat.slug] || [];
    const score = keywords.reduce((s, kw) => (hasKeyword(tokenSet, text, kw) ? s + 1 : s), 0);
    if (score > bestScore) {
      best = cat;
      bestScore = score;
    }
  }
  return best;
}

// Looks for a specific blog post whose title/excerpt/tags share enough
// distinct words with the visitor's message to be worth surfacing by name
// — this is what lets Balao answer "punya artikel soal SEO content
// strategy?" with the actual matching article instead of just the generic
// blog-topics list.
function bestPostMatch(tokens, posts) {
  const words = tokens.filter((w) => w.length > 3 && !STOPWORDS.has(w));
  if (words.length === 0) return null;

  let best = null;
  let bestScore = 0;
  for (const post of posts) {
    const haystack = `${post.title} ${post.excerpt} ${(post.tags || []).join(" ")}`.toLowerCase();
    const score = words.reduce((s, w) => (haystack.includes(w) ? s + 1 : s), 0);
    if (score > bestScore) {
      best = post;
      bestScore = score;
    }
  }
  return bestScore >= 2 ? best : null;
}

function categoryAnswer(cat, lang, site) {
  const preview = cat.children.slice(0, 6).join(", ") + (cat.children.length > 6 ? ", ..." : "");
  return lang === "id"
    ? `Nah, ${cat.name} nih salah satu andalan kita: ${cat.tagline}\n\nContohnya ada: ${preview}.\n\nCek lengkapnya di sini: ${site.url}/services/${cat.slug}`
    : `Oh nice, ${cat.name} is one of our go-tos: ${cat.tagline}\n\nSome examples: ${preview}.\n\nFull list here: ${site.url}/services/${cat.slug}`;
}

function servicesOverviewAnswer(lang, k) {
  const list = k.categories.map((c) => `- ${c.name}`).join("\n");
  return lang === "id"
    ? `Banyak banget yang bisa kita bantu, ada ${k.categories.length} kategori:\n${list}\n\nTinggal sebutin salah satu, nanti aku kasih detailnya, atau langsung cek semua di ${k.site.url}/services`
    : `We do a bunch of stuff, ${k.categories.length} categories in total:\n${list}\n\nJust mention one and I'll give you the details, or check them all out at ${k.site.url}/services`;
}

function toolsAnswer(lang, k) {
  const list = k.tools.map((g) => `- ${g.name}`).join("\n");
  return lang === "id"
    ? `Ada ${k.toolsTotalCount} tools gratisan yang bisa langsung dipakai di browser, gak perlu daftar akun segala:\n${list}\n\nLangsung coba aja di ${k.site.url}/tools`
    : `We've got ${k.toolsTotalCount} free browser-based tools, no account needed, no strings attached:\n${list}\n\nTry them out at ${k.site.url}/tools`;
}

function postAnswer(post, lang, site) {
  return lang === "id"
    ? `Kayaknya artikel ini cocok nih: "${post.title}"\n${post.excerpt}\n\nBaca di sini: ${site.url}/blog/${post.slug}`
    : `There's an article that might be exactly what you're looking for: "${post.title}"\n${post.excerpt}\n\nRead it here: ${site.url}/blog/${post.slug}`;
}

function blogAnswer(lang, k) {
  const list = k.blogCategories.slice(0, 8).map((c) => `- ${c.name}`).join("\n");
  return lang === "id"
    ? `Di blog kita ada macam-macam topik, contohnya:\n${list}\n\nMampir baca-baca di ${k.site.url}/blog`
    : `Our blog covers all sorts of stuff, like:\n${list}\n\nGo check it out at ${k.site.url}/blog`;
}

function portfolioAnswer(lang, k) {
  const summary = k.portfolio.heroSubtitle
    || (lang === "id"
      ? "Kita udah pernah garap macam-macam proyek: web, SEO, konten, monetisasi, sampai growth digital, semuanya sebagai konsultan."
      : "We've handled all kinds of projects: web, SEO, content, monetization, and digital growth, all as a consultant.");
  return `${summary}\n\n${lang === "id" ? "Lihat semua karyanya di" : "Check it all out at"} ${k.site.url}/portfolio`;
}

function clientsAnswer(lang, k) {
  const names = k.portfolio.consulting.slice(0, 6).map((c) => c.org).filter(Boolean);
  if (names.length === 0) return portfolioAnswer(lang, k);
  const list = names.map((n) => `- ${n}`).join("\n");
  return lang === "id"
    ? `Beberapa klien/proyek yang pernah kita bantu:\n${list}\n\nMau lihat semua? Cek di ${k.site.url}/portfolio`
    : `Some of the clients/projects we've worked with:\n${list}\n\nSee the full list at ${k.site.url}/portfolio`;
}

function certificationsAnswer(lang, k) {
  const names = k.portfolio.certifications.map((c) => c.name).filter(Boolean);
  if (names.length === 0) {
    return lang === "id"
      ? `Detail sertifikasi lengkapnya ada di ${k.site.url}/portfolio`
      : `You can find all the certification details at ${k.site.url}/portfolio`;
  }
  const list = names.slice(0, 10).join(", ");
  return lang === "id"
    ? `Kita tersertifikasi oleh: ${list}.\n\nLink verifikasinya ada di ${k.site.url}/portfolio`
    : `We're certified by: ${list}.\n\nVerification links are at ${k.site.url}/portfolio`;
}

function aboutAnswer(lang, k) {
  const body = k.about.storyBody || k.about.heroSubtitle || k.site.description;
  return `${body}\n\n${lang === "id" ? "Baca ceritanya lebih lengkap di" : "Read the full story at"} ${k.site.url}/about`;
}

function storeAnswer(lang, k) {
  if (k.products.length === 0) {
    return lang === "id"
      ? `Di store kita ada template, playbook, sama resource digital siap pakai. Cek semuanya di ${k.site.url}/store`
      : `Our store's got ready-to-use templates, playbooks, and digital resources. Take a look at ${k.site.url}/store`;
  }
  const list = k.products.slice(0, 6).map((p) => `- ${p.name} (Rp ${p.price.toLocaleString("id-ID")})`).join("\n");
  return lang === "id"
    ? `Beberapa item yang ada di store kita:\n${list}\n\nLihat semua di ${k.site.url}/store`
    : `Here are a few things in our store:\n${list}\n\nSee everything at ${k.site.url}/store`;
}

function pricingAnswer(lang, k) {
  return lang === "id"
    ? `Soal harga, tergantung scope proyeknya sih, jadi aku gak mau asal nebak angka di sini. Paling gampang, langsung chat aja biar cepet dapet estimasi.\n\nWhatsApp: ${k.contact.whatsappUrl}\nEmail: ${k.contact.email}\nAtau isi form di ${k.site.url}/contact`
    : `Pricing really depends on the project scope, so I won't just throw out a number here. Fastest way to get a real estimate is to just reach out directly.\n\nWhatsApp: ${k.contact.whatsappUrl}\nEmail: ${k.contact.email}\nOr fill out the form at ${k.site.url}/contact`;
}

function contactAnswer(lang, k) {
  return lang === "id"
    ? `Gampang, bisa hubungin kita lewat:\n- WhatsApp: ${k.contact.whatsappUrl}\n- Email: ${k.contact.email}\n- Atau isi form di: ${k.site.url}/contact`
    : `Easy, you can reach us through:\n- WhatsApp: ${k.contact.whatsappUrl}\n- Email: ${k.contact.email}\n- Or the form at: ${k.site.url}/contact`;
}

function greetingAnswer(lang) {
  return lang === "id"
    ? `Halo juga! Aku bisa bantu jawab soal layanan, tools gratis, blog, portofolio, store, atau cara ngehubungin kita. Mau tanya apa nih?`
    : `Hey there! I can help with stuff about our services, free tools, blog, portfolio, store, or how to reach us. What's on your mind?`;
}

function fallbackAnswer(lang, k) {
  return lang === "id"
    ? `Hmm, itu di luar pengetahuanku sekarang. Aku masih dalam tahap pengembangan, terus dilatih, dan terus ditambahin knowledge baru. Tapi aku bisa bantu soal layanan, tools gratis, blog, portofolio, atau store kita, atau langsung chat tim kita di ${k.site.url}/contact kalau butuh jawaban spesifik.`
    : `Hmm, that's outside what I know right now. I'm still being developed, trained, and given more knowledge over time. But I can help with our services, free tools, blog, portfolio, or store, or just reach out to the team directly at ${k.site.url}/contact for anything specific.`;
}

// Main entry point: given the visitor's raw message, the site's current
// language, and the knowledge object from useBalaoKnowledge(), return
// Balao's reply. Pure function, no network, no state of its own.
export function answerBalao(rawText, siteLang, knowledge) {
  const tokens = tokenize(rawText);
  const text = ` ${tokens.join(" ")} `;
  const tokenSet = withStemVariants(tokens);
  const lang = detectLang(tokenSet, siteLang || "en");
  const k = knowledge;

  if (matchesAny(tokenSet, text, CONTACT_KEYWORDS)) return contactAnswer(lang, k);
  if (matchesAny(tokenSet, text, PRICING_KEYWORDS)) return pricingAnswer(lang, k);
  if (matchesAny(tokenSet, text, CERT_KEYWORDS)) return certificationsAnswer(lang, k);
  if (matchesAny(tokenSet, text, CLIENTS_KEYWORDS)) return clientsAnswer(lang, k);
  if (matchesAny(tokenSet, text, ABOUT_KEYWORDS)) return aboutAnswer(lang, k);
  if (matchesAny(tokenSet, text, STORE_KEYWORDS)) return storeAnswer(lang, k);

  // Blog intent checked before service categories — otherwise a question
  // like "punya artikel soal X" can get pulled into whichever service
  // category happens to share a word with X (e.g. "content").
  if (matchesAny(tokenSet, text, BLOG_KEYWORDS)) {
    const specificPost = bestPostMatch(tokens, k.posts);
    return specificPost ? postAnswer(specificPost, lang, k.site) : blogAnswer(lang, k);
  }

  const category = bestCategoryMatch(tokenSet, text, k.categories);
  if (category) return categoryAnswer(category, lang, k.site);

  if (matchesAny(tokenSet, text, SERVICES_OVERVIEW_KEYWORDS)) return servicesOverviewAnswer(lang, k);
  if (matchesAny(tokenSet, text, TOOLS_KEYWORDS)) return toolsAnswer(lang, k);

  const post = bestPostMatch(tokens, k.posts);
  if (post) return postAnswer(post, lang, k.site);

  if (matchesAny(tokenSet, text, PORTFOLIO_KEYWORDS)) return portfolioAnswer(lang, k);
  if (isGreeting(tokens)) return greetingAnswer(lang);

  return fallbackAnswer(lang, k);
}
