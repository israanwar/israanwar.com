import { supabase, supabaseEnabled } from "./supabaseClient";

export const PAYMENT_METHOD_MANUAL_QRIS = "qris";
export const PAYMENT_METHOD_GOPAY_MERCHANT = "gopay_merchant";

const PAID_STATUSES = new Set(["PAID", "paid", "settlement", "capture"]);
const ACTIVE_STATUSES = new Set(["PENDING", "pending", "CREATED", "created"]);

export function isGopayMerchantAutoEnabled(settings = {}) {
  return settings.gopay_auto_enabled === true || settings.gopay_auto_enabled === "true";
}

export function getCheckoutPaymentMethod(settings = {}) {
  return isGopayMerchantAutoEnabled(settings)
    ? PAYMENT_METHOD_GOPAY_MERCHANT
    : PAYMENT_METHOD_MANUAL_QRIS;
}

export function isGopayMerchantOrder(order = {}, settings = {}) {
  if (order.payment_method === PAYMENT_METHOD_MANUAL_QRIS) return false;
  return order.payment_method === PAYMENT_METHOD_GOPAY_MERCHANT || isGopayMerchantAutoEnabled(settings);
}

export function getOrderGatewayPayment(order = {}) {
  const payment = order.payment_gateway ?? order.data?.payment_gateway;
  return normalizeGatewayPayment(payment);
}

export function normalizeGatewayPayment(payment) {
  if (!payment || typeof payment !== "object") return null;
  const data = payment.data && typeof payment.data === "object" ? payment.data : payment;
  const trxId = data.trx_id ?? data.trxId ?? data.transaction_id ?? data.qris_id ?? data.id;
  const qrisImageUrl = data.qris_image_url ?? data.qrImageUrl ?? data.qris_url ?? data.qr_url ?? data.image_url;
  return {
    provider: data.provider ?? PAYMENT_METHOD_GOPAY_MERCHANT,
    adapter: data.adapter ?? null,
    trxId,
    qrisId: data.qris_id ?? data.qrisId ?? null,
    status: data.status ?? null,
    amount: Number(data.amount ?? data.base_amount ?? 0) || 0,
    fee: Number(data.fee ?? 0) || 0,
    uniqueCode: Number(data.unique_code ?? data.uniqueCode ?? 0) || 0,
    amountToPay: Number(data.amount_to_pay ?? data.amountToPay ?? data.amount ?? 0) || 0,
    qrisImageUrl,
    qrisString: data.qris_string ?? data.qrString ?? data.qris_code ?? null,
    expiresAt: data.expires_at ?? data.expiresAt ?? null,
    paidAt: data.paid_at ?? data.paidAt ?? null,
    raw: data.raw ?? null,
  };
}

export function isGatewayPaymentPaid(payment) {
  return PAID_STATUSES.has(payment?.status) || Boolean(payment?.paidAt);
}

export function isGatewayPaymentActive(payment) {
  return !payment?.status || ACTIVE_STATUSES.has(payment.status);
}

export async function createGopayMerchantPayment(orderNumber) {
  return invokeGopayFunction("gopay-create-payment", { orderNumber });
}

export async function refreshGopayMerchantPayment(orderNumber) {
  return invokeGopayFunction("gopay-payment-status", { orderNumber });
}

async function invokeGopayFunction(functionName, body) {
  if (!supabaseEnabled || !supabase) {
    throw new Error("Supabase belum aktif, jadi GoPay otomatis belum bisa dipakai.");
  }

  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) throw new Error(error.message ?? "GoPay gateway gagal merespons.");
  if (!data?.success) throw new Error(data?.error ?? "GoPay gateway gagal merespons.");
  return normalizeGatewayPayment(data.payment ?? data.data);
}
