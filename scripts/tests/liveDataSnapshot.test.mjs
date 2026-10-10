import assert from 'node:assert/strict';
import { test } from 'node:test';
import { preservePublicValue, preserveLiveSnapshot } from '../../src/lib/liveDataSnapshot.js';

test('unchanged JSON refresh preserves references across public repositories', () => {
  for (const key of ['settings', 'homepage', 'page:portfolio', 'products:active', 'product:p', 'services:active', 'service:s', 'posts:published', 'post:p']) {
    const previous = { title: 'Home', rows: [{ id: 1, details: { price: 250, active: true } }] };
    assert.equal(preservePublicValue(key, previous, JSON.parse(JSON.stringify(previous))), previous);
    const changed = { ...previous, rows: [{ id: 1, details: { price: 300, active: true } }] };
    assert.equal(preservePublicValue(key, previous, changed), changed);
  }
});
test('added, removed, reordered and differently typed records remain observable', () => {
  for (const [before, after] of [[{ a: undefined }, {}], [{ a: 1 }, { a: '1' }], [[1, 2], [2, 1]], [[], new Array(2)], [null, {}], [{ a: false }, { a: true }]]) {
    assert.equal(preservePublicValue('homepage', before, after), after);
  }
  const before = { a: 1, b: 2 };
  assert.equal(preservePublicValue('settings', before, { b: 2, a: 1 }), before);
});
test('private keys and custom objects never use public JSON sharing', () => {
  const before = { rows: [] }, after = { rows: [] };
  assert.equal(preservePublicValue('cart', before, after), after);
  const date = new Date(0);
  assert.equal(preservePublicValue('settings', new Date(0), date), date);
});
test('value-only consumers ignore loading transitions but receive changed values', () => {
  const previous = { value: { title: 'Home' }, loading: false, error: null };
  const loading = { ...previous, loading: true };
  assert.equal(preserveLiveSnapshot(previous, loading, true), previous);
  assert.equal(preserveLiveSnapshot(previous, loading), loading);
  const changed = { ...previous, value: { title: 'Updated' } };
  assert.equal(preserveLiveSnapshot(previous, changed, true), changed);
});
test('detailed consumers receive errors and loading completion without data changes', () => {
  const previous = { value: [], loading: true, error: null };
  const failure = { ...previous, loading: false, error: new Error('refresh failed') };
  assert.equal(preserveLiveSnapshot(previous, failure), failure);
  const complete = { ...previous, loading: false };
  assert.equal(preserveLiveSnapshot(previous, complete), complete);
  assert.equal(preserveLiveSnapshot(previous, { ...previous }), previous);
});
