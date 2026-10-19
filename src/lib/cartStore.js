// Browser-session cart, split out of localStore.js so public pages can use it
// without pulling the full local fallback store (and its seed catalog) into
// the initial bundle. Same storage key and change event as before.
const CART_KEY = "okr:cart";
const listeners = new Set();

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeCart(list) {
  localStorage.setItem(CART_KEY, JSON.stringify(list));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("okr:local-store-change", { detail: { key: CART_KEY } }));
  }
  listeners.forEach((fn) => fn(list));
}

export const cartStore = {
  list() { return readCart(); },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  add(productId, qty = 1) {
    const list = readCart();
    const i = list.findIndex((it) => it.product_id === productId);
    if (i >= 0) list[i].qty += qty;
    else list.push({ product_id: productId, qty });
    writeCart(list);
    return list;
  },
  setQty(productId, qty) {
    const list = readCart();
    const i = list.findIndex((it) => it.product_id === productId);
    if (i < 0) return list;
    if (qty <= 0) list.splice(i, 1);
    else list[i].qty = qty;
    writeCart(list);
    return list;
  },
  remove(productId) {
    writeCart(readCart().filter((it) => it.product_id !== productId));
  },
  clear() { writeCart([]); },
  count() { return readCart().reduce((s, it) => s + it.qty, 0); },
};
