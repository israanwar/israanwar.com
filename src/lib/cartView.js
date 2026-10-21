// Turns the raw cart ({ product_id, qty } pairs) and the live product list
// into what the cart and checkout pages show, and decides whether an order may
// be placed. Kept free of React so it can be tested on its own.
//
// An order may only be placed when every cart item resolves to an active
// product with a real price. Anything else (still loading, deleted, draft,
// Rp 0) blocks checkout instead of creating an empty or free order.
export function buildCartView(items, products) {
  // With no items there is nothing to wait for; otherwise the catalog must
  // have arrived before an unresolved item can be called unavailable.
  const ready = items.length === 0 || products.length > 0;
  const rows = [];
  const unavailable = [];

  for (const item of items) {
    const product = products.find((p) => p.id === item.product_id);
    if (!product) {
      if (ready) unavailable.push(item.product_id);
      continue;
    }
    const price = Number(product.price) || 0;
    if ((product.status ?? "active") !== "active" || price <= 0) {
      unavailable.push(item.product_id);
      continue;
    }
    // One license per digital product, whatever the stored quantity says.
    rows.push({ ...item, qty: 1, product, subtotal: price });
  }

  const total = rows.reduce((sum, row) => sum + row.subtotal, 0);
  const purchasable = ready && rows.length === items.length && rows.length > 0 && unavailable.length === 0 && total > 0;
  return { rows, total, itemCount: items.length, ready, unavailable, purchasable };
}
