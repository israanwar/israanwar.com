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

export function ensureRemoteChangeBridge(key) {
  if (!supabaseEnabled || !supabase || typeof window === "undefined") return () => {};
  const table = liveDataTable(key);
  if (!table) return () => {};
  let entry = remoteChangeChannels.get(table);
  if (!entry) {
    const channel = supabase.channel(`okr-public-data:${table}`);
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      () => emitRemoteChange(table),
    );
    entry = { channel, subscribers: 0 };
    remoteChangeChannels.set(table, entry);
    channel.subscribe();
  }
  entry.subscribers += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    entry.subscribers -= 1;
    if (entry.subscribers === 0) {
      remoteChangeChannels.delete(table);
      void supabase.removeChannel(entry.channel);
    }
  };
}
