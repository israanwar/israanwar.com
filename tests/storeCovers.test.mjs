import test from 'node:test';
import assert from 'node:assert/strict';
import { contrastRatio, coverLook, generateStoreCover, resolveProductCover } from '../src/lib/storePlaceholder.js';
import { STORE_COVER_SLOTS } from '../src/data/storeCoverSlots.js';
import { STORE_COVER_COLORS } from '../src/data/storeCoverColors.js';
import { STORE_COVER_PLAN } from '../src/data/storeCoverPlan.js';
import { ICONS, ICON_BY_SLUG, SPARE_ICONS } from '../src/data/storeCoverIcons.js';
import { ART_COUNT, FRAME_COUNT, ORNAMENT_COUNT, SKELETON_COUNT, TITLE_COUNT, WEIGHT_COUNT } from '../src/lib/storeCoverLayouts.js';

const N = STORE_COVER_SLOTS.length;
const DIMS = [SKELETON_COUNT, ART_COUNT, FRAME_COUNT, TITLE_COUNT, ORNAMENT_COUNT, WEIGHT_COUNT];
const svgOf = (cover) => decodeURIComponent(cover.split(',').slice(1).join(','));
const lab = ([L, C, H]) => [L * 100, C * 100 * Math.cos((H * Math.PI) / 180), C * 100 * Math.sin((H * Math.PI) / 180)];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

test('every listed product has a slot, a color, a plan and an icon', () => {
  assert.equal(new Set(STORE_COVER_SLOTS).size, N, 'duplicate slugs');
  assert.ok(STORE_COVER_COLORS.length >= N + 20, 'not enough colors including spares');
  assert.equal(STORE_COVER_PLAN.length, N);
  for (const slug of STORE_COVER_SLOTS) assert.ok(ICON_BY_SLUG[slug], `${slug} has no icon`);
});

test('no icon is used twice, and every icon exists', () => {
  const used = STORE_COVER_SLOTS.map((slug) => ICON_BY_SLUG[slug]);
  assert.equal(new Set(used).size, used.length, 'an icon repeats');
  for (const name of used) assert.ok(ICONS[name], `${name} missing from the bank`);
  for (const name of SPARE_ICONS) assert.ok(!used.includes(name), `spare ${name} is already in use`);
  assert.ok(SPARE_ICONS.length >= 10);
});

test('no two products share a color and every pair is clearly apart', () => {
  const colors = STORE_COVER_COLORS.slice(0, N);
  assert.equal(new Set(colors.map((c) => c.join(','))).size, N);
  const labs = colors.map(lab);
  let min = Infinity;
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) min = Math.min(min, dist(labs[i], labs[j]));
  assert.ok(min >= 4.5, `closest pair is only ${min.toFixed(2)} apart in OKLab`);
});

test('palette stays clean, with no muddy browns, olive, lime or dusty tones', () => {
  for (const [slot, [L, C, H]] of STORE_COVER_COLORS.entries()) {
    const label = `slot ${slot} [${L}, ${C}, ${H}]`;
    assert.ok(!(H >= 70 && H <= 140 && L < 0.9), `${label} is olive or lime`);
    assert.ok(!(H >= 20 && H < 70 && L < 0.54), `${label} is brown`);
    assert.ok(!((H < 70 || H >= 340) && L >= 0.5 && L <= 0.82 && C < 0.14), `${label} is dusty rose or salmon`);
    assert.ok(!(L > 0.55 && C > 0.17), `${label} is neon`);
  }
});

test('products use many different hues, not a handful', () => {
  const hues = new Set(STORE_COVER_COLORS.slice(0, N).map(([, , H]) => Math.round(H / 15)));
  assert.ok(hues.size >= 18, `only ${hues.size} hue families`);
});

