import { supabase, supabaseEnabled, emitRemoteChange } from "./supabaseClient";
import {
  settingsRepo,
  homepageRepo,
  pagesRepo,
  postsRepo,
  productsRepo,
  servicesRepo,
  mediaRepo,
  usersRepo,
  contactsRepo,
  newsletterRepo,
  ordersRepo,
  ORDER_STATUS,
} from "./localStore";
import { applyProductPriceDiscount, applyProductPriceDiscounts } from "./productPricing";
import { normalizePortfolioProjects } from "./portfolioProjects";
import { normalizePaymentSettings } from "./paymentSettings";
import { POST_CONTENT_OVERRIDES } from "../data/postContentOverrides";

const MEDIA_BUCKET = "israanwar-media";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_SITE_DESCRIPTIONS = new Set([
  "web, seo, ai workflow & content strategy for personal brands and businesses.",
  "web, seo, workflow ai, dan strategi konten untuk personal brand dan bisnis.",
  "building smarter digital systems for stronger visibility, efficient operations, and sustainable business growth.",
  "kami membangun sistem digital yang lebih cerdas untuk memperkuat visibilitas, mengefisienkan operasional, dan mendorong pertumbuhan bisnis berkelanjutan.",
]);

function isUuid(value) {
  return UUID_RE.test(String(value ?? ""));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function localFirstList(remoteRows, fallbackRows) {
  return remoteRows ?? fallbackRows;
}

async function tryRemote(action, fallback) {
  if (!supabaseEnabled || !supabase) return typeof fallback === "function" ? fallback() : fallback;
  try {
    return await action();
  } catch (error) {
    console.warn("[israanwar:supabase]", error?.message ?? error);
    return typeof fallback === "function" ? fallback(error) : fallback;
  }
}

async function writeRemote(action) {
  if (!supabaseEnabled || !supabase) {
    throw new Error("Supabase belum aktif. Perubahan belum tersimpan untuk pengunjung situs.");
  }
  return action();
}

function rowToItem(row) {
  const data = clone(row?.data) ?? {};
  return {
    ...data,
    id: data.id ?? row.id,
    slug: row.slug ?? data.slug,
    title: row.title ?? data.title,
    name: row.name ?? data.name,
    category: row.category ?? data.category,
    status: row.status ?? data.status,
    kind: row.kind ?? data.kind,
    parent_slug: row.parent_slug ?? data.parent_slug,
    price: row.price ?? data.price,
    order: row.order_index ?? data.order,
    created_at: row.created_at ?? data.created_at,
    updated_at: row.updated_at ?? data.updated_at,
    published_at: row.published_at ?? data.published_at,
    author_id: row.author_id ?? data.author_id,
  };
}

function productRowToItem(row) {
  return applyProductPriceDiscount(rowToItem(row));
}

// Seed posts retain a legacy string ID inside `data.id`, while Supabase uses
// a UUID primary key. Admin routes must use the real row ID for reads/writes.
export function postRowToItem(row) {
  const legacyId = row.data?.legacy_id || (!isUuid(row.data?.id) ? row.data?.id : null);
  const item = { ...rowToItem(row), id: row.id, ...(legacyId ? { legacy_id: legacyId } : {}) };
  const override = POST_CONTENT_OVERRIDES[item.slug];
  return override ? { ...item, ...override } : item;
}

function orderRowToItem(row) {
  const data = clone(row?.data) ?? {};
  return {
    ...data,
    id: row.id ?? data.id,
    order_number: row.order_number ?? data.order_number,
    status: row.status ?? data.status,
    customer_email: row.customer_email ?? data.customer_email,
    total: row.total ?? data.total,
    created_at: row.created_at ?? data.created_at,
    updated_at: row.updated_at ?? data.updated_at,
  };
}

function capPrice(value) {
  return Math.min(799000, Math.max(0, Number(value) || 0));
}

function cleanUuid(value) {
  return isUuid(value) ? value : undefined;
}

function normalizedText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function shouldFollowDescription(value, previousDescription) {
  const text = normalizedText(value);
  return !text
    || text === normalizedText(previousDescription)
    || DEFAULT_SITE_DESCRIPTIONS.has(text);
}

function postPayload(post) {
  const data = clone(post) ?? {};
  const payload = {
    slug: data.slug,
    title: data.title ?? "",
    status: data.status ?? "draft",
    category: data.category || null,
    published_at: data.published_at || null,
    author_id: cleanUuid(data.author_id) ?? null,
    data,
  };
  if (isUuid(data.id)) payload.id = data.id;
  return payload;
}

function productPayload(product) {
  const data = applyProductPriceDiscount(clone(product) ?? {});
  const payload = {
    slug: data.slug,
    name: data.name ?? "",
    category: data.category || null,
    status: data.status ?? "active",
    price: capPrice(data.price),
    data: { ...data, price: capPrice(data.price) },
  };
  if (isUuid(data.id)) payload.id = data.id;
  return payload;
}

function servicePayload(service) {
  const data = clone(service) ?? {};
  const order = Number(data.order ?? data.order_index ?? 100) || 100;
  const payload = {
    slug: data.slug,
    name: data.name ?? "",
    status: data.status ?? "active",
    kind: data.kind ?? "service",
    parent_slug: data.parent_slug || null,
    order_index: order,
    data: { ...data, order },
  };
  if (isUuid(data.id)) payload.id = data.id;
  return payload;
}

function pageRowToItem(key, data) {
  return key === "portfolio" ? normalizePortfolioProjects(data) : data;
}

function contactPayload(contact) {
  const data = clone(contact) ?? {};
  return {
    status: data.status ?? "new",
    name: data.name ?? null,
    email: data.email ?? null,
    phone: data.phone ?? null,
    subject: data.subject ?? null,
    message: data.message ?? null,
    data,
  };
}

function newsletterPayload(sub) {
  const data = clone(sub) ?? {};
  return {
    status: data.status ?? "subscribed",
    email: String(data.email ?? "").trim().toLowerCase(),
    source: data.source ?? null,
    data,
  };
}

function genOrderNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const seq = String(Date.now()).slice(-6);
  return `OKR-${y}${m}${day}-${seq}`;
}

