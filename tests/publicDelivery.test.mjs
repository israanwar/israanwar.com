import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inlineStylesheet, matchedStylesheet, stylesheetSelectors, separateFontFaces } from '../scripts/public-delivery.mjs';

test('inlined CSS preserves relative asset queries/fragments and embedded/absolute URLs', () => {
  assert.equal(inlineStylesheet('a{mask:url(./icons.svg?v=1#logo);src:url(../font.woff2)}', '/assets/page.css'), 'a{mask:url("/assets/icons.svg?v=1#logo");src:url("/font.woff2")}');
  const css = 'a{background:url(data:image/svg+xml,abc);src:url(/font.woff2)}';
  assert.equal(inlineStylesheet(css, '/assets/page.css'), css);
});

test('matched CSS keeps original browser fallbacks, conditional rules, and cascade order', () => {
  const css = '@layer base,theme;@font-face{font-family:Brand;src:url(./font.woff2)}.hero{display:-webkit-box;display:flex;-moz-user-select:none;color:red}.admin{color:pink}@media(max-width:767px){.hero{color:blue}.admin{color:green}}@keyframes drift{0%{opacity:0}100%{opacity:1}}.hero{color:black}';
  assert.deepEqual(stylesheetSelectors(css), ['.hero', '.admin']);
  const selected = matchedStylesheet(css, new Set(['.hero']));
  assert.equal(selected, '@layer base,theme;@font-face{font-family:Brand;src:url(./font.woff2)}.hero{display:-webkit-box;display:flex;-moz-user-select:none;color:red}@media(max-width:767px){.hero{color:blue}}@keyframes drift{0%{opacity:0}100%{opacity:1}}.hero{color:black}');
});

test('font separation retains conditions, declarations, layer order, and full non-font cascade', () => {
  const css = '@layer reset,theme;@layer reset{.hero{color:red}}@supports(display:grid){@layer theme{@font-face{font-family:Brand;src:url(/brand.woff2);font-display:swap}.hero{display:-webkit-box;display:grid}}}@font-feature-values Brand{@styleset{headline:1}}@font-palette-values --brand{font-family:Brand;base-palette:1}.hero{color:blue}';
  const split = separateFontFaces(css);
  assert.equal(split.fonts, '@layer reset,theme;@layer reset{}@supports(display:grid){@layer theme{@font-face{font-family:Brand;src:url(/brand.woff2);font-display:swap}}}@font-feature-values Brand{@styleset{headline:1}}@font-palette-values --brand{font-family:Brand;base-palette:1}');
  assert.equal(split.rules, '@layer reset,theme;@layer reset{.hero{color:red}}@supports(display:grid){@layer theme{.hero{display:-webkit-box;display:grid}}}.hero{color:blue}');
});
