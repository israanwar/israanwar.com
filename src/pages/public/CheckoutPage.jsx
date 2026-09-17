import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { SunBackground } from "../../components/hero/SunBackground";
import { cartRepo } from "../../lib/localStore";
import { ordersData } from "../../lib/supabaseData";
import { useLiveCart, useLiveSettings } from "../../hooks/usePageData";
import { useI18n } from "../../lib/i18n";
import { getCheckoutPaymentMethod, isGopayMerchantAutoEnabled } from "../../lib/gopayMerchantGateway";
import { localizeProduct } from "../../lib/storeI18n";
import { resolveProductCover } from "../../lib/storePlaceholder";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s\-()]{8,20}$/;

export function CheckoutPage() {
  const { lang, t } = useI18n();
  const nav = useNavigate();
  const detail = useLiveCart();
  const settings = useLiveSettings();
  const [form, setForm] = useState({
    customer_name: "", customer_email: "", customer_phone: "",
    shipping_address: "", notes: "",
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Guard: kalau cart kosong DAN belum submit → redirect ke cart. Checked
  // against itemCount (the raw, synchronous cart contents) rather than
  // rows.length — rows only resolves once the live product list has
  // loaded, so gating on it fired this redirect on every visit, even with
  // items actually in the cart, during the render before that fetch
  // finished. Kalau sudah submit, biarkan navigate ke halaman payment berjalan.
  if (!submitted && detail.itemCount === 0) return <Navigate to="/cart" replace />;

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: null }));
  }

  function validate() {
    const e = {};
    if (form.customer_name.trim().length < 2) e.customer_name = t("err_min_chars", { n: 2 });
    if (!EMAIL_RE.test(form.customer_email)) e.customer_email = t("err_invalid_email");
    if (!PHONE_RE.test(form.customer_phone)) e.customer_phone = t("err_invalid_phone");
    if (form.shipping_address.trim().length < 10) e.shipping_address = t("err_min_chars", { n: 10 });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev) {
    ev.preventDefault();
    if (!validate()) {
      document.querySelector(".okr__field-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setBusy(true);
    setSubmitted(true); // gate: prevent redirect to /cart after cartRepo.clear()
    setSubmitError(null);
    try {
      const order = await ordersData.create({
      ...form,
      payment_method: getCheckoutPaymentMethod(settings),
      subtotal: detail.total,
      items: detail.rows.map(({ product, qty, subtotal }) => {
        const displayProduct = localizeProduct(product, lang);
        return {
          product_id: product.id, name: displayProduct.name, price: product.price ?? 0, qty, subtotal,
        };
      }),
      total: detail.total,
      });
      // Navigate ke halaman payment DULU — clear cart setelah nav biar UI tidak lompat.
      nav(`/orders/${order.order_number}/payment`, { replace: true });
      setTimeout(() => cartRepo.clear(), 100);
    } catch (e) {
      setSubmitError(e.message ?? "Pesanan gagal dibuat. Coba lagi.");
      setSubmitted(false);
      setBusy(false);
    }
  }

  return (
    <>
      <Seo title={`${t("checkout_title")} — israanwar`} description={t("checkout_title")} noindex />
              <section className="okr__section okr__page-hero">
            <SunBackground />
          <div className="okr__wrap">
            <AnimatedHeadline text={t("checkout_title")} className="okr__h2 okr__hero-title--stagger" highlightLast={1} assembleLetters />

            <form onSubmit={submit} className="okr__checkout-grid" style={{ marginTop: 40 }}>
              {submitError && <p role="alert" style={{ color: "#fca5a5", gridColumn: "1 / -1", margin: 0 }}>{submitError}</p>}
              <div className="okr__panel">
                <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>{t("checkout_customer")}</h3>

                <div className="okr__field">
                  <label className="okr__label">{t("checkout_name")} *</label>
                  <input
                    className={`okr__input${errors.customer_name ? " has-error" : ""}`}
                    required autoComplete="name"
                    value={form.customer_name}
                    onChange={(e) => set("customer_name", e.target.value)}
                  />
                  {errors.customer_name && <div className="okr__field-error">{errors.customer_name}</div>}
                </div>

                <div className="okr__field-2col">
                  <div className="okr__field">
                    <label className="okr__label">{t("checkout_email")} *</label>
                    <input
                      className={`okr__input${errors.customer_email ? " has-error" : ""}`}
                      type="email" required autoComplete="email"
                      value={form.customer_email}
                      onChange={(e) => set("customer_email", e.target.value)}
                      placeholder="you@example.com"
                    />
                    {errors.customer_email && <div className="okr__field-error">{errors.customer_email}</div>}
                  </div>
                  <div className="okr__field">
                    <label className="okr__label">{t("checkout_phone")} *</label>
                    <input
                      className={`okr__input${errors.customer_phone ? " has-error" : ""}`}
                      required autoComplete="tel"
                      value={form.customer_phone}
                      onChange={(e) => set("customer_phone", e.target.value)}
                      placeholder="+62812..."
                    />
                    {errors.customer_phone && <div className="okr__field-error">{errors.customer_phone}</div>}
                  </div>
                </div>

                <div className="okr__field">
                  <label className="okr__label">{t("checkout_address")} *</label>
                  <textarea
                    className={`okr__input${errors.shipping_address ? " has-error" : ""}`}
                    rows={3} required
                    value={form.shipping_address}
                    onChange={(e) => set("shipping_address", e.target.value)}
                    placeholder={t("checkout_address_placeholder")}
                  />
                  {errors.shipping_address && <div className="okr__field-error">{errors.shipping_address}</div>}
                </div>

                <div className="okr__field">
                  <label className="okr__label">{t("checkout_notes")}</label>
                  <textarea className="okr__input" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                </div>

                <div style={{
                  padding: "14px 16px", borderRadius: 10, background: "rgba(86, 99, 111, 0.08)",
                  border: "1px solid rgba(86, 99, 111, 0.25)", fontSize: 14,
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {isGopayMerchantAutoEnabled(settings) ? "Metode pembayaran: GoPay / QRIS otomatis" : t("checkout_payment_title")}
                  </div>
                  <div style={{ color: "var(--okr-muted)", fontSize: 13 }}>
                    {isGopayMerchantAutoEnabled(settings)
                      ? "Setelah order dibuat, QRIS dinamis akan dibuat otomatis. Status order berubah paid setelah pembayaran terdeteksi."
                      : t("checkout_payment_note")}
                  </div>
                </div>
              </div>

              <div className="okr__panel okr__checkout-summary">
                <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>{t("checkout_summary")}</h3>
                {detail.rows.map(({ product, qty, subtotal }) => {
                  const displayProduct = localizeProduct(product, lang);
                  return (
                    <div key={product.id} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--okr-line)" }}>
                      <img src={resolveProductCover(displayProduct)} alt="" style={{ width: 56, height: 56, borderRadius: 6, objectFit: "contain", background: "var(--okr-bg-2)", padding: 3, flexShrink: 0, border: "1px solid var(--okr-line)" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>{displayProduct.name}</div>
                        <div style={{ fontSize: 12, color: "var(--okr-muted)", marginTop: 2 }}>{t("qty_label")}: {qty}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>Rp {subtotal.toLocaleString("id-ID")}</div>
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0 0", marginTop: 8, fontSize: 18, fontWeight: 700 }}>
                  <span>{t("cart_total")}</span>
                  <span style={{ color: "var(--okr-primary-2)" }}>Rp {detail.total.toLocaleString("id-ID")}</span>
                </div>
                <button className="okr__btn okr__btn--primary" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 20 }}>
                  {busy ? t("checkout_processing") : t("checkout_submit")}
                </button>
                <p style={{ fontSize: 11, color: "var(--okr-dim)", textAlign: "center", marginTop: 10, marginBottom: 0 }}>
                  {t("checkout_terms")}
                </p>
              </div>
            </form>
          </div>
        </section>
    </>
  );
}
