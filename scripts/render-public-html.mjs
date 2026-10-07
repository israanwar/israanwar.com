import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from '@playwright/test';
import { site } from '../src/data/site.js';

// Render the built application itself instead of maintaining a second copy
// of its content. A fresh browser context preserves the default language and
// empty visitor state. Fail the build rather than publish partial snapshots.
export async function renderPublicHtml({ distDir, routes, template }) {
  const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.woff2':'font/woff2' };
  const server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let file = resolve(distDir, '.' + pathname);
      if (!file.startsWith(distDir + sep) && file !== distDir) { res.writeHead(403).end(); return; }
      if (!extname(file)) file = resolve(file, 'index.html');
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' }).end(body);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    const launchOptions = { headless:true };
    // Vercel's Amazon Linux runner has no Playwright-managed browser cache.
    // This runtime is only used to generate HTML; it never enters client bundles.
    if (process.env.VERCEL === '1' && process.platform === 'linux') {
      const { default: buildChromium } = await import('@sparticuz/chromium');
      // Separate processes let the four workers open and close fresh contexts.
      launchOptions.args = buildChromium.args.filter(arg => arg !== '--single-process');
      launchOptions.executablePath = await buildChromium.executablePath();
    }
    browser = await chromium.launch(launchOptions);
    const pending = routes.filter(r => !r.noindex);
    const snapshots = [];
    let completed = 0;
    await Promise.all(Array.from({length:4}, async () => {
      while (pending.length) {
        const route = pending.shift();
        const context = await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.addInitScript(() => {
          window.__prerenderData = {pending:0, changed:Date.now(), failures:[]};
          const original = window.fetch;
          window.fetch = async (...args) => {
            const input = args[0];
            const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, location.href);
            const tracked = url.pathname.startsWith('/rest/v1/');
            const state = window.__prerenderData;
            if (tracked) { state.pending++; state.changed = Date.now(); }
            try {
              const response = await original(...args);
              if (tracked && !response.ok) state.failures.push(`${url.pathname}: ${response.status}`);
              return response;
            } catch(error) {
              if (tracked) state.failures.push(url.pathname + ': request failed');
              throw error;
            } finally {
              if (tracked) { state.pending--; state.changed = Date.now(); }
            }
          };
        });
        await page.route('**/*', r => {
          const host = new URL(r.request().url()).hostname;
          const blocked = ['googlesyndication.com','doubleclick.net','google-analytics.com','googletagmanager.com'];
          if (blocked.some(domain => host === domain || host.endsWith('.' + domain))) return r.abort();
          return r.continue();
        });
        try {
          await page.goto(base + route.path, {waitUntil:'domcontentloaded',timeout:30000});
          await page.locator('#root h1').first().waitFor({timeout:15000});
          await page.waitForFunction(() => !document.querySelector('#ssg-shell') && document.querySelector('link[rel="canonical"]'));
          await page.waitForFunction(() => window.__prerenderData.pending === 0 && Date.now() - window.__prerenderData.changed > 500, null, {timeout:30000});
          const failures = await page.evaluate(() => window.__prerenderData.failures);
          if (failures.length) throw new Error('Content data fetch failed: ' + failures.join('; '));
          if (errors.length) throw new Error(errors.join('; '));
          const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
          if (canonical !== new URL(route.path, site.url).href) {
            throw new Error(`Canonical mismatch: ${canonical}`);
          }
          if (route.article) {
            await page.locator('article').first().waitFor();
            if (await page.locator('[data-schema="article"]').count() !== 1) throw new Error('Article schema missing');
          }
          if (await page.locator('meta[name="robots"]').getAttribute('content').then(v=>v?.includes('noindex'))) {
            throw new Error('Expected public route rendered as noindex');
          }
          const html = await page.evaluate(() => {
            const clone = document.documentElement.cloneNode(true);
            // Runtime-only surfaces must not become persistent build artifacts.
            clone.querySelectorAll('iframe, .adsbygoogle').forEach(e=>e.remove());
            const root = clone.querySelector('#root');
            root.querySelectorAll('.okr__touch-active').forEach(e=>e.classList.remove('okr__touch-active'));
            const style = document.createElement('style');
            style.id = 'prerender-readable';
            style.textContent = '#root .okr__reveal{opacity:1!important;transform:none!important}';
            clone.querySelector('head').append(style);
            return '<!doctype html>\n' + clone.outerHTML;
          });
          snapshots.push({ path: route.path, html });
          completed++;
          if (completed % 25 === 0) console.log(`Rendered ${completed} public pages`);
        } catch (error) { throw new Error(`Prerender ${route.path}: ${error.message}`); }
        finally { await context.close(); }
      }
    }));
    // Only replace output after every page succeeds.
    for (const snapshot of snapshots) {
      await writeFile(resolve(distDir, snapshot.path === '/' ? 'index.html' : snapshot.path.slice(1) + '/index.html'), snapshot.html);
    }
    // Private SPA routes need the client entry, never the homepage snapshot.
    // Unknown public URLs are served by Vercel's native 404 response instead.
    const shellPage = await browser.newPage({ javaScriptEnabled:false });
    await shellPage.setContent(template);
    await shellPage.evaluate(() => {
      document.head.querySelectorAll('script[type="application/ld+json"], link[rel="canonical"], link[hreflang], meta[property^="og:"], meta[name^="twitter:"]').forEach(e => e.remove());
      document.documentElement.lang = 'en';
      document.title = 'Isra Anwar';
      document.querySelector('meta[name="robots"]').content = 'noindex, follow';
      document.querySelector('meta[name="description"]').content = '';
      document.querySelector('#root').innerHTML = '<noscript>JavaScript is required to use this page.</noscript>';
    });
    await writeFile(resolve(distDir, 'private-shell.html'), '<!doctype html>\n' + await shellPage.locator('html').evaluate(e => e.outerHTML));
    await shellPage.evaluate(() => {
      document.title = 'Page not found | Isra Anwar';
      document.querySelector('meta[name="description"]').content = 'This page could not be found. Return to Isra Anwar.';
      document.querySelector('#root').innerHTML = '<main style="min-height:80vh;display:grid;place-content:center;text-align:center;padding:24px;color:#fff;background:#000"><p>404</p><h1>Page not found.</h1><p>The page you requested does not exist.</p><a href="/" style="color:#c8b7ff">Back to home</a></main>';
    });
    await writeFile(resolve(distDir, '404.html'), '<!doctype html>\n' + await shellPage.locator('html').evaluate(e => e.outerHTML));
    await shellPage.close();
    // The sitemap and HTML inventory come from the same successful build,
    // including active store products fetched from the configured data source.
    const escape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const entries = routes.filter(r => !r.noindex).map(route => {
      const url = new URL(route.path, site.url).href;
      const modified = route.article?.post.updated_at || route.article?.post.published_at;
      const lastmod = modified && Number.isFinite(Date.parse(modified)) ? `<lastmod>${new Date(modified).toISOString()}</lastmod>` : '';
      return `  <url><loc>${escape(url)}</loc>${lastmod}</url>`;
    });
    await writeFile(resolve(distDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`);
    console.log(`✓ Application HTML prerendered: ${snapshots.length} public pages`);
  } finally {
    await browser?.close();
    await new Promise(r => server.close(r));
  }
}
