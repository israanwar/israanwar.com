import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { useI18n } from "../../lib/i18n";

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <>
      <Seo title="404 — israanwar" description={t("nf_body")} noindex />
              <section className="okr__section" style={{ textAlign: "center" }}>
          <div className="okr__wrap">
            <span className="okr__eyebrow">404</span>
            <AnimatedHeadline text={t("nf_title")} className="okr__h2" highlightLast={1} />
            <p style={{ color: "var(--okr-muted)", marginTop: 20, marginBottom: 32 }}>
              {t("nf_body")}
            </p>
            <a className="okr__btn okr__btn--primary" href="/">{t("nf_action")}</a>
          </div>
        </section>
    </>
  );
}
