import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.1";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...(init.headers ?? {}),
    },
  });
}

export function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} belum diset di Supabase secrets.`);
  return value;
}

export function optionalEnv(name: string) {
  return Deno.env.get(name) ?? "";
}

export function createSupabaseAdmin() {
  return createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
}

export function getGatewayConfig() {
  const baseUrl = requiredEnv("GOPAY_GATEWAY_URL").replace(/\/+$/, "");
  const apiKey = optionalEnv("GOPAY_GATEWAY_API_KEY");
  const adapter = (optionalEnv("GOPAY_GATEWAY_ADAPTER") || "cv3inx").toLowerCase();
  return { baseUrl, apiKey, adapter };
}

export function getWebhookUrl() {
  return `${requiredEnv("SUPABASE_URL").replace(/\/+$/, "")}/functions/v1/gopay-webhook`;
}

export async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export async function gatewayFetch(path: string, init: RequestInit = {}) {
  const config = getGatewayConfig();
  const url = `${config.baseUrl}${path}`;
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (config.apiKey) {
    headers.set("X-API-Key", config.apiKey);
    headers.set("X-Api-Key", config.apiKey);
    headers.set("Authorization", `Bearer ${config.apiKey}`);
  }

  const response = await fetch(url, { ...init, headers });
  const text = await response.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; }
  catch { body = { raw: text }; }

  if (!response.ok || body?.success === false) {
    throw new Error(body?.error ?? body?.message ?? `GoPay gateway HTTP ${response.status}`);
  }
  return body;
}

export async function createGatewayPayment(order: any) {
  const config = getGatewayConfig();
  if (config.adapter === "zaki" || config.adapter === "ahmadzakiyo") {
    const raw = await gatewayFetch("/create-qris", {
      method: "POST",
      body: JSON.stringify({ amount: Number(order.total) || 0 }),
    });
    return normalizeZakiCreate(raw, order, config.baseUrl);
  }

  const webhookSecret = optionalEnv("GOPAY_WEBHOOK_SECRET");
  const raw = await gatewayFetch("/payment/create", {
    method: "POST",
    headers: { "Idempotency-Key": order.order_number },
    body: JSON.stringify({
      amount: Number(order.total) || 0,
      trxId: order.order_number,
      callbackUrl: getWebhookUrl(),
      callbackSecret: webhookSecret || undefined,
      expireMinutes: 30,
      metadata: {
        orderId: order.id,
        orderNumber: order.order_number,
        customerEmail: order.customer_email,
      },
    }),
  });
  return normalizeCv3inxPayment(raw, order, config.baseUrl);
}

export async function fetchGatewayPaymentStatus(order: any, payment: any) {
  const config = getGatewayConfig();
  if (config.adapter === "zaki" || config.adapter === "ahmadzakiyo") {
    const trxId = payment?.trx_id ?? payment?.trxId;
    const amount = payment?.amount_to_pay ?? payment?.amountToPay ?? payment?.amount ?? order.total;
    const qs = new URLSearchParams({ amount: String(amount), trx_id: String(trxId ?? "") });
    if (config.apiKey) qs.set("api_key", config.apiKey);
    const raw = await gatewayFetch(`/check-payment?${qs.toString()}`, { method: "GET" });
    return normalizeZakiStatus(raw, order, payment, config.baseUrl);
  }

  const trxId = payment?.trx_id ?? payment?.trxId ?? order.order_number;
  const raw = await gatewayFetch(`/payment/${encodeURIComponent(trxId)}`, { method: "GET" });
  return normalizeCv3inxPayment(raw, order, config.baseUrl);
}

export function normalizeCv3inxPayment(raw: any, order: any, baseUrl: string) {
  const data = raw?.data ?? raw?.payment ?? raw ?? {};
  const trxId = data.trxId ?? data.trx_id ?? order.order_number;
  return cleanPayment({
    provider: "gopay_merchant",
    adapter: "cv3inx",
    trx_id: trxId,
    status: data.status ?? "PENDING",
    amount: Number(data.amount ?? order.total) || 0,
    fee: Number(data.fee ?? 0) || 0,
    unique_code: Number(data.uniqueCode ?? data.unique_code ?? 0) || 0,
    amount_to_pay: Number(data.amountToPay ?? data.amount_to_pay ?? data.amount ?? order.total) || 0,
    qris_string: data.qrString ?? data.qris_string ?? null,
    qris_image_url: absoluteUrl(data.qrImageUrl ?? data.qrisImageUrl ?? `/payment/${trxId}/qr.png`, baseUrl),
    expires_at: data.expiresAt ?? data.expires_at ?? null,
    paid_at: data.paidAt ?? data.paid_at ?? null,
    raw: { success: raw?.success ?? true },
  });
}

export function normalizeZakiCreate(raw: any, order: any, baseUrl: string) {
  const data = raw?.data ?? raw ?? {};
  const qrisUrl = data.qris_url ? withRawQrParam(absoluteUrl(data.qris_url, baseUrl)) : null;
  return cleanPayment({
    provider: "gopay_merchant",
    adapter: "zaki",
    trx_id: data.trx_id ?? order.order_number,
    qris_id: data.qris_id ?? null,
    status: "PENDING",
    amount: Number(data.amount ?? order.total) || 0,
    amount_to_pay: Number(data.amount ?? order.total) || 0,
    qris_string: data.qris_code ?? null,
    qris_image_url: qrisUrl,
    expires_at: data.expires_at ?? null,
    raw: { success: raw?.success ?? true },
  });
}

export function normalizeZakiStatus(raw: any, order: any, payment: any, _baseUrl: string) {
  const data = raw?.data ?? raw ?? {};
  const transaction = data.transaction ?? raw?.transaction ?? null;
  return cleanPayment({
    ...payment,
    provider: "gopay_merchant",
    adapter: "zaki",
    status: data.paid || raw?.paid ? "PAID" : "PENDING",
    amount: Number(payment?.amount ?? order.total) || 0,
    amount_to_pay: Number(payment?.amount_to_pay ?? payment?.amountToPay ?? payment?.amount ?? order.total) || 0,
    paid_at: transaction?.transaction_time ?? transaction?.paid_at ?? payment?.paid_at ?? null,
    transaction_id: transaction?.transaction_id ?? transaction?.order_id ?? null,
    raw: { success: raw?.success ?? true, paid: data.paid ?? raw?.paid ?? false },
  });
}

export function isPaidPayment(payment: any) {
  const status = String(payment?.status ?? "").toUpperCase();
  return status === "PAID" || status === "SETTLEMENT" || status === "CAPTURE" || Boolean(payment?.paid_at);
}

export function isExpiredPayment(payment: any) {
  const status = String(payment?.status ?? "").toUpperCase();
  return status === "EXPIRED" || status === "EXPIRE" || status === "FAILED" || status === "FAILURE";
}

export function mergeGatewayPayment(order: any, payment: any, extra: Record<string, unknown> = {}) {
  const current = order?.data && typeof order.data === "object" ? order.data : {};
  return {
    ...current,
    payment_method: "gopay_merchant",
    payment_gateway: {
      ...(current.payment_gateway ?? {}),
      ...payment,
      ...extra,
      updated_at: new Date().toISOString(),
    },
  };
}

function cleanPayment(payment: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(payment).filter(([, value]) => typeof value !== "undefined"));
}

function absoluteUrl(value: string | null | undefined, baseUrl: string) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${baseUrl}/${String(value).replace(/^\/+/, "")}`;
}

function withRawQrParam(value: string | null) {
  if (!value) return null;
  const url = new URL(value);
  if (!url.searchParams.has("format") && !url.searchParams.has("raw")) {
    url.searchParams.set("format", "raw");
  }
  return url.toString();
}

export async function verifyHmacSignature(rawBody: string, signature: string | null, secret: string) {
  if (!secret) return true;
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return timingSafeEqual(expected, signature.replace(/^sha256=/i, ""));
}

function timingSafeEqual(a: string, b: string) {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i += 1) {
    result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return result === 0;
}
