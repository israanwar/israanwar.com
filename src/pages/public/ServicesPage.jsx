import { useMemo } from "react";
import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { useLiveServices } from "../../hooks/usePageData";
import { useI18n } from "../../lib/i18n";
import { localizeServiceCardItems } from "../../lib/serviceI18n";
import { ServiceFolderGrid } from "../../components/marketing/ServiceFolderGrid";
import "../../styles/service-folder-grid.css";

import { ServicePricing } from "../../components/services/ServicePricing";

export function ServicesPage() {
  const { lang, t } = useI18n();
  const rawItems = useLiveServices({ status: "active" });
  const serviceItems = useMemo(
    () => localizeServiceCardItems(rawItems, lang),
    [rawItems, lang],
  );
  const serviceCount = useMemo(
    () => rawItems.filter((s) => s.kind === "service").length,
    [rawItems]
  );

  return (
    <>
      <Seo
        title={`${t("services_eyebrow")} — israanwar`}
        description={t("services_page_subtitle", { count: serviceCount })}
      />
              <section className="okr__section okr__page-hero okr__services-plain">
          <div className="okr__wrap">
            <span className="okr__eyebrow">// {t("services_eyebrow").toUpperCase()}</span>
            <AnimatedHeadline text={t("services_page_title")} className="okr__h2 okr__hero-title--stagger" highlightFrom={2} assembleLetters />
            <p style={{ color: "var(--okr-muted)", maxWidth: 640, marginTop: 20, marginBottom: 56 }}>
              {t("services_page_subtitle", { count: serviceCount })}
            </p>

            <a className="okr__btn okr__btn--primary" href="#build-package" style={{ marginBottom: 32 }}>Build Your Own Package</a>
          </div>
        </section>
      <section className="okr__section okr__services-section okr__services-plain" aria-label={lang === "id" ? "Katalog layanan" : "Service catalog"}>
        <div className="okr__wrap">
          {serviceItems.length === 0 ? (
            <p style={{ color: "var(--okr-muted)" }}>{t("services_empty")}</p>
          ) : (
            <ServiceFolderGrid items={serviceItems} lang={lang} includeAll showHeading={false} />
          )}
        </div>
      </section>
      <ServicePricing lang={lang} />
    </>
  );
}
