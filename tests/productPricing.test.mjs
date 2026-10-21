import test from 'node:test';
import assert from 'node:assert/strict';
import { applyProductPriceDiscount, discountedProductPrice } from '../src/lib/productPricing.js';

const stored = (slug, price, original) => ({ slug, price, original_price: original, price_discount_applied: true, price_discount_rate: 0.7 });

test('corrected normal prices override the stored value and keep the 70% discount', () => {
  const cases = [
    ['modul-social-media-optimization', 98000, 29400],
    ['modul-ai-prompting', 130000, 39000],
    ['modul-blogging-platform', 130000, 39000],
    ['modul-seo-copywriting', 135000, 40500],
    ['modul-email-marketing', 150000, 45000],
    ['modul-backlink-building', 150000, 45000],
  ];
  for (const [slug, normal, sale] of cases) {
    const item = applyProductPriceDiscount(stored(slug, 100, 333));
    assert.equal(item.original_price, normal, slug);
    assert.equal(item.price, sale, slug);
    assert.equal(item.price, discountedProductPrice(normal), slug);
  }
});

test('products without an override keep their stored discounted price', () => {
  const item = applyProductPriceDiscount(stored('modul-google-adsense', 88800, 296000));
  assert.equal(item.price, 88800);
  assert.equal(item.original_price, 296000);
});

test('fixed final prices stay undiscounted', () => {
  const item = applyProductPriceDiscount({ slug: 'modul-google-adsense-advanced', price: 1 });
  assert.equal(item.price, 989000);
  assert.equal(item.price_discount_rate, 0);
});
