import { Link } from "react-router-dom";
import { Trash2, ShoppingBag } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { useEffect } from "react";
import { cartStore as cartRepo, cartNotice } from "../../lib/cartStore";
import { useLiveCart } from "../../hooks/usePageData";
import { useI18n } from "../../lib/i18n";
import { localizeProduct } from "../../lib/storeI18n";
import { resolveProductCover } from "../../lib/storePlaceholder";
import { STORE_TRANSACTIONS_CLOSED } from "../../data/storeStatus";
import { StoreTransactionNotice } from "../../components/store/StoreTransactionNotice";
import "../../styles/store-stamp.css";

let pendingNoticeClear = null;

export function CartPage() {
  const { lang, t } = useI18n();
  const { rows, total, itemCount, removed } = useLiveCart();
  // The notice is shown once; leaving the cart page clears it. The clear is
  // deferred so React's development double-mount (unmount, then mount again)
  // cancels it instead of wiping the notice before it is seen.
  useEffect(() => {
    clearTimeout(pendingNoticeClear);
    return () => { pendingNoticeClear = setTimeout(() => cartNotice.clear(), 0); };
  }, []);

  return (
    <>
      <Seo title={`${t("cart_title")} — israanwar`} description={t("cart_title")} noindex />
              <section className="okr__section okr__page-hero">
          <div className="okr__wrap">
            <AnimatedHeadline text={t("cart_title")} className="okr__h2 okr__hero-title--stagger" highlightLast={1} assembleLetters />
            {STORE_TRANSACTIONS_CLOSED && <StoreTransactionNotice />}

            {removed > 0 && (
              <p role="status" style={{ margin: "16px 0 0", padding: "12px 16px", borderRadius: 10, border: "1px solid var(--okr-line)", color: "var(--okr-muted)", fontSize: 14 }}>
                {t("cart_removed_notice", { n: removed })}
              </p>
            )}

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
                          <span style={{ fontSize: 13, color: "var(--okr-muted)", whiteSpace: "nowrap" }}>{t("cart_license")}</span>
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
                    <span style={{ color: "var(--okr-muted)" }}>{t("cart_subtotal")} ({rows.length})</span>
                    <span>Rp {total.toLocaleString("id-ID")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0", fontSize: 18, fontWeight: 700 }}>
                    <span>{t("cart_total")}</span>
                    <span style={{ color: "var(--okr-primary-2)" }}>Rp {total.toLocaleString("id-ID")}</span>
                  </div>
                  {!STORE_TRANSACTIONS_CLOSED && (
                    <Link to="/checkout" className="okr__btn okr__btn--primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
                      {t("cart_checkout")}
                    </Link>
                  )}
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