function orderPayload(order) {
  const data = clone(order) ?? {};
  const orderNumber = data.order_number || genOrderNumber();
  return {
    order_number: orderNumber,
    status: data.status ?? ORDER_STATUS.PENDING_PAYMENT,
    customer_email: data.customer_email ?? null,
    total: Number(data.total) || 0,
    data: { ...data, order_number: orderNumber },
  };
}

function cacheRecord(repo, id, item) {
  try {
    return repo.update(id, item);
  } catch {
    try {
      if (item?.slug) return repo.update(item.slug, item);
    } catch {
      // Create below.
    }
    try {
      return repo.create(item);
    } catch {
      return item;
    }
  }
}

function deleteCachedRecord(repo, id) {
  try { repo.delete(id); }
  catch { /* Local cache is best-effort. */ }
}

export const settingsData = {
  async get() {
    return tryRemote(async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("data")
        .eq("id", "site")
        .maybeSingle();
      if (error) throw error;
      return normalizePaymentSettings(data?.data ?? settingsRepo.get());
    }, () => settingsRepo.get());
  },
  async update(patch) {
    return writeRemote(async () => {
      const current = await this.get();
      const next = normalizePaymentSettings({ ...current, ...patch });
      if (
        patch.description
        && shouldFollowDescription(current.seo_default_description, current.description)
      ) {
        next.seo_default_description = patch.description;
      }
      if (
        patch.description_id
        && shouldFollowDescription(current.seo_default_description_id, current.description_id)
      ) {
        next.seo_default_description_id = patch.description_id;
      }
      const { data, error } = await supabase
        .from("site_settings")
        .upsert({ id: "site", data: next }, { onConflict: "id" })
        .select("data")
        .single();
      if (error) throw error;
      if (patch.description) {
        const hero = await supabase
          .from("homepage_sections")
          .select("data")
          .eq("section_key", "hero")
          .maybeSingle();
        if (!hero.error && shouldFollowDescription(hero.data?.data?.subtitle, current.description)) {
          const heroData = { ...(hero.data?.data ?? {}), subtitle: patch.description };
          if (patch.description_id && shouldFollowDescription(heroData.subtitle_id, current.description_id)) {
            heroData.subtitle_id = patch.description_id;
          }
          const { error: heroError } = await supabase
            .from("homepage_sections")
            .upsert({ section_key: "hero", data: heroData }, { onConflict: "section_key" });
          if (heroError) throw new Error(`Hero homepage gagal diperbarui: ${heroError.message}`);
          homepageRepo.update("hero", heroData);
          emitRemoteChange("homepage");
        }
      }
      settingsRepo.update(data.data);
      emitRemoteChange("settings");
      return normalizePaymentSettings(data.data);
    });
  },
};

