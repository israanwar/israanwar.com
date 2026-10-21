import test from 'node:test';
import assert from 'node:assert/strict';
import { COVER_COLORS, contrastRatio, coverIconFor, generateStoreCover, resolveProductCover } from '../src/lib/storePlaceholder.js';
import { STORE_COVER_SLOTS } from '../src/data/storeCoverSlots.js';
import { ICONS, ICON_BY_SLUG, SPARE_ICONS } from '../src/data/storeCoverIcons.js';

const N = STORE_COVER_SLOTS.length;
const svgOf = (cover) => decodeURIComponent(cover.split(',').slice(1).join(','));
const coverOf = (slug, name = slug.replace(/-/g, ' ')) => generateStoreCover({ slug, name, category: 'Modules' });

test('every product has its own Lucide icon and none repeats', () => {
  const icons = STORE_COVER_SLOTS.map((slug) => ICON_BY_SLUG[slug]);
  icons.forEach((icon, i) => assert.ok(icon, `${STORE_COVER_SLOTS[i]} has no icon`));
  assert.equal(new Set(icons).size, N, 'an icon is used twice');
  icons.forEach((icon) => assert.ok(ICONS[icon], `${icon} is missing from the icon bank`));
});

test('no two products draw the same icon even by geometry', () => {
  const bodies = STORE_COVER_SLOTS.map((slug) => ICONS[ICON_BY_SLUG[slug]]);
  assert.equal(new Set(bodies).size, N, 'two icons have identical artwork');
});

test('spare icons are unused and there are enough for new products', () => {
  const used = new Set(STORE_COVER_SLOTS.map((slug) => ICON_BY_SLUG[slug]));
  SPARE_ICONS.forEach((icon) => assert.ok(!used.has(icon), `${icon} is spare but already in use`));
  assert.ok(SPARE_ICONS.length >= 10);
});

test('every cover uses exactly one design: only the icon, title and number change', () => {
  const frame = (svg) => svg
    .replace(/<g transform="translate\([^"]*\) scale\(4\)"[^>]*>[\s\S]*?<\/g>/, '<icon/>')
    .replace(/<text[^>]*text-anchor="middle"[^>]*>[^<]*<\/text>/g, '')
    .replace(/>[^<]+</g, '><');
  const frames = new Set(STORE_COVER_SLOTS.map((slug) => frame(svgOf(coverOf(slug)))));
  assert.equal(frames.size, 1, 'covers do not share one layout');
});

test('covers use only black, white, lavender and grey: no gradient, glow or per-product color', () => {
  const allowed = new Set(['none', COVER_COLORS.background, COVER_COLORS.text, COVER_COLORS.accent, COVER_COLORS.muted, 'rgba(255,255,255,0.12)']);
  for (const slug of STORE_COVER_SLOTS) {
    const svg = svgOf(coverOf(slug));
    assert.ok(!/gradient|filter|blur|shadow|feGaussian|<image|<pattern/i.test(svg), `${slug} has a forbidden effect`);
    for (const [, value] of svg.matchAll(/(?:fill|stroke)="([^"]*)"/g)) assert.ok(allowed.has(value), `${slug} uses ${value}`);
  }
});

test('icon size and stroke weight are the same on every cover', () => {
  const marks = new Set();
  for (const slug of STORE_COVER_SLOTS) {
    const svg = svgOf(coverOf(slug));
    const group = svg.match(/<g transform="translate\(([^ ]+) ([^)]+)\) scale\(([^)]+)\)" fill="none" stroke="([^"]+)" stroke-width="([^"]+)"/);
    assert.ok(group, `${slug} has no icon group`);
    marks.add(`${group[1]} ${group[2]} ${group[3]} ${group[4]} ${group[5]}`);
  }
  assert.equal(marks.size, 1, `icon placement differs: ${[...marks]}`);
});

test('text and accents are readable on the black canvas', () => {
  const bg = COVER_COLORS.background;
  assert.ok(contrastRatio(COVER_COLORS.text, bg) >= 15);
  assert.ok(contrastRatio(COVER_COLORS.accent, bg) >= 10);
  assert.ok(contrastRatio(COVER_COLORS.muted, bg) >= 4.5);
});

test('every cover is distinct, well formed and carries its product icon', () => {
  const covers = STORE_COVER_SLOTS.map((slug) => coverOf(slug));
  assert.equal(new Set(covers).size, N);
  covers.forEach((cover, i) => {
    const svg = svgOf(cover);
    assert.match(svg, /^<svg[\s\S]*<\/svg>$/);
    assert.ok(!/NaN|undefined|null/.test(svg), `${STORE_COVER_SLOTS[i]} has a broken value`);
    assert.ok(svg.includes(ICONS[ICON_BY_SLUG[STORE_COVER_SLOTS[i]]].replace(/currentColor/g, COVER_COLORS.text)), `${STORE_COVER_SLOTS[i]} is missing its icon`);
  });
});

test('long titles shrink to fit and are never cut unless extreme', () => {
  const fits = svgOf(generateStoreCover({ slug: 'modul-search-engine-marketing', name: 'Module: Search Engine Marketing (Google, Meta, TikTok, AI Ads)' }));
  assert.ok(!fits.includes('…'), 'a 55 character title was cut');
  assert.ok(fits.includes('Search Engine Marketing') && fits.includes('AI Ads)'));
  const extreme = svgOf(generateStoreCover({ slug: 'x', name: 'word '.repeat(40) }));
  assert.ok(extreme.includes('…'));
  const titleLines = (svg) => [...svg.matchAll(/text-anchor="middle"/g)].length;
  assert.ok(titleLines(fits) <= 2 && titleLines(extreme) <= 2);
});

test('a product missing from the lists gets a stable cover with an unused icon', () => {
  const make = (slug) => generateStoreCover({ slug, name: slug });
  assert.equal(make('brand-new-product'), make('brand-new-product'));
  const used = new Set(STORE_COVER_SLOTS.map((slug) => ICON_BY_SLUG[slug]));
  for (const slug of ['brand-new-product', 'another-new-product', 'x', 'y']) {
    assert.ok(!used.has(coverIconFor(slug)), `${slug} reuses a listed icon`);
    assert.ok(svgOf(make(slug)).includes('N° ---'));
  }
});

test('Jago Jualan Shopee uses the same cover system even with an uploaded photo', () => {
  const upload = 'data:image/png;base64,AAAA';
  const cover = resolveProductCover({ slug: 'jagojualanshopee', name: 'Jago Jualan Shopee: Jurus Anti Ribet', image_url: upload });
  assert.notEqual(cover, upload);
  const svg = svgOf(cover);
  assert.ok(svg.includes('EBOOK'));
  assert.ok(svg.includes(ICONS['shopping-basket'].replace(/currentColor/g, COVER_COLORS.text)));
  // identical design to every other cover: same frame, only icon and text differ
  const frame = (x) => x
    .replace(/<g transform="translate\([^"]*\) scale\(4\)"[^>]*>[\s\S]*?<\/g>/, '<icon/>')
    .replace(/<text[^>]*text-anchor="middle"[^>]*>[^<]*<\/text>/g, '')
    .replace(/>[^<]+</g, '><');
  assert.equal(frame(svg), frame(svgOf(coverOf('modul-email-marketing'))));
});

test('another product with an uploaded photo keeps its own photo', () => {
  const upload = 'data:image/png;base64,AAAA';
  assert.equal(resolveProductCover({ slug: 'some-other-product', name: 'Other', image_url: upload }), upload);
});
