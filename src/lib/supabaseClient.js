import { createClient } from "@supabase/supabase-js";
import { liveDataTable } from "./liveDataEvents";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseEnabled = Boolean(supabaseUrl && supabaseKey);

export const supabase = supabaseEnabled
  ? createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
  : null;

const remoteChangeChannels = new Map();

export function emitRemoteChange(key) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("okr:remote-store-change", { detail: { key } }));
    try {
      window.localStorage.setItem("okr:remote-store-ping", JSON.stringify({ key, at: Date.now() }));
    } catch {
      // Cross-tab refresh is best-effort; the in-tab event above is enough locally.
    }
  }
}

// Public visitors read prerendered data and refresh on focus/visibility, so
// the realtime socket can wait until they actually interact with the page.
// This keeps an idle page load free of WebSocket traffic (and of console
// errors where sockets are blocked). The admin subscribes immediately.
const INTERACTION_EVENTS = ["pointerdown", "keydown", "touchstart", "wheel"];
let interactionReady = null;
function whenRealtimeAllowed() {
  if (window.location?.pathname?.startsWith("/admin")) return Promise.resolve();
  interactionReady ??= new Promise((resolve) => {
    const start = () => {
      INTERACTION_EVENTS.forEach((type) => window.removeEventListener(type, start, true));
      resolve();
    };
    INTERACTION_EVENTS.forEach((type) => window.addEventListener(type, start, { capture: true, passive: true }));
  });
  return interactionReady;
}

export function ensureRemoteChangeBridge(key) {
  if (!supabaseEnabled || !supabase || typeof window === "undefined") return () => {};
  const table = liveDataTable(key);
  if (!table) return () => {};
  let entry = remoteChangeChannels.get(table);
  if (!entry) {
    entry = { channel: null, subscribers: 0 };
    remoteChangeChannels.set(table, entry);
    const pending = entry;
    void whenRealtimeAllowed().then(() => {
      // Every subscriber may have left before the first interaction.
      if (remoteChangeChannels.get(table) !== pending) return;
      const channel = supabase.channel(`okr-public-data:${table}`);
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => emitRemoteChange(table),
      );
      pending.channel = channel;
      channel.subscribe();
    });
  }
  entry.subscribers += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    entry.subscribers -= 1;
    if (entry.subscribers === 0) {
      remoteChangeChannels.delete(table);
      if (entry.channel) void supabase.removeChannel(entry.channel);
    }
  };
}
