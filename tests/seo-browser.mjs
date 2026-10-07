import assert from 'node:assert/strict';
import { chromium, request } from '@playwright/test';
import { SLUG_RENAMES } from '../src/data/slugRenames.js';
import { pathToFileURL } from 'node:url';

export async function verifySeoDeployment({base, secret = null}) {
assert.ok(base, 'Set SEO_URL to the deployment to verify');
const options = {};
const routeRequest = async r => {
  const url = new URL(r.request().url());
  if (/googlesyndication\.com|doubleclick\.net|google-analytics\.com|googletagmanager\.com/.test(url.hostname)) return r.abort();
  const headers = await r.request().allHeaders();
  if (url.hostname !== new URL(base).hostname) delete headers['x-vercel-protection-bypass'];
  return r.continue({headers});
};
const api = await request.newContext();
if (secret) {
  await api.get(`${base}/?_vercel_share=${encodeURIComponent(secret)}`);
  options.storageState = await api.storageState();
}
const browser = await chromium.launch();
try {
  const response = await api.get(base + '/sitemap.xml');
  assert.equal(response.status(), 200);
  const urls = [...(await response.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  assert.ok(urls.length >= 222);
  assert.equal(urls.length, new Set(urls).size);
  for (const slug of Object.values(SLUG_RENAMES)) {
    const canonical = `https://www.israanwar.com/blog/${slug}`;
    assert.ok(urls.includes(canonical));
    const r = await api.get(`${base}/blog/${slug}`);
    assert.equal(r.status(), 200, slug);
    const html = await r.text();
    assert.ok(html.includes(`href="${canonical}"`), `${slug}: canonical missing`);
    assert.ok(html.includes('"@type":"BlogPosting"'), `${slug}: article schema missing`);
    assert.match(html, /<article\b/, `${slug}: article content missing`);
    assert.ok(!html.includes('id="ssg-shell"'));
  }
  console.log(`PASS ${urls.length} sitemap entries and all 22 article HTTP responses`);
  const oldSlug = Object.keys(SLUG_RENAMES)[0];
  const redirect = await api.get(`${base}/blog/${oldSlug}`, {maxRedirects:0});
  assert.equal(redirect.status(), 308);
  assert.ok(redirect.headers().location.endsWith(`/blog/${SLUG_RENAMES[oldSlug]}`));
  for (const path of ['/seo-audit-missing-20261007','/blog/seo-audit-missing-20261007','/assets/seo-audit-missing.js']) {
    const r = await api.get(base + path);
    assert.equal(r.status(), 404, path);
  }
  for (const path of ['/admin/login','/cart','/checkout','/orders/seo-audit/payment','/order/seo-audit']) {
    const r = await api.get(base + path);
    assert.equal(r.status(), 200, path);
    assert.match(r.headers()['x-robots-tag'], /noindex/, path);
    assert.match(await r.text(), /content="noindex, follow"/, path);
  }
  const slash = await api.get(base + '/services/', {maxRedirects:0});
  assert.equal(slash.status(), 308);
  assert.ok(slash.headers().location.endsWith('/services'));
  const endpoint = await api.get(base + '/api/post-views');
  assert.equal(endpoint.status(), 400, 'Existing serverless endpoint must remain reachable');
  console.log('PASS redirects, true 404, private noindex responses, existing API');
  const articlePath = `/blog/${Object.values(SLUG_RENAMES)[0]}`;
  for (const width of [390,1440]) {
    const context = await browser.newContext({...options,viewport:{width,height:900},reducedMotion:'reduce'});
    await context.route('**/*', routeRequest);
    await context.route('**/api/post-views**', r => r.fulfill({status:200,contentType:'application/json',body:'{"count":0}'}));
    const page = await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/services', {waitUntil:'networkidle'});
    assert.equal(await page.locator('html').getAttribute('lang'),'en');
    await page.locator('.okr__lang-toggle').click();
    await page.waitForFunction(()=>document.documentElement.lang==='id');
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('html').getAttribute('lang'),'id');
    await page.locator('.okr__lang-toggle').click();
    await page.goto(base+articlePath,{waitUntil:'networkidle'});
    assert.equal(await page.locator('html').getAttribute('lang'),'id');
    assert.equal(await page.locator('[data-schema="article"]').evaluate(e=>JSON.parse(e.textContent).inLanguage),'id-ID');
    await page.goto(base+'/services/web-development-landing-page-development',{waitUntil:'networkidle'});
    assert.match(await page.locator('body').innerText(), /Rp200\.000/);
    assert.equal(await page.locator('[data-schema="service-detail"]').evaluate(e=>JSON.parse(e.textContent).name),await page.locator('h1').innerText());
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth + 1), `${width}: horizontal overflow`);
    const productPath = new URL(urls.find(url=>new URL(url).pathname.startsWith('/store/'))).pathname;
    await page.goto(base+productPath,{waitUntil:'networkidle'});
    const product = await page.locator('[data-schema="product"]').evaluate(e=>JSON.parse(e.textContent));
    assert.equal(product.name,await page.locator('h1').innerText());
    assert.equal(product.offers.priceCurrency,'IDR');
    assert.ok((await page.locator('body').innerText()).includes(Number(product.offers.price).toLocaleString('id-ID')), `${width}: schema price must match visible price`);
    const nojs = await browser.newPage({...options,javaScriptEnabled:false,viewport:{width,height:900}});
    await nojs.route('**/*',routeRequest);
    await nojs.goto(base+'/services/web-development-landing-page-development');
    assert.match(await nojs.locator('#root').innerText(),/Rp200\.000/);
    await nojs.goto(base+articlePath);
    assert.ok((await nojs.locator('article').innerText()).length>1000);
    assert.ok(await nojs.evaluate(()=>document.documentElement.scrollWidth <= innerWidth + 1), `${width}: no-JS horizontal overflow`);
    assert.deepEqual(errors,[]);
    console.log(`PASS ${width}: language, article, service schema, locked price, no-JS content, overflow, runtime`);
    await nojs.close();await context.close();
  }
} finally {await browser.close();await api.dispose();}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await verifySeoDeployment({base:process.env.SEO_URL,secret:process.env.SEO_SHARE_SECRET});
}
