import { Fragment } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../../lib/i18n";

function pageRange(current, total, limit) {
  if (total <= limit) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = new Set([1, current, total]);
  let previous = current - 1;
  let next = current + 1;

  while (pages.size < limit && (previous > 1 || next < total)) {
    if (previous > 1) pages.add(previous--);
    if (pages.size < limit && next < total) pages.add(next++);
  }

  return [...pages].sort((a, b) => a - b);
}

export function StorePagination({ current, total, onChange, ariaLabel }) {
  const { t } = useI18n();
  if (total <= 1) return null;

  function renderPages(pages, layout) {
    return (
      <span className={`store-pagination__pages store-pagination__pages--${layout}`}>
        {pages.map((page, index) => (
          <Fragment key={page}>
            {index > 0 && page - pages[index - 1] > 1 && (
              <span className="store-pagination__ellipsis" aria-hidden="true">…</span>
            )}
            <button
              className="store-pagination__button"
              type="button"
              onClick={() => onChange(page)}
              aria-label={`${t("store_pagination")} ${page}`}
              aria-current={page === current ? "page" : undefined}
            >
              {page}
            </button>
          </Fragment>
        ))}
      </span>
    );
  }

  return (
    <nav className="store-pagination" aria-label={ariaLabel}>
      <button
        className="store-pagination__button store-pagination__direction"
        type="button"
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        aria-label={t("pagination_previous")}
      >
        <ChevronLeft size={17} aria-hidden="true" />
        <span>{t("pagination_previous")}</span>
      </button>

      {renderPages(pageRange(current, total, 5), "desktop")}
      {renderPages(pageRange(current, total, 3), "mobile")}

      <button
        className="store-pagination__button store-pagination__direction"
        type="button"
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        aria-label={t("pagination_next")}
      >
        <span>{t("pagination_next")}</span>
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </nav>
  );
}
