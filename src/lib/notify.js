// Build notification messages for admin (WA + email). Bilingual (default EN).

const L = {
  en: {
    order_new: "NEW ORDER",
    number: "Number", date: "Date",
    customer: "CUSTOMER", name: "Name", email: "Email", phone: "Phone/WA",
    items: "ITEMS", total: "TOTAL", payment: "Payment", address: "ADDRESS", notes: "NOTES",
    subject: (n, amt) => `[New Order] ${n} — Rp ${amt}`,
    email_intro: "New order received:",
    body_hello: (site) => `Hi ${site} admin,\n\nI just placed an order:`,
    body_pay: "I'll pay via QRIS. Please verify the transaction in the GoPay Merchant app — thanks 🙏",
    body_will_pay: "Total",
  },
  id: {
    order_new: "ORDER BARU",
    number: "Nomor", date: "Tanggal",
    customer: "PEMESAN", name: "Nama", email: "Email", phone: "HP/WA",
    items: "ITEMS", total: "TOTAL", payment: "Pembayaran", address: "ALAMAT", notes: "CATATAN",
    subject: (n, amt) => `[Order Baru] ${n} — Rp ${amt}`,
    email_intro: "Ada order baru masuk:",
    body_hello: (site) => `Halo admin ${site},\n\nSaya baru saja membuat pesanan:`,
    body_pay: "Saya akan bayar via QRIS. Mohon cek transaksinya di aplikasi GoPay Merchant ya, terima kasih 🙏",
    body_will_pay: "Total",
  },
};

function pickLang() {
  try { return localStorage.getItem("okr:lang") === "id" ? "id" : "en"; } catch { return "en"; }
}

export function buildOrderMessage(order, settings) {
  const t = L[pickLang()];
  const lines = [
    `🛒 *${t.order_new} — ${settings.site_name ?? "israanwar"}*`,
    ``,
    `${t.number}: *${order.order_number}*`,
    `${t.date}: ${new Date(order.created_at).toLocaleString()}`,
    ``,
    `👤 *${t.customer}*`,
    `${t.name}: ${order.customer_name}`,
    `${t.email}: ${order.customer_email}`,
    `${t.phone}: ${order.customer_phone}`,
    ``,
    `📦 *${t.items}*`,
    ...order.items.map((it) => `• ${it.name} × ${it.qty} — Rp ${it.subtotal.toLocaleString("id-ID")}`),
    ``,
    `💰 *${t.total}: Rp ${order.total.toLocaleString("id-ID")}*`,
    `${t.payment}: QRIS`,
    ``,
    `📮 *${t.address}*`,
    order.shipping_address,
  ];
  if (order.notes) lines.push("", `📝 *${t.notes}*`, order.notes);
  return lines.join("\n");
}

export function buildOrderEmailSubject(order) {
  return L[pickLang()].subject(order.order_number, order.total.toLocaleString("id-ID"));
}

export function buildOrderEmailBody(order) {
  const t = L[pickLang()];
  const rows = order.items
    .map((it) => `- ${it.name} × ${it.qty} = Rp ${it.subtotal.toLocaleString("id-ID")}`)
    .join("\n");
  return `${t.email_intro}

${t.number}: ${order.order_number}
${t.date}: ${new Date(order.created_at).toLocaleString()}

${t.customer}
${t.name}: ${order.customer_name}
${t.email}: ${order.customer_email}
${t.phone}: ${order.customer_phone}

${t.items}
${rows}

${t.total}: Rp ${order.total.toLocaleString("id-ID")}
${t.payment}: QRIS

${t.address}
${order.shipping_address}
${order.notes ? `\n${t.notes}\n${order.notes}` : ""}
`;
}

export function buildAdminWaLink(order, settings) {
  const msg = encodeURIComponent(buildOrderMessage(order, settings));
  const url = settings.admin_whatsapp_url || settings.whatsapp_url || "";
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}text=${msg}`;
}

export function buildAdminMailtoLink(order, settings) {
  const to = settings.admin_email || "";
  const subject = encodeURIComponent(buildOrderEmailSubject(order));
  const body = encodeURIComponent(buildOrderEmailBody(order));
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

// Customer → admin: payment follow-up without proof upload
export function buildCustomerPaymentWaLink(order, settings) {
  const t = L[pickLang()];
  const amount = order.total.toLocaleString("id-ID");
  const msg = encodeURIComponent(
    `${t.body_hello(settings.site_name ?? "israanwar")}\n` +
    `📦 ${order.order_number}\n` +
    `💰 ${t.body_will_pay} Rp ${amount}\n` +
    `👤 ${order.customer_name}\n\n` +
    t.body_pay
  );
  const url = settings.admin_whatsapp_url || settings.whatsapp_url || "";
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}text=${msg}`;
}
