// Balao — the site's chat widget — answers purely from this file, with
// zero external API calls. No AI provider, no API key, no ongoing cost:
// keyword/token matching against a `knowledge` object built from the
// site's own live data (services, blog posts, store products, About,
// Portfolio, contact settings) — see useBalaoKnowledge.js. Nothing here is
// invented, and nothing here is internal/code — only what a visitor could
// already see by browsing the site.
//
// Languages: Indonesian and English are the deep/native pair (informal
// shorthand, enclitic suffixes, casual tone tuned by hand). Spanish,
// Russian, Chinese, Korean, Japanese, and Arabic are also supported —
// Balao detects the visitor's script/language and replies with its own
// scaffolding phrases (greetings, "here's what we offer", "read more at",
// etc.) in that language. What it can't do: translate the site's own real
// content on the fly. Service/category names, blog titles+excerpts, the
// About story, and portfolio entries only exist in whichever language they
// were actually authored in (mostly English, some Indonesian) — a Chinese
// or Arabic visitor will get Balao's own sentences in their language, with
// any quoted real content (a service name, a blog excerpt) still shown as
// authored. Doing more than that would mean live machine translation via a
// paid API, which was explicitly ruled out for this project.
//
// Document upload: a visitor can attach a file (see SiteChatWidget.jsx),
// which gets its text extracted entirely in the browser. Balao can then
// find and quote matching parts of it (see bestDocumentChunks/
// documentAnswer below) — this is literal keyword search, not
// comprehension. It can't summarize the document or reason about what it
// means; that would again require a real AI model.

import { SEO_EXPERTISE } from "../data/seoExpertise";

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
  jelasin: "jelaskan", jlasin: "jelaskan", ngapain: "apa", ngerjain: "mengerjakan",
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

// Manually curated keyword synonyms per service category slug — auto-
// extracting words from the tagline gave too many generic filler words
// ("and", "for") to be useful for matching real visitor phrasing. Mixes
// Indonesian, English, and short entries in the other 6 supported
// languages. Multi-word phrases (and any phrase containing Chinese/Japanese
// characters) are matched as plain substrings; single Latin/Cyrillic/Hangul
// words are matched as whole tokens only (see hasKeyword() below) so a
// short token like "ai" can't false-match inside an unrelated word like
// "bagaimana".
const CATEGORY_KEYWORDS = {
  "web-development": [
    "web", "website", "situs", "landing page", "wordpress", "cms", "bikin website", "bikin web", "situs web", "company profile",
    "sitio web", "página web", "desarrollo web", "сайт", "веб-сайт", "разработка сайта",
    "网站", "网页开发", "建站", "웹사이트", "웹 개발", "홈페이지", "ウェブサイト", "ホームページ", "ウェブ開発",
    "موقع", "تطوير موقع", "موقع إلكتروني",
  ],
  "mobile-app-development": [
    "mobile", "app", "aplikasi", "android", "ios", "bikin aplikasi", "bikin app",
    "aplicación móvil", "app móvil", "мобильное приложение", "приложение",
    "手机应用", "app开发", "移动应用", "모바일 앱", "앱 개발", "モバイルアプリ", "アプリ開発",
    "تطبيق جوال", "تطبيق موبايل",
  ],
  "ui-ux-design": [
    "ui", "ux", "desain", "design", "wireframe", "prototype", "tampilan", "antarmuka",
    "diseño", "interfaz", "experiencia de usuario", "дизайн", "интерфейс",
    "界面设计", "用户体验", "디자인", "사용자 경험", "デザイン", "ユーザー体験",
    "تصميم", "واجهة المستخدم",
  ],
  "search-optimization": [
    "seo", "search", "pencarian", "optimasi", "aeo", "geo", "ranking", "peringkat", "muncul di google", "cari di google",
    "posicionamiento", "buscador", "сео", "поисковая оптимизация", "продвижение сайта",
    "搜索引擎优化", "关键词排名", "검색엔진최적화", "검색 노출", "検索エンジン最適化", "検索順位",
    "تحسين محركات البحث", "سيو",
  ],
  "ai-automation": [
    "ai", "automation", "otomasi", "otomatis", "chatbot", "workflow", "prompt", "kecerdasan buatan", "asisten ai", "integrasi ai",
    "inteligencia artificial", "automatización", "искусственный интеллект", "автоматизация",
    "人工智能", "自动化", "聊天机器人", "인공지능", "자동화", "챗봇", "人工知能", "自動化", "チャットボット",
    "ذكاء اصطناعي", "أتمتة",
  ],
  "branding-marketing-selling": [
    "brand", "branding", "marketing", "pemasaran", "campaign", "kampanye", "funnel", "penjualan", "sales", "iklan", "promosi", "jualan", "closing",
    "marca", "ventas", "бренд", "маркетинг", "продажи",
    "品牌", "营销", "销售", "브랜드", "마케팅", "영업", "ブランド", "マーケティング", "販売",
    "علامة تجارية", "تسويق", "مبيعات",
  ],
  "content-creative": [
    "content", "konten", "copywriting", "creative", "kreatif", "caption", "naskah",
    "contenido", "redacción", "контент", "копирайтинг",
    "内容", "文案", "创意", "콘텐츠", "카피라이팅", "コンテンツ", "コピーライティング",
    "محتوى", "كتابة",
  ],
  "e-commerce-solutions": [
    "ecommerce", "e-commerce", "toko online", "marketplace", "checkout", "payment", "jualan online",
    "tienda online", "comercio electrónico", "интернет-магазин", "электронная коммерция",
    "电商", "网店", "온라인 쇼핑몰", "이커머스", "ネットショップ", "eコマース",
    "متجر إلكتروني", "تجارة إلكترونية",
  ],
  "analytics-data-intelligence": [
    "analytics", "data", "dashboard", "tracking", "ga4", "laporan", "statistik",
    "análisis de datos", "estadísticas", "аналитика",
    "数据分析", "报表", "데이터 분석", "대시보드", "データ分析", "ダッシュボード",
    "تحليل البيانات", "تقارير",
  ],
  "digital-systems": [
    "system", "sistem", "crm", "erp", "portal", "lms", "booking", "sistem internal",
    "sistema", "plataforma interna", "система", "црм",
    "系统", "内部系统", "시스템", "내부 시스템", "システム", "業務システム",
    "نظام", "نظام داخلي",
  ],
  "strategy-digital-transformation": [
    "strategy", "strategi", "transformation", "transformasi", "konsultasi", "consulting", "roadmap", "transformasi digital",
    "estrategia", "transformación digital", "consultoría", "стратегия", "цифровая трансформация",
    "战略", "数字化转型", "咨询", "전략", "디지털 전환", "컨설팅", "戦略", "デジタル変革", "コンサルティング",
    "استراتيجية", "تحول رقمي",
  ],
  "support-growth": [
    "maintenance", "perawatan", "support", "dukungan", "growth", "pertumbuhan", "perawatan website", "update rutin",
    "mantenimiento", "soporte", "crecimiento", "поддержка", "обслуживание",
    "维护", "支持", "增长", "유지보수", "지원", "保守", "サポート",
    "صيانة", "دعم",
  ],
};

