import test from 'node:test';
import assert from 'node:assert/strict';
import { contrastRatio, coverBackground, coverComposition, generateStoreCover, resolveProductCover } from '../src/lib/storePlaceholder.js';
import { STORE_COVER_SLOTS } from '../src/data/storeCoverSlots.js';
import { glyphForProduct, LAYOUT_COUNT, PATTERN_COUNT } from '../src/lib/storeCoverLayouts.js';
import { STORE_COVER_COLORS } from '../src/data/storeCoverColors.js';

// CIELAB distance between two #rrggbb colors (D65). Roughly: below 5 looks the
// same, around 10 is clearly different, above 15 is obviously different.
function lab(hex) {
  const lin = (i) => { const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = [lin(0), lin(1), lin(2)];
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (b * 0.9505 + g * 0.1192 + r * 0.0193) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}
const deltaE = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

test('slot list has no duplicate slugs and fits the palette', () => {
  assert.equal(new Set(STORE_COVER_SLOTS).size, STORE_COVER_SLOTS.length);
  assert.ok(STORE_COVER_SLOTS.length <= STORE_COVER_COLORS.length, 'more products than palette colors');
});

test('every slot has its own background', () => {
  const seen = new Set();
  for (let slot = 0; slot < STORE_COVER_COLORS.length * 2; slot++) {
    const { svg } = coverBackground(slot);
    assert.ok(!seen.has(svg), `slot ${slot} repeats an earlier background`);
    seen.add(svg);
  }
});

test('no two listed products share a color or look alike', () => {
  const colors = STORE_COVER_SLOTS.map((_, slot) => coverBackground(slot).from);
  assert.equal(new Set(colors).size, colors.length, 'two products share the exact same color');
  const labs = colors.map(lab);
  let min = Infinity;
  for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++) min = Math.min(min, deltaE(labs[i], labs[j]));
  assert.ok(min >= 12, `closest pair of products is only ${min.toFixed(1)} apart in CIELAB`);
});

test('title and kicker text stay readable on every background', () => {
  for (let slot = 0; slot < STORE_COVER_COLORS.length; slot++) {
    const { from, to, ink, muted, canvasAccent } = coverBackground(slot);
    for (const [name, color, min] of [['title', ink, 4.5], ['accent line', canvasAccent, 4.5], ['footer', muted, 3]]) {
      for (const bg of [from, to]) {
        const bad = []; if (!(contrastRatio(color, bg) >= min)) bad.push(slot); assert.equal(bad.length, 0, `slot ${slot} ${name} ${color} on ${bg} is ${contrastRatio(color, bg).toFixed(2)}:1`);
      }
    }
  }
});

test('many different hues are used, not a handful', () => {
  const hues = new Set(STORE_COVER_SLOTS.map((_, slot) => coverBackground(slot).hue));
  assert.ok(hues.size >= 50, `only ${hues.size} distinct hues`);
});

test('covers for every listed product are distinct, valid and readable', () => {
  const covers = STORE_COVER_SLOTS.map((slug) => generateStoreCover({ slug, name: slug.replace(/-/g, ' '), category: 'Modules' }));
  assert.equal(new Set(covers).size, covers.length);
  for (const cover of covers) {
    const svg = decodeURIComponent(cover.split(',').slice(1).join(','));
    assert.match(svg, /^<svg[\s\S]*<\/svg>$/);
    assert.ok(!/#0b0a10/i.test(svg), 'no black canvas');
  }
});

test('a product missing from the slot list gets a stable cover on a spare color', () => {
  const a = generateStoreCover({ slug: 'brand-new-product', name: 'Brand New Product' });
  const b = generateStoreCover({ slug: 'brand-new-product', name: 'Brand New Product' });
  assert.equal(a, b);
  const listedColors = new Set(STORE_COVER_SLOTS.map((_, slot) => coverBackground(slot).from));
  for (const slug of ['brand-new-product', 'another-new-product', 'x', 'y', 'z']) {
    const svg = decodeURIComponent(generateStoreCover({ slug, name: slug }).split(',').slice(1).join(','));
    const stop = svg.match(/stop-color="(#[0-9a-f]{6})"/)[1];
    assert.ok(!listedColors.has(stop), `${slug} reuses a listed product's color`);
  }
});

test('no muddy olive, khaki or mustard backgrounds', () => {
  for (let slot = 0; slot < STORE_COVER_COLORS.length; slot++) {
    const [hue, , light] = STORE_COVER_COLORS[slot];
    assert.ok(!(hue >= 38 && hue <= 110 && light < 84), `slot ${slot} is olive-range [${STORE_COVER_COLORS[slot]}]`);
  }
});

test('Jago Jualan Shopee keeps its orange and cream but uses the shared layout', () => {
  const cover = resolveProductCover({ slug: 'jagojualanshopee', name: 'Jago Jualan Shopee: Jurus Anti Ribet', image_url: 'data:image/png;base64,AAAA' });
  const svg = decodeURIComponent(cover.split(',').slice(1).join(','));
  assert.match(svg, /^<svg[\s\S]*<\/svg>$/);
  for (const part of ['#e8541e', '#fdf6ee', 'Jurus Anti Ribet', '8 BAB', 'ISRAANWAR.COM']) assert.ok(svg.includes(part), `missing ${part}`);
});

test('no two listed products share a layout and pattern pair', () => {
  const seen = new Map();
  STORE_COVER_SLOTS.forEach((slug, slot) => {
    const { layout, pattern } = coverComposition(slot);
    const key = `${layout}/${pattern}`;
    assert.ok(!seen.has(key), `${slug} and ${seen.get(key)} share layout ${layout} with pattern ${pattern}`);
    seen.set(key, slug);
  });
});

test('all layouts and all patterns are in use, evenly', () => {
  const layouts = new Array(LAYOUT_COUNT).fill(0);
  const patterns = new Array(PATTERN_COUNT).fill(0);
  STORE_COVER_SLOTS.forEach((_, slot) => { const c = coverComposition(slot); layouts[c.layout]++; patterns[c.pattern]++; });
  assert.ok(layouts.every((n) => n >= 9), `uneven layouts ${layouts}`);
  assert.ok(patterns.every((n) => n >= 6), `uneven patterns ${patterns}`);
});

test('products get a spread of topic glyphs, not one icon', () => {
  const glyphs = new Set(STORE_COVER_SLOTS.map((slug) => glyphForProduct({ slug, name: slug.replace(/-/g, ' ') })));
  assert.ok(glyphs.size >= 14, `only ${glyphs.size} glyphs: ${[...glyphs]}`);
});

test('cover structure differs between products, not only color', () => {
  // Strip colors and text so only shapes remain, then compare.
  const shape = (svg) => svg.replace(/#[0-9a-f]{3,8}\b/gi, '#').replace(/>[^<]*</g, '><').replace(/\d+(\.\d+)?/g, '0');
  const structures = new Map();
  for (const slug of STORE_COVER_SLOTS.filter((s) => s !== 'jagojualanshopee')) {
    const svg = decodeURIComponent(generateStoreCover({ slug, name: slug.replace(/-/g, ' ') }).split(',').slice(1).join(','));
    const { layout, pattern } = coverComposition(STORE_COVER_SLOTS.indexOf(slug));
    structures.set(`${layout}/${pattern}`, shape(svg).length);
  }
  assert.equal(structures.size, STORE_COVER_SLOTS.length - 1);
});
