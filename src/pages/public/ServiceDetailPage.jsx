import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Check, Code2, Search, Sparkles, FileText, Settings, BarChart3, Zap, Wrench } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { useLiveServiceState, useLiveServices, useLiveSettings } from "../../hooks/usePageData";
import { useI18n } from "../../lib/i18n";
import { localizeServiceCardItem, localizeServiceItem } from "../../lib/serviceI18n";

const ICON_MAP = {
  code: Code2, search: Search, sparkles: Sparkles, "file-text": FileText,
  settings: Settings, "bar-chart": BarChart3, zap: Zap, wrench: Wrench,
};

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
    return (
              <section className="okr__section okr__page-hero">
          <div className="okr__wrap" style={{ color: "var(--okr-muted)" }}>Loading…</div>
        </section>
    );
  }

  if (!s || s.status !== "active") return <Navigate to="/services" replace />;

  const Icon = ICON_MAP[s.icon] || Sparkles;
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
      <Seo title={`${s.name} — Services israanwar`} description={s.description ?? s.body} />
              <section className="okr__section" style={{ paddingTop: 100 }}>
          <div className="okr__wrap" style={{ maxWidth: 900 }}>
            <Link to={backTo} className="okr__link" style={{ marginBottom: 24, display: "inline-flex" }}>
              <ArrowLeft size={14} /> {backLabel}
            </Link>

            <div className="okr__card-icon" style={{ marginBottom: 20, marginTop: 24 }}>
              <Icon size={22} strokeWidth={2} />
            </div>
            {parentCategory && (
              <Link to={`/services/${parentCategory.slug}`} className="okr__service-parent">
                {parentCategory.name}
              </Link>
            )}
            <AnimatedHeadline
              text={s.name}
              className="okr__h2 okr__detail-title"
              highlightLast={1}
              style={{ margin: "0 0 12px" }}
            />
            {s.tagline && (
              <p style={{ color: "var(--okr-primary-2)", fontSize: 18, fontWeight: 500, marginBottom: 24 }}>
                {s.tagline}
              </p>
            )}
            {s.description && (
              <ServiceText value={s.description} />
            )}

            {isCategory && childServices.length > 0 && (
              <section className="okr__service-list-section">
                <div className="okr__section-topbar" style={{ marginBottom: 28 }}>
                  <div>
                    <span className="okr__eyebrow">// {t("services_menu")}</span>
                    <h2 className="okr__service-section-title">{t("services_focused_count", { count: childServices.length })}</h2>
                  </div>
                </div>
                <div className="okr__cards okr__cards--services okr__service-child-grid">
                  {childServices.map((child, i) => {
                    const ChildIcon = ICON_MAP[child.icon] || Sparkles;
                    const childIndex = String(i + 1).padStart(2, "0");
                    return (
                      <Link
                        key={child.id}
                        to={`/services/${child.slug}`}
                        className="okr__card okr__service-card okr__service-card--catalog"
                        data-card-index={childIndex}
                        style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}
                      >
                        <div className="okr__service-card-meta" aria-hidden="true">
                          <span>{childIndex}</span>
                          <span>{t("services_menu")}</span>
                        </div>
                        <div className="okr__card-icon"><ChildIcon size={20} strokeWidth={2} /></div>
                        <h3 className="okr__card-title">{child.name}</h3>
                        <p className="okr__card-body" style={{ flex: 1 }}>{child.body}</p>
                        <span className="okr__card-link">{t("services_details")}</span>
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
