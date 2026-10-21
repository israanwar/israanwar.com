export const PRODUCT_PRICE_DISCOUNT_RATE = 0.7;
export const PRODUCT_PRICE_MULTIPLIER = 1 - PRODUCT_PRICE_DISCOUNT_RATE;

const PRODUCT_FINAL_PRICE_OVERRIDES = {
  "modul-google-adsense-advanced": 989000,
  "modul-tunecore-soundon": 389000,
};

// Normal (pre-discount) prices set here win over the value stored in the
// products table, so a price can be corrected by a deploy. Each entry is the
// normal price; the site discount below still applies on top of it.
const PRODUCT_NORMAL_PRICE_OVERRIDES = {
  "modul-social-media-optimization": 98000,
  "modul-ai-prompting": 130000,
  "modul-blogging-platform": 130000,
  "modul-seo-copywriting": 135000,
  "modul-email-marketing": 150000,
  "modul-backlink-building": 150000,
};

export function discountedProductPrice(value) {
  const price = Number(value) || 0;
  return Math.max(0, Math.round(price * PRODUCT_PRICE_MULTIPLIER));
}

export function applyProductPriceDiscount(product) {
  if (!product) return product;
  const finalPriceOverride = PRODUCT_FINAL_PRICE_OVERRIDES[product.slug];
  if (finalPriceOverride != null) {
    return {
      ...product,
      original_price: finalPriceOverride,
      price: finalPriceOverride,
      price_discount_applied: true,
      price_discount_rate: 0,
    };
  }
  const normalPriceOverride = PRODUCT_NORMAL_PRICE_OVERRIDES[product.slug];
  if (normalPriceOverride != null) {
    return {
      ...product,
      original_price: normalPriceOverride,
      price: discountedProductPrice(normalPriceOverride),
      price_discount_applied: true,
      price_discount_rate: PRODUCT_PRICE_DISCOUNT_RATE,
    };
  }
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
