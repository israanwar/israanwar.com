import { Fragment } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../../lib/i18n";

// Pagination klasik. Bukan infinite scroll (sesuai spec).
// Menampilkan maksimal 5 nomor halaman total + previous/next.
// onChange(page) dipanggil ketika user klik nomor. Halaman 1-indexed.

function buildRange(current, total, maxButtons = 5) {
  if (total <= maxButtons) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set([1, total, current]);
  let left = current - 1;
  let right = current + 1;

  while (pages.size < maxButtons && (left > 1 || right < total)) {
    if (left > 1) {
      pages.add(left);
      left -= 1;
    }
    if (pages.size >= maxButtons) break;
    if (right < total) {
      pages.add(right);
      right += 1;
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

export function BlogPagination({ current, total, onChange, ariaLabel }) {
  const { t } = useI18n();
  if (total <= 1) return null;
  const navLabel = ariaLabel ?? t("blog_pagination");
  const pages = buildRange(current, total, 5);
  const canPrev = current > 1;
  const canNext = current < total;

  const btnBase = {
    minWidth: 40,
    height: 40,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid var(--okr-line, rgba(255,255,255,0.1))",
    background: "transparent",
    color: "var(--okr-text)",
    fontSize: 14,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backdropFilter: "blur(14px) saturate(140%)",
    WebkitBackdropFilter: "blur(14px) saturate(140%)",
  };

  return (
    <nav
      aria-label={navLabel}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        marginTop: 48,
        flexWrap: "wrap",
      }}
    >
      <button
        type="button"
        onClick={() => canPrev && onChange(current - 1)}
        disabled={!canPrev}
        style={{ ...btnBase, opacity: canPrev ? 1 : 0.35, cursor: canPrev ? "pointer" : "not-allowed" }}
        aria-label={t("pagination_previous")}
      >
        <ChevronLeft size={16} /> {t("pagination_previous")}
      </button>

      {pages.map((p, index) => (
        <Fragment key={p}>
          {index > 0 && p - pages[index - 1] > 1 && (
            <span style={{ color: "var(--okr-dim)" }}>…</span>
          )}
          <button
            type="button"
            onClick={() => onChange(p)}
            style={{
              ...btnBase,
              background: p === current ? "var(--okr-touch-glass)" : "transparent",
              borderColor: p === current ? "var(--okr-touch-glass-border)" : btnBase.border,
              boxShadow: p === current ? "var(--okr-touch-glass-shadow)" : undefined,
              color: "var(--okr-text)",
              fontWeight: p === current ? 600 : 400,
            }}
            aria-current={p === current ? "page" : undefined}
          >
            {p}
          </button>
        </Fragment>
      ))}

      <button
        type="button"
        onClick={() => canNext && onChange(current + 1)}
        disabled={!canNext}
        style={{ ...btnBase, opacity: canNext ? 1 : 0.35, cursor: canNext ? "pointer" : "not-allowed" }}
        aria-label={t("pagination_next")}
      >
        {t("pagination_next")} <ChevronRight size={16} />
      </button>
    </nav>
  );
}
