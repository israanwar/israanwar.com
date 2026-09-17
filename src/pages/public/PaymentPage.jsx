import { useEffect, useReducer, useState } from "react";
import { useParams, useNavigate, Link, Navigate } from "react-router-dom";
import {
  Check, Copy, Clock, X, Download, ShoppingBag, FileImage, ChevronRight, RefreshCw,
} from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { ORDER_STATUS } from "../../lib/localStore";
import { ordersData, productsData } from "../../lib/supabaseData";
import { useLiveSettings } from "../../hooks/usePageData";
import { useI18n } from "../../lib/i18n";
import {
  createGopayMerchantPayment,
  getOrderGatewayPayment,
  isGatewayPaymentActive,
  isGatewayPaymentPaid,
  isGopayMerchantOrder,
  refreshGopayMerchantPayment,
} from "../../lib/gopayMerchantGateway";
import { createDynamicQrisDataUrl } from "../../lib/qrisDynamic";

export function PaymentPage() {
  const { orderNumber } = useParams();
  const settings = useLiveSettings();
  const [refreshToken, forceRender] = useReducer((x) => x + 1, 0);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Live-refresh order status (so admin approve/reject updates instantly)
  useEffect(() => {
    const onVis = () => { if (!document.hidden) forceRender(); };
    window.addEventListener("focus", forceRender);
    window.addEventListener("storage", forceRender);
    window.addEventListener("okr:local-store-change", forceRender);
    window.addEventListener("okr:remote-store-change", forceRender);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", forceRender);
      window.removeEventListener("storage", forceRender);
      window.removeEventListener("okr:local-store-change", forceRender);
      window.removeEventListener("okr:remote-store-change", forceRender);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    ordersData.getByNumber(orderNumber).then((next) => {
      if (!alive) return;
      setOrder(next);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [orderNumber, refreshToken]);

  if (loading) return null;
  if (!order) return <Navigate to="/" replace />;

  return (
    <>
      <Seo title={`Payment · ${order.order_number}`} description="Payment" noindex />
              <section className="okr__section" style={{ paddingTop: 100, paddingBottom: 80 }}>
          <div className="okr__wrap" style={{ maxWidth: 640 }}>
            <PaymentBody order={order} settings={settings} onChanged={forceRender} />
          </div>
        </section>
    </>
  );
}

function PaymentBody({ order, settings, onChanged }) {
  const { lang } = useI18n();
  const status = order.status ?? ORDER_STATUS.PENDING_PAYMENT;
  const isPending = status === ORDER_STATUS.PENDING_PAYMENT;
  const isWaiting = status === ORDER_STATUS.WAITING_VERIFICATION;
  const isPaid = status === ORDER_STATUS.PAID;
  const isRejected = status === ORDER_STATUS.REJECTED;

  const L = lang === "id" ? LANG_ID : LANG_EN;

  return (
    <>
      {/* Progress stepper */}
      <ProgressStepper status={status} L={L} />

      {/* Order number header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          fontSize: 11, color: "var(--okr-muted)", letterSpacing: ".14em",
          textTransform: "uppercase", marginBottom: 8,
        }}>{L.order_num}</div>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 20, fontWeight: 700 }}>
          {order.order_number}
        </div>
      </div>

      {/* Main content: switches by status */}
      {isPending && <PendingView order={order} settings={settings} L={L} onChanged={onChanged} />}
      {isWaiting && <WaitingView order={order} L={L} />}
      {isPaid && <PaidView order={order} L={L} />}
      {isRejected && <RejectedView order={order} L={L} />}

      {/* Order summary — always shown */}
      <OrderSummary order={order} L={L} />
    </>
  );
}

/* ============================================================
 * PENDING: QRIS + merchant-app verification
 * ============================================================ */
function PendingView({ order, settings, L, onChanged }) {
  const storedGatewayPayment = getOrderGatewayPayment(order);
  const useGopayAuto = isGopayMerchantOrder(order, settings);
  const [copied, setCopied] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [manualConfirmError, setManualConfirmError] = useState(null);
  const [gatewayPayment, setGatewayPayment] = useState(storedGatewayPayment);
  const [gatewayLoading, setGatewayLoading] = useState(false);
  const [gatewayChecking, setGatewayChecking] = useState(false);
  const [gatewayError, setGatewayError] = useState(null);
  const [dynamicQrisImage, setDynamicQrisImage] = useState(null);
  const [dynamicQrisPayload, setDynamicQrisPayload] = useState(null);
  const [dynamicQrisLoading, setDynamicQrisLoading] = useState(false);
  const [dynamicQrisError, setDynamicQrisError] = useState(null);

  const showManualFlow = !useGopayAuto || Boolean(gatewayError);
  const amountToPay = useGopayAuto && !gatewayError
    ? (gatewayPayment?.amountToPay || order.total)
    : order.total;
  const qrisImage = useGopayAuto && !gatewayError ? gatewayPayment?.qrisImageUrl : dynamicQrisImage;
  const amount = amountToPay.toLocaleString("id-ID");
  const hasQris = Boolean(qrisImage)
    && qrisImage !== "/assets/qris/israanwar-qris.png"
    && !imgBroken;
  const autoStatusActive = useGopayAuto && !gatewayError && (gatewayLoading || gatewayPayment?.trxId);

  // Countdown
  const [remaining, setRemaining] = useState(() => msRemaining(order));
  useEffect(() => {
    const iv = setInterval(() => setRemaining(msRemaining(order)), 1000);
    return () => clearInterval(iv);
  }, [order.payment_deadline]);

  useEffect(() => {
    setImgBroken(false);
  }, [qrisImage]);

  useEffect(() => {
    if (!showManualFlow) {
      setDynamicQrisImage(null);
      setDynamicQrisPayload(null);
      setDynamicQrisError(null);
      setDynamicQrisLoading(false);
      return undefined;
    }

    let alive = true;
    setDynamicQrisImage(null);
    setDynamicQrisPayload(null);
    setDynamicQrisError(null);
    setDynamicQrisLoading(true);
    createDynamicQrisDataUrl(settings.qris_payload, amountToPay)
      .then(({ dataUrl, payload }) => {
        if (!alive) return;
        setDynamicQrisImage(dataUrl);
        setDynamicQrisPayload(payload);
      })
      .catch((e) => {
        if (!alive) return;
        setDynamicQrisError(e.message ?? L.dynamic_qris_error);
      })
      .finally(() => {
        if (alive) setDynamicQrisLoading(false);
      });
    return () => { alive = false; };
  }, [showManualFlow, settings.qris_payload, amountToPay, order.order_number]);

  useEffect(() => {
    setGatewayPayment(storedGatewayPayment);
  }, [
    order.order_number,
    storedGatewayPayment?.trxId,
    storedGatewayPayment?.status,
    storedGatewayPayment?.amountToPay,
    storedGatewayPayment?.qrisImageUrl,
  ]);

  useEffect(() => {
    if (!useGopayAuto || (gatewayPayment?.trxId && isGatewayPaymentActive(gatewayPayment)) || gatewayError) return;
    let alive = true;
    setGatewayLoading(true);
    createGopayMerchantPayment(order.order_number)
      .then((payment) => {
        if (!alive) return;
        setGatewayPayment(payment);
        setGatewayError(null);
        onChanged();
      })
      .catch((e) => {
        if (!alive) return;
        setGatewayError(e.message ?? L.auto_gateway_error);
      })
      .finally(() => {
        if (alive) setGatewayLoading(false);
      });
    return () => { alive = false; };
  }, [useGopayAuto, order.order_number, gatewayPayment?.trxId, gatewayPayment?.status, gatewayError]);

  useEffect(() => {
    if (!useGopayAuto || !gatewayPayment?.trxId || gatewayError || !isGatewayPaymentActive(gatewayPayment)) return;
    const iv = setInterval(() => {
      checkGatewayStatus({ quiet: true });
    }, 20000);
    return () => clearInterval(iv);
  }, [useGopayAuto, gatewayPayment?.trxId, gatewayPayment?.status, gatewayError]);

  async function copyAmount() {
    await navigator.clipboard.writeText(String(amountToPay));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function checkGatewayStatus({ quiet = false } = {}) {
    if (!useGopayAuto || gatewayChecking) return;
    if (!quiet) setManualConfirmError(null);
    setGatewayChecking(true);
    try {
      const payment = await refreshGopayMerchantPayment(order.order_number);
      setGatewayPayment(payment);
      setGatewayError(null);
      if (isGatewayPaymentPaid(payment)) onChanged();
    } catch (e) {
      if (!quiet) setGatewayError(e.message ?? L.auto_status_error);
    } finally {
      setGatewayChecking(false);
    }
  }

  async function confirmManualPayment() {
    setManualConfirmError(null);
    setConfirming(true);
    try {
      await ordersData.uploadProof(order.order_number, "");
      onChanged();
    } catch (e) {
      setManualConfirmError(e.message ?? L.manual_confirm_error);
      setConfirming(false);
    }
  }

  return (
    <>
      {/* Awaiting banner */}
      <div className="okr__pay-alert okr__pay-alert--pending">
        <Clock size={16} />
        <span>{useGopayAuto && !gatewayError ? L.auto_pending_body : L.pending_body}</span>
        {remaining > 0 && (
          <span style={{ marginLeft: "auto", fontWeight: 700, color: remaining < 5 * 60 * 1000 ? "#fbbf24" : "inherit" }}>
            {formatMs(remaining)}
          </span>
        )}
      </div>

      {/* QRIS card — contained, centered, max 320px */}
      <div className="okr__panel okr__pay-qris-card">
        <div className="okr__pay-qris-frame">
          {hasQris ? (
            <img
              src={qrisImage}
              alt="QRIS"
              onError={() => setImgBroken(true)}
              className="okr__pay-qris-img"
            />
          ) : (
            <div className="okr__pay-qris-empty">
              <FileImage size={28} style={{ opacity: 0.5 }} />
              <p>{dynamicQrisLoading ? L.qris_generating : (dynamicQrisError || L.qris_missing)}</p>
            </div>
          )}
        </div>

        <div className="okr__pay-total">
          <div className="okr__pay-total-label">{useGopayAuto && !gatewayError ? L.total_pay_exact : L.total_pay}</div>
          <div className="okr__pay-total-amount">Rp {amount}</div>
          <button onClick={copyAmount} className="okr__pay-copy-btn">
            {copied ? <><Check size={14} /> {L.copied}</> : <><Copy size={14} /> {L.copy}</>}
          </button>
          {useGopayAuto && gatewayPayment?.uniqueCode > 0 && !gatewayError && (
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--okr-muted)", lineHeight: 1.5 }}>
              {L.unique_amount_note.replace("{base}", order.total.toLocaleString("id-ID"))}
            </div>
          )}
          {showManualFlow && dynamicQrisImage && dynamicQrisPayload && !dynamicQrisError && (
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--okr-muted)", lineHeight: 1.5 }}>
              <strong style={{ color: "var(--okr-primary-2)" }}>{L.dynamic_qris_active}</strong>
              <br />
              {L.manual_dynamic_note.replace("{amount}", amount)}
            </div>
          )}
        </div>
      </div>

      {useGopayAuto && (
        <div className="okr__panel" style={{ marginBottom: 16 }}>
          <h3 className="okr__pay-section-title">{gatewayError ? L.auto_fallback_title : L.auto_title}</h3>
          {gatewayError ? (
            <div style={{ fontSize: 13, color: "#fca5a5", lineHeight: 1.6 }}>
              {gatewayError}. {L.auto_fallback_body}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: "var(--okr-muted)", lineHeight: 1.6, marginBottom: 14 }}>
                {gatewayLoading ? L.auto_starting : L.auto_waiting}
              </div>
              {gatewayPayment?.trxId && (
                <div style={{ display: "grid", gap: 6, fontSize: 12, marginBottom: 14 }}>
                  <div><strong>TRX:</strong> <span style={{ fontFamily: "ui-monospace, monospace" }}>{gatewayPayment.trxId}</span></div>
                  {gatewayPayment.expiresAt && <div><strong>{L.expire_at}:</strong> {new Date(gatewayPayment.expiresAt).toLocaleString("id-ID")}</div>}
                </div>
              )}
              <button
                type="button"
                onClick={() => checkGatewayStatus()}
                disabled={gatewayLoading || gatewayChecking || !gatewayPayment?.trxId}
                className="okr__btn okr__btn--secondary"
                style={{ width: "100%", justifyContent: "center", padding: "13px", opacity: gatewayPayment?.trxId ? 1 : 0.55 }}
              >
                <RefreshCw size={15} /> {gatewayChecking ? L.checking_status : L.check_status}
              </button>
            </>
          )}
        </div>
      )}

      {showManualFlow && (
        <div className="okr__panel" style={{ marginBottom: 20 }}>
          <h3 className="okr__pay-section-title">{L.no_proof_title}</h3>
          <div style={{ color: "var(--okr-muted)", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
            {L.no_proof_body}
          </div>
          <button
            onClick={confirmManualPayment}
            disabled={!hasQris || confirming}
            className="okr__btn okr__btn--primary"
            style={{ width: "100%", justifyContent: "center", padding: "16px", fontSize: 15, opacity: hasQris ? 1 : 0.5 }}
          >
            <Check size={17} /> {confirming ? L.confirming_paid : L.confirm_paid}
          </button>
          {manualConfirmError && (
            <div style={{ color: "#fca5a5", fontSize: 13, marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <X size={14} /> {manualConfirmError}
            </div>
          )}
        </div>
      )}

      {autoStatusActive && (
        <div style={{ textAlign: "center", color: "var(--okr-dim)", fontSize: 12, lineHeight: 1.5, marginBottom: 20 }}>
          {L.auto_no_proof}
        </div>
      )}
    </>
  );
}

/* ============================================================
 * WAITING VERIFICATION
 * ============================================================ */
function WaitingView({ order, L }) {
  return (
    <div className="okr__panel" style={{ textAlign: "center", padding: "40px 32px", marginBottom: 20 }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "rgba(86, 99, 111, 0.15)",
        display: "grid", placeItems: "center",
        margin: "0 auto 20px", color: "var(--okr-primary-2)",
      }}>
        <Clock size={34} />
      </div>
      <AnimatedHeadline as="h2" text={L.waiting_title} className="okr__hero-title--stagger" assembleLetters style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }} />
      <p style={{ color: "var(--okr-muted)", margin: "0 0 20px", fontSize: 15, lineHeight: 1.6 }}>
        {L.waiting_body}
      </p>
      <div style={{
        display: "inline-block", padding: "8px 16px",
        background: "rgba(86, 99, 111, 0.08)",
        border: "1px solid rgba(86, 99, 111, 0.25)",
        borderRadius: 999, fontSize: 13, color: "var(--okr-primary-2)",
      }}>
        ⏱ {L.waiting_estimate}
      </div>
      {order.payment_proof && (
        <div style={{ marginTop: 24, textAlign: "left" }}>
          <div style={{ fontSize: 12, color: "var(--okr-muted)", marginBottom: 8, textAlign: "center" }}>{L.your_proof}</div>
          <img src={order.payment_proof} alt="Proof"
            style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 10, border: "1px solid var(--okr-line)", display: "block", margin: "0 auto" }} />
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * PAID — download products
 * ============================================================ */
function PaidView({ order, L }) {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    Promise.all(order.items.map((it) => productsData.get(it.product_id))).then((list) => {
      setProducts(list.filter(Boolean));
    });
  }, [order.id]);

  const downloadItems = order.items.map((it) => {
    const p = products.find((x) => x.id === it.product_id);
    return { ...it, download_url: p?.download_url };
  });
  const hasAnyDownload = downloadItems.some((it) => it.download_url);

  return (
    <div className="okr__panel" style={{ textAlign: "center", padding: "40px 32px", marginBottom: 20 }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "rgba(34,197,94,0.15)",
        display: "grid", placeItems: "center",
        margin: "0 auto 20px", color: "#86efac",
      }}>
        <Check size={34} />
      </div>
      <AnimatedHeadline as="h2" text={L.paid_title} className="okr__hero-title--stagger" assembleLetters style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }} />
      <p style={{ color: "var(--okr-muted)", margin: "0 0 24px", fontSize: 15, lineHeight: 1.6 }}>
        {L.paid_body}
      </p>

      {hasAnyDownload ? (
        <div style={{ display: "grid", gap: 10 }}>
          {downloadItems.map((it) => (
            it.download_url ? (
              <a key={it.product_id} href={it.download_url} target="_blank" rel="noreferrer"
                className="okr__btn okr__btn--primary"
                style={{ width: "100%", justifyContent: "space-between", padding: "14px 20px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <Download size={16} /> {L.download} {it.name}
                </span>
                <ChevronRight size={16} />
              </a>
            ) : (
              <div key={it.product_id} className="okr__panel" style={{ padding: 14, background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{it.name}</div>
                <div style={{ fontSize: 12, color: "var(--okr-muted)", marginTop: 4 }}>{L.download_via_email}</div>
              </div>
            )
          ))}
        </div>
      ) : (
        <div style={{
          padding: 16, background: "rgba(86, 99, 111, 0.06)",
          border: "1px solid rgba(86, 99, 111, 0.25)", borderRadius: 10,
          fontSize: 14, color: "var(--okr-muted)",
        }}>
          {L.download_via_email}
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * REJECTED — retry upload
 * ============================================================ */
function RejectedView({ order, L }) {
  const nav = useNavigate();
  const [retryError, setRetryError] = useState(null);
  const [retryBusy, setRetryBusy] = useState(false);
  async function retry() {
    if (!confirm(L.retry_confirm)) return;
    setRetryError(null);
    setRetryBusy(true);
    try {
      const nextOrder = await ordersData.create({
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        shipping_address: order.shipping_address,
        items: order.items,
        subtotal: order.subtotal,
        total: order.total,
        payment_method: order.payment_method,
        notes: order.notes,
      });
      nav(`/orders/${nextOrder.order_number}/payment`, { replace: true });
    } catch (e) {
      setRetryError(e.message ?? "Gagal mengulang pembayaran.");
      setRetryBusy(false);
    }
  }
  return (
    <div className="okr__panel" style={{ textAlign: "center", padding: "40px 32px", marginBottom: 20 }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "rgba(239,68,68,0.15)",
        display: "grid", placeItems: "center",
        margin: "0 auto 20px", color: "#fca5a5",
      }}>
        <X size={34} />
      </div>
      <AnimatedHeadline as="h2" text={L.rejected_title} className="okr__hero-title--stagger" assembleLetters style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }} />
      <p style={{ color: "var(--okr-muted)", margin: "0 0 16px", fontSize: 15, lineHeight: 1.6 }}>
        {L.rejected_body}
      </p>
      {order.admin_note && (
        <div style={{
          padding: 14, background: "rgba(239,68,68,0.05)",
          border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10,
          fontSize: 13, color: "#fca5a5", marginBottom: 20, textAlign: "left",
        }}>
          <strong>{L.admin_note}:</strong> {order.admin_note}
        </div>
      )}
      {retryError && <p role="alert" style={{ color: "#a72226" }}>{retryError}</p>}
      <button onClick={retry} disabled={retryBusy} className="okr__btn okr__btn--primary" style={{ padding: "12px 24px" }}>
        <RefreshCw size={15} /> {L.retry}
      </button>
    </div>
  );
}

/* ============================================================
 * Progress Stepper
 * ============================================================ */
function ProgressStepper({ status, L }) {
  const steps = [
    { key: "created",  label: L.step_created },
    { key: "submitted", label: L.step_submitted },
    { key: "verified", label: L.step_verified },
    { key: "download", label: L.step_download },
  ];
  const activeIdx =
    status === ORDER_STATUS.PENDING_PAYMENT ? 0 :
    status === ORDER_STATUS.WAITING_VERIFICATION ? 1 :
    status === ORDER_STATUS.PAID ? 3 :
    0;

  return (
    <div className="okr__pay-steps">
      {steps.map((s, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <div key={s.key} className={`okr__pay-step${done ? " is-done" : ""}${active ? " is-active" : ""}`}>
            <div className="okr__pay-step-dot">
              {done ? <Check size={12} /> : <span>{i + 1}</span>}
            </div>
            <div className="okr__pay-step-label">{s.label}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
 * Order summary
 * ============================================================ */
function OrderSummary({ order, L }) {
  return (
    <div className="okr__panel" style={{ padding: 20 }}>
      <h3 className="okr__pay-section-title" style={{ marginBottom: 12 }}>{L.summary}</h3>
      {order.items.map((it, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 14 }}>
          <span style={{ color: "var(--okr-muted)" }}>{it.name} × {it.qty}</span>
          <span>Rp {it.subtotal.toLocaleString("id-ID")}</span>
        </div>
      ))}
      <div style={{
        display: "flex", justifyContent: "space-between",
        padding: "16px 0 0", marginTop: 12,
        borderTop: "1px solid var(--okr-line)", fontSize: 17, fontWeight: 700,
      }}>
        <span>Total</span>
        <span style={{ color: "var(--okr-primary-2)" }}>Rp {order.total.toLocaleString("id-ID")}</span>
      </div>
    </div>
  );
}

/* ============================================================
 * Utils
 * ============================================================ */
function msRemaining(order) {
  if (!order.payment_deadline) return 0;
  return Math.max(0, new Date(order.payment_deadline).getTime() - Date.now());
}
function formatMs(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rs).padStart(2, "0")}`;
}

/* ============================================================
 * i18n strings
 * ============================================================ */
const LANG_EN = {
  order_num: "Order number",
  step_created: "Order Created",
  step_submitted: "Payment Confirmed",
  step_verified: "Verification",
  step_download: "Download Ready",
  pending_body: "Please scan the QRIS below and complete payment. No proof upload is needed.",
  auto_pending_body: "Please pay the exact GoPay/QRIS amount below. Payment will be checked automatically.",
  total_pay: "Total to pay",
  total_pay_exact: "Exact amount to pay",
  copy: "Copy amount", copied: "Copied",
  qris_missing: "QRIS not available yet. Contact admin.",
  qris_generating: "Creating QRIS with the exact order amount.",
  dynamic_qris_error: "Unable to create QRIS with automatic amount.",
  dynamic_qris_active: "Dynamic amount QRIS is active.",
  manual_dynamic_note: "This QRIS was generated for this order with Rp {amount} embedded. If your wallet still asks for an amount, enter exactly Rp {amount}.",
  no_proof_title: "No payment proof upload",
  no_proof_body: "After paying, the transaction will appear in the connected GoPay Merchant app. Tap the button below so admin can match the order and mark it paid.",
  confirm_paid: "I have paid",
  confirming_paid: "Sending confirmation...",
  manual_confirm_error: "Unable to send payment confirmation.",
  unique_amount_note: "Base total is Rp {base}. This exact amount may include a small unique code for automatic matching.",
  auto_title: "Automatic payment check",
  auto_starting: "Creating a dynamic QRIS payment for this order.",
  auto_waiting: "After paying, keep this page open. The order will switch to paid when the gateway detects the transaction.",
  auto_no_proof: "No payment proof upload is needed for automatic GoPay/QRIS payments.",
  auto_gateway_error: "Automatic GoPay gateway is not ready",
  auto_status_error: "Unable to check payment status",
  auto_fallback_title: "Manual fallback active",
  auto_fallback_body: "Please use the QRIS above. Admin will verify the transaction from the GoPay Merchant app.",
  check_status: "Check payment status",
  checking_status: "Checking status…",
  expire_at: "Expires",
  waiting_title: "Payment Confirmation Sent",
  waiting_body: "Waiting for admin verification from the GoPay Merchant app.",
  waiting_estimate: "Estimated: 5–30 minutes",
  your_proof: "Your uploaded proof",
  paid_title: "Payment Verified",
  paid_body: "Thank you. Your digital product is now available.",
  download: "Download",
  download_via_email: "Download link will be sent to your email shortly.",
  rejected_title: "Payment Rejected",
  rejected_body: "There was an issue with your payment. Please try again or contact admin.",
  admin_note: "Note from admin",
  retry: "Retry payment",
  retry_confirm: "Create a new order to try payment again?",
  summary: "Order summary",
};
const LANG_ID = {
  order_num: "Nomor pesanan",
  step_created: "Order Dibuat",
  step_submitted: "Bayar Dikonfirmasi",
  step_verified: "Verifikasi",
  step_download: "Siap Diunduh",
  pending_body: "Silakan scan QRIS di bawah dan selesaikan pembayaran. Tidak perlu upload bukti.",
  auto_pending_body: "Silakan bayar nominal GoPay/QRIS persis di bawah. Status pembayaran akan dicek otomatis.",
  total_pay: "Total pembayaran",
  total_pay_exact: "Nominal persis yang dibayar",
  copy: "Copy nominal", copied: "Tersalin",
  qris_missing: "QRIS belum tersedia. Hubungi admin.",
  qris_generating: "Membuat QRIS dengan nominal order persis.",
  dynamic_qris_error: "Gagal membuat QRIS dengan nominal otomatis.",
  dynamic_qris_active: "QRIS nominal otomatis aktif.",
  manual_dynamic_note: "QRIS ini dibuat khusus untuk order ini dengan nominal Rp {amount} tertanam. Jika aplikasi tetap meminta nominal, isi persis Rp {amount}.",
  no_proof_title: "Tidak perlu upload bukti pembayaran",
  no_proof_body: "Setelah bayar, transaksi akan masuk di aplikasi GoPay Merchant yang terhubung. Tekan tombol di bawah agar admin mencocokkan order dan menandainya lunas.",
  confirm_paid: "Saya sudah bayar",
  confirming_paid: "Mengirim konfirmasi...",
  manual_confirm_error: "Gagal mengirim konfirmasi pembayaran.",
  unique_amount_note: "Total dasar Rp {base}. Nominal persis ini bisa memuat kode unik kecil agar pembayaran terbaca otomatis.",
  auto_title: "Cek pembayaran otomatis",
  auto_starting: "Membuat QRIS dinamis untuk order ini.",
  auto_waiting: "Setelah membayar, biarkan halaman ini terbuka. Order akan berubah paid saat gateway mendeteksi transaksi.",
  auto_no_proof: "Tidak perlu upload bukti pembayaran untuk GoPay/QRIS otomatis.",
  auto_gateway_error: "Gateway GoPay otomatis belum siap",
  auto_status_error: "Gagal cek status pembayaran",
  auto_fallback_title: "Fallback manual aktif",
  auto_fallback_body: "Silakan gunakan QRIS di atas. Admin akan verifikasi transaksi dari aplikasi GoPay Merchant.",
  check_status: "Cek status pembayaran",
  checking_status: "Mengecek status…",
  expire_at: "Kedaluwarsa",
  waiting_title: "Konfirmasi Pembayaran Terkirim",
  waiting_body: "Menunggu admin mencocokkan pembayaran dari aplikasi GoPay Merchant.",
  waiting_estimate: "Estimasi: 5–30 menit",
  your_proof: "Bukti yang Anda upload",
  paid_title: "Pembayaran Terverifikasi",
  paid_body: "Terima kasih. Produk digital Anda sekarang tersedia.",
  download: "Download",
  download_via_email: "Link download akan dikirim ke email Anda.",
  rejected_title: "Pembayaran Ditolak",
  rejected_body: "Ada masalah dengan pembayaran. Silakan coba lagi atau hubungi admin.",
  admin_note: "Catatan dari admin",
  retry: "Coba bayar ulang",
  retry_confirm: "Buat pesanan baru untuk mencoba pembayaran lagi?",
  summary: "Ringkasan pesanan",
};
