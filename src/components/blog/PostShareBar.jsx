import { useState } from "react";
import "./PostShareBar.css";
import { site } from "../../data/site";
import { getBlogShareUrl } from "../../lib/socialMeta";

const COPY = {
  id: {
    eyebrow: "Sebarkan ide ini",
    title: "Bagikan artikel ini.",
    description: "Satu klik langsung ke platform pilihan Anda.",
    copied: "Tautan artikel disalin.",
    instagram: "Tautan disalin. Buka Instagram lalu tempelkan pada Story, DM, atau bio.",
    copy: "Salin tautan",
    copiedLabel: "Tersalin",
  },
  en: {
    eyebrow: "Pass the idea on",
    title: "Share this article.",
    description: "One click takes you directly to your chosen platform.",
    copied: "Article link copied.",
    instagram: "Link copied. Open Instagram and paste it into a Story, DM, or bio.",
    copy: "Copy link",
    copiedLabel: "Copied",
  },
};

function SocialLogo({ network }) {
  const common = { viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" };

  switch (network) {
    case "whatsapp":
      return <svg {...common}><path d="M12.04 2.2a9.8 9.8 0 0 0-8.34 14.96L2.2 21.8l4.77-1.47A9.8 9.8 0 1 0 12.04 2.2Zm0 17.84a8.03 8.03 0 0 1-4.09-1.12l-.29-.17-2.83.87.92-2.73-.19-.29a8.04 8.04 0 1 1 6.54 3.64Zm4.41-6.03c-.24-.12-1.42-.7-1.64-.77-.22-.08-.38-.12-.54.12-.16.23-.62.77-.76.93-.14.16-.28.18-.52.06a6.55 6.55 0 0 1-1.92-1.18 7.23 7.23 0 0 1-1.34-1.67c-.14-.24 0-.37.11-.49.11-.11.24-.28.35-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.46-.4-.4-.54-.4h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.65.57.25 1.02.4 1.37.51.57.18 1.09.15 1.5.09.46-.07 1.42-.58 1.62-1.15.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" /></svg>;
    case "facebook":
      return <svg {...common}><path d="M13.8 21v-8h2.7l.4-3.12h-3.1V7.9c0-.9.25-1.52 1.57-1.52H17V3.6c-.28-.04-1.22-.12-2.32-.12-2.3 0-3.87 1.4-3.87 3.98v2.42H8.2V13h2.61v8h2.99Z" /></svg>;
    case "linkedin":
      return <svg {...common}><path d="M5.13 8.18A1.83 1.83 0 1 0 5.13 4.5a1.83 1.83 0 0 0 0 3.68ZM3.56 9.62h3.15v10.12H3.56V9.62Zm5.12 0h3.02V11h.04c.42-.8 1.45-1.65 2.98-1.65 3.19 0 3.78 2.1 3.78 4.83v5.56h-3.15v-4.93c0-1.18-.02-2.69-1.64-2.69-1.64 0-1.9 1.28-1.9 2.61v5.01H8.68V9.62Z" /></svg>;
    case "x":
      return <svg {...common}><path d="M18.24 2.25h3.31l-7.23 8.26 8.51 11.24h-6.66l-5.22-6.82-5.96 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" /></svg>;
    case "telegram":
      return <svg {...common}><path d="m21.4 3.1-3.02 17.06c-.23 1.2-.83 1.5-1.67.94l-4.61-3.4-2.23 2.15c-.25.25-.46.46-.94.46l.33-4.7 8.56-7.73c.37-.33-.08-.52-.58-.19L6.66 14.35 2.1 12.92c-.99-.31-1.01-.99.21-1.47L20.14 4.57c.83-.31 1.56.19 1.26 1.47Z" /></svg>;
    case "instagram":
      return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.35" cy="6.65" r="1.05" /></svg>;
    case "pinterest":
      return <svg {...common}><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0Z" /></svg>;
    case "email":
      return <svg {...common}><path d="M3.4 5.35h17.2v13.3H3.4V5.35Zm1.52 1.5 7.08 5.36 7.08-5.36H4.92Zm14.18 10.3V8.74L12 14.13 4.9 8.74v8.41h14.2Z" /></svg>;
    default:
      return <svg {...common}><path d="M9.6 14.4a3.5 3.5 0 0 0 4.95.05l3.2-3.2a3.5 3.5 0 0 0-4.95-4.95l-1.84 1.84 1.18 1.18 1.84-1.84a1.83 1.83 0 1 1 2.59 2.59l-3.2 3.2a1.83 1.83 0 0 1-2.59 0l-1.18 1.13Zm4.8-4.8a3.5 3.5 0 0 0-4.95-.05l-3.2 3.2a3.5 3.5 0 1 0 4.95 4.95l1.84-1.84-1.18-1.18-1.84 1.84a1.83 1.83 0 1 1-2.59-2.59l3.2-3.2a1.83 1.83 0 0 1 2.59 0l1.18-1.13Z" /></svg>;
  }
}

async function copyToClipboard(value) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Clipboard fallback failed");
}

