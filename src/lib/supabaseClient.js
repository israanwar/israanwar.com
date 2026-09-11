import { createClient } from "@supabase/supabase-js";

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

let remoteChangeChannel = null;

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

export function ensureRemoteChangeBridge() {
  if (!supabaseEnabled || !supabase || typeof window === "undefined" || remoteChangeChannel) return;

  const tables = [
    "site_settings",
    "homepage_sections",
    "pages",
    "posts",
    "products",
    "services",
    "media",
    "contacts",
    "orders",
  ];

  remoteChangeChannel = supabase.channel("okr-public-data");
  tables.forEach((table) => {
    remoteChangeChannel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      () => emitRemoteChange(table),
    );
  });
  remoteChangeChannel.subscribe();
}
