import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Realtime shares a table subscription and releases it after its final consumer", async () => {
  const channels = [];
  const removed = [];
  globalThis.__bridgeSupabase = {
    channel(name) {
      const channel = {
        name, subscribed: false,
        on(event, filter, callback) { Object.assign(this, { event, filter, callback }); return this; },
        subscribe() { this.subscribed = true; return this; },
      };
      channels.push(channel);
      return channel;
    },
    removeChannel(channel) { removed.push(channel); return Promise.resolve("ok"); },
  };
  const events = [];
  const listeners = new Map();
  globalThis.window = {
    location: { pathname: "/" },
    dispatchEvent: e => events.push(e),
    localStorage: { setItem() {} },
    addEventListener(type, fn) { listeners.set(type, [...(listeners.get(type) ?? []), fn]); },
    removeEventListener(type, fn) { listeners.set(type, (listeners.get(type) ?? []).filter(f => f !== fn)); },
  };
  const interact = async () => { (listeners.get("pointerdown") ?? []).forEach(fn => fn()); await new Promise(r => setTimeout(r, 0)); };
  try {
    // Load the real bridge with its SDK boundary mocked; no database or
    // development server is needed for ownership/lifecycle verification.
    const source = (await readFile(new URL("../src/lib/supabaseClient.js", import.meta.url), "utf8"))
      .replace('import { createClient } from "@supabase/supabase-js";', "const createClient = () => globalThis.__bridgeSupabase;")
      .replace('"./liveDataEvents"', JSON.stringify(new URL("../src/lib/liveDataEvents.js", import.meta.url).href))
      .replace("import.meta.env.VITE_SUPABASE_URL", JSON.stringify("https://israanwar-test.supabase.co"))
      .replace("import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY", JSON.stringify("test-key"));
    const { ensureRemoteChangeBridge } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
    // A table released before the first interaction never opens a socket.
    const offEarly = ensureRemoteChangeBridge("products:active");
    offEarly();
    const offList = ensureRemoteChangeBridge("posts:published:limit=6");
    const offDetail = ensureRemoteChangeBridge("post:example");
    const offSettings = ensureRemoteChangeBridge("settings");
    assert.equal(channels.length, 0, "public pages wait for a user interaction before subscribing");
    await interact();
    assert.equal(channels.length, 2);
    assert.deepEqual(channels.map(c => c.filter.table), ["posts", "site_settings"]);
    assert.ok(channels.every(c => c.subscribed));
    channels[0].callback();
    assert.equal(events[0].detail.key, "posts");
    offList(); offList();
    assert.equal(removed.length, 0, "duplicate release cannot remove another consumer's channel");
    offDetail();
    assert.equal(removed.length, 1);
    assert.equal(removed[0], channels[0]);
    offSettings();
    assert.equal(removed.length, 2);
    const offAgain = ensureRemoteChangeBridge("posts:published");
    await new Promise(r => setTimeout(r, 0));
    assert.equal(channels.length, 3, "remount after interaction creates a working subscription");
    offAgain();
  } finally {
    delete globalThis.__bridgeSupabase;
    delete globalThis.window;
  }
});

test("Realtime subscribes immediately in the admin", async () => {
  const channels = [];
  globalThis.__bridgeSupabase = {
    channel(name) { const c = { name, on() { return this; }, subscribe() { this.subscribed = true; return this; } }; channels.push(c); return c; },
    removeChannel() { return Promise.resolve("ok"); },
  };
  globalThis.window = { location: { pathname: "/admin/posts" }, dispatchEvent() {}, localStorage: { setItem() {} }, addEventListener() {}, removeEventListener() {} };
  try {
    const source = (await readFile(new URL("../src/lib/supabaseClient.js", import.meta.url), "utf8"))
      .replace('import { createClient } from "@supabase/supabase-js";', "const createClient = () => globalThis.__bridgeSupabase;")
      .replace('"./liveDataEvents"', JSON.stringify(new URL("../src/lib/liveDataEvents.js", import.meta.url).href))
      .replace("import.meta.env.VITE_SUPABASE_URL", JSON.stringify("https://israanwar-test.supabase.co"))
      .replace("import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY", JSON.stringify("test-key"))
      + "\n// admin-variant";
    const { ensureRemoteChangeBridge } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
    const off = ensureRemoteChangeBridge("posts:published");
    await new Promise(r => setTimeout(r, 0));
    assert.equal(channels.length, 1);
    assert.ok(channels[0].subscribed);
    off();
  } finally {
    delete globalThis.__bridgeSupabase;
    delete globalThis.window;
  }
});
