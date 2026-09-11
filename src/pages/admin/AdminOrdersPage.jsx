import { useEffect, useState } from "react";
import { Check, X, Eye, ExternalLink } from "lucide-react";
import { ORDER_STATUS } from "../../lib/localStore";
import { ordersData } from "../../lib/supabaseData";

const STATUS_LABEL = {
  [ORDER_STATUS.PENDING_PAYMENT]:      { label: "Pending payment",     badge: "draft" },
  [ORDER_STATUS.WAITING_VERIFICATION]: { label: "Waiting verification", badge: "editor" },
  [ORDER_STATUS.PAID]:                 { label: "Paid",                 badge: "published" },
  [ORDER_STATUS.REJECTED]:             { label: "Rejected",             badge: "admin" },
  [ORDER_STATUS.CANCELLED]:            { label: "Cancelled",            badge: "draft" },
};

const REVIEWABLE_STATUSES = new Set([
  ORDER_STATUS.PENDING_PAYMENT,
  ORDER_STATUS.WAITING_VERIFICATION,
]);

export function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [detailOrder, setDetailOrder] = useState(null);
  const [filter, setFilter] = useState("all");
  async function load() {
    setOrders(await ordersData.list());
  }
  useEffect(() => { load(); }, []);

  async function approve(id) {
    const note = prompt("Optional note for customer:") ?? undefined;
    await ordersData.approve(id, note || null);
    await load();
    if (detailOrder?.id === id) setDetailOrder(await ordersData.get(id));
  }
  async function reject(id) {
    const note = prompt("Reason for rejection (visible to customer):");
    if (note === null) return;
    await ordersData.reject(id, note || "Payment could not be verified.");
    await load();
    if (detailOrder?.id === id) setDetailOrder(await ordersData.get(id));
  }
  async function setStatus(id, status) {
    await ordersData.updateStatus(id, status);
    await load();
    if (detailOrder?.id === id) setDetailOrder(await ordersData.get(id));
  }

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const counts = orders.reduce((a, o) => { a[o.status] = (a[o.status] ?? 0) + 1; return a; }, {});
  const reviewCount = (counts[ORDER_STATUS.PENDING_PAYMENT] ?? 0) + (counts[ORDER_STATUS.WAITING_VERIFICATION] ?? 0);

  return (
    <>
      <div className="wpx__page-header">
        <h1>Orders</h1>
        <div className="spacer" />
        <span style={{ color: "var(--text-mute)", fontSize: 13 }}>
          {orders.length} total · {reviewCount} perlu dicek di GoPay Merchant
        </span>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
        <FilterTab label="All" count={orders.length} active={filter === "all"} onClick={() => setFilter("all")} />
        {Object.entries(STATUS_LABEL).map(([status, { label }]) => (
          <FilterTab key={status} label={label} count={counts[status] ?? 0}
            active={filter === status} onClick={() => setFilter(status)} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="wpx__card"><div className="wpx__card-body" style={{ textAlign: "center", color: "var(--text-mute)", padding: 60 }}>
          No orders in this status.
        </div></div>
      ) : (
        <table className="wpx__table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Items</th>
              <th style={{ width: 130 }}>Total</th>
              <th style={{ width: 170 }}>Status</th>
              <th style={{ width: 140 }}>Date</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id}>
                <td style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--primary)" }}>{o.order_number}</td>
                <td>
                  <div style={{ fontWeight: 600 }}>{o.customer_name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-mute)" }}>{o.customer_email} · {o.customer_phone}</div>
                </td>
                <td style={{ fontSize: 12 }}>
                  {o.items.map((it, i) => <div key={i}>{it.name} × {it.qty}</div>)}
                </td>
                <td style={{ fontWeight: 700 }}>Rp {o.total.toLocaleString("id-ID")}</td>
                <td>
                  <select className="wpx__select" value={o.status ?? ORDER_STATUS.PENDING_PAYMENT}
                    onChange={(e) => setStatus(o.id, e.target.value)}>
                    {Object.entries(STATUS_LABEL).map(([s, { label }]) => (
                      <option key={s} value={s}>{label}</option>
                    ))}
                  </select>
                </td>
                <td style={{ fontSize: 12 }}>{new Date(o.created_at).toLocaleString("id-ID")}</td>
                <td>
                  <button className="wpx__btn wpx__btn--secondary" style={{ padding: "4px 10px", marginRight: 4 }}
                    onClick={() => setDetailOrder(o)} title="View details">
                    <Eye size={12} />
                  </button>
                  {REVIEWABLE_STATUSES.has(o.status ?? ORDER_STATUS.PENDING_PAYMENT) && (
                    <>
                      <button className="wpx__btn wpx__btn--primary" style={{ padding: "4px 10px", marginRight: 4 }}
                        onClick={() => approve(o.id)} title="Approve → Paid">
                        <Check size={12} />
                      </button>
                      <button className="wpx__btn wpx__btn--danger" style={{ padding: "4px 10px" }}
                        onClick={() => reject(o.id)} title="Reject">
                        <X size={12} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Detail modal */}
      {detailOrder && <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)}
        onApprove={approve} onReject={reject} onStatus={setStatus} />}
    </>
  );
}

