import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from '@playwright/test';

// Build gate for the purchase path. It drives the built site the way a
// visitor does (product page, cart, checkout, place order, payment page) and
// fails the build if any step breaks, so a broken checkout never reaches
// production. Supabase reads are real; every Supabase write is intercepted
// and answered locally, so no order is ever created.

const PRIVATE_SHELL = /^\/(cart|checkout|orders\/.+|order\/.+)$/;
const STEP_TIMEOUT = 20000;

// VERIFY_CHECKOUT_ASSET_DELAY_MS slows JavaScript responses so the check can be
// proven against slow hydration (a prerendered button clicked before React
// attaches). Unset in normal builds.
const ASSET_DELAY_MS = Number(process.env.VERIFY_CHECKOUT_ASSET_DELAY_MS || 0);
// VERIFY_CHECKOUT_CPU_THROTTLE (e.g. 6) slows the page's CPU the same way for hydration tests.
const CPU_THROTTLE = Number(process.env.VERIFY_CHECKOUT_CPU_THROTTLE || 0);

function startServer(distDir) {
  const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.woff2':'font/woff2', '.webp':'image/webp', '.wasm':'application/wasm', '.webmanifest':'application/manifest+json' };
  const server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    // Mirror the vercel.json rewrites for client-only routes.
    let file = PRIVATE_SHELL.test(pathname) ? resolve(distDir, 'private-shell.html') : resolve(distDir, '.' + pathname);
    if (!file.startsWith(distDir + sep) && file !== distDir) { res.writeHead(403).end(); return; }
    if (!extname(file)) file = resolve(file, 'index.html');
    try {
      const body = await readFile(file);
      if (ASSET_DELAY_MS && extname(file) === '.js') await new Promise(r => setTimeout(r, ASSET_DELAY_MS));
      res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' }).end(body);
    } catch {
      try { res.writeHead(404, { 'Content-Type': 'text/html' }).end(await readFile(resolve(distDir, '404.html'))); }
      catch { res.writeHead(404).end(); }
    }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

async function launchBrowser() {
  const launchOptions = { headless: true };
  // Same runtime as render-public-html.mjs on Vercel's Amazon Linux runner.
  if (process.env.VERCEL === '1' && process.platform === 'linux') {
    const { default: buildChromium } = await import('@sparticuz/chromium');
    launchOptions.args = buildChromium.args.filter(arg => arg !== '--single-process');
    launchOptions.executablePath = await buildChromium.executablePath();
  }
  return chromium.launch(launchOptions);
}

// Intercepts every Supabase write. Order inserts are recorded and echoed back
// to the payment page's lookup; anything else is refused so a test can never
// change real data.
async function interceptWrites(page) {
  const orders = new Map();
  await page.route(/\.supabase\.co\/rest\/v1\//, async route => {
    const request = route.request();
    if (request.method() === 'GET' || request.method() === 'HEAD') return route.continue();
    const url = new URL(request.url());
    if (request.method() === 'POST' && url.pathname.endsWith('/rest/v1/orders')) {
      const rows = [].concat(JSON.parse(request.postData() || '[]'));
      for (const row of rows) orders.set(row.order_number, { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row });
      return route.fulfill({ status: 201, body: '' });
    }
    if (request.method() === 'POST' && url.pathname.endsWith('/rpc/get_order_by_number')) {
      const { order_no: orderNo } = JSON.parse(request.postData() || '{}');
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(orders.get(orderNo) ?? null) });
    }
    return route.abort();
  });
  return orders;
}

async function step(name, fn) {
  try { await fn(); }
  catch (error) { throw new Error(`Checkout check failed at "${name}": ${error.message.split('\n')[0]}`); }
}

