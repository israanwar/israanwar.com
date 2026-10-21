import test from 'node:test';
import assert from 'node:assert/strict';
import { coverBackground, generateStoreCover } from '../src/lib/storePlaceholder.js';
import { STORE_COVER_SLOTS } from '../src/data/storeCoverSlots.js';

const hueGap = (a, b) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };

test('slot list has no duplicate slugs', () => {
  assert.equal(new Set(STORE_COVER_SLOTS).size, STORE_COVER_SLOTS.length);
});

test('every slot has its own background', () => {
  const total = STORE_COVER_SLOTS.length + 200;
  const seen = new Set();
  for (let slot = 0; slot < total; slot++) {
    const { svg } = coverBackground(slot);
    assert.ok(!seen.has(svg), `slot ${slot} repeats an earlier background`);
    seen.add(svg);
  }
});

// Same-pattern slots step 20 degrees apart, so 18 fit per pattern (144 slots).
// Past that, tone and gradient direction keep backgrounds apart (covered by
// the uniqueness test above), but the hue gap shrinks. Fail loudly well before
// the catalog gets there so the slot scheme can be widened.
test('same-pattern backgrounds are visibly different in hue', () => {
  const total = STORE_COVER_SLOTS.length + 20;
  assert.ok(total <= 144, 'catalog outgrew the hue spread, widen the slot scheme');
  const byKind = new Map();
  for (let slot = 0; slot < total; slot++) {
    const { kind, hue } = coverBackground(slot);
    byKind.set(kind, [...(byKind.get(kind) ?? []), hue]);
  }
  for (const [kind, hues] of byKind) {
    for (let i = 0; i < hues.length; i++) {
      for (let j = i + 1; j < hues.length; j++) {
        assert.ok(hueGap(hues[i], hues[j]) >= 12, `pattern ${kind}: hues ${hues[i].toFixed(1)} and ${hues[j].toFixed(1)} are too close`);
      }
    }
  }
});

test('covers for every listed product are distinct, valid and not dark', () => {
  const covers = STORE_COVER_SLOTS.map((slug) => generateStoreCover({ slug, name: slug.replace(/-/g, ' '), category: 'Modules' }));
  assert.equal(new Set(covers).size, covers.length);
  for (const cover of covers) {
    const svg = decodeURIComponent(cover.split(',').slice(1).join(','));
    assert.match(svg, /^<svg[\s\S]*<\/svg>$/);
    assert.ok(!/#0b0a10/i.test(svg), 'no black canvas');
  }
});

test('a product missing from the slot list still gets its own stable cover', () => {
  const a = generateStoreCover({ slug: 'brand-new-product', name: 'Brand New Product' });
  const b = generateStoreCover({ slug: 'brand-new-product', name: 'Brand New Product' });
  const c = generateStoreCover({ slug: 'another-new-product', name: 'Brand New Product' });
  assert.equal(a, b);
  assert.notEqual(a, c);
});
