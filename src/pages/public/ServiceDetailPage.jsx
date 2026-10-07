import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Check } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { useLiveServiceState, useLiveServices, useLiveSettings } from "../../hooks/usePageData";
import { useI18n } from "../../lib/i18n";
import { localizeServiceCardItem, localizeServiceItem } from "../../lib/serviceI18n";
import { ServiceFolderArtwork } from "../../components/marketing/ServiceFolderArtwork";
import { getServiceFolderVisual } from "../../data/serviceFolderVisuals";
import "../../styles/service-folder-grid.css";

import { ServicePrice, ServicePackageLink } from "../../components/services/ServicePricing";

export function ServiceDetailPage() {
  const { lang, t } = useI18n();
  const { slug } = useParams();
  const { value: rawService, loading } = useLiveServiceState(slug);
  const rawServices = useLiveServices({ status: "active" });
  const s = useMemo(
    () => localizeServiceItem(rawService, rawServices, lang),
    [rawService, rawServices, lang]
  );
  const settings = useLiveSettings();
  const isCategory = s?.kind === "category";
  const childServices = useMemo(() => {
    if (!s || !isCategory) return [];
    return rawServices
      .filter((item) => item.kind === "service" && item.parent_slug === s.slug)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((item) => localizeServiceCardItem(item, rawServices, lang));
  }, [isCategory, rawServices, s?.slug, lang]);
  const parentCategory = useMemo(() => {
    if (!s || isCategory || !s.parent_slug) return null;
    return localizeServiceCardItem(
      rawServices.find((item) => item.kind === "category" && item.slug === s.parent_slug),
      rawServices,
      lang
    );
  }, [isCategory, rawServices, s?.parent_slug, lang]);

  if (loading && !rawService) {
    // In-flight data fetch, not a failure — stay visually silent, same
    // reasoning as the route-chunk Suspense fallbacks.
    return <section className="okr__section okr__page-hero" style={{ minHeight: "60vh" }} aria-hidden="true" />;
  }

  if (!s || s.status !== "active") return <Navigate to="/services" replace />;

  const waMsg = encodeURIComponent(
    lang === "id"
      ? `Halo, saya tertarik dengan ${s.name} di israanwar.com. Mohon kirimkan informasi lebih lanjut.`
      : `Hi, I'm interested in ${s.name} at israanwar.com. Please share more information.`
  );
  const waLink = `${settings.whatsapp_url}?text=${waMsg}`;
  const backTo = parentCategory ? `/services/${parentCategory.slug}` : "/services";
  const backLabel = parentCategory ? parentCategory.name : t("services_all");

  return (
    <>
      <Seo title={`${s.name} — Services israanwar`} description={s.description ?? s.body} service={s} />
      <section className="okr__section" style={{ paddingTop: 100 }}>
        <div className="okr__wrap" style={{ maxWidth: isCategory ? undefined : 900 }}>
            <Link to={backTo} className="okr__link okr__service-detail-back">
              <ArrowLeft size={14} /> {backLabel}
            </Link>

            {parentCategory && (
              <Link to={`/services/${parentCategory.slug}`} className="okr__service-parent">
                {parentCategory.name}
              </Link>
            )}
            <AnimatedHeadline
              text={s.name}
              className="okr__h2 okr__detail-title okr__hero-title--stagger"
              highlightLast={1}
              assembleLetters
              style={{ margin: "0 0 12px" }}
            />
            {s.tagline && (
              <p style={{ color: "var(--okr-primary-2)", fontSize: 18, fontWeight: 500, marginBottom: 24 }}>
                {s.tagline}
              </p>
            )}
            <ServicePrice service={rawService} lang={lang} />
            <ServicePackageLink service={rawService} lang={lang} />
            <p style={{ color: "var(--okr-muted)", fontSize: 13, margin: "16px 0 28px" }}>{lang === "id" ? "Harga awal. Cakupan, hasil kerja, revisi, dan biaya tambahan dikonfirmasi dalam penawaran. Biaya pihak ketiga tidak termasuk." : "Starting price. Scope, deliverables, revisions, and additional costs are confirmed in the quote. Third-party costs are excluded."}</p>
            {s.description && (
              <ServiceText value={s.description} />
            )}

            {isCategory && childServices.length > 0 && (
              <section className="okr__service-list-section">
                <div className="okr__section-topbar" style={{ marginBottom: 28 }}>
                  <div>
                    <span className="okr__eyebrow">// {t("services_menu")}</span>
                    <AnimatedHeadline
                      as="h2"
                      text={t("services_focused_count", { count: childServices.length })}
                      className="okr__service-section-title okr__hero-title--stagger"
                      assembleLetters
                    />
                  </div>
                </div>
                <div className="service-folder-grid service-subservice-grid">
                  {childServices.map((child, index) => {
                    const visual = getServiceFolderVisual(child.parent_slug, index, childServices.length);
                    return (
                      <Link
                        key={child.id}
                        to={`/services/${child.slug}`}
                        className="service-folder-card service-folder-card--leaf"
                        style={{ "--folder-gradient": visual.gradient, "--folder-glow": visual.accent }}
                      >
                        <span className="service-folder-card-glow" aria-hidden="true" />
                        <ServiceFolderArtwork />
                        <div className="service-folder-meta">
                          <h3>{child.name}</h3>
                          <ServicePrice service={rawServices.find(item => item.slug === child.slug)} lang={lang} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {s.deliverables?.length > 0 && (
              <div className="okr__panel" style={{ marginBottom: 32 }}>
                <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>{t("services_deliverables")}</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
                  {s.deliverables.map((d, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, color: "var(--okr-muted)" }}>
                      <Check size={18} style={{ color: "var(--okr-primary-2)", flexShrink: 0, marginTop: 2 }} />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="okr__cta" style={{ margin: "40px 0 0" }}>
              <h3>{t("services_cta_title")}</h3>
              <p>{t("services_cta_body")}</p>
              <a className="okr__btn okr__btn--primary" href={waLink} target="_blank" rel="noreferrer">
                <MessageCircle size={17} /> {t("services_cta_button")}
              </a>
            </div>
          </div>
        </section>
    </>
  );
}

function ServiceText({ value }) {
  const paragraphs = String(value ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="okr__service-text">
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}
