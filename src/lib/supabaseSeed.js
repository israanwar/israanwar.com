import {
  settingsRepo,
  homepageRepo,
  pagesRepo,
  postsRepo,
  productsRepo,
  servicesRepo,
} from "./localStore";
import { applyProductPriceDiscount } from "./productPricing";
import { supabase, supabaseEnabled } from "./supabaseClient";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function isUuid(value) {
  return UUID_RE.test(String(value ?? ""));
}

function cleanUuid(value) {
  return isUuid(value) ? value : undefined;
}

function capPrice(value) {
  return Math.min(799000, Math.max(0, Number(value) || 0));
}

function chunkRows(rows, size = 25) {
  const chunks = [];
  for (let i = 0; i < rows.length; i += size) chunks.push(rows.slice(i, i + size));
  return chunks;
}

async function withTimeout(promise, label, ms = 30000) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} terlalu lama merespons. Coba login ulang lalu sync lagi.`)), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function postRow(post) {
  const data = clone(post) ?? {};
  const row = {
    slug: data.slug,
    title: data.title ?? "",
    status: data.status ?? "draft",
    category: data.category || null,
    published_at: data.published_at || null,
    author_id: cleanUuid(data.author_id) ?? null,
    data,
  };
  if (isUuid(data.id)) row.id = data.id;
  return row;
}

function productRow(product) {
  const data = applyProductPriceDiscount(clone(product) ?? {});
  const price = capPrice(data.price);
  const row = {
    slug: data.slug,
    name: data.name ?? "",
    category: data.category || null,
    status: data.status ?? "active",
    price,
    data: { ...data, price },
  };
  if (isUuid(data.id)) row.id = data.id;
  return row;
}

function serviceRow(service) {
  const data = clone(service) ?? {};
  const order = Number(data.order ?? data.order_index ?? 100) || 100;
  const row = {
    slug: data.slug,
    name: data.name ?? "",
    status: data.status ?? "active",
    kind: data.kind ?? "service",
    parent_slug: data.parent_slug || null,
    order_index: order,
    data: { ...data, order },
  };
  if (isUuid(data.id)) row.id = data.id;
  return row;
}

async function requireSupabaseStaffSession() {
  if (!supabaseEnabled || !supabase) {
    throw new Error("Supabase belum aktif. Periksa VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY.");
  }

  const { data: sessionData, error: sessionError } = await withTimeout(
    supabase.auth.getSession(),
    "Cek session Supabase",
    12000,
  );
  if (sessionError) throw sessionError;
  const userId = sessionData.session?.user?.id;
  if (!userId) {
    throw new Error("Session Supabase belum aktif. Logout dulu, lalu login ulang memakai akun admin Supabase.");
  }

  const { data: profile, error: profileError } = await withTimeout(
    supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle(),
    "Cek role admin",
    12000,
  );
  if (profileError) throw profileError;
  if (!["admin", "editor"].includes(profile?.role)) {
    throw new Error("Akun ini belum punya akses staff/admin di Supabase.");
  }
}

async function upsert(table, row, onConflict, label) {
  const { error } = await withTimeout(
    supabase.from(table).upsert(row, { onConflict }),
    label,
  );
  if (error) throw new Error(`${label}: ${error.message}`);
}

async function upsertMany(table, rows, onConflict, label, onProgress) {
  if (!rows.length) return;
  const chunks = chunkRows(rows);
  let synced = 0;
  for (const [index, chunk] of chunks.entries()) {
    onProgress?.(`${label} ${synced + 1}-${synced + chunk.length}/${rows.length}`);
    const { error } = await withTimeout(
      supabase.from(table).upsert(chunk, { onConflict }),
      `${label} batch ${index + 1}`,
    );
    if (error) throw new Error(`${label}: ${error.message}`);
    synced += chunk.length;
  }
}

export async function pushLocalContentToSupabase({ onProgress } = {}) {
  onProgress?.("checking session");
  await requireSupabaseStaffSession();

  const settings = settingsRepo.get();
  onProgress?.("settings");
  if (settings) await upsert("site_settings", { id: "site", data: clone(settings) }, "id", "Settings");

  const homepage = homepageRepo.getAll() ?? {};
  await upsertMany(
    "homepage_sections",
    Object.entries(homepage).map(([key, section]) => ({ section_key: key, data: clone(section) })),
    "section_key",
    "homepage",
    onProgress,
  );

  const pages = pagesRepo.getAll() ?? {};
  await upsertMany(
    "pages",
    Object.entries(pages).map(([key, page]) => ({ page_key: key, data: clone(page) })),
    "page_key",
    "pages",
    onProgress,
  );

  const posts = postsRepo.list();
  await upsertMany("posts", posts.map(postRow), "slug", "posts", onProgress);

  const products = productsRepo.list();
  await upsertMany("products", products.map(productRow), "slug", "products", onProgress);

  const services = servicesRepo.list();
  await upsertMany("services", services.map(serviceRow), "slug", "services", onProgress);

  onProgress?.("done");

  return {
    homepage: Object.keys(homepage).length,
    pages: Object.keys(pages).length,
    posts: posts.length,
    products: products.length,
    services: services.length,
  };
}
