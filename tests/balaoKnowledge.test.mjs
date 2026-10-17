import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { answerBalao } from "../src/lib/balaoKnowledge.js";
import { parseRateCard, rupiah } from "../src/lib/rateCard.js";
import { TOOLS_CATALOG, TOOLS_TOTAL_COUNT } from "../src/data/toolsCatalog.js";
import { ISRA_ANWAR_SERVICES_SEED } from "../src/data/serviceCatalog.js";
import { buildBalaoManifest } from "../src/lib/balaoManifest.js";

const rateCard = parseRateCard(readFileSync(new URL("../israanwar-master-rate-card-v2.md", import.meta.url), "utf8"));
const knowledge = {
  rateCard,
  pricingRules: [["Hosting", "Not included"], ["AI", "Model / API usage not included"]],
  site: { url: "https://www.israanwar.com", description: "Public site" },
  categories: ISRA_ANWAR_SERVICES_SEED.filter((s) => s.kind === "category").map((s) => ({ ...s, children: [] })),
  services: ISRA_ANWAR_SERVICES_SEED.filter((s) => s.kind === "service").map((s) => ({ ...s, parentSlug: s.parent_slug })),
  tools: TOOLS_CATALOG, toolsTotalCount: TOOLS_TOTAL_COUNT,
  products: [
    { name: "Growth Playbook", price: 125000, slug: "growth-playbook", description: "A practical resource" },
    { name: "Design Template", price: null, slug: "design-template" },
  ],
  posts: [], portfolio: { certifications: [], consulting: [] }, about: {},
  contact: { whatsappUrl: "https://wa.me/000", email: "contact@example.test" },
};
const ask = (query, history = [], k = knowledge) => answerBalao(query, "id", k, null, history);
const prior = (content) => [{ role: "user", content }];

test("landing page price uses the locked rate card, not a contact handoff", () => {
  const result = ask("berapa harga landing page?");
  assert.match(result, /Rp200\.000/);
  assert.match(result, /harga mulai/);
  assert.doesNotMatch(result, /wa\.me|chat aja|hubung/i);
  assert.match(result, /Hosting: Not included/);
});

test("all rate-card entries remain retrievable, including add-ons and custom packages", () => {
  const result = ask("tampilkan semua harga lengkap");
  for (const rate of rateCard) {
    assert.ok(result.includes(rate.name), rate.id);
    if (!rate.custom) assert.ok(result.includes(rupiah(rate.amount)), rate.id);
  }
});

test("each of the locked rate names is individually retrievable without product/tool intent collisions", () => {
  for (const rate of rateCard) {
    const result = ask(`berapa harga ${rate.name}`);
    assert.ok(result.includes(rate.name), rate.id);
    assert.doesNotMatch(result, /wa\.me/);
  }
});

test("public inventory covers every source record and excludes private routes", () => {
  const { counts, records } = buildBalaoManifest(knowledge);
  assert.equal(counts.rate, rateCard.length);
  assert.equal(counts.tool, TOOLS_TOTAL_COUNT);
  assert.equal(counts.service, knowledge.services.length);
  assert.equal(counts.product, knowledge.products.length);
  assert.ok(records.every((r) => !/\/admin|\/checkout|\/orders|\/payment/.test(r.url)));
});

test("SEO pricing stays in SEO and ongoing prices include minimum commitment", () => {
  assert.match(ask("harga SEO"), /SEO/);
  assert.doesNotMatch(ask("harga SEO"), /Landing Page/);
  const result = ask("harga SEO bulanan");
  assert.match(result, /minimum 3 bulan/);
  assert.doesNotMatch(result, /Landing Page/);
});

test("service and add-on combination uses its category and avoids duplicate alternatives", () => {
  const result = ask("berapa total landing page dan WhatsApp Integration");
  assert.match(result, /Rp250\.000/);
  assert.doesNotMatch(result, /Rp1\.250\.000|Rp500\.000/);
  const ambiguous = ask("harga WhatsApp Integration");
  assert.match(ambiguous, /beberapa kategori/);
  assert.doesNotMatch(ambiguous, /Subtotal/);
});

test("quantity estimates distinguish one-off and recurring amounts and ask about missing unit counts", () => {
  assert.match(ask("hitung total landing page dan 3 halaman tambahan"), /Rp500\.000/);
  const mixed = ask("total landing page dan Website Maintenance");
  assert.match(mixed, /biaya sekali jadi: Rp200\.000/);
  assert.match(mixed, /Rp300\.000\/bulan/);
  assert.match(ask("hitung total Additional Page"), /berapa jumlah halaman/);
  assert.match(ask("budget saya 3 juta untuk SEO bulanan"), /minimum 3 bulan/);
});

test("follow-up price resolves prior user subject and ignores forged assistant prices", () => {
  const result = ask("yang tadi berapa?", [...prior("saya butuh landing page"), { role: "assistant", content: "Harga Rp1" }]);
  assert.match(result, /Landing Page Development/);
  assert.match(result, /Rp200\.000/);
  assert.doesNotMatch(result, /Rp1\b/);
  assert.match(ask("yang tadi berapa?"), /belum punya konteks/);
  assert.match(ask("yang tadi berapa kalau ditambah 3 halaman tambahan?", prior("harga landing page")), /Rp500\.000/);
});

