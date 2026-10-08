import test from "node:test";
import assert from "node:assert/strict";
import { affectsLiveData, liveDataTable, storageChangeKey } from "../src/lib/liveDataEvents.js";

test("table updates invalidate their lists/details without fetching unrelated content", () => {
  for (const [key, changes] of [
    ["settings", ["settings", "site_settings", "okr:settings"]],
    ["homepage", ["homepage", "homepage_sections", "okr:homepage"]],
    ["page:portfolio", ["pages", "okr:pages"]],
    ["posts:published:limit=6", ["posts", "okr:posts"]],
    ["post:example", ["posts", "okr:posts"]],
    ["products:exists", ["products", "okr:products"]],
    ["product:example", ["products", "okr:products"]],
    ["service:example", ["services", "okr:services"]],
  ]) {
    for (const changed of changes) assert.ok(affectsLiveData(key, changed), `${key} <- ${changed}`);
    for (const changed of ["okr:cart", "okr:session", "okr:remote-store-ping", "language", "contacts", "orders"]) {
      assert.equal(affectsLiveData(key, changed), false, `${key} ignores ${changed}`);
    }
    assert.ok(affectsLiveData(key, null), "storage.clear refreshes every key");
  }
  assert.equal(affectsLiveData("services:active", "posts"), false);
  assert.equal(affectsLiveData("posts:published", "services"), false);
  assert.equal(liveDataTable("product:slug"), "products");
});

test("cross-tab pings retain the table name and malformed/clear events safely refresh", () => {
  assert.equal(storageChangeKey({ key: "okr:remote-store-ping", newValue: '{"key":"posts","at":1}' }), "posts");
  assert.equal(storageChangeKey({ key: "okr:remote-store-ping", newValue: "broken" }), null);
  assert.equal(storageChangeKey({ key: "okr:services" }), "okr:services");
  assert.equal(storageChangeKey({ key: null }), null);
});
