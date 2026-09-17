import { useEffect } from "react";
import { X } from "lucide-react";

// Same-site preview stays inside the admin workspace. Sandbox prevents the
// previewed page from opening a new tab or navigating the top-level admin UI.
export function AdminPreviewModal({ path, title = "Preview situs", onClose }) {
  useEffect(() => {
    function onKeyDown(event) { if (event.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function keepPreviewOnSite(event) {
    const doc = event.currentTarget.contentDocument;
    doc?.addEventListener("click", (click) => {
      const anchor = click.target?.closest?.("a[href]");
      if (!anchor) return;
      try {
        if (new URL(anchor.href, window.location.origin).origin !== window.location.origin) click.preventDefault();
      } catch { click.preventDefault(); }
    }, true);
  }

  return (
    <div className="wpx__preview-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="wpx__preview-dialog" role="dialog" aria-modal="true" aria-label={title}>
        <header className="wpx__preview-header">
          <strong>{title}</strong>
          <span>{path}</span>
          <button type="button" className="wpx__btn wpx__btn--secondary" onClick={onClose} aria-label="Tutup preview"><X size={16} /></button>
        </header>
        <iframe src={path} title={title} sandbox="allow-same-origin allow-scripts" onLoad={keepPreviewOnSite} />
      </section>
    </div>
  );
}