export const homepageData = {
  async getAll() {
    return tryRemote(async () => {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("section_key,data");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((row) => [row.section_key, row.data]));
    }, () => homepageRepo.getAll());
  },
  async update(sectionKey, sectionData) {
    return writeRemote(async () => {
      const { error } = await supabase
        .from("homepage_sections")
        .upsert({ section_key: sectionKey, data: clone(sectionData) }, { onConflict: "section_key" });
      if (error) throw new Error(`Bagian ${sectionKey} gagal disimpan: ${error.message}`);
      homepageRepo.update(sectionKey, sectionData);
      emitRemoteChange("homepage");
      return sectionData;
    });
  },
};

export const pagesData = {
  async getAll() {
    return tryRemote(async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("page_key,data");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((row) => [row.page_key, pageRowToItem(row.page_key, row.data)]));
    }, () => {
      const pages = pagesRepo.getAll();
      return { ...pages, portfolio: normalizePortfolioProjects(pages?.portfolio) };
    });
  },
  async get(key) {
    return tryRemote(async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("data")
        .eq("page_key", key)
        .maybeSingle();
      if (error) throw error;
      return pageRowToItem(key, data?.data ?? {});
    }, () => pageRowToItem(key, pagesRepo.get(key)));
  },
  async update(key, pageData) {
    return writeRemote(async () => {
      const nextPage = pageRowToItem(key, clone(pageData));
      const { data, error } = await supabase
        .from("pages")
        .upsert({ page_key: key, data: nextPage }, { onConflict: "page_key" })
        .select("data")
        .single();
      if (error) throw error;
      const updatedPage = pageRowToItem(key, data.data);
      pagesRepo.update(key, updatedPage);
      emitRemoteChange(`pages:${key}`);
      return updatedPage;
    });
  },
};

export const postsData = {
  async list(filter) {
    return tryRemote(async () => {
      let query = supabase.from("posts").select("*").order("published_at", { ascending: false }).order("created_at", { ascending: false });
      if (filter?.status) query = query.eq("status", filter.status);
      const { data, error } = await query;
      if (error) throw error;
      return localFirstList((data ?? []).map(postRowToItem), postsRepo.list(filter));
    }, () => postsRepo.list(filter));
  },
  async get(id) {
    return tryRemote(async () => {
      const legacyPost = !isUuid(id) ? postsRepo.get(id) : null;
      const query = isUuid(id)
        ? supabase.from("posts").select("*").eq("id", id)
        : supabase.from("posts").select("*").eq("slug", legacyPost?.slug ?? id);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      if (data) return postRowToItem(data);
      // Old bookmarked admin URLs can contain `data.id` rather than a slug.
      if (!isUuid(id)) {
        const { data: byLegacyId, error: legacyError } = await supabase
          .from("posts").select("*").eq("data->>id", id).maybeSingle();
        if (legacyError) throw legacyError;
        if (byLegacyId) return postRowToItem(byLegacyId);
        const { data: byPreservedId, error: preservedError } = await supabase
          .from("posts").select("*").eq("data->>legacy_id", id).maybeSingle();
        if (preservedError) throw preservedError;
        return byPreservedId ? postRowToItem(byPreservedId) : null;
      }
      return null;
    }, () => postsRepo.get(id));
  },
  async getBySlug(slug) {
    return tryRemote(async () => {
      const { data, error } = await supabase.from("posts").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data ? postRowToItem(data) : null;
    }, () => postsRepo.getBySlug(slug));
  },
  async create(payload) {
    return writeRemote(async () => {
      const { data, error } = await supabase
        .from("posts")
        .insert(postPayload(payload))
        .select("*")
        .single();
      if (error) throw error;
      cacheRecord(postsRepo, data.id, postRowToItem(data));
      emitRemoteChange("posts");
      return postRowToItem(data);
    });
  },
  async update(id, patch) {
    return writeRemote(async () => {
      const current = await this.get(id);
      if (!current) throw new Error("Post tidak ditemukan di Supabase. Muat ulang halaman sebelum menyimpan.");
      const next = { ...current, ...patch };
      const { id: _rowId, ...rowPatch } = postPayload(next);
      const { data, error } = await supabase
        .from("posts")
        .update(rowPatch)
        .eq("id", current.id)
        .select("*")
        .single();
      if (error) throw error;
      cacheRecord(postsRepo, id, postRowToItem(data));
      emitRemoteChange("posts");
      return postRowToItem(data);
    });
  },
  async delete(id) {
    return writeRemote(async () => {
      const query = isUuid(id)
        ? supabase.from("posts").delete().eq("id", id)
        : supabase.from("posts").delete().eq("slug", id);
      const { error } = await query;
      if (error) throw error;
      deleteCachedRecord(postsRepo, id);
      emitRemoteChange("posts");
    });
  },
};

