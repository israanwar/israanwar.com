import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { SunBackground } from "../../components/hero/SunBackground";
import { useLivePage } from "../../hooks/usePageData";
import { renderRichText } from "../../components/layout/renderRichText";
import { useI18n } from "../../lib/i18n";
import { localizePage } from "../../lib/pageI18n";

export function PrivacyPage() {
  const { lang, t } = useI18n();
  const rawPage = useLivePage("privacy");
  const p = localizePage(rawPage, lang);
  return (
    <>
      <Seo title={`${p.title || t("foot_privacy")} — israanwar`} description={t("foot_privacy")} path="/privacy" />
              <section className="okr__section okr__page-hero">
            <SunBackground />
          <div className="okr__wrap" style={{ maxWidth: 780 }}>
            <span className="okr__eyebrow">{t("foot_legal_label")}</span>
            <AnimatedHeadline text={p.title || t("foot_privacy")} className="okr__h2 okr__hero-title--stagger" highlightLast={1} assembleLetters style={{ marginTop: 20 }} />
            {p.updated && (
              <p style={{ color: "var(--okr-dim)", fontSize: 14, marginTop: 12 }}>
                {t("foot_updated")} {p.updated}
              </p>
            )}
            <div style={{ color: "var(--okr-muted)", fontSize: 16, lineHeight: 1.75, marginTop: 32 }}>
              {renderRichText(p.body)}
            </div>
          </div>
        </section>
    </>
  );
}