const CONTACT_KEYWORDS = [
  "kontak", "contact", "hubungi", "hubungin", "whatsapp", "wa", "email", "telepon", "reach", "nomor wa", "nomor whatsapp", "narahubung", "cara hubungi",
  "contacto", "contactar", "контакт", "связаться", "联系", "联系方式", "연락처", "문의", "連絡先", "お問い合わせ", "تواصل", "اتصال",
];
const PRICING_KEYWORDS = [
  "harga", "price", "biaya", "cost", "berapa", "tarif", "budget", "mahal", "murah", "estimasi", "paketan", "biayanya", "bayar",
  "precio", "costo", "cuánto cuesta", "цена", "стоимость", "сколько стоит", "价格", "多少钱", "费用", "가격", "비용", "얼마", "料金", "値段", "いくら", "سعر", "تكلفة", "بكم",
];
const SERVICES_OVERVIEW_KEYWORDS = [
  "layanan", "services", "jasa", "what do you", "what can you", "offer", "bisa bantu apa", "bantu apa", "nawarin apa", "jasa apa", "kerjain apa", "layanan apa", "ngerjain apa",
  "servicios", "qué ofrecen", "услуги", "что вы делаете", "服务", "你们提供什么", "서비스", "뭐 하시나요", "サービス", "何ができますか", "خدمات",
];
const TOOLS_KEYWORDS = [
  "tools", "tool", "alat", "utility", "alat gratis", "tools gratis", "tools online",
  "herramientas", "herramienta gratis", "инструменты", "бесплатные инструменты", "工具", "免费工具", "도구", "무료 도구", "ツール", "無料ツール", "أدوات", "أدوات مجانية",
];
const BLOG_KEYWORDS = [
  "blog", "artikel", "article", "insight", "tulisan", "baca", "postingan", "bacaan",
  "artículo", "блог", "статья", "博客", "文章", "블로그", "글", "ブログ", "記事", "مدونة", "مقال",
];
const PORTFOLIO_KEYWORDS = [
  "portofolio", "portfolio", "karya", "case study", "hasil kerja", "contoh project", "contoh kerjaan", "pernah bikin apa",
  "portafolio", "proyectos", "портфолио", "проекты", "作品集", "案例", "포트폴리오", "작업물", "ポートフォリオ", "実績", "أعمال سابقة", "معرض الأعمال",
];
const CLIENTS_KEYWORDS = [
  "klien", "client", "proyek", "project", "pernah kerja", "worked with", "kerja sama siapa", "partner", "bantu siapa",
  "clientes", "con quién trabajaron", "клиенты", "с кем работали", "客户", "合作过谁", "고객", "누구랑 일했어요", "クライアント", "مين تعاملتوا معاه",
];
const CERT_KEYWORDS = [
  "sertifikat", "certificate", "certified", "certification", "kredensial", "credential", "sertifikasi", "diakui oleh",
  "certificado", "certificación", "сертификат", "认证", "证书", "인증", "자격증", "認定", "資格", "شهادة", "اعتماد",
];
const ABOUT_KEYWORDS = [
  "tentang", "about", "siapa kalian", "siapa kamu", "who are you", "profil", "company", "perusahaan", "founder", "pendiri", "ini bisnis apa", "usaha apa", "latar belakang", "cerita kalian",
  "quiénes son", "sobre nosotros", "о вас", "кто вы", "关于我们", "你们是谁", "소개", "누구세요", "会社概要", "من انتم", "نبذة عنكم",
];
const STORE_KEYWORDS = [
  "store", "toko", "produk", "product", "beli", "buy", "ebook", "template", "playbook", "jual apa", "ada dijual",
  "tienda", "comprar", "магазин", "товар", "купить", "商店", "产品", "购买", "스토어", "제품", "구매", "ストア", "商品", "購入", "متجر", "منتج", "شراء",
];
// Exact-word matches only — a substring check would let "bro" false-match
// inside words like "browser" or "brochure" (see isGreeting below).
const GREETING_KEYWORDS = [
  "halo", "hai", "hi", "hello", "hey", "pagi", "siang", "sore", "malam",
  "bro", "gan", "min", "sis", "bang", "cuy", "kak",
  "hola", "привет", "你好", "안녕", "안녕하세요", "こんにちは", "やあ", "مرحبا", "هلا", "السلام",
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
// message in, and the site itself only ever toggles between Indonesian and
// English. A visitor can still type in any of the 6 other supported
// languages regardless. Marker words below are used only for the languages
// that share the Latin alphabet (Indonesian, English, Spanish) — Russian,
// Arabic, Chinese, Korean, and Japanese are detected by script instead (see
// detectLang), which is far more reliable than word lists for those.
const ID_MARKERS = [
  "apa", "saja", "berapa", "bagaimana", "kalian", "kami", "dengan",
  "yang", "bisa", "harga", "layanan", "kontak", "hubungi", "tolong", "mohon",
  "kenapa", "dimana", "untuk", "dan", "nya", "halo", "hai", "pagi", "siang",
  "sore", "malam", "tidak", "karena", "kalau", "sudah", "belum", "ingin",
  "sekarang", "kapan", "sama", "terus", "jadi", "tapi", "jangan", "saya",
  "kamu", "aku", "memang", "cuma", "banyak", "orang", "tahu", "mencari",
  "bayar", "seperti", "begitu", "itu", "ini", "dong", "soal", "jelaskan",
  "nih", "sih", "dari",
];

const ES_MARKERS = [
  "qué", "como", "cómo", "dónde", "donde", "cuánto", "cuanto", "gracias", "ustedes",
  "nosotros", "quiero", "necesito", "cuál", "cual", "hola", "también", "tambien",
  "nuestro", "nuestra", "ofrecen", "tienen", "ayuda", "empresa", "página", "pagina",
  "servicios", "precio", "contacto", "hacen", "puedo",
];

// Cyrillic/Arabic/Hangul/Kana/Han scripts each map to exactly one supported
// language here, so a simple character-range test is both simpler and far
// more reliable than any word-list heuristic — no visitor typing Russian,
// Arabic, Korean, or Japanese needs to spell a "marker word" correctly for
// Balao to recognize the language. Kana is checked before Han because
// Japanese text mixes kanji (Han) with hiragana/katakana, while Chinese
// text uses Han only.
const CYRILLIC_RE = /[Ѐ-ӿ]/;
const ARABIC_RE = /[؀-ۿ]/;
const HANGUL_RE = /[가-힯]/;
const KANA_RE = /[぀-ヿ]/;
const HAN_RE = /[一-鿿]/;

// A keyword written in Chinese or Japanese script can't be reliably token-
// matched: neither language spaces words within a sentence the way Latin
// scripts do, so tokenize() below has no choice but to treat one whole run
// of Han/Kana characters as a single "token". Arabic does space its words,
// but its grammar attaches conjugation markers to BOTH ends of a word
// ("تواصل" -> "أتواصل", a prefixed "I contact") — the suffix-only prefix
// fallback in hasKeyword() below can't catch a prefix. Rather than build
// separate handling for each, any keyword containing a Han, Kana, or Arabic
// character is matched as a plain substring instead — the one workable
// shortcut without real morphological analysis for either script.
const NO_SEGMENTATION_RE = /[一-鿿぀-ヿ؀-ۿ]/;

// Splits raw input into lowercase word tokens. For Latin/Cyrillic/Arabic/
// Hangul scripts this is a real word split (they use whitespace/punctuation
// between words); for Chinese/Japanese it necessarily produces one token
// per unbroken run of Han/Kana characters, since there's no word-boundary
// signal to split on without a real segmenter — see NO_SEGMENTATION_RE
// above for how matching still works despite that. Indonesian shorthand is
// expanded to its canonical spelling after splitting (harmless no-op for
// every other language, since none of those words collide with SLANG_MAP's
// keys).
function tokenize(rawText) {
  const words = String(rawText ?? "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
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

const ASCII_WORD_RE = /^[a-z0-9]+$/;

// A single keyword is matched as a substring if it's a multi-word phrase or
// written in Chinese/Japanese/Arabic script (see NO_SEGMENTATION_RE above);
// otherwise it's matched as an exact token first, so a short word like "ai"
// can't false-match inside an unrelated word like "bagaimana". Failing
// that, it falls back to a suffix-tolerant prefix check: several supported
// languages glue grammatical endings straight onto a word with no
// separator — a Korean subject/object particle ("가격" -> "가격이"), a
// Spanish verb ending ("contactar" -> "contactarlos") — so requiring an
// exact token would miss very common real phrasing. ASCII keywords need to
// be longer before this kicks in (a short English root like "app" would
// otherwise false-match all sorts of unrelated words); non-ASCII scripts
// pack more meaning per character, so even a 2-character root is safe to
// prefix-match.
function hasKeyword(tokenSet, text, keyword) {
  if (keyword.includes(" ") || NO_SEGMENTATION_RE.test(keyword)) return text.includes(keyword);
  if (tokenSet.has(keyword)) return true;

  const minLen = ASCII_WORD_RE.test(keyword) ? 5 : 2;
  if (keyword.length < minLen) return false;
  for (const t of tokenSet) {
    if (t.startsWith(keyword) && t.length - keyword.length <= 4) return true;
  }
  return false;
}

function matchesAny(tokenSet, text, keywords) {
  return keywords.some((kw) => hasKeyword(tokenSet, text, kw));
}

// Script-based detection is checked first since it's unambiguous (a visitor
// typing in Cyrillic is not typing Russian by accident). Only once none of
// those scripts are present does it fall back to word-marker scoring
// between the three Latin-script languages Balao supports (Indonesian,
// Spanish, English) — `text` still carries the original characters (just
// lowercased and re-joined), so the script tests run against real text, not
// the token array.
function detectLang(tokenSet, text, fallbackLang) {
  if (CYRILLIC_RE.test(text)) return "ru";
  if (ARABIC_RE.test(text)) return "ar";
  if (HANGUL_RE.test(text)) return "ko";
  if (KANA_RE.test(text)) return "ja";
  if (HAN_RE.test(text)) return "zh";

  let idHits = 0;
  let esHits = 0;
  for (const w of ID_MARKERS) if (tokenSet.has(w)) idHits += 1;
  for (const w of ES_MARKERS) if (tokenSet.has(w)) esHits += 1;
  if (idHits === 0 && esHits === 0) return fallbackLang;
  return esHits > idHits ? "es" : "id";
}

// Words too generic to prove a message is really about one specific
// service — they recur across dozens of unrelated services in the same or
// different categories ("SEO Content Strategy", "Digital Marketing
// Strategy", "Content Strategy" all contain "strategy"). A match still
// needs at least one word outside this set, so a bare "seo" or "strategy"
// falls through to the category-level answer instead of pinning an
// arbitrary specific service. Service names are only ever authored in
// English, so this (and bestServiceMatch below) only recognizes English
// phrasing regardless of the visitor's language — a non-English question
// still gets a correct answer at the category level via CATEGORY_KEYWORDS.
const SERVICE_GENERIC_WORDS = new Set([
  "development", "website", "web", "design", "strategy", "seo", "system", "systems",
  "marketing", "content", "app", "application", "platform", "management", "integration",
  "consulting", "analytics", "dashboard", "digital", "solution", "solutions", "business",
  "customer", "commerce", "support", "growth", "automation", "campaign", "portal",
  "optimization", "service", "services", "setup", "planning", "program",
]);

function serviceTokens(name) {
  return tokenize(name).filter((w) => w.length > 1);
}

// Finds a specific service (e.g. "On-Page SEO", "Technical SEO") within any
// category whose name shares enough words with the visitor's message to be
// worth answering directly, rather than only the parent category's general
// overview. Requires every word to be an exact token match (so "on-page"
// splits the same way on both sides) and at least one of the matched words
// to be non-generic (see SERVICE_GENERIC_WORDS), so "apa itu seo" doesn't
// arbitrarily pin one SEO service out of a dozen.
// A hyphenated service name ("On-Page SEO", "Off-Page SEO", "Cross-Platform
// App Development") is just as often typed as one glued word with no
// hyphen at all ("onpage", "offpage") — which tokenize() has no way to
// split back into "on"+"page" on its own. This scans every service name for
// hyphenated compounds and maps each one's glued form back to its two real
// words, built fresh from the live service list rather than hardcoded, so
// it stays correct if the catalog changes.
const HYPHEN_COMPOUND_RE = /\b([a-z]+)-([a-z]+)\b/gi;

function hyphenCompoundAliases(services) {
  const aliases = new Map();
  for (const svc of services) {
    HYPHEN_COMPOUND_RE.lastIndex = 0;
    let match;
    while ((match = HYPHEN_COMPOUND_RE.exec(svc.name))) {
      const w1 = match[1].toLowerCase();
      const w2 = match[2].toLowerCase();
      aliases.set(w1 + w2, [w1, w2]);
    }
  }
  return aliases;
}

// Adds each glued compound's two real words to the working set whenever
// its glued form is present, so "onpage" counts as containing both "on"
// and "page" for scoring purposes below.
function expandCompoundTokens(tokenSet, aliases) {
  if (aliases.size === 0) return tokenSet;
  const expanded = new Set(tokenSet);
  for (const t of tokenSet) {
    const pair = aliases.get(t);
    if (pair) pair.forEach((w) => expanded.add(w));
  }
  return expanded;
}

// Returns every service that clears the match bar (see bestServiceMatch),
// ranked best-first, capped to `limit`. Split out from bestServiceMatch so
// a comparison question ("what's the difference between X and Y?") can see
// BOTH services it's actually asking about, not just whichever one scores
// highest — picking only the top match was exactly the bug where "apa
// beda technical dengan onpage seo?" silently dropped Technical SEO and
// answered only about On-Page SEO.
function topServiceMatches(tokenSet, services, limit) {
  const expandedTokens = expandCompoundTokens(tokenSet, hyphenCompoundAliases(services));
  const scored = [];
  for (const svc of services) {
    const svcWords = serviceTokens(svc.name);
    if (svcWords.length === 0) continue;
    let score = 0;
    let distinctiveHit = false;
    for (const w of svcWords) {
      if (expandedTokens.has(w)) {
        score += 1;
        if (!SERVICE_GENERIC_WORDS.has(w)) distinctiveHit = true;
      }
    }
    const needed = Math.min(2, svcWords.length);
    if (distinctiveHit && score >= needed) scored.push({ svc, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.svc);
}

function bestServiceMatch(tokenSet, services) {
  return topServiceMatches(tokenSet, services, 1)[0] || null;
}

// Words that signal the visitor wants two things contrasted, not just
// explained separately — checked before the single-best-match path so a
// comparison question gets a real comparison instead of silently answering
// about only whichever service happened to score highest.
const COMPARISON_MARKERS = [
  "beda", "bedanya", "perbedaan", "dibanding", "dibandingkan", "bandingkan",
  "versus", "vs", "difference", "compare", "comparison",
];

function isComparisonQuestion(tokenSet) {
  return COMPARISON_MARKERS.some((w) => tokenSet.has(w));
}

// Answers a genuine "what's the difference between X and Y" question with
// both services' real content, not just one of them. Opens with each
// service's one-line essence side by side (a real point of contrast, not
// just two paragraphs concatenated), then gives the full explanation for
// each. Only Indonesian/English have hand-written SEO content to draw a
// real contrast from (see seoExpertise.js); everything else (a non-SEO
// pair, or a non-id/en language) falls back to a simpler but still
// genuinely two-sided answer.
function comparisonAnswer(svcA, svcB, lang, site) {
  const urlA = `${site.url}/services/${svcA.slug}`;
  const urlB = `${site.url}/services/${svcB.slug}`;
  const expA = SEO_EXPERTISE[svcA.slug];
  const expB = SEO_EXPERTISE[svcB.slug];

  if (expA && expB && (lang === "id" || lang === "en")) {
    return pick(lang, {
      id: `Bedanya gini: ${svcA.name} itu soal ${expA.id.oneLiner}, sedangkan ${svcB.name} itu soal ${expB.id.oneLiner}.\n\n${svcA.name}:\n${expA.id.full}\n\n${svcB.name}:\n${expB.id.full}\n\nDetail masing-masing: ${urlA} dan ${urlB}`,
      en: `Here's the difference: ${svcA.name} is about ${expA.en.oneLiner}, while ${svcB.name} is about ${expB.en.oneLiner}.\n\n${svcA.name}:\n${expA.en.full}\n\n${svcB.name}:\n${expB.en.full}\n\nMore on each: ${urlA} and ${urlB}`,
    });
  }

  return pick(lang, {
    id: `${svcA.name} sama ${svcB.name} itu dua layanan yang beda. ${svcA.name} ada di kategori ${svcA.parentName}, sementara ${svcB.name} ada di kategori ${svcB.parentName}.\n\nCek detail masing-masing di ${urlA} dan ${urlB}`,
    en: `${svcA.name} and ${svcB.name} are two different services. ${svcA.name} is under ${svcA.parentName}, while ${svcB.name} is under ${svcB.parentName}.\n\nSee the details for each at ${urlA} and ${urlB}`,
  });
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
// blog-topics list. Posts are only ever authored in Indonesian or English,
// so this (like bestServiceMatch) only recognizes those two languages.
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

// Every response template below is picked from a per-language table rather
// than a chain of ternaries — with 8 supported languages that reads far
// more clearly, and falls back to English for anything not yet covered.
function pick(lang, table) {
  return table[lang] ?? table.en;
}

// The seeded per-service `description` is a ~800-word essay reused almost
// verbatim across every service in the catalog (only the service name gets
// swapped in) — pasting its opening paragraph read as generic templated
// boilerplate, especially jarring mixed into a short casual reply. This
// sticks to only the genuinely service-specific facts (name, category, real
// deliverables) and links out for anyone who wants the full page.
// Search-related services get real, hand-written expert content (see
// src/data/seoExpertise.js) instead of the generic templated answer below
// — SEO is explicitly one of this site's core areas, so a question about
// it deserves an actual, substantive answer, not the same boilerplate
// shape every other one of ~150 services gets. Only in Indonesian/English,
// consistent with every other piece of real (non-scaffolding) content in
// this project — the other 6 supported languages fall through to the
// generic answer below.
function serviceAnswer(svc, lang, site) {
  const url = `${site.url}/services/${svc.slug}`;
  const expertise = SEO_EXPERTISE[svc.slug];
  if (expertise && (lang === "id" || lang === "en")) {
    return pick(lang, {
      id: `${expertise.id.full}\n\nDetail layanannya ada di ${url}`,
      en: `${expertise.en.full}\n\nMore on this service at ${url}`,
    });
  }

  const deliverables = svc.deliverables.slice(0, 3).join(", ");
  return pick(lang, {
    id: `${svc.name} itu salah satu layanan spesifik kita di kategori ${svc.parentName}.${deliverables ? ` Biasanya nyakup: ${deliverables}.` : ""}\n\nMau lebih detail? Cek di ${url}`,
    en: `${svc.name} is one of our specific services under ${svc.parentName}.${deliverables ? ` It usually covers: ${deliverables}.` : ""}\n\nWant more detail? Check it out at ${url}`,
    es: `${svc.name} es uno de nuestros servicios específicos dentro de ${svc.parentName}.${deliverables ? ` Suele incluir: ${deliverables}.` : ""}\n\n¿Quieres más detalles? Míralo en ${url}`,
    ru: `${svc.name}, одна из наших конкретных услуг в категории ${svc.parentName}.${deliverables ? ` Обычно это включает: ${deliverables}.` : ""}\n\nХочешь подробнее? Смотри здесь: ${url}`,
    zh: `${svc.name} 是我们在 ${svc.parentName} 分类下的一项具体服务。${deliverables ? `通常包括：${deliverables}。` : ""}\n\n想看更多细节？点这里：${url}`,
    ko: `${svc.name}은(는) ${svc.parentName} 카테고리에 속한 저희의 구체적인 서비스 중 하나예요.${deliverables ? ` 보통 이런 걸 포함해요: ${deliverables}.` : ""}\n\n더 자세히 보고 싶으면 여기 확인해보세요: ${url}`,
    ja: `${svc.name}は${svc.parentName}カテゴリーに含まれる、私たちの具体的なサービスの一つです。${deliverables ? `内容にはこんなものが含まれます: ${deliverables}。` : ""}\n\n詳しく知りたい方はこちら: ${url}`,
    ar: `${svc.name} هي إحدى خدماتنا المحددة ضمن قسم ${svc.parentName}.${deliverables ? ` عادة بتشمل: ${deliverables}.` : ""}\n\nتبي تفاصيل أكثر؟ شوف هنا: ${url}`,
  });
}

function categoryAnswer(cat, lang, site) {
  const preview = cat.children.slice(0, 6).join(", ") + (cat.children.length > 6 ? ", ..." : "");
  const url = `${site.url}/services/${cat.slug}`;
  return pick(lang, {
    id: `Nah, ${cat.name} nih salah satu andalan kita: ${cat.tagline}\n\nContohnya ada: ${preview}.\n\nCek lengkapnya di sini: ${url}`,
    en: `Oh nice, ${cat.name} is one of our go-tos: ${cat.tagline}\n\nSome examples: ${preview}.\n\nFull list here: ${url}`,
    es: `${cat.name} es una de nuestras especialidades: ${cat.tagline}\n\nAlgunos ejemplos: ${preview}.\n\nLista completa aquí: ${url}`,
    ru: `${cat.name}, одно из наших основных направлений: ${cat.tagline}\n\nНапример: ${preview}.\n\nПолный список здесь: ${url}`,
    zh: `${cat.name} 是我们的强项之一：${cat.tagline}\n\n例如：${preview}。\n\n完整列表在这里：${url}`,
    ko: `${cat.name}은(는) 저희의 주력 분야 중 하나예요: ${cat.tagline}\n\n예시로는: ${preview}.\n\n전체 목록은 여기서: ${url}`,
    ja: `${cat.name}は私たちの得意分野の一つです: ${cat.tagline}\n\n例えば: ${preview}。\n\n全リストはこちら: ${url}`,
    ar: `${cat.name} من أقوى مجالاتنا: ${cat.tagline}\n\nأمثلة: ${preview}.\n\nالقائمة الكاملة هنا: ${url}`,
  });
}

function servicesOverviewAnswer(lang, k) {
  const list = k.categories.map((c) => `- ${c.name}`).join("\n");
  const n = k.categories.length;
  const url = `${k.site.url}/services`;
  return pick(lang, {
    id: `Banyak banget yang bisa kita bantu, ada ${n} kategori:\n${list}\n\nTinggal sebutin salah satu, nanti aku kasih detailnya, atau langsung cek semua di ${url}`,
    en: `We do a bunch of stuff, ${n} categories in total:\n${list}\n\nJust mention one and I'll give you the details, or check them all out at ${url}`,
    es: `Hacemos de todo un poco, ${n} categorías en total:\n${list}\n\nMenciona una y te doy los detalles, o míralas todas en ${url}`,
    ru: `Мы делаем много всего, всего ${n} категорий:\n${list}\n\nПросто назови одну, расскажу подробнее, или посмотри всё здесь: ${url}`,
    zh: `我们能做的挺多的，一共有 ${n} 个分类：\n${list}\n\n说一个类别我就给你详细介绍，或者直接看全部：${url}`,
    ko: `저희가 할 수 있는 게 꽤 많아요, 총 ${n}개 카테고리예요:\n${list}\n\n하나만 말해주면 자세히 알려드릴게요, 아니면 전체 보기: ${url}`,
    ja: `いろいろやってます、全部で${n}カテゴリー:\n${list}\n\n一つ言ってもらえれば詳しく説明します。全部見るならこちら: ${url}`,
    ar: `عندنا كتير نقدر نساعدك فيه، ${n} تصنيفات بالمجمل:\n${list}\n\nاذكر واحد وبعطيك التفاصيل، أو شوف الكل هنا: ${url}`,
  });
}

function toolsAnswer(lang, k) {
  const list = k.tools.map((g) => `- ${g.name}`).join("\n");
  const n = k.toolsTotalCount;
  const url = `${k.site.url}/tools`;
  return pick(lang, {
    id: `Ada ${n} tools gratisan yang bisa langsung dipakai di browser, gak perlu daftar akun segala:\n${list}\n\nLangsung coba aja di ${url}`,
    en: `We've got ${n} free browser-based tools, no account needed, no strings attached:\n${list}\n\nTry them out at ${url}`,
    es: `Tenemos ${n} herramientas gratuitas que funcionan directo en el navegador, sin necesidad de cuenta:\n${list}\n\nPruébalas en ${url}`,
    ru: `У нас есть ${n} бесплатных инструментов прямо в браузере, без регистрации:\n${list}\n\nПопробуй здесь: ${url}`,
    zh: `我们有 ${n} 个免费的浏览器工具，不用注册账号：\n${list}\n\n直接来试试：${url}`,
    ko: `계정 없이 브라우저에서 바로 쓸 수 있는 무료 도구가 ${n}개 있어요:\n${list}\n\n여기서 바로 써보세요: ${url}`,
    ja: `アカウント不要でブラウザですぐ使える無料ツールが${n}個あります:\n${list}\n\nこちらから試せます: ${url}`,
    ar: `عندنا ${n} أداة مجانية تشتغل مباشرة بالمتصفح، بدون تسجيل حساب:\n${list}\n\nجربها هنا: ${url}`,
  });
}

function postAnswer(post, lang, site) {
  const url = `${site.url}/blog/${post.slug}`;
  return pick(lang, {
    id: `Kayaknya artikel ini cocok nih: "${post.title}"\n${post.excerpt}\n\nBaca di sini: ${url}`,
    en: `There's an article that might be exactly what you're looking for: "${post.title}"\n${post.excerpt}\n\nRead it here: ${url}`,
    es: `Creo que este artículo te puede servir: "${post.title}"\n${post.excerpt}\n\nLéelo aquí: ${url}`,
    ru: `Кажется, эта статья тебе подойдёт: «${post.title}»\n${post.excerpt}\n\nЧитай здесь: ${url}`,
    zh: `这篇文章可能正是你要找的：《${post.title}》\n${post.excerpt}\n\n点这里阅读：${url}`,
    ko: `이 글이 딱 맞을 것 같아요: "${post.title}"\n${post.excerpt}\n\n여기서 읽어보세요: ${url}`,
    ja: `この記事がぴったりかもしれません: 「${post.title}」\n${post.excerpt}\n\nこちらから読めます: ${url}`,
    ar: `أعتقد إن هذا المقال بيناسبك: "${post.title}"\n${post.excerpt}\n\nاقرأه هنا: ${url}`,
  });
}

function blogAnswer(lang, k) {
  const list = k.blogCategories.slice(0, 8).map((c) => `- ${c.name}`).join("\n");
  const url = `${k.site.url}/blog`;
  return pick(lang, {
    id: `Di blog kita ada macam-macam topik, contohnya:\n${list}\n\nMampir baca-baca di ${url}`,
    en: `Our blog covers all sorts of stuff, like:\n${list}\n\nGo check it out at ${url}`,
    es: `Nuestro blog cubre de todo, por ejemplo:\n${list}\n\nÉchale un vistazo en ${url}`,
    ru: `В нашем блоге много разных тем, например:\n${list}\n\nЗагляни сюда: ${url}`,
    zh: `我们博客的话题挺多的，比如：\n${list}\n\n来看看吧：${url}`,
    ko: `저희 블로그엔 다양한 주제가 있어요, 예를 들면:\n${list}\n\n여기서 확인해보세요: ${url}`,
    ja: `ブログではいろんなトピックを扱ってます、例えば:\n${list}\n\nこちらからどうぞ: ${url}`,
    ar: `مدونتنا فيها مواضيع متنوعة، زي:\n${list}\n\nتصفحها هنا: ${url}`,
  });
}

function portfolioAnswer(lang, k) {
  const url = `${k.site.url}/portfolio`;
  const fallback = pick(lang, {
    id: "Kita udah pernah garap macam-macam proyek: web, SEO, konten, monetisasi, sampai growth digital, semuanya sebagai konsultan.",
    en: "We've handled all kinds of projects: web, SEO, content, monetization, and digital growth, all as a consultant.",
    es: "Hemos trabajado en todo tipo de proyectos: web, SEO, contenido, monetización y crecimiento digital, siempre como consultores.",
    ru: "Мы занимались самыми разными проектами: сайты, SEO, контент, монетизация и цифровой рост, всё в роли консультанта.",
    zh: "我们做过各种各样的项目：网站、SEO、内容、变现、数字化增长，都是以顾问的身份参与的。",
    ko: "저희는 웹, SEO, 콘텐츠, 수익화, 디지털 성장까지 다양한 프로젝트를 컨설턴트로서 진행해왔어요.",
    ja: "ウェブ、SEO、コンテンツ、収益化、デジタル成長まで、コンサルタントとして幅広いプロジェクトを手がけてきました。",
    ar: "اشتغلنا على مشاريع متنوعة: مواقع، سيو، محتوى، تحقيق دخل، ونمو رقمي، كل هذا كمستشارين.",
  });
  const summary = k.portfolio.heroSubtitle || fallback;
  const cta = pick(lang, {
    id: "Lihat semua karyanya di",
    en: "Check it all out at",
    es: "Míralo todo en",
    ru: "Смотри всё здесь:",
    zh: "全部作品都在这里：",
    ko: "전체 작업물은 여기서:",
    ja: "すべての実績はこちら:",
    ar: "شوف كل الأعمال هنا:",
  });
  return `${summary}\n\n${cta} ${url}`;
}

function clientsAnswer(lang, k) {
  const names = k.portfolio.consulting.slice(0, 6).map((c) => c.org).filter(Boolean);
  if (names.length === 0) return portfolioAnswer(lang, k);
  const list = names.map((n) => `- ${n}`).join("\n");
  const url = `${k.site.url}/portfolio`;
  return pick(lang, {
    id: `Beberapa klien/proyek yang pernah kita bantu:\n${list}\n\nMau lihat semua? Cek di ${url}`,
    en: `Some of the clients/projects we've worked with:\n${list}\n\nSee the full list at ${url}`,
    es: `Algunos de los clientes/proyectos con los que hemos trabajado:\n${list}\n\nVe la lista completa en ${url}`,
    ru: `Некоторые клиенты/проекты, с которыми мы работали:\n${list}\n\nПолный список здесь: ${url}`,
    zh: `我们合作过的一些客户/项目：\n${list}\n\n完整列表在：${url}`,
    ko: `함께 일했던 고객/프로젝트 일부예요:\n${list}\n\n전체 목록은 여기서: ${url}`,
    ja: `これまでご一緒したクライアント・プロジェクトの一部です:\n${list}\n\n全リストはこちら: ${url}`,
    ar: `بعض العملاء/المشاريع اللي اشتغلنا معهم:\n${list}\n\nشوف القائمة كاملة هنا: ${url}`,
  });
}

function certificationsAnswer(lang, k) {
  const names = k.portfolio.certifications.map((c) => c.name).filter(Boolean);
  const url = `${k.site.url}/portfolio`;
  if (names.length === 0) {
    return pick(lang, {
      id: `Detail sertifikasi lengkapnya ada di ${url}`,
      en: `You can find all the certification details at ${url}`,
      es: `Puedes ver todos los detalles de las certificaciones en ${url}`,
      ru: `Все подробности о сертификатах здесь: ${url}`,
      zh: `完整的认证信息在这里：${url}`,
      ko: `모든 인증 정보는 여기서 확인할 수 있어요: ${url}`,
      ja: `認定の詳細はこちらでご確認いただけます: ${url}`,
      ar: `كل تفاصيل الشهادات موجودة هنا: ${url}`,
    });
  }
  const list = names.slice(0, 10).join(", ");
  return pick(lang, {
    id: `Kita tersertifikasi oleh: ${list}.\n\nLink verifikasinya ada di ${url}`,
    en: `We're certified by: ${list}.\n\nVerification links are at ${url}`,
    es: `Estamos certificados por: ${list}.\n\nLos enlaces de verificación están en ${url}`,
    ru: `У нас есть сертификаты от: ${list}.\n\nСсылки для проверки здесь: ${url}`,
    zh: `我们获得了以下认证：${list}。\n\n验证链接在这里：${url}`,
    ko: `저희는 ${list}로부터 인증을 받았어요.\n\n검증 링크는 여기서: ${url}`,
    ja: `以下から認定を受けています: ${list}。\n\n確認リンクはこちら: ${url}`,
    ar: `إحنا معتمدين من: ${list}.\n\nروابط التحقق هنا: ${url}`,
  });
}

function aboutAnswer(lang, k) {
  const body = k.about.storyBody || k.about.heroSubtitle || k.site.description;
  const url = `${k.site.url}/about`;
  const cta = pick(lang, {
    id: "Baca ceritanya lebih lengkap di",
    en: "Read the full story at",
    es: "Lee la historia completa en",
    ru: "Полная история здесь:",
    zh: "完整故事请看：",
    ko: "전체 이야기는 여기서:",
    ja: "詳しいストーリーはこちら:",
    ar: "اقرأ القصة كاملة هنا:",
  });
  return `${body}\n\n${cta} ${url}`;
}

function storeAnswer(lang, k) {
  const url = `${k.site.url}/store`;
  if (k.products.length === 0) {
    return pick(lang, {
      id: `Di store kita ada template, playbook, sama resource digital siap pakai. Cek semuanya di ${url}`,
      en: `Our store's got ready-to-use templates, playbooks, and digital resources. Take a look at ${url}`,
      es: `En nuestra tienda hay plantillas, guías y recursos digitales listos para usar. Échale un vistazo en ${url}`,
      ru: `В нашем магазине есть готовые шаблоны, гайды и цифровые ресурсы. Посмотри здесь: ${url}`,
      zh: `我们的商店有现成的模板、指南和数字资源。快去看看：${url}`,
      ko: `저희 스토어엔 바로 쓸 수 있는 템플릿, 플레이북, 디지털 자료들이 있어요. 여기서 확인해보세요: ${url}`,
      ja: `ストアにはすぐ使えるテンプレートやプレイブック、デジタル素材が揃っています。こちらからどうぞ: ${url}`,
      ar: `في متجرنا قوالب جاهزة وأدلة وموارد رقمية. شوفها هنا: ${url}`,
    });
  }
  const list = k.products.slice(0, 6).map((p) => `- ${p.name} (Rp ${p.price.toLocaleString("id-ID")})`).join("\n");
  return pick(lang, {
    id: `Beberapa item yang ada di store kita:\n${list}\n\nLihat semua di ${url}`,
    en: `Here are a few things in our store:\n${list}\n\nSee everything at ${url}`,
    es: `Algunas cosas que tenemos en la tienda:\n${list}\n\nMira todo en ${url}`,
    ru: `Вот немного того, что есть у нас в магазине:\n${list}\n\nСмотри всё здесь: ${url}`,
    zh: `这是我们商店里的一些商品：\n${list}\n\n查看全部：${url}`,
    ko: `저희 스토어에 있는 몇 가지 상품이에요:\n${list}\n\n전체 보기: ${url}`,
    ja: `ストアにあるアイテムの一部です:\n${list}\n\n全部見るならこちら: ${url}`,
    ar: `بعض المنتجات الموجودة بمتجرنا:\n${list}\n\nشوف الكل هنا: ${url}`,
  });
}

function pricingAnswer(lang, k) {
  const { whatsappUrl, email } = k.contact;
  const url = `${k.site.url}/contact`;
  return pick(lang, {
    id: `Soal harga, tergantung scope proyeknya sih, jadi aku gak mau asal nebak angka di sini. Paling gampang, langsung chat aja biar cepet dapet estimasi.\n\nWhatsApp: ${whatsappUrl}\nEmail: ${email}\nAtau isi form di ${url}`,
    en: `Pricing really depends on the project scope, so I won't just throw out a number here. Fastest way to get a real estimate is to just reach out directly.\n\nWhatsApp: ${whatsappUrl}\nEmail: ${email}\nOr fill out the form at ${url}`,
    es: `El precio depende del alcance del proyecto, así que no voy a inventar un número aquí. Lo más rápido es contactarnos directamente para una cotización real.\n\nWhatsApp: ${whatsappUrl}\nEmail: ${email}\nO llena el formulario en ${url}`,
    ru: `Цена зависит от масштаба проекта, так что называть цифру наугад не буду. Быстрее всего получить реальную оценку: просто написать нам напрямую.\n\nWhatsApp: ${whatsappUrl}\nEmail: ${email}\nИли заполни форму на ${url}`,
    zh: `价格取决于项目范围，所以我不会在这里随便报数字。想拿到准确报价，最快的方式是直接联系我们。\n\nWhatsApp：${whatsappUrl}\n邮箱：${email}\n或填写表单：${url}`,
    ko: `가격은 프로젝트 범위에 따라 달라져서 여기서 대충 숫자를 말씀드리진 않을게요. 정확한 견적을 가장 빨리 받는 방법은 직접 문의하시는 거예요.\n\nWhatsApp: ${whatsappUrl}\n이메일: ${email}\n또는 폼 작성: ${url}`,
    ja: `料金はプロジェクトの規模によるので、ここで適当な数字はお伝えしません。一番早いのは直接お問い合わせいただくことです。\n\nWhatsApp: ${whatsappUrl}\nメール: ${email}\nまたはフォームはこちら: ${url}`,
    ar: `السعر يعتمد على حجم المشروع، فما راح أرمي رقم عشوائي هنا. أسرع طريقة تعرف السعر الحقيقي هي التواصل معنا مباشرة.\n\nواتساب: ${whatsappUrl}\nالبريد الإلكتروني: ${email}\nأو عبّي النموذج هنا: ${url}`,
  });
}

function contactAnswer(lang, k) {
  const { whatsappUrl, email } = k.contact;
  const url = `${k.site.url}/contact`;
  return pick(lang, {
    id: `Gampang, bisa hubungin kita lewat:\n- WhatsApp: ${whatsappUrl}\n- Email: ${email}\n- Atau isi form di: ${url}`,
    en: `Easy, you can reach us through:\n- WhatsApp: ${whatsappUrl}\n- Email: ${email}\n- Or the form at: ${url}`,
    es: `Fácil, puedes contactarnos por:\n- WhatsApp: ${whatsappUrl}\n- Email: ${email}\n- O el formulario en: ${url}`,
    ru: `Легко, можешь связаться с нами через:\n- WhatsApp: ${whatsappUrl}\n- Email: ${email}\n- Или форму на: ${url}`,
    zh: `很简单，你可以通过以下方式联系我们：\n- WhatsApp：${whatsappUrl}\n- 邮箱：${email}\n- 或者填写表单：${url}`,
    ko: `간단해요, 이렇게 연락하시면 돼요:\n- WhatsApp: ${whatsappUrl}\n- 이메일: ${email}\n- 또는 문의 폼: ${url}`,
    ja: `簡単ですよ、こちらから連絡できます:\n- WhatsApp: ${whatsappUrl}\n- メール: ${email}\n- またはフォームはこちら: ${url}`,
    ar: `سهل، تقدر تتواصل معنا عن طريق:\n- واتساب: ${whatsappUrl}\n- البريد الإلكتروني: ${email}\n- أو النموذج هنا: ${url}`,
  });
}

function greetingAnswer(lang) {
  return pick(lang, {
    id: `Halo juga! Aku bisa bantu jawab soal layanan, tools gratis, blog, portofolio, store, atau cara ngehubungin kita. Mau tanya apa nih?`,
    en: `Hey there! I can help with stuff about our services, free tools, blog, portfolio, store, or how to reach us. What's on your mind?`,
    es: `¡Hola! Puedo ayudarte con nuestros servicios, herramientas gratis, blog, portafolio, tienda, o cómo contactarnos. ¿Qué necesitas?`,
    ru: `Привет! Я могу рассказать про наши услуги, бесплатные инструменты, блог, портфолио, магазин или как с нами связаться. Что интересует?`,
    zh: `你好呀！我可以帮你了解我们的服务、免费工具、博客、作品集、商店，或者怎么联系我们。想问点什么？`,
    ko: `안녕하세요! 서비스, 무료 도구, 블로그, 포트폴리오, 스토어, 연락 방법에 대해 도와드릴 수 있어요. 뭐가 궁금하세요?`,
    ja: `こんにちは！サービス、無料ツール、ブログ、ポートフォリオ、ストア、連絡方法などお答えできます。何を知りたいですか?`,
    ar: `أهلاً! أقدر أساعدك بخصوص خدماتنا، الأدوات المجانية، المدونة، الأعمال، المتجر، أو كيف تتواصل معنا. شو تحب تعرف؟`,
  });
}

function fallbackAnswer(lang, k) {
  const url = `${k.site.url}/contact`;
  return pick(lang, {
    id: `Hmm, itu di luar pengetahuanku sekarang. Aku masih dalam tahap pengembangan, terus dilatih, dan terus ditambahin knowledge baru. Tapi aku bisa bantu soal layanan, tools gratis, blog, portofolio, atau store kita, atau langsung chat tim kita di ${url} kalau butuh jawaban spesifik.`,
    en: `Hmm, that's outside what I know right now. I'm still being developed, trained, and given more knowledge over time. But I can help with our services, free tools, blog, portfolio, or store, or just reach out to the team directly at ${url} for anything specific.`,
    es: `Hmm, eso está fuera de lo que sé por ahora. Todavía estoy en desarrollo, aprendiendo y recibiendo más conocimiento con el tiempo. Pero puedo ayudarte con nuestros servicios, herramientas gratis, blog, portafolio o tienda, o puedes contactar al equipo directamente en ${url} para algo más específico.`,
    ru: `Хм, это пока выходит за рамки того, что я знаю. Я всё ещё в разработке, меня обучают и постепенно добавляют новые знания. Но я могу рассказать про наши услуги, бесплатные инструменты, блог, портфолио или магазин, а за чем-то конкретным напиши команде напрямую: ${url}`,
    zh: `嗯，这个我暂时还不知道。我还在开发和训练中，知识也在不断更新。不过我可以帮你了解我们的服务、免费工具、博客、作品集或商店，具体问题也可以直接联系团队：${url}`,
    ko: `음, 그건 제가 아직 잘 모르는 부분이에요. 저는 아직 개발되고 학습되는 중이고, 계속 새로운 지식이 추가되고 있어요. 하지만 서비스, 무료 도구, 블로그, 포트폴리오, 스토어에 대해서는 도와드릴 수 있어요. 구체적인 답변이 필요하면 여기로 문의해주세요: ${url}`,
    ja: `うーん、それは今の私にはまだわかりません。私はまだ開発中で、学習を重ねながら知識を増やしている段階です。サービス、無料ツール、ブログ、ポートフォリオ、ストアについてはお手伝いできます。具体的なことはこちらからチームに直接お問い合わせください: ${url}`,
    ar: `هممم، هذا خارج نطاق معرفتي حالياً. أنا لسه قيد التطوير والتدريب، وبيتم إضافة معرفة جديدة لي باستمرار. بس أقدر أساعدك بخصوص خدماتنا، الأدوات المجانية، المدونة، الأعمال، أو المتجر، أو تواصل مع الفريق مباشرة هنا لأي شي محدد: ${url}`,
  });
}

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

// Splits an uploaded document's extracted text into searchable chunks —
// paragraphs where the document actually has blank-line breaks, or
// sentences as a fallback for a document that's just one dense block of
// text with no paragraph structure at all.
function splitIntoChunks(text) {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length > 1) return paragraphs;
  return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

// This is deliberately just literal keyword search, not comprehension —
// Balao can't summarize a document or reason about what it means (that
// needs a real AI model, which this project explicitly doesn't use). What
// it CAN do for free: find and quote the parts of an uploaded document that
// share real words with the visitor's question. Same overlap-scoring
// approach as bestPostMatch, just against the document's own chunks instead
// of blog posts.
// A search word carrying an Indonesian enclitic suffix ("peluncurannya")
// won't literally appear in a document that only has the bare root
// ("peluncuran") — same issue withStemVariants solves for matching the
// site's own keywords, just needed again here since document text is
// arbitrary and never passes through that function.
function stemmedVariant(word) {
  for (const suf of ENCLITIC_SUFFIXES) {
    if (word.endsWith(suf) && word.length - suf.length >= 3) return word.slice(0, -suf.length);
  }
  return null;
}

function bestDocumentChunks(tokens, doc, maxChunks = 2) {
  const words = tokens.filter((w) => w.length > 3 && !STOPWORDS.has(w));
  if (words.length === 0) return [];
  const chunks = splitIntoChunks(doc.text);
  const scored = chunks
    .map((chunk) => {
      const haystack = chunk.toLowerCase();
      const score = words.reduce((s, w) => {
        const stem = stemmedVariant(w);
        return haystack.includes(w) || (stem && haystack.includes(stem)) ? s + 1 : s;
      }, 0);
      return { chunk, score };
    })
    .filter((c) => c.score >= 2)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, maxChunks).map((c) => c.chunk);
}

function documentAnswer(chunks, doc, lang) {
  const quotes = chunks.map((c) => `"${truncate(c, 400)}"`).join("\n\n");
  return pick(lang, {
    id: `Ketemu ini di dokumen "${doc.name}" yang kamu upload:\n\n${quotes}`,
    en: `Found this in the document "${doc.name}" you uploaded:\n\n${quotes}`,
    es: `Encontré esto en el documento "${doc.name}" que subiste:\n\n${quotes}`,
    ru: `Вот что нашлось в документе «${doc.name}», который ты загрузил:\n\n${quotes}`,
    zh: `在你上传的文档《${doc.name}》里找到了这个：\n\n${quotes}`,
    ko: `업로드하신 문서 "${doc.name}"에서 이런 내용을 찾았어요:\n\n${quotes}`,
    ja: `アップロードされた文書「${doc.name}」にこんな記載がありました:\n\n${quotes}`,
    ar: `لقيت هذا في المستند "${doc.name}" اللي رفعته:\n\n${quotes}`,
  });
}

// Shown when a document IS attached but nothing in it shares 2+ words with
// the question — e.g. a generic "what does this say?" rather than a
// specific search term. Falling all the way through to the generic
// fallbackAnswer here would read as if Balao failed to read the file at
// all; showing what it actually extracted instead makes the real
// limitation honest and visible (literal search, not comprehension) and
// gives the visitor something concrete to ask a follow-up about.
function documentPreviewAnswer(doc, lang) {
  const excerpt = truncate(doc.text.replace(/\s+/g, " ").trim(), 400);
  return pick(lang, {
    id: `Aku udah baca dokumen "${doc.name}" yang kamu upload, tapi belum nemu bagian yang cocok spesifik sama pertanyaan itu. Ini teks yang berhasil aku baca:\n\n"${excerpt}"\n\nCoba tanya soal bagian tertentu ya. Aku cuma bisa cari & kutip teksnya, bukan benar-benar "ngerti" isinya.`,
    en: `I've read the document "${doc.name}" you uploaded, but couldn't find a part that specifically matches that question. Here's what I could read from it:\n\n"${excerpt}"\n\nTry asking about a specific part. I can only search and quote the text, not really "understand" what it means.`,
    es: `Ya leí el documento "${doc.name}" que subiste, pero no encontré una parte que coincida específicamente con esa pregunta. Esto es lo que pude leer:\n\n"${excerpt}"\n\nIntenta preguntar sobre una parte específica: solo puedo buscar y citar el texto, no realmente "entender" lo que significa.`,
    ru: `Я прочитал документ «${doc.name}», который ты загрузил, но не нашёл части, которая конкретно отвечает на этот вопрос. Вот что удалось прочитать:\n\n«${excerpt}»\n\nПопробуй спросить о конкретной части. Я могу только искать и цитировать текст, а не по-настоящему «понимать» его смысл.`,
    zh: `我读了你上传的文档《${doc.name}》，但没找到跟这个问题具体对应的部分。这是我读到的内容：\n\n"${excerpt}"\n\n试着问更具体的部分吧，我只能搜索和引用文字，没办法真正"理解"它的意思。`,
    ko: `업로드하신 문서 "${doc.name}"를 읽어봤는데, 그 질문에 정확히 맞는 부분은 못 찾았어요. 대신 읽어낸 내용은 이래요:\n\n"${excerpt}"\n\n좀 더 구체적인 부분을 물어봐 주세요. 저는 텍스트를 검색하고 인용만 할 수 있고, 진짜로 "이해"하는 건 아니에요.`,
    ja: `アップロードされた文書「${doc.name}」を読みましたが、その質問にぴったり合う部分は見つかりませんでした。読み取れた内容はこちらです:\n\n「${excerpt}」\n\nもっと具体的な部分について聞いてみてください。私はテキストの検索と引用しかできず、本当の意味で「理解」しているわけではありません。`,
    ar: `قريت المستند "${doc.name}" اللي رفعته، بس ما لقيت جزء يطابق سؤالك بالضبط. هاي اللي قدرت أقراه:\n\n"${excerpt}"\n\nجرب تسأل عن جزء أكثر تحديداً، أنا بس أقدر أدور واقتبس من النص، مش أفهمه فعلياً.`,
  });
}

// Main entry point: given the visitor's raw message, the site's current
// UI language (used only as a last-resort fallback — see detectLang), the
// knowledge object from useBalaoKnowledge(), and an optional uploaded
// `doc` ({name, text} or null — see SiteChatWidget.jsx), return Balao's
// reply. Pure function, no network, no state of its own. Document search
// is checked last, right before giving up — a question that clearly
// matches a known site topic (contact, pricing, a service...) still wins,
// so an uploaded document can't accidentally hijack an unrelated question.
export function answerBalao(rawText, siteLang, knowledge, doc) {
  const tokens = tokenize(rawText);
  const text = ` ${tokens.join(" ")} `;
  const tokenSet = withStemVariants(tokens);
  const lang = detectLang(tokenSet, text, siteLang || "en");
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

  // A comparison question ("what's the difference between X and Y?") is
  // checked before the single-best-match path below, so it gets both
  // services it's actually asking about instead of silently answering
  // about only whichever one happened to score highest.
  if (isComparisonQuestion(tokenSet)) {
    const compared = topServiceMatches(tokenSet, k.services, 2);
    if (compared.length >= 2) return comparisonAnswer(compared[0], compared[1], lang, k.site);
  }

  // A specific service (e.g. "On-Page SEO") is checked before the parent
  // category, so a detailed question gets the specific answer instead of
  // just the category's general overview.
  const service = bestServiceMatch(tokenSet, k.services);
  if (service) return serviceAnswer(service, lang, k.site);

  const category = bestCategoryMatch(tokenSet, text, k.categories);
  if (category) return categoryAnswer(category, lang, k.site);

  if (matchesAny(tokenSet, text, SERVICES_OVERVIEW_KEYWORDS)) return servicesOverviewAnswer(lang, k);
  if (matchesAny(tokenSet, text, TOOLS_KEYWORDS)) return toolsAnswer(lang, k);

  const post = bestPostMatch(tokens, k.posts);
  if (post) return postAnswer(post, lang, k.site);

  if (matchesAny(tokenSet, text, PORTFOLIO_KEYWORDS)) return portfolioAnswer(lang, k);
  if (isGreeting(tokens)) return greetingAnswer(lang);

  if (doc) {
    const chunks = bestDocumentChunks(tokens, doc);
    return chunks.length > 0 ? documentAnswer(chunks, doc, lang) : documentPreviewAnswer(doc, lang);
  }

  return fallbackAnswer(lang, k);
}