function FilterTab({ label, count, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{
        background: "transparent", border: "none",
        padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600,
        color: active ? "var(--primary)" : "var(--text-dim)",
        borderBottom: `2px solid ${active ? "var(--primary)" : "transparent"}`,
        marginBottom: -1,
        display: "inline-flex", alignItems: "center", gap: 6,
      }}>
      {label}
      <span style={{
        background: active ? "var(--primary)" : "var(--panel-2)",
        color: active ? "#fff" : "var(--text-mute)",
        fontSize: 11, fontWeight: 700, padding: "1px 8px", borderRadius: 999, minWidth: 20, textAlign: "center",
      }}>{count}</span>
    </button>
  );
}

function OrderDetailModal({ order, onClose, onApprove, onReject }) {
  const gateway = order.payment_gateway ?? order.data?.payment_gateway;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
      zIndex: 100, display: "grid", placeItems: "center", padding: 20, overflow: "auto",
    }}>
      <div onClick={(e) => e.stopPropagation()} className="wpx__card" style={{ maxWidth: 720, width: "100%", margin: "40px auto" }}>
        <div className="wpx__card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "monospace" }}>{order.order_number}</span>
          <div style={{ display: "flex", gap: 6 }}>
            <a href={`/orders/${order.order_number}/payment`} target="_blank" rel="noreferrer"
              className="wpx__btn wpx__btn--secondary" style={{ padding: "4px 10px", fontSize: 12 }}>
              <ExternalLink size={12} /> Customer view
            </a>
            <button className="wpx__btn wpx__btn--secondary" style={{ padding: "4px 10px" }} onClick={onClose}>
              <X size={13} />
            </button>
          </div>
        </div>
        <div className="wpx__card-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
          <div style={{ display: "grid", gap: 8, fontSize: 13, marginBottom: 20 }}>
            <div><strong>Status:</strong> <span className={`wpx__badge wpx__badge--${STATUS_LABEL[order.status]?.badge}`}>{STATUS_LABEL[order.status]?.label ?? order.status}</span></div>
            <div><strong>Customer:</strong> {order.customer_name}</div>
            <div><strong>Email:</strong> <a href={`mailto:${order.customer_email}`} style={{ color: "var(--primary)" }}>{order.customer_email}</a></div>
            <div><strong>Phone:</strong> <a href={`https://wa.me/${order.customer_phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>{order.customer_phone}</a></div>
            <div><strong>Address:</strong> {order.shipping_address}</div>
            {order.notes && <div><strong>Notes:</strong> {order.notes}</div>}
            <div><strong>Total:</strong> Rp {order.total.toLocaleString("id-ID")}</div>
            {order.payment_confirmed_without_proof_at && (
              <div><strong>Customer confirmed paid:</strong> {new Date(order.payment_confirmed_without_proof_at).toLocaleString("id-ID")} · cek di GoPay Merchant app</div>
            )}
            {gateway && (
              <>
                <div><strong>Payment gateway:</strong> {gateway.provider ?? "gopay_merchant"} {gateway.adapter ? `(${gateway.adapter})` : ""}</div>
                {gateway.trx_id && <div><strong>Gateway TRX:</strong> <span style={{ fontFamily: "monospace" }}>{gateway.trx_id}</span></div>}
                {gateway.status && <div><strong>Gateway status:</strong> {gateway.status}</div>}
                {gateway.amount_to_pay && <div><strong>Paid amount target:</strong> Rp {Number(gateway.amount_to_pay).toLocaleString("id-ID")}</div>}
              </>
            )}
            <div><strong>Created:</strong> {new Date(order.created_at).toLocaleString("id-ID")}</div>
            {order.payment_proof_uploaded_at && (
              <div><strong>Proof uploaded:</strong> {new Date(order.payment_proof_uploaded_at).toLocaleString("id-ID")}</div>
            )}
            {order.admin_note && <div><strong>Admin note:</strong> {order.admin_note}</div>}
          </div>

          <h4 style={{ margin: "0 0 12px", fontSize: 14 }}>Items</h4>
          <div style={{ background: "var(--panel-2)", padding: 12, borderRadius: 8, marginBottom: 20 }}>
            {order.items.map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
                <span>{it.name} × {it.qty}</span>
                <span>Rp {it.subtotal.toLocaleString("id-ID")}</span>
              </div>
            ))}
          </div>

          {order.payment_proof ? (
            <div>
              <h4 style={{ margin: "0 0 12px", fontSize: 14 }}>Payment Proof</h4>
              <img src={order.payment_proof} alt="Proof" style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 10, border: "1px solid var(--border)" }} />
              <a href={order.payment_proof} download={`proof-${order.order_number}.png`}
                className="wpx__btn wpx__btn--secondary" style={{ marginTop: 12, padding: "6px 14px", fontSize: 13 }}>
                <ExternalLink size={13} /> Open full size
              </a>
            </div>
          ) : (
            <div style={{ padding: 24, background: "var(--panel-2)", borderRadius: 8, textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>
              Tidak ada upload bukti. Cocokkan nominal dan waktu transaksi di aplikasi GoPay Merchant.
            </div>
          )}

          {REVIEWABLE_STATUSES.has(order.status ?? ORDER_STATUS.PENDING_PAYMENT) && (
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="wpx__btn wpx__btn--primary" onClick={() => { onApprove(order.id); onClose(); }} style={{ flex: 1, justifyContent: "center" }}>
                <Check size={14} /> Approve → Paid
              </button>
              <button className="wpx__btn wpx__btn--danger" onClick={() => { onReject(order.id); onClose(); }} style={{ flex: 1, justifyContent: "center" }}>
                <X size={14} /> Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
