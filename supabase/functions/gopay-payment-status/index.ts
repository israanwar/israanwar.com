import {
  corsHeaders,
  createSupabaseAdmin,
  fetchGatewayPaymentStatus,
  isPaidPayment,
  jsonResponse,
  mergeGatewayPayment,
  readJson,
} from "../_shared/gopay.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ success: false, error: "Method not allowed" }, { status: 405 });

  try {
    const { orderNumber } = await readJson(req);
    if (!orderNumber) return jsonResponse({ success: false, error: "orderNumber wajib diisi" }, { status: 400 });

    const supabase = createSupabaseAdmin();
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (error) throw error;
    if (!order) return jsonResponse({ success: false, error: "Order tidak ditemukan" }, { status: 404 });

    const currentPayment = order.data?.payment_gateway;
    if (!currentPayment?.trx_id) {
      return jsonResponse({ success: false, error: "Payment gateway belum dibuat untuk order ini" }, { status: 400 });
    }

    const payment = await fetchGatewayPaymentStatus(order, currentPayment);
    const nextStatus = isPaidPayment(payment) ? "paid" : order.status;
    const nextData = mergeGatewayPayment(order, payment, {
      checked_from: "gopay-payment-status",
      paid_at: payment.paid_at ?? currentPayment.paid_at ?? null,
    });

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: nextStatus, data: nextData })
      .eq("id", order.id);
    if (updateError) throw updateError;

    return jsonResponse({ success: true, payment: nextData.payment_gateway, orderStatus: nextStatus });
  } catch (error) {
    return jsonResponse({ success: false, error: error?.message ?? "Gagal cek pembayaran GoPay" }, { status: 500 });
  }
});
