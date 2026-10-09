import { publicBootstrap } from "../lib/publicBootstrap";
import { useEffect, useMemo, useState } from "react";
import {
  pagesRepo, settingsRepo, homepageRepo, productsRepo,
  servicesRepo, postsRepo, cartRepo,
} from "../lib/localStore";
import {
  pagesData, settingsData, homepageData, productsData,
  servicesData, postsData,
} from "../lib/supabaseData";
import { ensureRemoteChangeBridge } from "../lib/supabaseClient";
import { affectsLiveData, storageChangeKey } from "../lib/liveDataEvents";
import { applyProductPriceDiscount, applyProductPriceDiscounts } from "../lib/productPricing";
import { normalizePortfolioProjects } from "../lib/portfolioProjects";

// Shared per-key cache so multiple components asking for the same data
// (e.g. site settings requested by both the header and a page body) share
// one fetch, one set of global listeners, and one cached value instead of
// each mounted component re-fetching and re-subscribing independently.
const cacheStore = new Map();
export function getPublicDataSnapshot() {
 return Object.fromEntries([...cacheStore].filter(([key])=>/^(settings|homepage|page:|products:|product:|services:|service:|posts:|post:)/.test(key)).map(([key,entry])=>[key,entry.value]));
}

function getEntry(key, fallbackFn) {
  let entry = cacheStore.get(key);
  if (!entry) {
    entry = {
      value: Object.hasOwn(publicBootstrap?.data ?? {}, key) ? publicBootstrap.data[key] : fallbackFn(),
      loading: !Object.hasOwn(publicBootstrap?.data ?? {}, key),
      error: null,
      listeners: new Set(),
      frame: 0,
      requestId: 0,
      cleanupGlobal: null,
    };
    cacheStore.set(key, entry);
  }
  return entry;
}

function notify(entry) {
  const snapshot = { value: entry.value, loading: entry.loading, error: entry.error };
  entry.listeners.forEach((fn) => fn(snapshot));
}

function scheduleRefresh(key, readFn) {
  const entry = cacheStore.get(key);
  if (!entry) return;
  if (entry.frame) cancelAnimationFrame(entry.frame);
  entry.frame = requestAnimationFrame(async () => {
    entry.frame = 0;
    const id = ++entry.requestId;
    entry.loading = true;
    entry.error = null;
    notify(entry);
    try {
      const next = await readFn();
      if (id === entry.requestId) {
        entry.value = next;
        entry.loading = false;
        entry.error = null;
        notify(entry);
      }
    } catch (error) {
      console.warn("[israanwar:live-data]", error?.message ?? error);
      if (id === entry.requestId) {
        entry.loading = false;
        entry.error = error;
        notify(entry);
      }
    }
  });
}

// Universal auto-refresh hook — updates on local writes, storage changes from
// other tabs, visibility return, or window focus. Avoid polling: rerendering a
// long product grid during scroll is expensive and visibly janky.
//
// `key` identifies *what* is being read (e.g. "settings", "products:active").
// Every component asking for the same key shares one fetch/subscription —
// the first mounted subscriber sets it up, the last one to unmount tears it
// down; everyone in between just reads the shared cached value.
function useLiveState(key, readFn, fallbackFn, enabled = true) {
  const [state, setState] = useState(() => {
    // A closed chat or empty cart does not need to parse its full local
    // fallback catalog either. Initialize it when the consumer is enabled.
    if (!enabled) return { value: undefined, loading: true, error: null };
    const entry = getEntry(key, fallbackFn);
    return { value: entry.value, loading: entry.loading, error: entry.error };
  });

  useEffect(() => {
    if (!enabled) return undefined;
    const entry = getEntry(key, fallbackFn);
    setState({ value: entry.value, loading: entry.loading, error: entry.error });
    entry.listeners.add(setState);

    if (entry.listeners.size === 1) {
      const releaseBridge = ensureRemoteChangeBridge(key);
      const refresh = () => scheduleRefresh(key, readFn);
      const onChange = (event) => {
        if (affectsLiveData(key, event.detail?.key)) refresh();
      };
      const onStorage = (event) => {
        if (affectsLiveData(key, storageChangeKey(event))) refresh();
      };
      const onVis = () => { if (!document.hidden) refresh(); };
      document.addEventListener("visibilitychange", onVis);
      window.addEventListener("focus", refresh);
      window.addEventListener("storage", onStorage);
      window.addEventListener("okr:local-store-change", onChange);
      window.addEventListener("okr:remote-store-change", onChange);
      entry.cleanupGlobal = () => {
        document.removeEventListener("visibilitychange", onVis);
        window.removeEventListener("focus", refresh);
        window.removeEventListener("storage", onStorage);
        window.removeEventListener("okr:local-store-change", onChange);
        window.removeEventListener("okr:remote-store-change", onChange);
        releaseBridge();
      };
      refresh();
    }

    return () => {
      entry.listeners.delete(setState);
      if (entry.listeners.size === 0) {
        if (entry.frame) cancelAnimationFrame(entry.frame);
        entry.frame = 0;
        entry.requestId += 1;
        entry.cleanupGlobal?.();
        entry.cleanupGlobal = null;
      }
    };
  }, [key, enabled]);

  return state;
}

