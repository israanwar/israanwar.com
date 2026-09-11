import { useEffect, useState } from "react";
import {
  pagesRepo, settingsRepo, homepageRepo, productsRepo,
  servicesRepo, postsRepo, cartRepo,
} from "../lib/localStore";
import {
  pagesData, settingsData, homepageData, productsData,
  servicesData, postsData,
} from "../lib/supabaseData";
import { ensureRemoteChangeBridge } from "../lib/supabaseClient";
import { applyProductPriceDiscount, applyProductPriceDiscounts } from "../lib/productPricing";
import { normalizePortfolioProjects } from "../lib/portfolioProjects";

// Shared per-key cache so multiple components asking for the same data
// (e.g. site settings requested by both the header and a page body) share
// one fetch, one set of global listeners, and one cached value instead of
// each mounted component re-fetching and re-subscribing independently.
const cacheStore = new Map();

function getEntry(key, fallbackFn) {
  let entry = cacheStore.get(key);
  if (!entry) {
    entry = {
      value: fallbackFn(),
      loading: true,
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
function useLiveState(key, readFn, fallbackFn) {
  const [state, setState] = useState(() => {
    const entry = getEntry(key, fallbackFn);
    return { value: entry.value, loading: entry.loading, error: entry.error };
  });

  useEffect(() => {
    const entry = getEntry(key, fallbackFn);
    setState({ value: entry.value, loading: entry.loading, error: entry.error });
    entry.listeners.add(setState);

    if (entry.listeners.size === 1) {
      ensureRemoteChangeBridge();
      const refresh = () => scheduleRefresh(key, readFn);
      const onVis = () => { if (!document.hidden) refresh(); };
      document.addEventListener("visibilitychange", onVis);
      window.addEventListener("focus", refresh);
      window.addEventListener("storage", refresh);
      window.addEventListener("okr:local-store-change", refresh);
      window.addEventListener("okr:remote-store-change", refresh);
      entry.cleanupGlobal = () => {
        document.removeEventListener("visibilitychange", onVis);
        window.removeEventListener("focus", refresh);
        window.removeEventListener("storage", refresh);
        window.removeEventListener("okr:local-store-change", refresh);
        window.removeEventListener("okr:remote-store-change", refresh);
      };
      refresh();
    }

    return () => {
      entry.listeners.delete(setState);
      if (entry.listeners.size === 0) {
        if (entry.frame) cancelAnimationFrame(entry.frame);
        entry.cleanupGlobal?.();
        entry.cleanupGlobal = null;
      }
    };
  }, [key]);

  return state;
}

function useLive(key, readFn, fallbackFn) {
  return useLiveState(key, readFn, fallbackFn).value;
}

// Pages (about, contact, portfolio, privacy, terms)
export function useLivePage(key) {
  return useLive(
    `page:${key}`,
    () => pagesData.get(key),
    () => key === "portfolio" ? normalizePortfolioProjects(pagesRepo.get(key)) : pagesRepo.get(key) ?? {},
  ) ?? {};
}

// Global site settings
export function useLiveSettings() {
  return useLive("settings", () => settingsData.get(), () => settingsRepo.get() ?? {}) ?? {};
}

// Homepage sections (hero, cta, process, services list, cases list)
export function useLiveHomepage() {
  return useLive("homepage", () => homepageData.getAll(), () => homepageRepo.getAll() ?? {}) ?? {};
}

// Store products
export function useLiveProducts(filter) {
  const status = filter?.status;
  const rows = useLive(
    `products:${status ?? "all"}`,
    () => productsData.list(status ? { status } : undefined),
    () => applyProductPriceDiscounts(productsRepo.list(status ? { status } : undefined)),
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
export function useLiveServices(filter) {
  const status = filter?.status;
  const rows = useLive(
    `services:${status ?? "all"}`,
    () => servicesData.list(status ? { status } : undefined),
    () => servicesRepo.list(status ? { status } : undefined),
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
export function useLivePosts(filter) {
  const status = filter?.status;
  const rows = useLive(
    `posts:${status ?? "all"}`,
    () => postsData.list(status ? { status } : undefined),
    () => postsRepo.list(status ? { status } : undefined),
  );
  return Array.isArray(rows) ? rows : [];
}
export function useLivePost(slug) {
  return useLive(`post:${slug}`, () => postsData.getBySlug(slug), () => postsRepo.getBySlug(slug));
}
export function useLivePostState(slug) {
  return useLiveState(`post:${slug}`, () => postsData.getBySlug(slug), () => postsRepo.getBySlug(slug));
}

// Cart — pakai listener bawaan cartRepo (lebih responsif dari polling)
export function useLiveCart() {
  const [detail, setDetail] = useState(() => cartRepo.detail());
  useEffect(() => {
    const off = cartRepo.onChange(() => setDetail(cartRepo.detail()));
    return off;
  }, []);
  return detail;
}
