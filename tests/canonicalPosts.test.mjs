import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getCanonicalPublishedPosts } from "../src/lib/canonicalPosts.js";
import { SLUG_RENAMES } from "../src/data/slugRenames.js";

const posts = getCanonicalPublishedPosts();

test("every post has one unique canonical slug, title and path", () => {
  assert.equal(posts.length, 22);
  assert.equal(new Set(posts.map((p) => p.slug)).size, posts.length);
  assert.equal(new Set(posts.map((p) => p.title)).size, posts.length);
  assert.equal(new Set(posts.map((p) => p.meta_title)).size, posts.length);
  for (const p of posts) assert.equal(p.canonical_path, `/blog/${p.slug}`);
});

test("no canonical slug is an old slug, and renames never chain", () => {
  const olds = new Set(Object.keys(SLUG_RENAMES));
  for (const p of posts) assert.ok(!olds.has(p.slug), `${p.slug} is still a legacy slug`);
  for (const next of Object.values(SLUG_RENAMES)) assert.ok(!olds.has(next), `chain via ${next}`);
});

test("related slugs and in-body blog links point at canonical slugs", () => {
  const slugs = new Set(posts.map((p) => p.slug));
  const links = [];
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    if (node.type === "link" && /^\/blog\//.test(node.attrs?.href ?? "")) links.push(node.attrs.href);
    Object.values(node).forEach(walk);
  };
  for (const p of posts) {
    for (const s of p.related_slugs) assert.ok(slugs.has(s), `${p.slug} relates to unknown ${s}`);
    walk(p.content);
  }
  for (const href of links) {
    const slug = href.replace("/blog/", "").split(/[?#]/)[0];
    assert.ok(slugs.has(slug), `in-body link to non-canonical ${href}`);
  }
});

test("vercel.json 301s every old slug straight to its canonical slug", () => {
  const { redirects } = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  for (const [old, next] of Object.entries(SLUG_RENAMES)) {
    const rule = redirects.find((r) => r.source === `/blog/${old}`);
    assert.ok(rule, `missing redirect for ${old}`);
    assert.equal(rule.destination, `/blog/${next}`);
    assert.equal(rule.statusCode, 301);
  }
});
