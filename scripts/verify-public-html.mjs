import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { site } from '../src/data/site.js';

export async function verifyPublicHtml({ distDir, routes }) {
  const xml = await readFile(resolve(distDir, 'sitemap.xml'), 'utf8');
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1].replace(/&amp;/g, '&'));
  assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs');
  const inventory = new Map(routes.filter(r => !r.noindex).map(r => [new URL(r.path, site.url).href, r]));
  for (const url of urls) assert.ok(inventory.has(url), `Sitemap URL has no public route: ${url}`);
  for (const [url, route] of inventory) {
    const file = resolve(distDir, route.path === '/' ? 'index.html' : route.path.slice(1) + '/index.html');
    const html = await readFile(file, 'utf8');
    assert.ok(!html.includes('id="ssg-shell"'), `${url}: obsolete content shell`);
    assert.match(html, /id="prerender-readable"/, `${url}: missing application snapshot`);
    assert.match(html, /<h1[\s>]/, `${url}: missing H1`);
    const canonical = html.match(/<link\b(?=[^>]*\brel="canonical")(?=[^>]*\bhref="([^"]+)")[^>]*>/)?.[1];
    assert.equal(canonical, url, `${url}: incorrect canonical`);
    assert.ok(!/<meta\b(?=[^>]*name="robots")(?=[^>]*content="[^"]*noindex)/.test(html), `${url}: public page is noindex`);
    if (route.article) {
      assert.match(html, /"@type":"BlogPosting"/, `${url}: missing article schema`);
      assert.match(html, /<article\b/, `${url}: missing article body`);
    }
  }
  console.log(`✓ Verified ${inventory.size} public HTML pages and ${urls.length} sitemap URLs`);
}