test('any two products differ in at least four of six design dimensions', () => {
  const dist4 = (a, b) => a.reduce((n, v, i) => n + (v !== b[i] ? 1 : 0), 0);
  for (let i = 0; i < N; i++) {
    STORE_COVER_PLAN[i].forEach((v, d) => assert.ok(v >= 0 && v < DIMS[d], `slot ${i} dimension ${d} out of range`));
    for (let j = i + 1; j < N; j++) {
      assert.ok(dist4(STORE_COVER_PLAN[i], STORE_COVER_PLAN[j]) >= 4, `${STORE_COVER_SLOTS[i]} and ${STORE_COVER_SLOTS[j]} are too alike`);
    }
  }
});

test('every dimension is used broadly', () => {
  DIMS.forEach((size, d) => {
    const counts = new Array(size).fill(0);
    STORE_COVER_PLAN.forEach((plan) => counts[plan[d]]++);
    assert.ok(counts.every((n) => n >= Math.floor(N / size / 3)), `dimension ${d} is lopsided ${counts}`);
  });
});

test('text and accent stay readable on every background', () => {
  for (let slot = 0; slot < STORE_COVER_COLORS.length; slot++) {
    const { bg1, bg2, ink, accent } = coverLook(slot);
    for (const bg of [bg1, bg2]) {
      assert.ok(contrastRatio(ink, bg) >= 4.5, `slot ${slot} ink ${ink} on ${bg} is ${contrastRatio(ink, bg).toFixed(2)}:1`);
      assert.ok(contrastRatio(accent, bg) >= 4.5, `slot ${slot} accent ${accent} on ${bg} is ${contrastRatio(accent, bg).toFixed(2)}:1`);
    }
  }
});

test('every listed cover is distinct, well formed and uses the product icon', () => {
  const covers = STORE_COVER_SLOTS.map((slug) => generateStoreCover({ slug, name: slug.replace(/-/g, ' '), description: 'A short description. More text.' }));
  assert.equal(new Set(covers).size, covers.length);
  covers.forEach((cover, i) => {
    const svg = svgOf(cover);
    assert.match(svg, /^<svg[\s\S]*<\/svg>$/);
    assert.ok(!/NaN|undefined|null/.test(svg), `${STORE_COVER_SLOTS[i]} has a broken value`);
    assert.ok(svg.includes(ICONS[ICON_BY_SLUG[STORE_COVER_SLOTS[i]]]), `${STORE_COVER_SLOTS[i]} is missing its icon`);
  });
});

test('a product missing from the lists gets a stable cover on spare color and icon', () => {
  const make = (slug) => generateStoreCover({ slug, name: slug });
  assert.equal(make('brand-new-product'), make('brand-new-product'));
  const used = new Set(STORE_COVER_SLOTS.map((slug) => ICONS[ICON_BY_SLUG[slug]]));
  const listedBg = new Set(STORE_COVER_SLOTS.map((_, slot) => coverLook(slot).bg1));
  for (const slug of ['brand-new-product', 'another-new-product', 'x', 'y']) {
    const svg = svgOf(make(slug));
    assert.ok(![...used].some((body) => svg.includes(body)), `${slug} reuses a listed product icon`);
    const stop = svg.match(/id="bg"[^>]*><stop offset="0" stop-color="(#[0-9a-f]{6})"/)[1];
    assert.ok(!listedBg.has(stop), `${slug} reuses a listed product color`);
  }
});

test('Jago Jualan Shopee keeps its cream and orange and its own tagline', () => {
  const cover = resolveProductCover({ slug: 'jagojualanshopee', name: 'Jago Jualan Shopee: Jurus Anti Ribet', image_url: 'data:image/png;base64,AAAA' });
  const svg = svgOf(cover);
  assert.match(svg, /^<svg[\s\S]*<\/svg>$/);
  for (const part of ['#fbf1e5', '#b03509', 'Jurus anti ribet', 'ISRAANWAR.COM']) assert.ok(svg.includes(part), `missing ${part}`);
});
