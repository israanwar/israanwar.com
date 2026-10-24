// Browser-session cart, split out of localStore.js so public pages can use it
// without pulling the full local fallback store (and its seed catalog) into
// the initial bundle. Same storage key and change event as before.
//
// Every product in the store is a digital download, so a buyer needs exactly
// one license per product. Quantity is therefore fixed at 1: adding the same
// product again (a second click, "Buy now" after "Add to cart", or a cart
// saved by an older version) never raises it.
import { STORE_TRANSACTIONS_CLOSED } from "../data/storeStatus.js";

const CART_KEY = "okr:cart";
const listeners = new Set();

function normalize(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const list = [];
  for (const item of raw) {
    const id = item && typeof item.product_id === "string" ? item.product_id : "";
    if (!id || seen.has(id)) continue;
    seen.add(id);
    list.push({ product_id: id, qty: 1 });
  }
  return list;
}

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? normalize(JSON.parse(raw)) : [];
  } catch { return []; }
}

function writeCart(list) {
  localStorage.setItem(CART_KEY, JSON.stringify(list));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("okr:local-store-change", { detail: { key: CART_KEY } }));
  }
  listeners.forEach((fn) => fn(list));
}

// How many unavailable items were dropped from the cart, remembered for the
// session so the cart page can tell the buyer even after a redirect.
const NOTICE_KEY = "okr:cart-removed";

export const cartNotice = {
  read() {
    try { return Number(sessionStorage.getItem(NOTICE_KEY)) || 0; } catch { return 0; }
  },
  add(count) {
    try { sessionStorage.setItem(NOTICE_KEY, String(cartNotice.read() + count)); } catch { /* optional */ }
    return cartNotice.read();
  },
  clear() {
    try { sessionStorage.removeItem(NOTICE_KEY); } catch { /* optional */ }
  },
};

export const cartStore = {
  list() { return readCart(); },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  // Idempotent: a product already in the cart stays at one license.
  add(productId) {
    if (STORE_TRANSACTIONS_CLOSED) return readCart();
    const list = readCart();
    if (list.some((item) => item.product_id === productId)) return list;
    list.push({ product_id: productId, qty: 1 });
    writeCart(list);
    return list;
  },
  // Kept for the old API. A positive quantity changes nothing; zero or less removes.
  setQty(productId, qty) {
    const list = readCart();
    if (!list.some((item) => item.product_id === productId)) return list;
    if (qty > 0) return list;
    const next = list.filter((item) => item.product_id !== productId);
    writeCart(next);
    return next;
  },
  remove(productId) {
    writeCart(readCart().filter((it) => it.product_id !== productId));
  },
  clear() { writeCart([]); },
  count() { return readCart().length; },
};
