import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getServiceChildIcon } from "../../lib/serviceIcons";

const SERVICE_FOLDER_VISUALS = [
  {
    slug: "web-development",
    gradient: "linear-gradient(145deg, #72A7FF, #AFCBFF)",
    accent: "#AFCBFF",
  },
  {
    slug: "ui-ux-design",
    gradient: "linear-gradient(145deg, #C7B5FF, #EEE9FF)",
    accent: "#EEE9FF",
  },
  {
    slug: "search-optimization",
    gradient: "linear-gradient(145deg, #55C9B5, #A5E4D8)",
    accent: "#A5E4D8",
  },
  {
    slug: "ai-automation",
    gradient: "linear-gradient(145deg, #7357B5, #B397E8)",
    accent: "#B397E8",
  },
  {
    slug: "branding-marketing-selling",
    gradient: "linear-gradient(145deg, #E68FB5, #F4BDD3)",
    accent: "#F4BDD3",
  },
  {
    slug: "content-creative",
    gradient: "linear-gradient(145deg, #D6A56F, #F1D1A8)",
    accent: "#F1D1A8",
  },
];

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

function FolderPreviewCard({ service, index, total, isOpen }) {
  const midpoint = (total - 1) / 2;
  const normalized = midpoint === 0 ? 0 : (index - midpoint) / midpoint;
  const ServiceIcon = getServiceChildIcon(index, service.parent_slug, service.slug);
  const transform = {
    "--folder-card-x": `${normalized * 85}px`,
    "--folder-card-y": `${Math.abs(normalized) * 12}px`,
    "--folder-card-rotate": `${normalized * 25}deg`,
    "--folder-card-delay": `${index * 50}ms`,
    "--folder-card-z": index + 1,
  };

  return (
    <Link
      className="service-folder-preview"
      style={transform}
      to={`/services/${service.slug}`}
      aria-label={service.name}
      title={service.name}
      tabIndex={isOpen ? 0 : -1}
      aria-hidden={!isOpen}
      onClick={(event) => event.stopPropagation()}
    >
      <span className="service-folder-preview-inner">
        <span className="service-folder-preview-icon" aria-hidden="true">
          <ServiceIcon size={30} strokeWidth={1.8} />
        </span>
        <span className="service-folder-preview-title">{service.name}</span>
      </span>
    </Link>
  );
}

function ServiceFolder({ folder, visual, isOpen, onOpen, onClose, onToggle, lang }) {
  const articleRef = useRef(null);
  const previewServices = folder.services.slice(0, 5);
  const previewId = `service-folder-preview-${folder.slug}`;
  const serviceCount = folder.service_count ?? folder.services.length;
  const serviceUnit = lang === "id" ? "layanan" : "services";

  function handleBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) onClose();
  }

  return (
    <article
      ref={articleRef}
      className={`service-folder-card${isOpen ? " is-open" : ""}`}
      style={{
        "--folder-gradient": visual.gradient,
        "--folder-glow": visual.accent,
      }}
      onMouseEnter={() => {
        if (window.matchMedia("(hover: hover)").matches) onOpen();
      }}
      onMouseLeave={() => {
        if (window.matchMedia("(hover: hover)").matches) onClose();
      }}
      onFocus={(event) => {
        if (event.target.matches(":focus-visible")) onOpen();
      }}
      onBlur={handleBlur}
    >
      <span className="service-folder-card-glow" aria-hidden="true" />

      <button
        className="service-folder-trigger"
        type="button"
        aria-expanded={isOpen}
        aria-controls={previewId}
        aria-label={`${isOpen ? (lang === "id" ? "Tutup" : "Close") : (lang === "id" ? "Buka" : "Open")} ${folder.name}`}
        onClick={onToggle}
      />

      <div className="service-folder-stage">
        <span className="service-folder-back" aria-hidden="true" />
        <span className="service-folder-tab" aria-hidden="true" />

        <span
          className="service-folder-preview-stack"
          id={previewId}
          role="group"
          aria-label={lang === "id" ? `Pratinjau ${folder.name}` : `${folder.name} previews`}
          aria-hidden={!isOpen}
        >
          {previewServices.map((service, index) => (
            <FolderPreviewCard
              key={service.slug}
              service={service}
              index={index}
              total={previewServices.length}
              isOpen={isOpen}
            />
          ))}
        </span>

        <span className="service-folder-front" aria-hidden="true" />
        <span className="service-folder-front-shine" aria-hidden="true" />
      </div>

      <div className="service-folder-meta">
        <h3>{folder.name}</h3>
        <Link
          className="service-folder-all-link"
          to={`/services/${folder.slug}`}
          aria-label={lang === "id"
            ? `Lihat semua ${serviceCount} layanan ${folder.name}`
            : `View all ${serviceCount} ${folder.name} services`}
          onClick={(event) => event.stopPropagation()}
        >
          {serviceCount} {serviceUnit}
        </Link>
      </div>

      <span className="service-folder-hint" aria-hidden="true">
        <span className="service-folder-hint-tap">{lang === "id" ? "Sentuh" : "Tap"}</span>
      </span>
    </article>
  );
}

export function ServiceFolderGrid({ items, lang = "en" }) {
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

    return SERVICE_FOLDER_VISUALS.map((visual) => {
      const category = categories.get(visual.slug);
      if (!category) return null;
      const services = (servicesByParent.get(visual.slug) || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      return { ...category, services, visual };
    }).filter(Boolean);
  }, [items]);

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
    ? "Katalog interaktif layanan digital. Sentuh folder untuk melihat layanan di dalamnya."
    : "An interactive catalog of digital services. Hover over folders to reveal what is inside.";

  return (
    <div className="service-folder-catalog" ref={rootRef}>
      <header className="service-folder-heading">
        <h2 aria-label={`${headingLead} ${headingAccent}`}>
          <span aria-hidden="true"><TouchText text={headingLead} keyPrefix="services-heading-lead" /></span>{" "}
          <em aria-hidden="true"><TouchText text={headingAccent} keyPrefix="services-heading-accent" /></em>
        </h2>
        <p aria-label={description}>
          <span aria-hidden="true"><TouchText text={description} keyPrefix="services-description" /></span>
        </p>
      </header>

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
