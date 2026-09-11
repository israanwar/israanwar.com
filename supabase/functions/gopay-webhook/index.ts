import {
  corsHeaders,
  createSupabaseAdmin,
  isExpiredPayment,
  isPaidPayment,
  jsonResponse,
  mergeGatewayPayment,
  optionalEnv,
  verifyHmacSignature,
} from "../_shared/gopay.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ success: false, error: "Method not allowed" }, { status: 405 });

  const rawBody = await req.text();
  try {
    const secret = optionalEnv("GOPAY_WEBHOOK_SECRET");
    const signature = req.headers.get("x-signature") ?? req.headers.get("X-Signature");
    const valid = await verifyHmacSignature(rawBody, signature, secret);
    if (!valid) return jsonResponse({ success: false, error: "Invalid signature" }, { status: 401 });

    const event = JSON.parse(rawBody || "{}");
    const orderNumber = event.trxId ?? event.trx_id ?? event.externalId ?? event.order_number ?? event.metadata?.orderNumber;
    if (!orderNumber) return jsonResponse({ success: false, error: "Order number tidak ditemukan di webhook" }, { status: 400 });

    const supabase = createSupabaseAdmin();
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (error) throw error;
    if (!order) return jsonResponse({ success: false, error: "Order tidak ditemukan" }, { status: 404 });

    const payment = {
      ...(order.data?.payment_gateway ?? {}),
      provider: "gopay_merchant",
      adapter: order.data?.payment_gateway?.adapter ?? "cv3inx",
      trx_id: event.trxId ?? event.trx_id ?? orderNumber,
      status: event.status ?? (event.event === "payment.paid" ? "PAID" : event.event === "payment.expired" ? "EXPIRED" : "PENDING"),
      amount: Number(event.amount ?? order.total) || 0,
      fee: Number(event.fee ?? order.data?.payment_gateway?.fee ?? 0) || 0,
      unique_code: Number(event.uniqueCode ?? event.unique_code ?? order.data?.payment_gateway?.unique_code ?? 0) || 0,
      amount_to_pay: Number(event.amountToPay ?? event.amount_to_pay ?? event.amount ?? order.total) || 0,
      paid_at: event.paidAt ?? event.paid_at ?? null,
      webhook_event: event.event ?? null,
      webhook_received_at: new Date().toISOString(),
    };

    const nextStatus = isPaidPayment(payment)
      ? "paid"
      : isExpiredPayment(payment)
        ? order.status
        : order.status;
    const nextData = mergeGatewayPayment(order, payment, { checked_from: "gopay-webhook" });

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: nextStatus, data: nextData })
      .eq("id", order.id);
    if (updateError) throw updateError;

    return jsonResponse({ success: true, orderStatus: nextStatus });
  } catch (error) {
    return jsonResponse({ success: false, error: error?.message ?? "Gagal memproses webhook GoPay" }, { status: 500 });
  }
});
