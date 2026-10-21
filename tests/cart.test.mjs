import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCartView } from '../src/lib/cartView.js';

// A tiny browser stand-in so the real cartStore module runs unchanged.
const memory = new Map();
globalThis.localStorage = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => memory.set(k, String(v)),
  removeItem: (k) => memory.delete(k),
};
globalThis.window = { dispatchEvent() {} };
const session = new Map();
globalThis.sessionStorage = {
  getItem: (k) => (session.has(k) ? session.get(k) : null),
  setItem: (k, v) => session.set(k, String(v)),
  removeItem: (k) => session.delete(k),
};
const { cartStore, cartNotice } = await import('../src/lib/cartStore.js');

const stored = () => JSON.parse(memory.get('okr:cart') ?? '[]');
const reset = () => memory.clear();

test('adding the same product again never raises the quantity', () => {
  reset();
  cartStore.add('p1');
  cartStore.add('p1');
  cartStore.add('p1', 5);
  assert.deepEqual(stored(), [{ product_id: 'p1', qty: 1 }]);
  assert.equal(cartStore.count(), 1);
});

test('"Add to cart" followed by "Buy now" keeps one license', () => {
  reset();
  cartStore.add('jago'); // Add to cart
  cartStore.add('jago'); // Buy now on the same product
  assert.equal(cartStore.list().length, 1);
  assert.equal(cartStore.list()[0].qty, 1);
});

test('a cart saved by an older version with qty 2 is read as one license', () => {
  reset();
  memory.set('okr:cart', JSON.stringify([{ product_id: 'jago', qty: 2 }, { product_id: 'other', qty: 7 }]));
  assert.deepEqual(cartStore.list(), [{ product_id: 'jago', qty: 1 }, { product_id: 'other', qty: 1 }]);
  assert.equal(cartStore.count(), 2);
});

test('duplicate and malformed entries are cleaned up on read', () => {
  reset();
  memory.set('okr:cart', JSON.stringify([{ product_id: 'a', qty: 1 }, { product_id: 'a', qty: 3 }, null, { qty: 2 }, { product_id: 42 }, 'x']));
  assert.deepEqual(cartStore.list(), [{ product_id: 'a', qty: 1 }]);
  memory.set('okr:cart', '{not json');
  assert.deepEqual(cartStore.list(), []);
  memory.set('okr:cart', JSON.stringify({ not: 'an array' }));
  assert.deepEqual(cartStore.list(), []);
});

test('setQty can remove but never raise a quantity', () => {
  reset();
  cartStore.add('p1');
  cartStore.setQty('p1', 4);
  assert.equal(cartStore.list()[0].qty, 1);
  cartStore.setQty('p1', 0);
  assert.deepEqual(cartStore.list(), []);
  assert.deepEqual(cartStore.setQty('missing', 3), []);
});

test('remove and clear empty the cart and notify listeners', () => {
  reset();
  const seen = [];
  const off = cartStore.onChange((list) => seen.push(list.length));
  cartStore.add('a');
  cartStore.add('b');
  cartStore.remove('a');
  cartStore.clear();
  off();
  assert.deepEqual(seen, [1, 2, 1, 0]);
});

/* ---------------------------------------------------------------- cart view */

const product = (over = {}) => ({ id: 'p1', status: 'active', price: 45900, ...over });
const item = (id = 'p1', qty = 1) => ({ product_id: id, qty });

test('a normal cart is purchasable with the right total', () => {
  const view = buildCartView([item('p1'), item('p2')], [product(), product({ id: 'p2', price: 10000 })]);
  assert.equal(view.purchasable, true);
  assert.equal(view.total, 55900);
  assert.deepEqual(view.rows.map((r) => r.qty), [1, 1]);
});

test('quantity in the stored cart never multiplies the price', () => {
  const view = buildCartView([item('p1', 2)], [product()]);
  assert.equal(view.rows[0].qty, 1);
  assert.equal(view.total, 45900);
});

test('an empty cart is ready but not purchasable', () => {
  const view = buildCartView([], []);
  assert.equal(view.ready, true);
  assert.equal(view.purchasable, false);
  assert.equal(view.itemCount, 0);
});

test('while the catalog is still loading nothing is purchasable or removed', () => {
  const view = buildCartView([item('p1')], []);
  assert.equal(view.ready, false);
  assert.equal(view.purchasable, false);
  assert.deepEqual(view.unavailable, []);
  assert.equal(view.itemCount, 1);
});

test('an item missing from the loaded catalog blocks the order and is flagged', () => {
  const view = buildCartView([item('gone'), item('p1')], [product()]);
  assert.equal(view.purchasable, false);
  assert.deepEqual(view.unavailable, ['gone']);
});

test('draft, archived and Rp 0 products can never be ordered', () => {
  for (const bad of [product({ status: 'draft' }), product({ status: 'archived' }), product({ price: 0 }), product({ price: null }), product({ price: -5 })]) {
    const view = buildCartView([item('p1')], [bad, product({ id: 'other' })]);
    assert.equal(view.purchasable, false, JSON.stringify(bad));
    assert.deepEqual(view.unavailable, ['p1']);
    assert.equal(view.total, 0);
  }
});

test('a product without a status is treated as active', () => {
  const view = buildCartView([item('p1')], [{ id: 'p1', price: 1000 }]);
  assert.equal(view.purchasable, true);
});

test('the removed-items notice accumulates, survives a redirect and clears', () => {
  session.clear();
  assert.equal(cartNotice.read(), 0);
  assert.equal(cartNotice.add(1), 1);
  assert.equal(cartNotice.add(2), 3);
  assert.equal(cartNotice.read(), 3);
  cartNotice.clear();
  assert.equal(cartNotice.read(), 0);
});
