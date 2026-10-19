import { Link } from "react-router-dom";
import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { useI18n } from "../../lib/i18n";

// Main sections a lost visitor is most likely looking for.
const EXPLORE_LINKS = [
  { to: "/services", label: "nav_services" },
  { to: "/tools", label: "nav_tools" },
  { to: "/blog", label: "nav_blog" },
  { to: "/store", label: "nav_store" },
  { to: "/contact", label: "nav_contact" },
];

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <>
      <Seo title="404 — israanwar" description={t("nf_body")} noindex />
              <section className="okr__section" style={{ textAlign: "center" }}>
          <div className="okr__wrap">
            <span className="okr__eyebrow">404</span>
            <AnimatedHeadline text={t("nf_title")} className="okr__h2 okr__hero-title--stagger" highlightLast={1} assembleLetters />
            <p style={{ color: "var(--okr-muted)", marginTop: 20, marginBottom: 32 }}>
              {t("nf_body")}
            </p>
            <Link className="okr__btn okr__btn--primary" to="/">{t("nf_action")}</Link>
            <nav aria-label={t("nf_explore")} style={{ marginTop: 48 }}>
              <p style={{ color: "var(--okr-dim)", fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
                {t("nf_explore")}
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, padding: 0, margin: "16px 0 0" }}>
                {EXPLORE_LINKS.map(({ to, label }) => (
                  <li key={to}>
                    <Link className="okr__btn okr__btn--ghost" to={to}>{t(label)}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </section>
    </>
  );
}