export const productsData = {
  async list(filter) {
    return tryRemote(async () => {
      let query = supabase.from("products").select("*").order("created_at", { ascending: false });
      if (filter?.status) query = query.eq("status", filter.status);
      const { data, error } = await query;
      if (error) throw error;
      return localFirstList((data ?? []).map(productRowToItem), applyProductPriceDiscounts(productsRepo.list(filter)));
    }, () => applyProductPriceDiscounts(productsRepo.list(filter)));
  },
  // Cheap existence check (nav "Store" link visibility) — avoids pulling the
  // full product catalog just to know whether it's non-empty.
  async exists() {
    return tryRemote(async () => {
      const { data, error } = await supabase.from("products").select("id").limit(1);
      if (error) throw error;
      return (data?.length ?? 0) > 0 || productsRepo.list().length > 0;
    }, () => productsRepo.list().length > 0);
  },
  async get(id) {
    return tryRemote(async () => {
      const query = isUuid(id)
        ? supabase.from("products").select("*").eq("id", id)
        : supabase.from("products").select("*").eq("slug", id);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data ? productRowToItem(data) : null;
    }, () => applyProductPriceDiscount(productsRepo.get(id)));
  },
  async getBySlug(slug) {
    return tryRemote(async () => {
      const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data ? productRowToItem(data) : null;
    }, () => applyProductPriceDiscount(productsRepo.getBySlug(slug)));
  },
  async create(payload) {
    return writeRemote(async () => {
      const { data, error } = await supabase
        .from("products")
        .insert(productPayload(payload))
        .select("*")
        .single();
      if (error) throw error;
      cacheRecord(productsRepo, data.id, rowToItem(data));
      emitRemoteChange("products");
      return productRowToItem(data);
    });
  },
  async update(id, patch) {
    return writeRemote(async () => {
      const current = await this.get(id);
      if (!current) throw new Error("Produk tidak ditemukan di Supabase. Muat ulang halaman sebelum menyimpan.");
      const next = { ...current, ...patch };
      const { data, error } = await supabase
        .from("products")
        .upsert(productPayload(next), { onConflict: "slug" })
        .select("*")
        .single();
      if (error) throw error;
      cacheRecord(productsRepo, id, rowToItem(data));
      emitRemoteChange("products");
      return productRowToItem(data);
    });
  },
  async delete(id) {
    return writeRemote(async () => {
      const query = isUuid(id)
        ? supabase.from("products").delete().eq("id", id)
        : supabase.from("products").delete().eq("slug", id);
      const { error } = await query;
      if (error) throw error;
      deleteCachedRecord(productsRepo, id);
      emitRemoteChange("products");
    });
  },
};

