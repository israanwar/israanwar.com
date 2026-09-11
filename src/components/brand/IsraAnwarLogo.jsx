import "./IsraAnwarLogo.css";

const IA_MARK_SRC = "/assets/brand/israanwar-mark-ia-v2.png";

export function IsraAnwarMark({ className = "", title = "Isra Anwar", decorative = false }) {
  return (
    <img
      className={`okr-mark ${className}`.trim()}
      src={IA_MARK_SRC}
      alt={decorative ? "" : `${title} mark`}
      aria-hidden={decorative ? "true" : undefined}
      draggable="false"
    />
  );
}

export function IsraAnwarLogo({ name = "Isra Anwar", className = "" }) {
  return (
    <span className={`okr-logo ${className}`.trim()} aria-label={name} role="img">
      <img className="okr-logo__mark-image" src={IA_MARK_SRC} alt="" aria-hidden="true" draggable="false" />
      <span className="okr-logo__wordmark" aria-hidden="true">Isra Anwar</span>
    </span>
  );
}
