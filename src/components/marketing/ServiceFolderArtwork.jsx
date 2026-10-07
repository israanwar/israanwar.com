// Shared folder geometry for Home, the category catalog, and individual services.
export function ServiceFolderArtwork({ children }) {
  return (
    <div className="service-folder-stage">
      <span className="service-folder-back" aria-hidden="true" />
      <span className="service-folder-tab" aria-hidden="true" />
      {children}
      <span className="service-folder-front" aria-hidden="true" />
      <span className="service-folder-front-shine" aria-hidden="true" />
    </div>
  );
}