function useLive(key, readFn, fallbackFn, enabled = true) {
  return useLiveState(key, readFn, fallbackFn, enabled).value;
}

// Pages (about, contact, portfolio, privacy, terms)
export function useLivePage(key, { enabled = true } = {}) {
  return useLive(
    `page:${key}`,
    () => pagesData.get(key),
    () => key === "portfolio" ? normalizePortfolioProjects(pagesRepo.get(key)) : pagesRepo.get(key) ?? {},
    enabled,
  ) ?? {};
}

// Global site settings
export function useLiveSettings({ enabled = true } = {}) {
  return useLive("settings", () => settingsData.get(), () => settingsRepo.get() ?? {}, enabled) ?? {};
}

// Homepage sections (hero, cta, process, services list, cases list)
export function useLiveHomepage() {
  return useLive("homepage", () => homepageData.getAll(), () => homepageRepo.getAll() ?? {}) ?? {};
}

// Store products
export function useLiveProducts(filter, { enabled = true } = {}) {
  const status = filter?.status;
  const rows = useLive(
    `products:${status ?? "all"}`,
    () => productsData.list(status ? { status } : undefined),
    () => applyProductPriceDiscounts(productsRepo.list(status ? { status } : undefined)),
    enabled,
  );
  return Array.isArray(rows) ? rows : [];
}
// Cheap boolean-only check (nav "Store" link visibility) — shares one
// lightweight query across every page instead of each page pulling the
// full product catalog just to know whether it's non-empty.
export function useLiveProductsExist() {
  return useLive(
    "products:exists",
    () => productsData.exists(),
    () => productsRepo.list().length > 0,
  ) ?? false;
}
export function useLiveProduct(slug) {
  return useLive(
    `product:${slug}`,
    () => productsData.getBySlug(slug),
    () => applyProductPriceDiscount(productsRepo.getBySlug(slug)),
  );
}
export function useLiveProductState(slug) {
  return useLiveState(
    `product:${slug}`,
    () => productsData.getBySlug(slug),
    () => applyProductPriceDiscount(productsRepo.getBySlug(slug)),
  );
}

// Services
export function useLiveServices(filter, { enabled = true } = {}) {
  const status = filter?.status;
  const view = filter?.view;
  const rows = useLive(
    `services:${status ?? "all"}${view ? `:view=${view}` : ""}`,
    () => servicesData.list({ status, view }),
    () => servicesRepo.list(status ? { status } : undefined),
    enabled,
  );
  return Array.isArray(rows) ? rows : [];
}
export function useLiveService(slug) {
  return useLive(`service:${slug}`, () => servicesData.getBySlug(slug), () => servicesRepo.getBySlug(slug));
}
export function useLiveServiceState(slug) {
  return useLiveState(`service:${slug}`, () => servicesData.getBySlug(slug), () => servicesRepo.getBySlug(slug));
}

// Blog posts
export function useLivePosts(filter, { enabled = true } = {}) {
  const status = filter?.status;
  const limit = filter?.limit;
  const view = filter?.view;
  const rows = useLive(
    `posts:${status ?? "all"}${limit ? `:limit=${limit}` : ""}${view ? `:view=${view}` : ""}`,
    () => postsData.list({ status, limit, view }),
    () => {
      const items = postsRepo.list(status ? { status } : undefined);
      return limit ? items.slice(0, limit) : items;
    },
    enabled,
  );
  return Array.isArray(rows) ? rows : [];
}
export function useLivePost(slug) {
  return useLive(`post:${slug}`, () => postsData.getBySlug(slug), () => postsRepo.getBySlug(slug));
}
export function useLivePostState(slug) {
  return useLiveState(`post:${slug}`, () => postsData.getBySlug(slug), () => postsRepo.getBySlug(slug));
}

// Cart — pakai listener bawaan cartRepo (lebih responsif dari polling).
// cartRepo itself only persists { product_id, qty } pairs; it has no way
// to resolve those against the real (Supabase-backed) product catalog, so
// row/total data is built here from the live product list instead of
// cartRepo.detail() (which resolved against the local-only product
// mirror — always empty for a Supabase-backed store, so every cart item
// was silently dropped and checkout looked "empty" for every product).
export function useLiveCart() {
  const [items, setItems] = useState(() => publicBootstrap ? [] : cartRepo.list());
  const products = useLiveProducts(undefined, { enabled: items.length > 0 });
  useEffect(() => {
    setItems(cartRepo.list());
    const off = cartRepo.onChange(setItems);
    return off;
  }, []);
  return useMemo(() => {
    const rows = items.map((it) => {
      const product = products.find((p) => p.id === it.product_id);
      if (!product) return null;
      return { ...it, product, subtotal: (product.price ?? 0) * it.qty };
    }).filter(Boolean);
    const total = rows.reduce((sum, row) => sum + row.subtotal, 0);
    // itemCount reflects the raw cart (synchronous, from localStorage) —
    // unlike `rows`, it doesn't wait on the live product fetch, so pages
    // that redirect away on an "empty" cart don't fire that redirect
    // during the one render where products just haven't loaded yet.
    return { rows, total, itemCount: items.length };
  }, [items, products]);
}
