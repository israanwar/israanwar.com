import { useI18n } from "../../lib/i18n";

export function LangThemeSwitcher() {
  const { lang, toggle } = useI18n();
  const code = lang === "id" ? "ID" : "EN";
  const hint = lang === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia";
  return (
    <button
      className="okr__lang-toggle"
      type="button"
      onClick={toggle}
      title={hint}
      // The accessible name starts with the visible label (WCAG 2.5.3).
      aria-label={`${code}: ${hint}`}
    >
      {code}
    </button>
  );
}
