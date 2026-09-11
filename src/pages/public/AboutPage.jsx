import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { useLivePage } from "../../hooks/usePageData";
import { useI18n } from "../../lib/i18n";
import { localizePage } from "../../lib/pageI18n";

export function AboutPage() {
  const { lang, t } = useI18n();
  const rawPage = useLivePage("about");
  const p = localizePage(rawPage, lang);

  return (
    <>
      <Seo title={`${p.hero_title || t("nav_about")} — israanwar`} description={p.hero_subtitle} />
              <section className="okr__section okr__page-hero">
            <div className="okr__wrap" style={{ maxWidth: 900 }}>
            {p.hero_kicker && <span className="okr__kicker">{p.hero_kicker}</span>}
            <AnimatedHeadline text={p.hero_title} className="okr__h2" highlightFrom={3} />
            {p.hero_subtitle && (
              <p className="okr__page-hero-lead">
                {p.hero_subtitle}
              </p>
            )}
          </div>
        </section>

        {p.story_title && (
          <section className="okr__section" style={{ paddingTop: 0 }}>
            <div className="okr__wrap" style={{ maxWidth: 780 }}>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 24 }}>
                {p.story_title}
              </h2>
              <p style={{ color: "var(--okr-muted)", fontSize: 17, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                {p.story_body}
              </p>
            </div>
          </section>
        )}

        {p.values?.length > 0 && (
          <section className="okr__section" style={{ paddingTop: 0 }}>
            <div className="okr__wrap">
              <span className="okr__eyebrow">{t("portfolio_values_label")}</span>
              <div className="okr__cards" style={{ marginTop: 32 }}>
                {p.values.map((v, i) => (
                  <article key={i} className="okr__card">
                    <h3 className="okr__card-title">{v.title}</h3>
                    <p className="okr__card-body">{v.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {p.stats?.length > 0 && (
          <section className="okr__section" style={{ paddingTop: 0 }}>
            <div className="okr__wrap">
              <div style={{
                display: "grid", gridTemplateColumns: `repeat(${p.stats.length}, 1fr)`,
                gap: 24, textAlign: "center",
              }} className="okr__stats-grid">
                {p.stats.map((s, i) => (
                  <div key={i} className="okr__panel" style={{ padding: 32 }}>
                    <div style={{ fontSize: 44, fontWeight: 800, color: "var(--okr-primary-2)", letterSpacing: "-0.02em" }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: 14, color: "var(--okr-muted)", marginTop: 8 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
    </>
  );
}
