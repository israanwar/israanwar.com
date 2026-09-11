export const PRODUCT_PRICE_DISCOUNT_RATE = 0.7;
export const PRODUCT_PRICE_MULTIPLIER = 1 - PRODUCT_PRICE_DISCOUNT_RATE;

export function discountedProductPrice(value) {
  const price = Number(value) || 0;
  return Math.max(0, Math.round(price * PRODUCT_PRICE_MULTIPLIER));
}

export function applyProductPriceDiscount(product) {
  if (!product) return product;
  if (product.price_discount_applied) return product;

  const originalPrice = Number(product.price ?? 0) || 0;
  return {
    ...product,
    original_price: product.original_price ?? originalPrice,
    price: discountedProductPrice(originalPrice),
    price_discount_applied: true,
    price_discount_rate: PRODUCT_PRICE_DISCOUNT_RATE,
  };
}

export function applyProductPriceDiscounts(products) {
  return Array.isArray(products) ? products.map(applyProductPriceDiscount) : products;
}
