import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { SunBackground } from "../../components/hero/SunBackground";
import { useLiveServices } from "../../hooks/usePageData";
import { useI18n } from "../../lib/i18n";
import { localizeServiceCardItems } from "../../lib/serviceI18n";
import { getServiceCategoryIcon } from "../../lib/serviceIcons";

export function ServicesPage() {
  const { lang, t } = useI18n();
  const rawItems = useLiveServices({ status: "active" });
  const categories = useMemo(() => {
    const rawCategories = rawItems.filter((s) => s.kind === "category");
    return localizeServiceCardItems(rawCategories, lang);
  }, [rawItems, lang]);
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
              <section className="okr__section okr__page-hero">
            <SunBackground />
          <div className="okr__wrap">
            <span className="okr__eyebrow">// {t("services_eyebrow").toUpperCase()}</span>
            <AnimatedHeadline text={t("services_page_title")} className="okr__h2 okr__hero-title--stagger" highlightFrom={2} assembleLetters />
            <p style={{ color: "var(--okr-muted)", maxWidth: 640, marginTop: 20, marginBottom: 56 }}>
              {t("services_page_subtitle", { count: serviceCount })}
            </p>

            {categories.length === 0 ? (
              <p style={{ color: "var(--okr-muted)" }}>{t("services_empty")}</p>
            ) : (
              <div className="okr__cards okr__cards--services okr__cards--services-catalog">
                {categories.map((s, i) => {
                  const Icon = getServiceCategoryIcon(s.slug);
                  const cardIndex = String(i + 1).padStart(2, "0");
                  return (
                    <Link
                      key={s.id}
                      to={`/services/${s.slug}`}
                      className="okr__card okr__service-card okr__service-card--catalog"
                      data-card-index={cardIndex}
                      style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}
                    >
                      <div className="okr__service-card-meta" aria-hidden="true">
                        <span>{cardIndex}</span>
                        <span>{t("services_eyebrow")}</span>
                      </div>
                      <div className="okr__card-icon"><Icon size={20} strokeWidth={2} /></div>
                      <h3 className="okr__card-title">{s.name}</h3>
                      <div className="okr__service-count">{t("services_count_label", { count: s.service_count ?? s.child_slugs?.length ?? 0 })}</div>
                      <p className="okr__card-body" style={{ flex: 1 }}>{s.body}</p>
                      <span className="okr__card-link">{t("services_explore")} <ArrowRight size={13} /></span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
    </>
  );
}
