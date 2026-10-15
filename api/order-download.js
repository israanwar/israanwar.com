// Mengalirkan file produk digital hanya kalau pesanan sudah berstatus paid
// dan token akses pembeli cocok. Lokasi file rahasia, disimpan di environment
// variable Vercel, dan tidak pernah dikirim ke browser.
//
// Env (Vercel):
//   DIGITAL_FILES  JSON, mis. {"<product_id>":{"url":"https://...","filename":"nama.pdf"}}
//   VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY  (sudah ada)
import { createHash, timingSafeEqual } from "node:crypto";

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

export default async function handler(req, res) {
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
    order = await fetchOrder(orderNumber);
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

  const registry = loadFiles();
  const items = Array.isArray(order?.data?.items) ? order.data.items : [];
  const owned = items
    .map((it) => ({ product_id: it?.product_id, name: it?.name }))
    .filter((it) => it.product_id && registry[it.product_id]?.url);

  if (!productId) {
    return res.status(200).json({
      success: true,
      files: owned.map((it) => ({
        product_id: it.product_id,
        name: it.name || registry[it.product_id].filename,
        filename: registry[it.product_id].filename || "download.pdf",
      })),
    });
  }

  const entry = owned.find((it) => it.product_id === String(productId));
  if (!entry) return res.status(404).json({ success: false, error: "File tidak ditemukan" });

  const file = registry[entry.product_id];
  let upstream;
  try {
    upstream = await fetch(file.url);
  } catch {
    return res.status(502).json({ success: false, error: "File belum tersedia. Hubungi admin" });
  }
  if (!upstream.ok) return res.status(502).json({ success: false, error: "File belum tersedia. Hubungi admin" });

  const filename = String(file.filename || "download.pdf").replace(/[^A-Za-z0-9._-]/g, "_");
  const buf = Buffer.from(await upstream.arrayBuffer());
  res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", String(buf.length));
  return res.status(200).send(buf);
}
