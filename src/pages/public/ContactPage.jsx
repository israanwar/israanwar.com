import { useState } from "react";
import { Mail, MessageCircle, MapPin, Clock, Check } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { AnimatedHeadline } from "../../components/ui/AnimatedHeadline";
import { contactsData } from "../../lib/supabaseData";
import { useLivePage, useLiveSettings } from "../../hooks/usePageData";
import { useI18n } from "../../lib/i18n";
import { localizePage } from "../../lib/pageI18n";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactPage() {
  const { lang, t } = useI18n();
  const rawPage = useLivePage("contact");
  const p = localizePage(rawPage, lang);
  const settings = useLiveSettings();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); if (errors[k]) setErrors((e) => ({ ...e, [k]: null })); }

  function validate() {
    const e = {};
    if (form.name.trim().length < 2) e.name = t("err_min_chars", { n: 2 });
    if (!EMAIL_RE.test(form.email)) e.email = t("err_invalid_email");
    if (form.message.trim().length < 10) e.message = t("err_min_chars", { n: 10 });
    setErrors(e); return Object.keys(e).length === 0;
  }

  async function submit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    setBusy(true);
    await contactsData.create({ ...form });
    setStatus("success");
    setBusy(false);
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  }

  return (
    <>
      <Seo title={`${t("nav_contact")} — israanwar`} description={p.hero_subtitle} />
              <section className="okr__section okr__page-hero">
          <div className="okr__wrap">
            {p.hero_kicker && <span className="okr__kicker">{p.hero_kicker}</span>}
            <AnimatedHeadline text={p.hero_title} className="okr__h2" highlightLast={1} style={{ marginTop: 20 }} />
            {p.hero_subtitle && (
              <p style={{ color: "var(--okr-muted)", fontSize: 18, lineHeight: 1.6, marginTop: 24, maxWidth: 640 }}>
                {p.hero_subtitle}
              </p>
            )}

            <div className="okr__contact-grid" style={{ marginTop: 56 }}>
              <form onSubmit={submit} className="okr__panel">
                <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>{t("contact_send")}</h3>

                {status === "success" && (
                  <div style={{
                    padding: 14, borderRadius: 10, background: "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.3)", color: "#86efac",
                    fontSize: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <Check size={16} /> {t("contact_success")}
                  </div>
                )}

                <div className="okr__field-2col">
                  <div className="okr__field">
                    <label className="okr__label">{t("contact_name")} *</label>
                    <input className={`okr__input${errors.name ? " has-error" : ""}`}
                      required value={form.name} onChange={(e) => set("name", e.target.value)} />
                    {errors.name && <div className="okr__field-error">{errors.name}</div>}
                  </div>
                  <div className="okr__field">
                    <label className="okr__label">{t("contact_email")} *</label>
                    <input type="email" className={`okr__input${errors.email ? " has-error" : ""}`}
                      required value={form.email} onChange={(e) => set("email", e.target.value)} />
                    {errors.email && <div className="okr__field-error">{errors.email}</div>}
                  </div>
                </div>
                <div className="okr__field-2col">
                  <div className="okr__field">
                    <label className="okr__label">{t("contact_phone")}</label>
                    <input className="okr__input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                  <div className="okr__field">
                    <label className="okr__label">{t("contact_subject")}</label>
                    <input className="okr__input" value={form.subject} onChange={(e) => set("subject", e.target.value)}
                      placeholder={t("contact_subject_ph")} />
                  </div>
                </div>
                <div className="okr__field">
                  <label className="okr__label">{t("contact_message")} *</label>
                  <textarea className={`okr__input${errors.message ? " has-error" : ""}`}
                    rows={6} required value={form.message} onChange={(e) => set("message", e.target.value)} />
                  {errors.message && <div className="okr__field-error">{errors.message}</div>}
                </div>
                <button className="okr__btn okr__btn--primary" type="submit" disabled={busy}
                  style={{ width: "100%", justifyContent: "center" }}>
                  {busy ? t("contact_sending") : t("contact_send")}
                </button>
              </form>

              <div className="okr__panel">
                <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>{t("contact_info")}</h3>
                <div style={{ display: "grid", gap: 18, fontSize: 15 }}>
                  {settings.email && (
                    <InfoRow icon={Mail} label={t("contact_label_email")}>
                      <a href={`mailto:${settings.email}`} style={{ color: "var(--okr-text)" }}>{settings.email}</a>
                    </InfoRow>
                  )}
                  {settings.whatsapp_number && (
                    <InfoRow icon={MessageCircle} label={t("contact_label_wa")}>
                      <a href={settings.whatsapp_url} target="_blank" rel="noreferrer" style={{ color: "var(--okr-text)" }}>{settings.whatsapp_number}</a>
                    </InfoRow>
                  )}
                  {p.address && <InfoRow icon={MapPin} label={t("contact_label_loc")}>{p.address}</InfoRow>}
                  {p.hours && <InfoRow icon={Clock} label={t("contact_label_hours")}>{p.hours}</InfoRow>}
                </div>
                {p.response_time && (
                  <div style={{
                    marginTop: 24, padding: 14, borderRadius: 10,
                    background: "rgba(86, 99, 111, 0.08)", border: "1px solid rgba(86, 99, 111, 0.25)",
                    fontSize: 13, color: "var(--okr-muted)",
                  }}>
                    ⏱ {p.response_time}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
    </>
  );
}

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <Icon size={20} style={{ color: "var(--okr-primary-2)", flexShrink: 0, marginTop: 2 }} />
      <div>
        <div style={{ color: "var(--okr-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}