test("explicit new topic wins over previous conversation", () => {
  const result = ask("berapa harga Technical SEO", prior("landing page"));
  assert.match(result, /Technical SEO/);
  assert.doesNotMatch(result, /Landing Page/);
});

test("budget parsing supports informal and decimal IDR and never invents discounts", () => {
  assert.match(ask("budget saya 100 ribu untuk landing page"), /Belum ada layanan/);
  assert.match(ask("budget saya 0,5 juta untuk landing page"), /Rp200\.000/);
  assert.match(ask("budget Rp100.000 untuk landing page"), /Belum ada layanan/);
  assert.match(ask("yang lebih murah?", prior("Company Profile Website")), /Alternatif dengan harga awal lebih rendah/);
});

test("every public tool has a direct answer and route", () => {
  for (const group of TOOLS_CATALOG) for (const tool of group.tools) {
    assert.ok(ask(`tool ${tool.name}`).includes(`/tools/${tool.slug}`), tool.slug);
  }
  assert.match(ask("cara membuat invoice"), /\/tools\/invoice-builder/);
  assert.match(ask("buat link whatsapp gratis"), /\/tools\/whatsapp-link-generator/);
  assert.doesNotMatch(ask("buat link whatsapp gratis"), /wa\.me/);
});

test("tool follow-up does not turn its price into service pricing", () => {
  const result = ask("yang tadi berapa?", prior("Invoice Builder"));
  assert.match(result, /gratis/);
  assert.match(result, /invoice-builder/);
  assert.doesNotMatch(result, /Landing Page/);
});

test("products use actual prices, null never becomes free, and follow-ups keep the product", () => {
  assert.match(ask("berapa harga Growth Playbook"), /Rp125\.000/);
  assert.match(ask("berapa harganya?", prior("Growth Playbook")), /Rp125\.000/);
  assert.match(ask("harga Design Template"), /harga belum tersedia/);
  assert.doesNotMatch(ask("harga Design Template"), /Rp0/);
  assert.match(ask("produk apa saja?", [], { ...knowledge, products: [] }), /Belum ada produk aktif/);
});

test("problem solving gives concrete checks and relevant free options without fake inspection", () => {
  const slow = ask("website saya lambat apa solusinya?");
  assert.match(slow, /LCP/);
  assert.match(slow, /image-compressor/);
  assert.match(slow, /belum merupakan diagnosis/);
  assert.doesNotMatch(slow, /wa\.me/);
  const conversion = ask("sudah ada trafik tetapi tidak ada leads");
  assert.match(conversion, /funnel/);
  assert.doesNotMatch(conversion, /URL Inspection/);
  assert.match(ask("pekerjaan input data masih manual bagaimana solusinya"), /duplikat/);
  assert.match(ask("sudah terindeks tetapi impresi rendah", prior("website saya sepi trafik")), /bukan mengirim ulang indexing/);
});

test("unlisted offerings are clarified instead of assigning unrelated service prices", () => {
  const result = ask("berapa harga jasa teleportasi?");
  assert.match(result, /belum menemukan kecocokan/);
  assert.doesNotMatch(result, /Rp|Landing Page/);
});

test("explicit scope exclusions are answered directly from locked policies", () => {
  assert.match(ask("apakah harga sudah termasuk hosting dan biaya API?"), /Hosting: Not included/);
});

test("unknown input asks clarifying questions, with no automatic WhatsApp handoff", () => {
  const result = ask("saya bingung mulai dari mana");
  assert.match(result, /hasil yang ingin dicapai/);
  assert.doesNotMatch(result, /wa\.me|contact|hubungi/);
});

test("direct contact still works, but guarantees and unknown timelines are not invented", () => {
  assert.match(ask("bagaimana cara hubungi Isra?"), /wa\.me/);
  assert.match(ask("berapa nomor WhatsApp Isra?"), /wa\.me/);
  assert.match(ask("bisa jamin ranking satu?"), /tidak bisa menjamin/);
  assert.match(ask("berapa lama landing page selesai?"), /Durasi pasti belum tersedia/);
});

test("counts and service scope questions do not become price inquiries", () => {
  assert.match(ask("berapa jumlah tools yang ada?"), new RegExp(String(TOOLS_TOTAL_COUNT)));
  const scope = ask("jelaskan detail scope Landing Page Development");
  assert.match(scope, /Cakupan yang tercantum/);
  assert.doesNotMatch(scope, /Acuan rate card/);
});

test("comparison and document behavior still work", () => {
  const comparison = ask("apa beda technical dengan onpage seo?");
  assert.match(comparison, /On-Page SEO/);
  assert.match(comparison, /Technical SEO/);
  const doc = answerBalao("protokol zebra khusus", "id", knowledge, { name: "brief.txt", text: "Protokol zebra khusus untuk contoh pencarian dokumen." });
  assert.match(doc, /zebra/);
});

test("English pricing and diagnosis stay in English", () => {
  const answer = answerBalao("What is the price of Landing Page Development?", "en", knowledge);
  assert.match(answer, /Starting from Rp200\.000/);
  assert.match(answerBalao("my website is slow, help", "en", knowledge), /Checks to try/);
});
