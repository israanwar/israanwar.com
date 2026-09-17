import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

test("every seeded post has a resolvable editor route and remote UUID wins over legacy data ID", async () => {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  };
  globalThis.window = { dispatchEvent() {} };
  const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
  try {
    const { postsRepo } = await server.ssrLoadModule("/src/lib/localStore.js");
    const { postRowToItem } = await server.ssrLoadModule("/src/lib/supabaseData.js");
    const posts = postsRepo.list();
    assert.equal(posts.length, 22);
    assert.equal(new Set(posts.map((post) => post.slug)).size, posts.length);
    for (const [index, post] of posts.entries()) {
      assert.equal(postsRepo.get(post.id)?.slug, post.slug, `legacy ID ${post.id}`);
      assert.equal(postsRepo.get(post.slug)?.id, post.id, `slug ${post.slug}`);
      const remoteId = `11111111-1111-4111-8111-${String(index + 1).padStart(12, "0")}`;
      const mapped = postRowToItem({ id: remoteId, slug: post.slug, title: post.title, data: post });
      assert.equal(mapped.id, remoteId, `remote row for ${post.slug}`);
      assert.equal(mapped.slug, post.slug);
      assert.equal(mapped.legacy_id, post.id, `legacy URL for ${post.slug}`);
    }
  } finally {
    await server.close();
    delete globalThis.window;
    delete globalThis.localStorage;
  }
});
