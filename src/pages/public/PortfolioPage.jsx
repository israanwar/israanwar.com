import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Blocks,
  BriefcaseBusiness,
  ChevronDown,
  CircuitBoard,
  Code2,
  ExternalLink,
  Globe2,
  Megaphone,
  Music2,
  Orbit,
  Radar,
  Search,
  Trophy,
  X,
  Youtube,
} from "lucide-react";
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
    || p.portfolio_groups?.length
    || p.certifications?.length,
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

            {p.certifications?.length > 0 && (
              <PortfolioSection eyebrow={t("portfolio_credentials_label")}>
                <CertificationsMarquee providers={p.certifications} />
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
          {title && (
            <h2 className="okr__portfolio-heading">
              {title}
            </h2>
          )}
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
      {items.map((item, i) => {
        const ConsultingIcon = CONSULTING_ICON_BY_ORG[item.org] || BriefcaseBusiness;
        return (
          <article key={`${item.org}-${i}`} className="okr__card okr__portfolio-consult-card">
            <div className="okr__portfolio-card-top">
              <span className="okr__portfolio-year">
                {item.year}
              </span>
              <span className="okr__card-icon okr__portfolio-card-icon" aria-hidden="true">
                <ConsultingIcon size={17} />
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
        );
      })}
    </div>
  );
}

const CONSULTING_ICON_BY_ORG = {
  "PT Tri Ariesta Dinamika (TADCO)": Code2,
  "PT Cipta Jasa Digital": Search,
  "PT Nisdar Digital Group": Youtube,
  "Walk Alone Studio": Music2,
  "R24 Studio": Globe2,
  "Akraga TV": Trophy,
};

// Groups past this size render collapsed by default with a "show all" toggle
// so a 60-item catalog doesn't turn into a wall of pills on first paint.
const PORTFOLIO_PILL_COLLAPSE_LIMIT = 15;

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
        <ProjectGroupCard key={`${group.label}-${i}`} group={group} />
      ))}
    </div>
  );
}

function ProjectGroupCard({ group }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const total = group.parsedItems.length;
  const isLong = total > PORTFOLIO_PILL_COLLAPSE_LIMIT;
  const visibleItems = expanded || !isLong
    ? group.parsedItems
    : group.parsedItems.slice(0, PORTFOLIO_PILL_COLLAPSE_LIMIT);

  return (
    <article className="okr__panel okr__portfolio-group">
      <div className="okr__portfolio-group-head">
        <h3 className="okr__portfolio-group-title">
          {group.label}
        </h3>
        <span className="okr__portfolio-group-icon" aria-hidden="true">
          <ProjectGroupIcon label={group.label} />
        </span>
      </div>
      <div className="okr__portfolio-pills">
        {visibleItems.map((item) => (
          <span key={item} className="okr__portfolio-pill">
            {item}
          </span>
        ))}
      </div>
      {isLong && (
        <button
          type="button"
          className="okr__portfolio-toggle"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? t("portfolio_show_less") : t("portfolio_show_all", { count: total })}
          <ChevronDown size={14} className={expanded ? "is-flipped" : ""} aria-hidden="true" />
        </button>
      )}
    </article>
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

function CertificationsMarquee({ providers }) {
  const { t } = useI18n();
  const [activeSlug, setActiveSlug] = useState(null);
  const active = providers.find((provider) => provider.slug === activeSlug) || null;

  useEffect(() => {
    if (!active) return undefined;
    function onKeyDown(e) {
      if (e.key === "Escape") setActiveSlug(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active]);

  // Duplicate the track once so the CSS marquee can loop seamlessly
  // (translate exactly -50% and the second copy lines up perfectly).
  const track = [...providers, ...providers];

  return (
    <>
      <div className="okr__cert-marquee">
        <div className="okr__cert-marquee-track">
          {track.map((provider, i) => (
            <button
              key={`${provider.slug}-${i}`}
              type="button"
              className="okr__cert-logo"
              onClick={() => setActiveSlug(provider.slug)}
              aria-label={`${provider.name} — ${t("portfolio_view_certificates")}`}
              tabIndex={i < providers.length ? 0 : -1}
              aria-hidden={i < providers.length ? undefined : true}
            >
              {/* Never lazy-load: this strip auto-scrolls continuously, so
                  every logo — including ones further along the track —
                  must already be decoded, not deferred until it scrolls
                  near the viewport. */}
              <img src={provider.logo} alt="" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
      <p className="okr__cert-hint">{t("portfolio_credentials_hint")}</p>

      {active && typeof document !== "undefined" && createPortal(
        // Rendered via portal straight into <body> — several ancestor sections
        // use `contain: layout paint style`, which turns them into a
        // containing block for position:fixed descendants and traps a
        // same-tree overlay instead of letting it cover the viewport.
        <div className="okr__cert-overlay" onClick={() => setActiveSlug(null)}>
          <div
            className="okr__cert-panel"
            role="dialog"
            aria-modal="true"
            aria-label={active.name}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="okr__cert-panel-close"
              onClick={() => setActiveSlug(null)}
              aria-label={t("portfolio_cert_close")}
            >
              <X size={18} />
            </button>
            <div className="okr__cert-panel-head">
              <img src={active.logo} alt="" aria-hidden="true" className="okr__cert-panel-logo" />
              <h3 className="okr__cert-panel-title">{active.name}</h3>
            </div>
            <ul className="okr__cert-panel-list">
              {active.items.map((item) => (
                <li key={item.name}>
                  <a href={item.url} target="_blank" rel="noreferrer">
                    <span>{item.name}</span>
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
