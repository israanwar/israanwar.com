import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from '@playwright/test';
import { SLUG_RENAMES } from '../src/data/slugRenames.js';
const dist = resolve(process.env.PARITY_DIST || 'dist');
const server = createServer(async(req,res)=>{
 try {
  let path=resolve(dist,'.'+new URL(req.url,'http://localhost').pathname);
  if(!extname(path))path=resolve(path,'index.html');
  const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2'};
  const body=await readFile(path);
  res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'}).end(body);
 }catch{res.writeHead(404).end()}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const documents=(await readdir(dist,{recursive:true})).filter(p=>p.endsWith('index.html'));
assert.ok(documents.length > 200, 'Expected complete public route output');
for(const file of documents){
 const html=await readFile(resolve(dist,file),'utf8');
 assert.ok(!html.includes('id="ssg-shell"'), `${file}: obsolete content shell`);
 assert.match(html, /id="prerender-readable"/, `${file}: missing app snapshot`);
 assert.match(html, /<h1[\s>]/, `${file}: missing H1`);
 assert.match(html, /type="module"[^>]*(?:src|data-public-entry)="[^"]+"/, `${file}: missing app entry`);
}
console.log(`PASS ${documents.length} public HTML documents: application snapshot, H1, client entry`);
const sitemap=await readFile(resolve(dist,'sitemap.xml'),'utf8');
const sitemapUrls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
for(const url of sitemapUrls){
 const path=new URL(url).pathname;
 const html=await readFile(resolve(dist,path==='/'?'index.html':path.slice(1)+'/index.html'),'utf8');
 const canonical=html.match(/<link\b(?=[^>]*rel="canonical")(?=[^>]*href="([^"]+)")[^>]*>/)?.[1];
 assert.equal(canonical,url,`${path}: sitemap must match rendered canonical`);
}
for(const [oldSlug,newSlug] of Object.entries(SLUG_RENAMES)){
 const path=`blog/${newSlug}/index.html`;
 const html=await readFile(resolve(dist,path),'utf8');
 assert.ok(sitemapUrls.includes(`https://www.israanwar.com/blog/${newSlug}`),`${newSlug}: missing from sitemap`);
 assert.match(html,/<article\b/,`${newSlug}: missing visible article`);
 assert.match(html,/"@type":"BlogPosting"/,`${newSlug}: missing article schema`);
 assert.ok(!documents.includes(`blog/${oldSlug}/index.html`),`${oldSlug}: generated obsolete redirect route`);
}
console.log(`PASS ${sitemapUrls.length} sitemap URLs and all ${Object.keys(SLUG_RENAMES).length} renamed articles: HTML, canonical, article schema`);
const browser=await chromium.launch();
const routes=['/','/services','/services/web-development','/services/web-development-landing-page-development','/about','/blog','/privacy','/tools',...Object.values(SLUG_RENAMES).map(slug=>`/blog/${slug}`)];
const normalized=s=>s.replace(/\s+/g,' ').trim();
try{
 for(const route of routes){
  const raw=await browser.newPage({javaScriptEnabled:false});
  const js=await browser.newPage({reducedMotion:'reduce'});
  await js.route('**/*', r => /googlesyndication\.com|doubleclick\.net|google-analytics\.com|googletagmanager\.com/.test(r.request().url()) ? r.abort() : r.continue());
  await js.route('**/api/post-views**', r => r.fulfill({status:200,contentType:'application/json',body:'{"count":0}'}));
  const errors=[];js.on('pageerror',e=>errors.push(e.message));
  js.on('console', message => { if (message.type() === 'error' && message.text().includes('Public hydration:')) errors.push(message.text()); });
  await raw.goto(base+route);
  await js.goto(base+route,{waitUntil:'networkidle'});
  const collect=p=>p.evaluate(()=>({title:document.title,description:document.querySelector('meta[name="description"]')?.content,canonical:document.querySelector('link[rel="canonical"]')?.href,h1:[...document.querySelectorAll('h1')].map(e=>e.textContent),price:[...document.querySelectorAll('.service-price')].map(e=>e.textContent)}));
  const a=await collect(raw),b=await collect(js);
  for(const key of ['title','description','canonical'])assert.equal(a[key],b[key],`${route}: ${key}`);
  assert.deepEqual(a.h1.map(normalized),b.h1.map(normalized),`${route}: H1`);
  assert.equal(await raw.locator('#ssg-shell').count(),0);
  assert.deepEqual(errors,[],`${route}: runtime`);
  if(route.startsWith('/services')) {
   assert.equal(normalized(await raw.locator('#root').innerText()), normalized(await js.locator('#root').innerText()), `${route}: complete visible service content`);
  }
  if(route.includes('landing-page-development')){
   assert.match(await raw.locator('#root').innerText(),/Rp200\.000/);
   assert.deepEqual(a.price,b.price);
  }
  if(route==='/services') {
   assert.match(await raw.locator('#root').innerText(),/Rp200\.000/);
   // Capture the reader's active no-JS surface after the paired JS page.
   await raw.bringToFront();
   await raw.screenshot({path:'/tmp/seo-step1-services-nojs.png'});
  }
  console.log(`PASS ${route}: HTML and client metadata/headings; accessible without JavaScript`);
  await raw.close();await js.close();
 }
}finally{await browser.close();await new Promise(r=>server.close(r))}
