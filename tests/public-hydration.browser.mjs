import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

// Run against the production build, not Vite's development server.
const base = process.env.TEST_URL || 'http://127.0.0.1:4203';
const browser = await chromium.launch();
try {
  for (const width of [390, 1440]) {
    for (const language of ['en', 'id']) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [], requests = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error' && message.text().includes('Public hydration:')) errors.push(message.text());
      });
      page.on('request', request => requests.push(request.url()));
      await page.addInitScript(language => {
        window.__fontLoadCycles = 0;
        document.fonts.addEventListener('loadingdone', () => window.__fontLoadCycles++);
        localStorage.setItem('okr:lang', language);
        localStorage.setItem('okr:migrated:lang:v2', '1');
        localStorage.setItem('okr:migrated:lang:v3', '1');
      }, language);
      await page.route('**/*', route => /googlesyndication\.com|doubleclick\.net|google-analytics\.com|googletagmanager\.com/.test(new URL(route.request().url()).hostname) ? route.abort() : route.continue());
      await page.route(base + '/', async route => {
        const response = await route.fetch();
        const html = await response.text();
        assert.match(html, /id="public-bootstrap"/);
        // Mark the parser-created, locale-selected node before deferred modules
        // run. Hydration must retain this actual node, not recreate its text.
        await route.fulfill({ response, body: html.replace('</body>', '<script>window.__parserHeading=document.querySelector("#root h1");</script></body>') });
      });
      await page.goto(base + '/', { waitUntil: 'networkidle' });
      await page.waitForFunction(() => document.querySelector('.okr__sun-hero-bg')?.dataset.mode === 'ready');
      assert.equal(await page.evaluate(() => document.querySelector('#root h1') === window.__parserHeading), true);
      assert.equal(await page.evaluate(() => document.documentElement.lang), language);
      assert.equal(await page.locator('.okr__isra-cloud-stage').first().getAttribute('data-renderer'), 'worker');
      assert.ok(!requests.some(url => /\/assets\/prerender-[^/]+\.js/.test(url)), 'Build-only server renderer must never download on a visitor page');
      assert.deepEqual(errors, []);
      assert.ok(await page.evaluate(() => window.__fontLoadCycles <= 1), 'Deferred styles must not restart the font loading cycle');
      assert.equal(await page.evaluate(() => localStorage.getItem('okr:seeded:store:v17')), null, 'Public hydration must not seed an unused local store catalog');
      console.log(`PASS retained public HTML, language ${language}, worker renderer, build-only bundle excluded: ${width}px`);
      await page.close();
    }
  }
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.route('**/*', route => /googlesyndication|doubleclick|google-analytics|googletagmanager/.test(new URL(route.request().url()).hostname) ? route.abort() : route.continue());
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('.okr__sun-hero-bg')?.dataset.mode === 'ready');
    await page.waitForTimeout(1800);
    await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'instant' }));
    await page.waitForFunction(() => scrollY === 0);
    await page.mouse.move(width / 2, 450);
    await page.mouse.wheel(0, 700);
    await page.waitForFunction(() => scrollY > 0);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => scrollY), 0, 'Hard reload from a scrolled page starts at the top');
    await page.goto(base + '/#services', { waitUntil: 'networkidle' });
    assert.ok(Math.abs(await page.locator('#services').evaluate(element => element.getBoundingClientRect().top)) <= 101);
    await page.close();
    console.log(`PASS late restoration, reader scroll, hard reload and hash navigation: ${width}px`);
  }
  for (const failure of ['initial', 'runtime']) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(failure => {
      const NativeWorker = window.Worker;
      window.__sunTestWorkers = [];
      window.Worker = class extends NativeWorker {
        constructor(...args) {
          if (failure === 'initial') throw new Error('Test worker constructor failure');
          super(...args);
          window.__sunTestWorkers.push(this);
        }
      };
    }, failure);
    await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('.okr__sun-hero-bg')?.dataset.mode === 'ready');
    if (failure === 'initial') {
      assert.equal(await page.locator('.okr__isra-cloud-stage').first().getAttribute('data-renderer'), 'main');
    } else {
      await page.evaluate(() => window.__sunTestWorkers[0].dispatchEvent(new ErrorEvent('error', { cancelable: true, message: 'Test runtime worker failure' })));
      await page.waitForFunction(() => document.querySelector('.okr__sun-hero-bg')?.dataset.mode === 'fallback');
      assert.ok(await page.locator('.okr__isra-cloud-fallback').isVisible());
    }
    assert.ok(await page.locator('.okr__hero-pointcloud-cta').isVisible());
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS ${failure} worker failure keeps the existing animation or image fallback`);
  }
  const page = await browser.newPage();
  await page.addInitScript(() => {
    window.Worker = undefined;
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return /^webgl/.test(type) ? null : getContext.call(this, type, ...args);
    };
  });
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('.okr__sun-hero-bg')?.dataset.mode === 'fallback');
  assert.ok(await page.locator('.okr__isra-cloud-fallback').isVisible());
  assert.ok(await page.locator('.okr__hero-pointcloud-cta').isVisible());
  console.log('PASS unsupported WebGL retains the existing image and usable CTA');
} finally {
  await browser.close();
}
