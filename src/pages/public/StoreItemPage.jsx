import { useState } from "react";
import { Navigate, useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Check } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { cartRepo } from "../../lib/localStore";
import { useLiveProductState } from "../../hooks/usePageData";
import { useI18n } from "../../lib/i18n";
import { localizeProduct } from "../../lib/storeI18n";
import { resolveProductCover } from "../../lib/storePlaceholder";
import { ProductSocialProof } from "../../components/store/ProductSocialProof";

function seoDescription(text) {
  return String(text ?? "").split(/\n+/)[0].slice(0, 160);
}

function ProductDescription({ text }) {
  const blocks = String(text ?? "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) return null;

  return (
    <div className="okr__product-description">
      {blocks.map((block, index) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        const isList = lines.length > 1 && lines.every((line) => line.startsWith("- "));

        if (isList) {
          return (
            <ul key={index}>
              {lines.map((line) => <li key={line}>{line.slice(2)}</li>)}
            </ul>
          );
        }

        return <p key={index}>{lines.join(" ")}</p>;
      })}
    </div>
  );
}

export function StoreItemPage() {
  const { lang, t } = useI18n();
  const { slug } = useParams();
  const nav = useNavigate();
  const { value: product, loading } = useLiveProductState(slug);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (loading && !product) {
    return (
              <section className="okr__section okr__page-hero">
          <div className="okr__wrap" style={{ color: "var(--okr-muted)" }}>Loading…</div>
        </section>
    );
  }

  if (!product || product.status !== "active") return <Navigate to="/store" replace />;
  const displayProduct = localizeProduct(product, lang);
  const coverUrl = resolveProductCover(displayProduct);

  function addToCart() {
    cartRepo.add(product.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <>
      <Seo title={`${displayProduct.name} — israanwar`} description={seoDescription(displayProduct.description)} />
              <section className="okr__section" style={{ paddingTop: 100 }}>
          <div className="okr__wrap">
            <Link to="/store" className="okr__link" style={{ marginBottom: 24, display: "inline-flex" }}>
              <ArrowLeft size={14} /> {t("store_back")}
            </Link>

            <div className="okr__product-detail">
              <div className="okr__product-hero-img">
                <img
                  src={coverUrl}
                  alt={displayProduct.name}
                  loading="eager"
                  decoding="async"
                />
              </div>
              <div>
                {displayProduct.category && <div className="okr__product-cat">{displayProduct.category}</div>}
                <AnimatedHeadline
                  text={displayProduct.name}
                  className="okr__h2 okr__detail-title"
                  highlightLast={1}
                  style={{ margin: "8px 0 16px" }}
                />
                <ProductSocialProof product={displayProduct} variant="detail" />
                <div style={{ fontSize: 32, fontWeight: 700, color: "var(--okr-primary-2)", marginBottom: 24 }}>
                  Rp {(product.price ?? 0).toLocaleString("id-ID")}
                </div>
                <ProductDescription text={displayProduct.description} />

                <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 24 }}>
                  <div className="okr__qty">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label={t("qty_decrease")}>−</button>
                    <span style={{ minWidth: 24, textAlign: "center", fontWeight: 600 }}>{qty}</span>
                    <button onClick={() => setQty(qty + 1)} aria-label={t("qty_increase")}>+</button>
                  </div>
                  <button className="okr__btn okr__btn--primary" onClick={addToCart} style={{ flex: 1 }}>
                    {added ? <><Check size={16} /> {t("store_added")}</> : <><ShoppingBag size={16} /> {t("store_add")}</>}
                  </button>
                </div>
                <button className="okr__btn okr__btn--ghost" onClick={() => { cartRepo.add(product.id, qty); nav("/checkout"); }} style={{ width: "100%" }}>
                  {t("store_buy_now")}
                </button>
              </div>
            </div>
          </div>
        </section>
    </>
  );
}
