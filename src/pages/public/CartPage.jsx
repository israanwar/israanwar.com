import { Link } from "react-router-dom";
import { Trash2, ShoppingBag } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { SunBackground } from "../../components/hero/SunBackground";
import { cartRepo } from "../../lib/localStore";
import { useLiveCart } from "../../hooks/usePageData";
import { useI18n } from "../../lib/i18n";
import { localizeProduct } from "../../lib/storeI18n";
import { resolveProductCover } from "../../lib/storePlaceholder";

export function CartPage() {
  const { lang, t } = useI18n();
  const { rows, total, itemCount } = useLiveCart();

  return (
    <>
      <Seo title={`${t("cart_title")} — israanwar`} description={t("cart_title")} noindex />
              <section className="okr__section okr__page-hero">
            <SunBackground />
          <div className="okr__wrap">
            <AnimatedHeadline text={t("cart_title")} className="okr__h2 okr__hero-title--stagger" highlightLast={1} assembleLetters />

            {itemCount === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--okr-muted)" }}>
                <ShoppingBag size={40} style={{ margin: "0 auto 16px", color: "var(--okr-dim)" }} />
                <p>{t("cart_empty")}</p>
                <Link to="/store" className="okr__btn okr__btn--primary" style={{ marginTop: 20 }}>{t("cart_see_store")}</Link>
              </div>
            ) : (
              <div className="okr__cart-grid">
                <div className="okr__panel" style={{ padding: 0 }}>
                  {rows.map(({ product, qty, subtotal }) => {
                    const displayProduct = localizeProduct(product, lang);
                    return (
                      <div key={product.id} className="okr__cart-row">
                        <img src={resolveProductCover(displayProduct)} alt={displayProduct.name} loading="lazy" onError={(e) => { e.target.style.opacity = 0; }} />
                        <div className="okr__cart-info">
                          <Link to={`/store/${product.slug}`} style={{ fontWeight: 600, color: "var(--okr-text)" }}>{displayProduct.name}</Link>
                          <div style={{ color: "var(--okr-muted)", fontSize: 13, marginTop: 4 }}>
                            Rp {(product.price ?? 0).toLocaleString("id-ID")}
                          </div>
                          {displayProduct.category && (
                            <div className="okr__product-cat" style={{ marginTop: 6 }}>{displayProduct.category}</div>
                          )}
                        </div>
                        <div className="okr__qty">
                          <button onClick={() => cartRepo.setQty(product.id, qty - 1)} aria-label={t("qty_decrease")}>−</button>
                          <span style={{ minWidth: 24, textAlign: "center" }}>{qty}</span>
                          <button onClick={() => cartRepo.setQty(product.id, qty + 1)} aria-label={t("qty_increase")}>+</button>
                        </div>
                        <div className="okr__cart-actions">
                          <div style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                            Rp {subtotal.toLocaleString("id-ID")}
                          </div>
                          <button onClick={() => cartRepo.remove(product.id)} className="okr__cart-remove" title={t("cart_title_remove")} aria-label={t("cart_remove")}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="okr__panel okr__cart-summary">
                  <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>{t("cart_summary")}</h3>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--okr-line)" }}>
                    <span style={{ color: "var(--okr-muted)" }}>{t("cart_subtotal")} ({rows.reduce((s, r) => s + r.qty, 0)})</span>
                    <span>Rp {total.toLocaleString("id-ID")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0", fontSize: 18, fontWeight: 700 }}>
                    <span>{t("cart_total")}</span>
                    <span style={{ color: "var(--okr-primary-2)" }}>Rp {total.toLocaleString("id-ID")}</span>
                  </div>
                  <Link to="/checkout" className="okr__btn okr__btn--primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
                    {t("cart_checkout")}
                  </Link>
                  <Link to="/store" className="okr__btn okr__btn--ghost" style={{ width: "100%", justifyContent: "center", marginTop: 10 }}>
                    {t("cart_continue")}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
    </>
  );
}
