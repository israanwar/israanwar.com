import { useMemo } from "react";
import { Blocks, BriefcaseBusiness, CircuitBoard, Megaphone, Orbit, Radar } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { useLivePage } from "../../hooks/usePageData";
import { useI18n } from "../../lib/i18n";
import { localizePage } from "../../lib/pageI18n";

export function PortfolioPage() {
  const { lang, t } = useI18n();
  const rawPage = useLivePage("portfolio");
  const p = useMemo(() => localizePage(rawPage, lang), [rawPage, lang]);
  const hasWork = Boolean(
    p.hero_title
    || p.hero_subtitle
    || p.core_expertise?.length
    || p.consulting?.length
    || p.portfolio_groups?.length,
  );

  if (!hasWork) {
    return (
      <>
        <Seo title="Portfolio - israanwar" description="Portfolio israanwar." />
                  <section className="okr__section" style={{ paddingTop: 140, paddingBottom: 100 }}>
            <div className="okr__wrap" style={{ maxWidth: 640, textAlign: "center" }}>
              {p.hero_kicker && <span className="okr__kicker">{p.hero_kicker}</span>}
              <AnimatedHeadline text={t("portfolio_empty_title")} className="okr__h2" highlightLast={1} style={{ marginTop: 20 }} />
              <p style={{ color: "var(--okr-muted)", marginTop: 20, fontSize: 16, lineHeight: 1.6 }}>
                {t("portfolio_empty_body")}
              </p>
            </div>
          </section>
      </>
    );
  }

  return (
    <>
      <Seo
        title={`${p.hero_title || t("nav_portfolio")} - israanwar`}
        description={p.hero_subtitle || t("portfolio_empty_body")}
      />
              <section className="okr__section okr__portfolio-page" style={{ paddingTop: 110, paddingBottom: 70 }}>
          <div className="okr__wrap">
            <header style={{ maxWidth: 860, marginBottom: 54 }}>
              {p.hero_kicker && <span className="okr__kicker">{p.hero_kicker}</span>}
              <AnimatedHeadline
                text={p.hero_title || t("portfolio_empty_title")}
                className="okr__hero-title"
                highlightLast={1}
                style={{ marginTop: 24, maxWidth: 920 }}
              />
              {p.hero_subtitle && (
                <p className="okr__hero-sub" style={{ maxWidth: 720 }}>
                  {p.hero_subtitle}
                </p>
              )}
            </header>

            {p.core_expertise?.length > 0 && (
              <PortfolioSection eyebrow={t("portfolio_positioning")} title={t("portfolio_consultant_focus")}>
                <TagCloud tags={p.core_expertise} highlight={["Consultant", "SEO Architecture", "Web Development"]} />
              </PortfolioSection>
            )}

            {p.consulting?.length > 0 && (
              <PortfolioSection eyebrow={t("portfolio_role")} title={t("portfolio_consulting_projects")}>
                <ConsultingGrid items={p.consulting} />
              </PortfolioSection>
            )}

            {p.portfolio_groups?.length > 0 && (
              <PortfolioSection eyebrow={t("portfolio_selected_work")} title={t("portfolio_project_portfolio")}>
                <ProjectGroups groups={p.portfolio_groups} />
              </PortfolioSection>
            )}
          </div>
        </section>
    </>
  );
}

function PortfolioSection({ eyebrow, title, children }) {
  return (
    <section className="okr__portfolio-section">
      <div className="okr__portfolio-section-head">
        <div>
          <div className="okr__portfolio-eyebrow">
            {eyebrow}
          </div>
          <h2 className="okr__portfolio-heading">
            {title}
          </h2>
        </div>
        <div className="okr__portfolio-rule" />
      </div>
      {children}
    </section>
  );
}

function ConsultingGrid({ items }) {
  return (
    <div className="okr__portfolio-consulting-grid">
      {items.map((item, i) => (
        <article key={`${item.org}-${i}`} className="okr__card okr__portfolio-consult-card">
          <div className="okr__portfolio-card-top">
            <span className="okr__portfolio-year">
              {item.year}
            </span>
            <span className="okr__card-icon okr__portfolio-card-icon">
              <BriefcaseBusiness size={17} />
            </span>
          </div>
          <h3 className="okr__card-title" style={{ marginBottom: 8 }}>
            {item.org}
          </h3>
          <div className="okr__portfolio-role">
            {item.role}
          </div>
          <p className="okr__card-body">{item.desc}</p>
        </article>
      ))}
    </div>
  );
}

function ProjectGroups({ groups }) {
  const preparedGroups = useMemo(
    () => groups.map((group) => ({
      ...group,
      parsedItems: splitPortfolioItems(group.items),
    })),
    [groups]
  );

  return (
    <div className="okr__portfolio-groups">
      {preparedGroups.map((group, i) => (
        <article key={`${group.label}-${i}`} className="okr__panel okr__portfolio-group">
          <div className="okr__portfolio-group-head">
            <h3 className="okr__portfolio-group-title">
              {group.label}
            </h3>
            <span className="okr__portfolio-group-icon" aria-hidden="true">
              <ProjectGroupIcon label={group.label} />
            </span>
          </div>
          <div className="okr__portfolio-pills">
            {group.parsedItems.map((item) => (
              <span key={item} className="okr__portfolio-pill">
                {item}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function ProjectGroupIcon({ label }) {
  const Icon = label === "Products & Platforms"
    ? Blocks
    : label === "Website Development & SEO"
      ? CircuitBoard
      : label === "SEO, Niche & AdSense Sites"
        ? Radar
        : label === "Event & Brand Campaigns"
          ? Megaphone
          : Orbit;
  return <Icon size={18} strokeWidth={2} />;
}

function TagCloud({ tags, highlight = [] }) {
  return (
    <div className="okr__portfolio-tag-cloud">
      {tags.map((tag) => (
        <span key={tag} className={`okr__portfolio-chip${highlight.includes(tag) ? " is-highlight" : ""}`}>
          {tag}
        </span>
      ))}
    </div>
  );
}

function splitPortfolioItems(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value ?? "")
    .replace(/\.$/, "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