export const servicesData = {
  async list(filter) {
    return tryRemote(async () => {
      let query = supabase.from("services").select("*").order("order_index", { ascending: true });
      if (filter?.status) query = query.eq("status", filter.status);
      const { data, error } = await query;
      if (error) throw error;
      return localFirstList((data ?? []).map(rowToItem), servicesRepo.list(filter));
    }, () => servicesRepo.list(filter));
  },
  async get(id) {
    return tryRemote(async () => {
      const query = isUuid(id)
        ? supabase.from("services").select("*").eq("id", id)
        : supabase.from("services").select("*").eq("slug", id);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data ? rowToItem(data) : null;
    }, () => servicesRepo.get(id));
  },
  async getBySlug(slug) {
    return tryRemote(async () => {
      const { data, error } = await supabase.from("services").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data ? rowToItem(data) : null;
    }, () => servicesRepo.getBySlug(slug));
  },
  async create(payload) {
    return writeRemote(async () => {
      const { data, error } = await supabase
        .from("services")
        .insert(servicePayload(payload))
        .select("*")
        .single();
      if (error) throw error;
      cacheRecord(servicesRepo, data.id, rowToItem(data));
      emitRemoteChange("services");
      return rowToItem(data);
    });
  },
  async update(id, patch) {
    return writeRemote(async () => {
      const current = await this.get(id);
      if (!current) throw new Error("Layanan tidak ditemukan di Supabase. Muat ulang halaman sebelum menyimpan.");
      const next = { ...current, ...patch };
      const { data, error } = await supabase
        .from("services")
        .upsert(servicePayload(next), { onConflict: "slug" })
        .select("*")
        .single();
      if (error) throw error;
      cacheRecord(servicesRepo, id, rowToItem(data));
      emitRemoteChange("services");
      return rowToItem(data);
    });
  },
  async delete(id) {
    return writeRemote(async () => {
      const query = isUuid(id)
        ? supabase.from("services").delete().eq("id", id)
        : supabase.from("services").delete().eq("slug", id);
      const { error } = await query;
      if (error) throw error;
      deleteCachedRecord(servicesRepo, id);
      emitRemoteChange("services");
    });
  },
};

export const mediaData = {
  async list() {
    return tryRemote(async () => {
      const { data, error } = await supabase.from("media").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return localFirstList((data ?? []).map(rowToItem), mediaRepo.list());
    }, () => mediaRepo.list());
  },
  async upload(file, uploadedBy) {
    return writeRemote(async () => {
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
      const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
      const upload = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, { upsert: false });
      if (upload.error) throw upload.error;
      const { data: publicUrlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
      const item = {
        path,
        url: publicUrlData.publicUrl,
        filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: cleanUuid(uploadedBy) ?? null,
        data: {},
      };
      const { data, error } = await supabase.from("media").insert(item).select("*").single();
      if (error) throw error;
      emitRemoteChange("media");
      return rowToItem(data);
    });
  },
  async delete(id) {
    return writeRemote(async () => {
      const item = await supabase.from("media").select("path").eq("id", id).maybeSingle();
      if (item.error) throw item.error;
      if (item.data?.path) await supabase.storage.from(MEDIA_BUCKET).remove([item.data.path]);
      const { error } = await supabase.from("media").delete().eq("id", id);
      if (error) throw error;
      emitRemoteChange("media");
    });
  },
};

export const contactsData = {
  async list() {
    return tryRemote(async () => {
      const { data, error } = await supabase.from("contacts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return localFirstList((data ?? []).map(rowToItem), contactsRepo.list());
    }, () => contactsRepo.list());
  },
  async create(payload) {
    return writeRemote(async () => {
      const row = contactPayload(payload);
      const { error } = await supabase.from("contacts").insert(row);
      if (error) throw error;
      emitRemoteChange("contacts");
      return row;
    });
  },
  async updateStatus(id, status) {
    return writeRemote(async () => {
      const { data, error } = await supabase.from("contacts").update({ status }).eq("id", id).select("*").single();
      if (error) throw error;
      emitRemoteChange("contacts");
      return rowToItem(data);
    });
  },
  async delete(id) {
    return writeRemote(async () => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
      emitRemoteChange("contacts");
    });
  },
};

