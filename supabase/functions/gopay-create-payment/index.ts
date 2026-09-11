import {
  corsHeaders,
  createGatewayPayment,
  createSupabaseAdmin,
  isExpiredPayment,
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
    if (order.status === "paid") {
      return jsonResponse({ success: true, payment: order.data?.payment_gateway ?? null, orderStatus: order.status });
    }

    const currentPayment = order.data?.payment_gateway;
    if (currentPayment?.trx_id && !isExpiredPayment(currentPayment)) {
      return jsonResponse({ success: true, payment: currentPayment, orderStatus: order.status, reused: true });
    }

    const payment = await createGatewayPayment(order);
    const nextData = mergeGatewayPayment(order, payment, { created_from: "gopay-create-payment" });
    const { error: updateError } = await supabase
      .from("orders")
      .update({ data: nextData })
      .eq("id", order.id);
    if (updateError) throw updateError;

    return jsonResponse({ success: true, payment, orderStatus: order.status });
  } catch (error) {
    return jsonResponse({ success: false, error: error?.message ?? "Gagal membuat pembayaran GoPay" }, { status: 500 });
  }
});