async function runScenario(browser, base, slugs, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  if (CPU_THROTTLE > 1) await (await context.newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error)));
  const orders = await interceptWrites(page);
  const checkoutForm = page.locator('form.okr__checkout-grid');
  const label = `${viewport.width}px`;
  try {
    await step(`${label} add to cart from a prerendered product page`, async () => {
      await page.goto(`${base}/store/${slugs[0]}`, { waitUntil: 'networkidle' });
      // Network idle can fire before React starts hydrating on a slow runner.
      await page.waitForTimeout(1500);
      // The product page is prerendered HTML, so a click that lands before
      // React has attached does nothing. Keep clicking until the cart has the
      // item (extra clicks only raise the quantity), as a patient visitor would.
      const cartHasItem = () => page.waitForFunction(() => JSON.parse(localStorage.getItem('okr:cart') || '[]').length === 1, null, { timeout: 5000 });
      let added = false;
      for (let attempt = 0; attempt < 6 && !added; attempt++) {
        await page.getByRole('button', { name: 'Add to cart' }).click({ timeout: STEP_TIMEOUT });
        added = await cartHasItem().then(() => true, () => false);
      }
      if (!added) throw new Error('cart is still empty after clicking Add to cart');
      // Digital products: however many times the button was clicked, one license.
      const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('okr:cart') || '[]'));
      if (cart.length !== 1 || cart[0].qty !== 1) throw new Error(`repeated Add to cart left ${JSON.stringify(cart)} instead of one item at quantity 1`);
    });
    await step(`${label} open the cart with the header link`, async () => {
      await page.locator('a[href="/cart"]').first().click({ timeout: STEP_TIMEOUT });
      await page.waitForURL(/\/cart$/, { timeout: STEP_TIMEOUT });
      await page.locator('a[href="/checkout"]').first().waitFor({ timeout: STEP_TIMEOUT });
    });
    await step(`${label} go from the cart to checkout and stay there`, async () => {
      await page.locator('a[href="/checkout"]').first().click();
      await checkoutForm.waitFor({ timeout: STEP_TIMEOUT });
      await page.waitForTimeout(1500);
      if (!page.url().endsWith('/checkout')) throw new Error(`redirected to ${page.url()}`);
    });
    await step(`${label} reload checkout`, async () => {
      await page.reload({ waitUntil: 'networkidle' });
      await checkoutForm.waitFor({ timeout: STEP_TIMEOUT });
      if (!page.url().endsWith('/checkout')) throw new Error(`redirected to ${page.url()}`);
    });
    await step(`${label} Buy now on a product already in the cart keeps one license`, async () => {
      await page.goto(`${base}/store/${slugs[0]}`, { waitUntil: 'networkidle' });
      for (let attempt = 0; attempt < 6; attempt++) {
        await page.getByRole('button', { name: 'Buy now' }).click({ timeout: STEP_TIMEOUT });
        if (await page.waitForURL(/\/checkout$/, { timeout: 5000 }).then(() => true, () => false)) break;
      }
      const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('okr:cart') || '[]'));
      if (cart.length !== 1 || cart[0].qty !== 1) throw new Error(`Buy now on a carted product left ${JSON.stringify(cart)}`);
    });
    await step(`${label} Buy now from a second product`, async () => {
      await page.goto(`${base}/store/${slugs[1] ?? slugs[0]}`, { waitUntil: 'networkidle' });
      // Same patience for Buy now: it only navigates once React has attached.
      for (let attempt = 0; attempt < 6; attempt++) {
        await page.getByRole('button', { name: 'Buy now' }).click({ timeout: STEP_TIMEOUT });
        if (await page.waitForURL(/\/checkout$/, { timeout: 5000 }).then(() => true, () => false)) break;
      }
      await checkoutForm.waitFor({ timeout: STEP_TIMEOUT });
    });
    await step(`${label} place the order and reach the payment page`, async () => {
      // Field order in CheckoutPage: name, email, phone, then the address textarea.
      const inputs = checkoutForm.locator('input');
      await inputs.nth(0).fill('Build Checkout Check');
      await inputs.nth(1).fill('build-check@example.com');
      await inputs.nth(2).fill('081234567890');
      await checkoutForm.locator('textarea').first().fill('Automated build check, never stored.');
      // A fast double click must still create exactly one order.
      await checkoutForm.locator('button[type="submit"]').dblclick();
      await page.waitForURL(/\/orders\/[^/]+\/payment/, { timeout: STEP_TIMEOUT });
      if (orders.size !== 1) throw new Error(`a double click created ${orders.size} orders`);
      const [orderNumber, order] = [...orders.entries()].at(-1) ?? [];
      if (!orderNumber) throw new Error('no order insert was sent');
      if (!(Number(order.total) > 0)) throw new Error(`order total is ${order.total}`);
      const items = order.data?.items ?? [];
      if (!(items.length > 0)) throw new Error('order has no items');
      if (new Set(items.map((item) => item.product_id)).size !== items.length) throw new Error('order lists a product twice');
      if (items.some((item) => item.qty !== 1)) throw new Error(`order has a quantity other than 1: ${JSON.stringify(items.map((item) => item.qty))}`);
      const itemsTotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
      if (itemsTotal !== Number(order.total)) throw new Error(`order total ${order.total} does not match its items (${itemsTotal})`);
      await page.getByText(orderNumber).first().waitFor({ timeout: STEP_TIMEOUT });
    });
    await step(`${label} empty cart sends checkout back to the cart`, async () => {
      await page.evaluate(() => localStorage.removeItem('okr:cart'));
      await page.goto(`${base}/checkout`, { waitUntil: 'networkidle' });
      await page.waitForURL(/\/cart$/, { timeout: STEP_TIMEOUT });
    });
    if (pageErrors.length) throw new Error(`Checkout check found page errors at ${label}: ${pageErrors.slice(0, 3).join(' | ')}`);
  } finally {
    await context.close();
  }
}

export async function verifyCheckout({ distDir }) {
  const storeDir = resolve(distDir, 'store');
  const slugs = (await readdir(storeDir, { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
  if (!slugs.length) throw new Error('Checkout check needs at least one prerendered store product');
  const server = await startServer(distDir);
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await launchBrowser();
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
      // A real break fails both attempts. One retry absorbs a runner hiccup
      // (slow hydration, a dropped network read) so it cannot block a deploy.
      try {
        await runScenario(browser, base, slugs, viewport);
      } catch (firstError) {
        console.warn(`Checkout check retrying once after: ${firstError.message}`);
        await runScenario(browser, base, slugs, viewport);
      }
    }
    console.log('✓ Checkout verified: cart, one license per product, checkout, reload, Buy now, single order on double click, payment page (mobile and desktop)');
  } finally {
    await browser.close();
    server.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await verifyCheckout({ distDir: resolve(process.argv[2] ?? 'dist') });
}
