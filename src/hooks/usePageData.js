import { preservePublicValue, preserveLiveSnapshot } from "../lib/liveDataSnapshot.js";
import { publicBootstrap } from "../lib/publicBootstrap";
import { useEffect, useMemo, useState } from "react";
import { cartStore as cartRepo, cartNotice } from "../lib/cartStore";
import { buildCartView } from "../lib/cartView";
import { getLoadedLocalStore } from "../lib/localStoreLoader";
import {
  pagesData, settingsData, homepageData, productsData,
  servicesData, postsData,
} from "../lib/supabaseData";
import { ensureRemoteChangeBridge } from "../lib/supabaseClient";
import { affectsLiveData, storageChangeKey } from "../lib/liveDataEvents";
import { applyProductPriceDiscount, applyProductPriceDiscounts } from "../lib/productPricing";
import { normalizePortfolioProjects } from "../lib/portfolioProjects";

// The local fallback store (localStore.js) carries the full offline seed
// catalog, so it is not part of the initial bundle. Public pages get their
// first values from the prerendered bootstrap and then from Supabase; the
// local store is only read once something has loaded it (no Supabase, a
// failed remote read, or the admin), and until then fallbacks are empty.
function fromLocal(read, empty) {
  return () => {
    const localStore = getLoadedLocalStore();
    return localStore ? read(localStore) : empty;
  };
}

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
        entry.value = preservePublicValue(key, entry.value, next);
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
function useLiveState(key, readFn, fallbackFn, enabled = true, valueOnly = false) {
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
    let current = state;
    const update = (next) => {
      const retained = preserveLiveSnapshot(current, next, valueOnly);
      if (retained === current) return;
      current = retained;
      setState(retained);
    };
    update({ value: entry.value, loading: entry.loading, error: entry.error });
    entry.listeners.add(update);

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
      entry.listeners.delete(update);
      if (entry.listeners.size === 0) {
        if (entry.frame) cancelAnimationFrame(entry.frame);
        entry.frame = 0;
        entry.requestId += 1;
        entry.cleanupGlobal?.();
        entry.cleanupGlobal = null;
      }
    };
  }, [key, enabled, valueOnly]);

  return state;
}

function useLive(key, readFn, fallbackFn, enabled = true) {
  return useLiveState(key, readFn, fallbackFn, enabled, true).value;
}

// Pages (about, contact, portfolio, privacy, terms)
export function useLivePage(key, { enabled = true } = {}) {
  return useLive(
    `page:${key}`,
    () => pagesData.get(key),
    fromLocal(({ pagesRepo }) => key === "portfolio" ? normalizePortfolioProjects(pagesRepo.get(key)) : pagesRepo.get(key) ?? {}, {}),
    enabled,
  ) ?? {};
}

// Global site settings
export function useLiveSettings({ enabled = true } = {}) {
  return useLive("settings", () => settingsData.get(), fromLocal(({ settingsRepo }) => settingsRepo.get() ?? {}, {}), enabled) ?? {};
}

// Homepage sections (hero, cta, process, services list, cases list)
export function useLiveHomepage() {
  return useLive("homepage", () => homepageData.getAll(), fromLocal(({ homepageRepo }) => homepageRepo.getAll() ?? {}, {})) ?? {};
}

// Store products
export function useLiveProducts(filter, { enabled = true } = {}) {
  const status = filter?.status;
  const rows = useLive(
    `products:${status ?? "all"}`,
    () => productsData.list(status ? { status } : undefined),
    fromLocal(({ productsRepo }) => applyProductPriceDiscounts(productsRepo.list(status ? { status } : undefined)), []),
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
    fromLocal(({ productsRepo }) => productsRepo.list().length > 0, false),
  ) ?? false;
}
export function useLiveProduct(slug) {
  return useLive(
    `product:${slug}`,
    () => productsData.getBySlug(slug),
    fromLocal(({ productsRepo }) => applyProductPriceDiscount(productsRepo.getBySlug(slug)), undefined),
  );
}
export function useLiveProductState(slug) {
  return useLiveState(
    `product:${slug}`,
    () => productsData.getBySlug(slug),
    fromLocal(({ productsRepo }) => applyProductPriceDiscount(productsRepo.getBySlug(slug)), undefined),
  );
}

