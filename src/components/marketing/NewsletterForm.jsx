import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { newsletterData } from "../../lib/supabaseData";
import { useI18n } from "../../lib/i18n";
import "../../styles/newsletter.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Shared subscribe form for both placements (footer + end of blog posts).
// `variant` only switches the CSS hook used for layout/color — the markup
// and behavior are identical everywhere.
export function NewsletterForm({ source, variant = "footer", className = "" }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [error, setError] = useState(null);

  async function submit(ev) {
    ev.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError(t("err_invalid_email"));
      return;
    }
    setError(null);
    setStatus("sending");
    try {
      await newsletterData.create({ email: email.trim(), source });
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className={`okr__newsletter okr__newsletter--${variant} ${className}`}>
      <div className="okr__newsletter-copy">
        <span className="okr__newsletter-kicker">{t("newsletter_kicker")}</span>
        <p className="okr__newsletter-title">{t("newsletter_title")}</p>
        <p className="okr__newsletter-subtitle">{t("newsletter_subtitle")}</p>
      </div>

      {status === "success" ? (
        <div className="okr__newsletter-success">
          <Check size={16} /> {t("newsletter_success")}
        </div>
      ) : (
        <form className="okr__newsletter-form" onSubmit={submit} noValidate>
          <div className="okr__newsletter-field">
            <input
              type="email"
              className="okr__newsletter-input"
              placeholder={t("newsletter_email_ph")}
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }}
              aria-label={t("newsletter_email_ph")}
              required
            />
            <button className="okr__newsletter-btn" type="submit" disabled={status === "sending"}>
              <span className="okr__newsletter-btn-fill" aria-hidden="true" />
              <span className="okr__newsletter-btn-label">
                {status === "sending" ? t("newsletter_sending") : t("newsletter_cta")}
                <ArrowRight size={15} strokeWidth={2} />
              </span>
            </button>
          </div>
          {error && <div className="okr__newsletter-error">{error}</div>}
          {status === "error" && <div className="okr__newsletter-error">{t("newsletter_error")}</div>}
        </form>
      )}
    </div>
  );
}
