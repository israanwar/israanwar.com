import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getServiceChildIcon } from "../../lib/serviceIcons";

import { SERVICE_FOLDER_VISUALS } from "../../data/serviceFolderVisuals";
import { ServiceFolderArtwork } from "./ServiceFolderArtwork";

function TouchText({ text, keyPrefix }) {
  return String(text ?? "").split(/(\s+)/).map((chunk, wordIndex) => {
    if (!chunk || /^\s+$/.test(chunk)) return chunk;

    return (
      <span className="okr__word-touch" key={`${keyPrefix}-word-${wordIndex}`}>
        {Array.from(chunk).map((character, characterIndex) => (
          <span
            className="okr__letter-touch"
            key={`${keyPrefix}-word-${wordIndex}-character-${characterIndex}`}
          >
            {character}
          </span>
        ))}
      </span>
    );
  });
}

function ServiceFolder({ folder, visual, isOpen, onOpen, onClose, onToggle, lang }) {
  const serviceCount = folder.service_count ?? folder.services.length;
  const previewId = `service-folder-preview-${folder.slug}`;
  return (
    <article
      className={`service-folder-card${isOpen ? " is-open" : ""}`}
      style={{ "--folder-gradient": visual.gradient, "--folder-glow": visual.accent }}
      onPointerEnter={(event) => { if (event.pointerType === "mouse") onOpen(); }}
      onPointerLeave={(event) => { if (event.pointerType === "mouse") onClose(); }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) onClose(); }}
    >
      <span className="service-folder-card-glow" aria-hidden="true" />
      <Link
        className="service-folder-trigger"
        to={`/services/${folder.slug}`}
        aria-label={lang === "id" ? `Lihat ${serviceCount} layanan ${folder.name}` : `View ${serviceCount} ${folder.name} services`}
      />
      <button
        type="button"
        className="service-folder-preview-toggle"
        aria-expanded={isOpen}
        aria-controls={previewId}
        aria-label={lang === "id" ? `Pratinjau layanan ${folder.name}` : `Preview ${folder.name} services`}
        onClick={onToggle}
      >{isOpen ? "−" : "+"}</button>
      <ServiceFolderArtwork />
      {isOpen && (
        <nav className="service-folder-readable-list" id={previewId} aria-label={folder.name}>
          {folder.services.map((service, index) => {
            const Icon = getServiceChildIcon(index, service.parent_slug, service.slug);
            return (
              <Link key={service.slug} to={`/services/${service.slug}`}>
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                <span>{service.name}</span>
              </Link>
            );
          })}
        </nav>
      )}
      <div className="service-folder-meta">
        <h3>{folder.name}</h3>
        <Link className="service-folder-all-link" to={`/services/${folder.slug}`}>
          {serviceCount} {lang === "id" ? "layanan" : "services"}
        </Link>
      </div>
    </article>
  );
}

export function ServiceFolderGrid({ items, lang = "en", includeAll = false, showHeading = true }) {
  const rootRef = useRef(null);
  const [openSlug, setOpenSlug] = useState(null);
  const folders = useMemo(() => {
    const categories = new Map(items.filter((item) => item.kind === "category").map((item) => [item.slug, item]));
    const servicesByParent = items
      .filter((item) => item.kind === "service")
      .reduce((result, service) => {
        const existing = result.get(service.parent_slug) || [];
        existing.push(service);
        result.set(service.parent_slug, existing);
        return result;
      }, new Map());

    const visuals = includeAll ? SERVICE_FOLDER_VISUALS : SERVICE_FOLDER_VISUALS.slice(0, 6);
    return visuals.map((visual) => {
      const category = categories.get(visual.slug);
      if (!category) return null;
      const services = (servicesByParent.get(visual.slug) || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      return { ...category, services, visual };
    }).filter(Boolean);
  }, [items, includeAll]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpenSlug(null);
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") setOpenSlug(null);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!folders.length) return null;

  const headingLead = lang === "id" ? "Layanan" : "Our";
  const headingAccent = lang === "id" ? "Kami" : "Services";
  const description = lang === "id"
    ? "Pilih kategori untuk melihat semua layanan. Gunakan tombol + untuk pratinjau."
    : "Choose a category to explore all services. Use + to preview what is inside.";

  return (
    <div className="service-folder-catalog" ref={rootRef}>
      {showHeading && <header className="service-folder-heading">
        <h2 aria-label={`${headingLead} ${headingAccent}`}>
          <span aria-hidden="true"><TouchText text={headingLead} keyPrefix="services-heading-lead" /></span>{" "}
          <em aria-hidden="true"><TouchText text={headingAccent} keyPrefix="services-heading-accent" /></em>
        </h2>
        <p aria-label={description}>
          <span aria-hidden="true"><TouchText text={description} keyPrefix="services-description" /></span>
        </p>
      </header>}

      <div className="service-folder-grid">
        {folders.map((folder) => (
          <ServiceFolder
            key={folder.slug}
            folder={folder}
            visual={folder.visual}
            isOpen={openSlug === folder.slug}
            onOpen={() => setOpenSlug(folder.slug)}
            onClose={() => setOpenSlug((current) => (current === folder.slug ? null : current))}
            onToggle={() => setOpenSlug((current) => (current === folder.slug ? null : folder.slug))}
            lang={lang}
          />
        ))}
      </div>
    </div>
  );
}