export const newsletterData = {
  async list() {
    return tryRemote(async () => {
      const { data, error } = await supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return localFirstList((data ?? []).map(rowToItem), newsletterRepo.list());
    }, () => newsletterRepo.list());
  },
  async create(payload) {
    return writeRemote(async () => {
      const row = newsletterPayload(payload);
      const { error } = await supabase.from("newsletter_subscribers")
        .insert(row);
      if (error) {
        // 23505 = unique_violation (email already subscribed) — not a real
        // failure, just report it as already-on-the-list instead of an error.
        if (error.code === "23505") return { alreadySubscribed: true };
        throw error;
      }
      emitRemoteChange("newsletter_subscribers");
      return row;
    });
  },
  async delete(id) {
    return writeRemote(async () => {
      const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
      if (error) throw error;
      emitRemoteChange("newsletter_subscribers");
    });
  },
};

export const ordersData = {
  async list() {
    return tryRemote(async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return localFirstList((data ?? []).map(orderRowToItem), ordersRepo.list());
    }, () => ordersRepo.list());
  },
  async get(id) {
    return tryRemote(async () => {
      if (isUuid(id)) {
        const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
        if (error) throw error;
        return data ? orderRowToItem(data) : null;
      }
      const { data, error } = await supabase.rpc("get_order_by_number", { order_no: id });
      if (error) throw error;
      return data ? orderRowToItem(data) : null;
    }, () => ordersRepo.get(id));
  },
  async getByNumber(orderNumber) {
    return this.get(orderNumber);
  },
  async create(payload) {
    return writeRemote(async () => {
      const row = orderPayload(payload);
      const { error } = await supabase.from("orders").insert(row);
      if (error) throw error;
      emitRemoteChange("orders");
      return orderRowToItem(row);
    });
  },
  async updateStatus(id, status, extra = {}) {
    return writeRemote(async () => {
      const current = await this.get(id);
      if (!current) throw new Error("Pesanan tidak ditemukan di Supabase. Muat ulang halaman sebelum mengubah status.");
      const nextData = { ...(current ?? {}), ...extra, status };
      const { data, error } = await supabase
        .from("orders")
        .update({ status, data: nextData })
        .eq(isUuid(id) ? "id" : "order_number", id)
        .select("*")
        .single();
      if (error) throw error;
      emitRemoteChange("orders");
      return orderRowToItem(data);
    });
  },
  async uploadProof(id, dataUrl) {
    return writeRemote(async () => {
      const order = await this.get(id);
      const orderNumber = order?.order_number ?? id;
      const { data, error } = await supabase.rpc("mark_order_waiting_verification", {
        order_no: orderNumber,
        proof_url: dataUrl,
      });
      if (error) throw error;
      if (!data) throw new Error("Status pesanan tidak dapat diperbarui. Muat ulang halaman dan coba lagi.");
      emitRemoteChange("orders");
      return orderRowToItem(data);
    });
  },
  async approve(id, note) {
    return this.updateStatus(id, ORDER_STATUS.PAID, { admin_note: note ?? null });
  },
  async reject(id, note) {
    return this.updateStatus(id, ORDER_STATUS.REJECTED, { admin_note: note ?? null });
  },
};

export const usersData = {
  async list() {
    return tryRemote(async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return localFirstList(data ?? [], usersRepo.list());
    }, () => usersRepo.list());
  },
  async updateRole(id, role) {
    return writeRemote(async () => {
      const { data, error } = await supabase.from("profiles").update({ role }).eq("id", id).select("*").single();
      if (error) throw error;
      emitRemoteChange("profiles");
      return data;
    });
  },
};

export async function getRemoteStats() {
  return tryRemote(async () => {
    const [posts, products, services, contacts, orders, media, users] = await Promise.all([
      postsData.list(),
      productsData.list(),
      servicesData.list(),
      contactsData.list(),
      ordersData.list(),
      mediaData.list(),
      usersData.list(),
    ]);
    return {
      posts: posts.length,
      products: products.length,
      services: services.length,
      contacts: contacts.length,
      contactsUnread: contacts.filter((c) => c.status === "new").length,
      orders: orders.length,
      media: media.length,
      users: users.length,
    };
  }, async () => null);
}
