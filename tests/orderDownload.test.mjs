import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Writable } from 'node:stream';
import { createHandler } from '../api/order-download.js';

const PRODUCT = 'e5a0accf-0575-4c3e-9e33-c61aea9e8659';
const OTHER = '11111111-2222-3333-4444-555555555555';
const TOKEN = 'buyer-secret-token';
const hash = (v) => createHash('sha256').update(v).digest('hex');

const paidOrder = (over = {}) => ({
  status: 'paid',
  data: { access_token_hash: hash(TOKEN), items: [{ product_id: PRODUCT, name: 'Jago Jualan Shopee' }] },
  ...over,
});

function fakeRes() {
  const chunks = [];
  const res = new Writable({ write(chunk, _enc, cb) { chunks.push(chunk); cb(); } });
  res.headers = {};
  res.statusCode = 200;
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(obj)); return res; };
  res.done = () => new Promise((resolve) => (res.writableFinished ? resolve() : res.on('finish', resolve)));
  res.bodyBuffer = () => Buffer.concat(chunks);
  return res;
}

function bigStream(totalBytes, chunkBytes = 1024 * 1024) {
  let sent = 0;
  return new ReadableStream({
    pull(controller) {
      if (sent >= totalBytes) return controller.close();
      const size = Math.min(chunkBytes, totalBytes - sent);
      controller.enqueue(new Uint8Array(size).fill(7));
      sent += size;
    },
  });
}

const blobSdk = (files = {}, streamBytes = 20 * 1024 * 1024) => async () => ({
  list: async ({ prefix }) => ({ blobs: Object.keys(files).filter((p) => p.startsWith(prefix)).map((pathname) => ({ pathname })) }),
  get: async (pathname, opts) => {
    assert.equal(opts.access, 'private');
    if (!files[pathname]) return null;
    return { statusCode: 200, stream: bigStream(streamBytes), blob: { size: streamBytes, contentType: 'application/pdf' } };
  },
});

async function call(handler, body, method = 'POST') {
  const res = fakeRes();
  await handler({ method, body }, res);
  await res.done();
  return res;
}

const json = (res) => JSON.parse(res.bodyBuffer().toString());
const mk = (over = {}) => createHandler({
  fetchOrder: async () => paidOrder(),
  files: {},
  blobSdk: blobSdk({ [`downloads/${PRODUCT}/Jago-Jualan-Shopee.pdf`]: true }),
  ...over,
});

test('rejects non-POST and missing fields', async () => {
  assert.equal((await call(mk(), {}, 'GET')).statusCode, 405);
  assert.equal((await call(mk(), { orderNumber: 'A' })).statusCode, 400);
});

test('wrong token and unknown order get the same 403', async () => {
  const bad = await call(mk(), { orderNumber: 'A', token: 'nope' });
  const missing = await call(mk({ fetchOrder: async () => null }), { orderNumber: 'A', token: TOKEN });
  assert.equal(bad.statusCode, 403);
  assert.equal(missing.statusCode, 403);
  assert.deepEqual(json(bad), json(missing));
});

test('unpaid order is refused even with a valid token', async () => {
  for (const status of ['pending', 'awaiting_verification', 'cancelled']) {
    const res = await call(mk({ fetchOrder: async () => paidOrder({ status }) }), { orderNumber: 'A', token: TOKEN, productId: PRODUCT });
    assert.equal(res.statusCode, 403, status);
    assert.equal(res.bodyBuffer().length < 200, true, 'no file bytes leaked');
  }
});

test('lists downloadable files for a paid order without revealing locations', async () => {
  const res = await call(mk(), { orderNumber: 'A', token: TOKEN });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(json(res), { success: true, files: [{ product_id: PRODUCT, name: 'Jago Jualan Shopee', filename: 'Jago-Jualan-Shopee.pdf' }] });
});

test('streams the full 20 MB file with attachment headers', async () => {
  const res = await call(mk(), { orderNumber: 'A', token: TOKEN, productId: PRODUCT });
  assert.equal(res.statusCode, 200);
  assert.equal(res.bodyBuffer().length, 20 * 1024 * 1024);
  assert.equal(res.headers['content-type'], 'application/pdf');
  assert.equal(res.headers['content-length'], String(20 * 1024 * 1024));
  assert.match(res.headers['content-disposition'], /^attachment; filename="Jago-Jualan-Shopee\.pdf"$/);
  assert.equal(res.headers['cache-control'], 'no-store');
});

test('cannot download a product that is not in the order', async () => {
  const handler = mk({ blobSdk: blobSdk({ [`downloads/${PRODUCT}/a.pdf`]: true, [`downloads/${OTHER}/b.pdf`]: true }) });
  const res = await call(handler, { orderNumber: 'A', token: TOKEN, productId: OTHER });
  assert.equal(res.statusCode, 404);
});

test('path-like product ids never reach Blob lookups', async () => {
  const prefixes = [];
  const sdk = async () => ({ list: async ({ prefix }) => { prefixes.push(prefix); return { blobs: [] }; }, get: async () => null });
  const evil = '../../etc/passwd';
  const handler = createHandler({
    fetchOrder: async () => paidOrder({ data: { access_token_hash: hash(TOKEN), items: [{ product_id: evil, name: 'x' }] } }),
    files: {}, blobSdk: sdk,
  });
  const res = await call(handler, { orderNumber: 'A', token: TOKEN, productId: evil });
  assert.equal(res.statusCode, 404);
  assert.deepEqual(prefixes, []);
});

test('product without a file has no download and no error', async () => {
  const res = await call(mk({ blobSdk: blobSdk({}) }), { orderNumber: 'A', token: TOKEN });
  assert.deepEqual(json(res), { success: true, files: [] });
});

test('a Blob outage degrades to no files instead of crashing', async () => {
  const sdk = async () => ({ list: async () => { throw new Error('boom'); } });
  const res = await call(mk({ blobSdk: sdk }), { orderNumber: 'A', token: TOKEN });
  assert.deepEqual(json(res), { success: true, files: [] });
});

test('missing Blob object after listing returns 502', async () => {
  const sdk = async () => ({
    list: async () => ({ blobs: [{ pathname: `downloads/${PRODUCT}/x.pdf` }] }),
    get: async () => null,
  });
  const res = await call(mk({ blobSdk: sdk }), { orderNumber: 'A', token: TOKEN, productId: PRODUCT });
  assert.equal(res.statusCode, 502);
});

test('legacy DIGITAL_FILES url entries still stream', async () => {
  const handler = mk({
    files: { [PRODUCT]: { url: 'https://files.example/x.pdf', filename: 'ebook final.pdf' } },
    fetchUrl: async () => new Response(bigStream(2 * 1024 * 1024), { headers: { 'content-type': 'application/pdf' } }),
  });
  const res = await call(handler, { orderNumber: 'A', token: TOKEN, productId: PRODUCT });
  assert.equal(res.statusCode, 200);
  assert.equal(res.bodyBuffer().length, 2 * 1024 * 1024);
  assert.match(res.headers['content-disposition'], /ebook_final\.pdf/);
});

test('order lookup failure returns 503', async () => {
  const res = await call(mk({ fetchOrder: async () => { throw new Error('down'); } }), { orderNumber: 'A', token: TOKEN });
  assert.equal(res.statusCode, 503);
});
