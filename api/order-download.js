// Mengalirkan file produk digital hanya kalau pesanan sudah berstatus paid
// dan token akses pembeli cocok. Lokasi file rahasia dan tidak pernah dikirim
// ke browser. File dialirkan (streaming), jadi ukuran besar tidak memenuhi
// memori fungsi dan tidak terkena batas respons biasa milik Vercel.
//
// Sumber file untuk satu produk, urutan prioritas:
//   1. Vercel Blob privat: pathname "downloads/<product_id>/<nama-file>".
//      Cukup unggah file ke folder itu di Blob store privat yang terhubung ke
//      proyek (BLOB_READ_WRITE_TOKEN diisi Vercel otomatis). Hapus file itu
//      untuk menarik produk dari pengiriman otomatis.
//   2. Env DIGITAL_FILES (cara lama), JSON mis.
//      {"<product_id>":{"url":"https://...","filename":"nama.pdf"}}
//
// Produk tanpa file di salah satu sumber di atas tidak punya tombol unduh.
// Pembeli hanya melihat pesan bahwa link dikirim lewat email.
import { createHash, timingSafeEqual } from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const BLOB_FOLDER = "downloads";

function sha256Hex(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function safeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length || a.length === 0) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

function loadFiles() {
  try {
    const parsed = JSON.parse(process.env.DIGITAL_FILES || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function safeFilename(name, fallback = "download.pdf") {
  const cleaned = String(name || "").replace(/[^A-Za-z0-9._-]/g, "_").replace(/^\.+/, "");
  return cleaned || fallback;
}

async function fetchOrder(orderNumber) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("config");
  const r = await fetch(`${url}/rest/v1/rpc/get_order_by_number`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ order_no: orderNumber }),
  });
  if (!r.ok) throw new Error("order lookup failed");
  return r.json();
}

// The Blob SDK is loaded on demand so a project without a Blob store keeps
// working with DIGITAL_FILES alone.
async function loadBlobSdk() {
  return import("@vercel/blob");
}

// Finds the private Blob for a product, or null. Only ever called with a UUID
// product id, so the prefix cannot be steered to another folder.
async function findBlob(sdk, productId) {
  if (!UUID_RE.test(productId)) return null;
  try {
    const { blobs } = await sdk.list({ prefix: `${BLOB_FOLDER}/${productId.toLowerCase()}/`, limit: 5 });
    const file = [...blobs].sort((a, b) => a.pathname.localeCompare(b.pathname))[0];
    if (!file) return null;
    return { pathname: file.pathname, filename: safeFilename(file.pathname.split("/").pop()) };
  } catch {
    // No store connected, or a transient Blob error: treat as "no file".
    return null;
  }
}

async function resolveDeliverable(deps, productId) {
  const entry = deps.files[productId];
  if (entry?.url) return { kind: "url", url: entry.url, filename: safeFilename(entry.filename) };
  const blob = await findBlob(await deps.blobSdk(), productId);
  return blob ? { kind: "blob", ...blob } : null;
}

export function createHandler(overrides = {}) {
  const deps = {
    fetchOrder,
    blobSdk: loadBlobSdk,
    fetchUrl: (url) => fetch(url),
    ...overrides,
  };
  const filesOf = () => deps.files ?? loadFiles();

  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const { orderNumber, token, productId } = req.body ?? {};
    if (typeof orderNumber !== "string" || typeof token !== "string" || !orderNumber || !token) {
      return res.status(400).json({ success: false, error: "orderNumber dan token wajib diisi" });
    }

    let order;
    try {
      order = await deps.fetchOrder(orderNumber);
    } catch {
      return res.status(503).json({ success: false, error: "Layanan unduhan sedang tidak tersedia" });
    }

    // Pesan yang sama untuk pesanan tidak ada dan token salah, supaya tidak bisa dipakai menebak.
    const expected = order?.data?.access_token_hash;
    if (!order || !safeEqualHex(String(expected ?? ""), sha256Hex(token))) {
      return res.status(403).json({ success: false, error: "Akses ditolak" });
    }
    if (order.status !== "paid") {
      return res.status(403).json({ success: false, error: "Pembayaran belum terverifikasi" });
    }

    const ctx = { files: filesOf(), blobSdk: deps.blobSdk };
    const items = Array.isArray(order?.data?.items) ? order.data.items : [];
    const seen = new Set();
    const ordered = items
      .map((it) => ({ product_id: typeof it?.product_id === "string" ? it.product_id : "", name: it?.name }))
      .filter((it) => it.product_id && !seen.has(it.product_id) && seen.add(it.product_id));

    if (!productId) {
      const files = [];
      for (const it of ordered) {
        const found = await resolveDeliverable(ctx, it.product_id);
        if (found) files.push({ product_id: it.product_id, name: it.name || found.filename, filename: found.filename });
      }
      return res.status(200).json({ success: true, files });
    }

    const entry = ordered.find((it) => it.product_id === String(productId));
    if (!entry) return res.status(404).json({ success: false, error: "File tidak ditemukan" });
    const found = await resolveDeliverable(ctx, entry.product_id);
    if (!found) return res.status(404).json({ success: false, error: "File tidak ditemukan" });

    let body;
    let size = null;
    let contentType = "application/pdf";
    try {
      if (found.kind === "blob") {
        const sdk = await deps.blobSdk();
        const result = await sdk.get(found.pathname, { access: "private" });
        if (!result || (result.statusCode !== undefined && result.statusCode !== 200) || !result.stream) {
          return res.status(502).json({ success: false, error: "File belum tersedia. Hubungi admin" });
        }
        body = Readable.fromWeb(result.stream);
        size = result.blob?.size ?? null;
        contentType = result.blob?.contentType || contentType;
      } else {
        const upstream = await deps.fetchUrl(found.url);
        if (!upstream.ok || !upstream.body) {
          return res.status(502).json({ success: false, error: "File belum tersedia. Hubungi admin" });
        }
        body = Readable.fromWeb(upstream.body);
        const length = Number(upstream.headers.get("content-length"));
        size = Number.isFinite(length) && length > 0 ? length : null;
        contentType = upstream.headers.get("content-type") || contentType;
      }
    } catch {
      return res.status(502).json({ success: false, error: "File belum tersedia. Hubungi admin" });
    }

    res.status(200);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${found.filename}"`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (size) res.setHeader("Content-Length", String(size));
    try {
      await pipeline(body, res);
    } catch {
      // The client went away or the source broke mid-stream; the response is
      // already underway, so just make sure it is closed.
      if (!res.writableEnded) res.end();
    }
    return undefined;
  };
}

export default createHandler();
