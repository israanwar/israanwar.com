import { Link } from "react-router-dom";
import { useI18n } from "../../lib/i18n";

export function StoreTransactionNotice({ showStoreLink = false }) {
  const { t } = useI18n();
  return (
    <div className="store-transaction-notice" role="status">
      <strong>{t("store_transactions_closed_title")}</strong>
      <p>{t("store_transactions_closed_body")}</p>
      {showStoreLink && <Link to="/store" className="okr__link">{t("store_back")}</Link>}
    </div>
  );
}