export function PostShareBar({ post, canonicalPath, socialImage, lang = "en", compact = false }) {
  const [notice, setNotice] = useState("");
  const copy = COPY[lang] ?? COPY.en;
  const url = getBlogShareUrl(canonicalPath || `/blog/${post.slug}`);
  const title = post.title || site.name;
  const message = `${title} — ${site.name}`;
  const messageWithUrl = `${message}\n${url}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedMessage = encodeURIComponent(message);
  const encodedImageUrl = socialImage
    ? encodeURIComponent(new URL(socialImage, site.url).toString())
    : "";

  const links = [
    { id: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(messageWithUrl)}` },
    { id: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { id: "linkedin", label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { id: "x", label: "X", href: `https://x.com/intent/post?text=${encodedMessage}&url=${encodedUrl}` },
    { id: "telegram", label: "Telegram", href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}` },
    {
      id: "pinterest",
      label: "Pinterest",
      href: `https://www.pinterest.com/pin/create/button/?url=${encodedUrl}${encodedImageUrl ? `&media=${encodedImageUrl}` : ""}&description=${encodedMessage}`,
    },
    { id: "email", label: "Email", href: `mailto:?subject=${encodedMessage}&body=${encodeURIComponent(messageWithUrl)}`, mail: true },
  ];

  async function handleCopy(successMessage = copy.copied) {
    try {
      await copyToClipboard(url);
      setNotice(successMessage);
    } catch {
      setNotice(lang === "id" ? "Tautan tidak dapat disalin. Salin URL dari browser." : "The link could not be copied. Copy the URL from your browser.");
    }
  }

  async function handleInstagram() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }

    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    await handleCopy(copy.instagram);
  }

  return (
    <section className={`okr__post-share${compact ? " okr__post-share--compact" : ""}`} aria-labelledby="post-share-title">
      <div className="okr__post-share-intro">
        <p className="okr__post-share-eyebrow">// {copy.eyebrow}</p>
        <h2 id="post-share-title">{copy.title}</h2>
        <p>{copy.description}</p>
      </div>
      <ul className="okr__post-share-actions" aria-label={copy.title}>
        {links.map((item) => (
          <li key={item.id}>
            <a
              className={`okr__post-share-button okr__post-share-button--${item.id}`}
              href={item.href}
              target={item.mail ? undefined : "_blank"}
              rel={item.mail ? undefined : "noopener noreferrer"}
              aria-label={`${lang === "id" ? "Bagikan ke" : "Share on"} ${item.label}`}
              title={item.label}
            >
              <SocialLogo network={item.id} />
              <span>{item.label}</span>
            </a>
          </li>
        ))}
        <li>
          <button
            type="button"
            className="okr__post-share-button okr__post-share-button--instagram"
            onClick={handleInstagram}
            aria-label={lang === "id" ? "Bagikan melalui Instagram" : "Share through Instagram"}
            title="Instagram"
          >
            <SocialLogo network="instagram" />
            <span>Instagram</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            className={`okr__post-share-button okr__post-share-button--copy${notice ? " is-copied" : ""}`}
            onClick={() => handleCopy()}
            aria-label={lang === "id" ? "Salin tautan artikel" : "Copy article link"}
            title={copy.copy}
          >
            <SocialLogo network="copy" />
            <span>{notice ? copy.copiedLabel : copy.copy}</span>
          </button>
        </li>
      </ul>
      <p className="okr__post-share-notice" aria-live="polite">{notice}</p>
    </section>
  );
}
