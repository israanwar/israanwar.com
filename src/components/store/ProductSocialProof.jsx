import { Star } from "lucide-react";
import { useI18n } from "../../lib/i18n";

function formatSold(value) {
  return Number(value ?? 0).toLocaleString("id-ID");
}

function normalizeRating(value) {
  const rating = Number(value ?? 0);
  if (!Number.isFinite(rating) || rating <= 0) return 0;
  return Math.min(5, Math.max(4.4, rating));
}

export function ProductSocialProof({ product, variant = "card" }) {
  const { t } = useI18n();
  const rating = normalizeRating(product?.rating);
  const sold = Number(product?.sold_count ?? 0);

  if (!rating && !sold) return null;

  const roundedStars = Math.round(rating);
  const ratingText = rating ? rating.toFixed(1) : null;
  const soldText = sold ? t("store_sold", { count: formatSold(sold) }) : null;

  return (
    <div className={`okr__product-proof okr__product-proof--${variant}`}>
      {ratingText && (
        <>
          <span className="okr__product-stars" aria-label={t("store_rating", { rating: ratingText })}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                size={variant === "detail" ? 15 : 13}
                strokeWidth={2.2}
                className={index < roundedStars ? "is-filled" : "is-muted"}
                aria-hidden="true"
              />
            ))}
          </span>
          <span className="okr__product-rating">{ratingText}</span>
        </>
      )}
      {ratingText && soldText && <span className="okr__product-proof-dot">·</span>}
      {soldText && <span className="okr__product-sold">{soldText}</span>}
    </div>
  );
}