// Services
export function useLiveServices(filter, { enabled = true } = {}) {
  const status = filter?.status;
  const view = filter?.view;
  const rows = useLive(
    `services:${status ?? "all"}${view ? `:view=${view}` : ""}`,
    () => servicesData.list({ status, view }),
    fromLocal(({ servicesRepo }) => servicesRepo.list(status ? { status } : undefined), []),
    enabled,
  );
  return Array.isArray(rows) ? rows : [];
}
export function useLiveService(slug) {
  return useLive(`service:${slug}`, () => servicesData.getBySlug(slug), fromLocal(({ servicesRepo }) => servicesRepo.getBySlug(slug), undefined));
}
export function useLiveServiceState(slug) {
  return useLiveState(`service:${slug}`, () => servicesData.getBySlug(slug), fromLocal(({ servicesRepo }) => servicesRepo.getBySlug(slug), undefined));
}

// Blog posts
export function useLivePosts(filter, { enabled = true } = {}) {
  const status = filter?.status;
  const limit = filter?.limit;
  const view = filter?.view;
  const rows = useLive(
    `posts:${status ?? "all"}${limit ? `:limit=${limit}` : ""}${view ? `:view=${view}` : ""}`,
    () => postsData.list({ status, limit, view }),
    fromLocal(({ postsRepo }) => {
      const items = postsRepo.list(status ? { status } : undefined);
      return limit ? items.slice(0, limit) : items;
    }, []),
    enabled,
  );
  return Array.isArray(rows) ? rows : [];
}
export function useLivePost(slug) {
  return useLive(`post:${slug}`, () => postsData.getBySlug(slug), fromLocal(({ postsRepo }) => postsRepo.getBySlug(slug), undefined));
}
export function useLivePostState(slug) {
  return useLiveState(`post:${slug}`, () => postsData.getBySlug(slug), fromLocal(({ postsRepo }) => postsRepo.getBySlug(slug), undefined));
}

// Cart — pakai listener bawaan cartRepo (lebih responsif dari polling).
// cartRepo itself only persists { product_id, qty } pairs; it has no way
// to resolve those against the real (Supabase-backed) product catalog, so
// row/total data is built here from the live product list instead of
// cartRepo.detail() (which resolved against the local-only product
// mirror — always empty for a Supabase-backed store, so every cart item
// was silently dropped and checkout looked "empty" for every product).
// Prerendered HTML is built with an empty cart, so only the components that
// hydrate that HTML (the first mount, e.g. the header badge) may start empty.
// Anything mounted after hydration, like /checkout reached by an in-app link,
// must read the cart synchronously or it sees "empty" and redirects to /cart.
let cartHydrated = false;

export function useLiveCart() {
  const [items, setItems] = useState(() => publicBootstrap && !cartHydrated ? [] : cartRepo.list());
  const [removed, setRemoved] = useState(0);
  const products = useLiveProducts(undefined, { enabled: items.length > 0 });
  useEffect(() => {
    cartHydrated = true;
    setItems(cartRepo.list());
    setRemoved(cartNotice.read());
    const off = cartRepo.onChange(setItems);
    return off;
  }, []);
  const view = useMemo(() => buildCartView(items, products), [items, products]);
  // Products that were deleted, drafted or priced at zero can never be bought,
  // so they leave the cart (once the catalog has really loaded) instead of
  // sitting there and blocking checkout.
  useEffect(() => {
    if (!view.ready || view.unavailable.length === 0) return;
    view.unavailable.forEach((id) => cartRepo.remove(id));
    setRemoved(cartNotice.add(view.unavailable.length));
  }, [view]);
  // itemCount reflects the raw cart (synchronous, from localStorage), unlike
  // `rows`, it doesn't wait on the live product fetch, so pages that redirect
  // away on an "empty" cart don't fire that redirect during the one render
  // where products just haven't loaded yet.
  return useMemo(() => ({ ...view, removed }), [view, removed]);
}
