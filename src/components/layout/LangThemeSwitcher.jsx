import { useI18n } from "../../lib/i18n";

export function LangThemeSwitcher() {
  const { lang, toggle } = useI18n();
  return (
    <button
      className="okr__lang-toggle"
      type="button"
      onClick={toggle}
      title={lang === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
      aria-label="Toggle language"
    >
      {lang === "id" ? "ID" : "EN"}
    </button>
  );
}
