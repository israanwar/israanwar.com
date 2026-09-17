import test from "node:test";
import assert from "node:assert/strict";
import { auditPostSeo } from "../src/lib/seoAudit.js";

const status = (audit, id) => audit.checks.find((check) => check.id === id)?.status;

test("audit follows the post fields and rendered TipTap content", () => {
  const post = {
    title: "Panduan SEO Praktis",
    slug: "panduan-seo-praktis",
    meta_title: "Panduan SEO Praktis untuk Bisnis",
    meta_description: "Panduan SEO praktis untuk bisnis kecil.",
    focus_keyword: "panduan SEO",
    canonical_path: "/blog/panduan-seo-praktis",
    related_slugs: ["artikel-terkait"],
    references: [{ title: "Google Search Central", url: "https://developers.google.com/search" }],
    content: { type: "doc", content: [
      { type: "paragraph", content: [{ type: "text", text: "Panduan SEO membantu pembaca memahami dasar-dasarnya." }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Menggunakan panduan SEO" }] },
      { type: "paragraph", content: [{ type: "text", text: "Baca juga artikel lain.", marks: [{ type: "link", attrs: { href: "/blog/artikel-terkait" } }] }] },
    ] },
  };
  const audit = auditPostSeo(post, [{ slug: "artikel-terkait", status: "published" }]);
  for (const id of ["title", "description", "slug", "canonical", "keyphrase", "phrase-title", "phrase-slug", "phrase-description", "phrase-intro", "phrase-heading", "body", "internal", "outbound"]) {
    assert.equal(status(audit, id), "good", id);
  }
  assert.match(audit.checks.find((check) => check.id === "body").evidence, /2 kemunculan/);
  assert.equal(status(audit, "length"), "info");
});

test("missing keyphrase remains unassessed and related posts are not assumed published", () => {
  const post = { title: "Artikel", slug: "artikel", excerpt: "Ringkasan", related_slugs: ["draft-lain"], content: { type: "doc", content: [] } };
  const unknown = auditPostSeo(post);
  assert.equal(status(unknown, "phrase-title"), "pending");
  assert.equal(status(unknown, "internal"), "pending");
  const verified = auditPostSeo(post, [{ slug: "draft-lain", status: "draft" }]);
  assert.equal(status(verified, "internal"), "improve");
  assert.equal(status(verified, "keyphrase"), "improve");
});

test("cross-domain canonical requires manual review and unrelated phrase is not shown green", () => {
  const audit = auditPostSeo({ title: "Contoh", slug: "contoh", focus_keyword: "frasa berbeda", canonical_path: "https://example.com/other", content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Artikel sederhana." }] }] } }, []);
  assert.equal(status(audit, "canonical"), "info");
  assert.equal(status(audit, "phrase-intro"), "improve");
  assert.equal(status(audit, "body"), "improve");
});

test("published-style editorial slug reports word overlap without demanding a URL change", () => {
  const audit = auditPostSeo({ title: "Website yang tajam", slug: "website-yang-tajam-adalah-mesin-kepercayaan", focus_keyword: "website yang menghasilkan leads", content: { type: "doc", content: [] } }, []);
  assert.equal(status(audit, "slug"), "good");
  assert.equal(status(audit, "phrase-slug"), "info");
  assert.match(audit.checks.find((check) => check.id === "phrase-slug").evidence, /kata sama persis/);
});
