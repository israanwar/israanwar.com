import { useEffect, useRef, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  MessageCircle, Github, Instagram, Linkedin, Mail, ShoppingBag, Menu, X,
  Home, Fingerprint, Compass, LayoutGrid, ShoppingCart, BookOpen, Wrench,
} from "lucide-react";
import { useLiveSettings, useLiveProductsExist, useLiveCart } from "../../hooks/usePageData";
import { useI18n } from "../../lib/i18n";
import { localizeSiteDescription } from "../../lib/pageI18n";
import { LangThemeSwitcher } from "./LangThemeSwitcher";
import { IsraAnwarMark } from "../brand/IsraAnwarLogo";
import { FooterParticles } from "./FooterParticles";
import { NewsletterForm } from "../marketing/NewsletterForm";
import { SiteChatWidget } from "../chat/SiteChatWidget";
import "../../styles/landing.css";
import "../../styles/light-theme.css";

// Aurora canvas gradient configs — pulled out of the component so they're
// stable object references. Only their (fixed) color stops are used to build
// actual gradient objects, which are cached per resize instead of rebuilt
// every animation frame — see `buildGradients()` in AuroraBackdrop.
const AURORA_RADIALS = [
  { x: 0.38, y: 0.1, r: 0.74, alpha: 0.9, stops: [
    [0, "rgba(132, 21, 72, 0.38)"],
    [0.48, "rgba(67, 18, 83, 0.16)"],
    [1, "rgba(67, 18, 83, 0)"],
  ] },
  { x: 0.16, y: 0.34, r: 0.58, alpha: 0.7, stops: [
    [0, "rgba(255, 139, 58, 0.14)"],
    [0.46, "rgba(180, 34, 54, 0.095)"],
    [1, "rgba(180, 34, 54, 0)"],
  ] },
  { x: 0.82, y: 0.08, r: 0.58, alpha: 0.75, stops: [
    [0, "rgba(67, 18, 83, 0.16)"],
    [0.54, "rgba(132, 21, 72, 0.07)"],
    [1, "rgba(132, 21, 72, 0)"],
  ] },
];

const AURORA_CURTAINS = [
  {
    base: 0.03, depth: 0.38, amplitude: 0.035, frequency: 1.1, phase: 0.08, drift: 0.62,
    alpha: 0.68, blur: 22,
    stops: [
      [0, "rgba(119, 125, 133, 0)"],
      [0.24, "rgba(119, 125, 133, 0.28)"],
      [0.48, "rgba(217, 219, 222, 0.52)"],
      [0.68, "rgba(86, 99, 111, 0.32)"],
      [1, "rgba(86, 99, 111, 0)"],
    ],
  },
  {
    base: 0.1, depth: 0.46, amplitude: 0.065, frequency: 1.56, phase: 0.46, drift: -0.48,
    alpha: 0.52, blur: 32,
    stops: [
      [0, "rgba(48, 54, 61, 0)"],
      [0.22, "rgba(48, 54, 61, 0.12)"],
      [0.42, "rgba(119, 125, 133, 0.28)"],
      [0.62, "rgba(86, 99, 111, 0.25)"],
      [1, "rgba(86, 99, 111, 0)"],
    ],
  },
  {
    base: 0.28, depth: 0.4, amplitude: 0.08, frequency: 1.28, phase: 0.72, drift: 0.34,
    alpha: 0.3, blur: 42,
    stops: [
      [0, "rgba(119, 125, 133, 0)"],
      [0.34, "rgba(86, 99, 111, 0.16)"],
      [0.58, "rgba(119, 125, 133, 0.15)"],
      [1, "rgba(48, 54, 61, 0)"],
    ],
  },
];

const AURORA_FILAMENTS = [
  {
    base: 0.08, amplitude: 0.045, frequency: 1.2, phase: 0.22, drift: 0.64,
    width: 0.034, alpha: 0.3, blur: 16,
    stops: [
      [0, "rgba(217, 219, 222, 0)"],
      [0.24, "rgba(217, 219, 222, 0.24)"],
      [0.5, "rgba(217, 219, 222, 0.42)"],
      [0.76, "rgba(119, 125, 133, 0.18)"],
      [1, "rgba(119, 125, 133, 0)"],
    ],
  },
  {
    base: 0.22, amplitude: 0.07, frequency: 1.62, phase: 0.58, drift: -0.5,
    width: 0.045, alpha: 0.15, blur: 20,
    stops: [
      [0, "rgba(86, 99, 111, 0)"],
      [0.22, "rgba(86, 99, 111, 0.16)"],
      [0.48, "rgba(119, 125, 133, 0.22)"],
      [0.72, "rgba(217, 219, 222, 0.1)"],
      [1, "rgba(119, 125, 133, 0)"],
    ],
  },
];

export function BrandMark() {
  return <IsraAnwarMark className="okr__brand-mark" title="israanwar" />;
}

export function SiteHeader({ settings }) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const cart = useLiveCart();
  const hasProducts = useLiveProductsExist();
  const cartCount = cart.rows.reduce((s, r) => s + r.qty, 0);

  const nav = [
    { label: t("nav_home"), to: "/", route: true, icon: Home },
    { label: t("nav_about"), to: "/about", route: true, icon: Fingerprint },
    { label: t("nav_services"), to: "/services", route: true, icon: Compass },
    { label: t("nav_portfolio"), to: "/portfolio", route: true, icon: LayoutGrid },
    { label: t("nav_tools"), to: "/tools", route: true, icon: Wrench },
    ...(hasProducts ? [{ label: t("nav_store"), to: "/store", route: true, icon: ShoppingCart }] : []),
    { label: t("nav_blog"), to: "/blog", route: true, icon: BookOpen },
    { label: t("nav_contact"), to: "/contact", route: true, icon: Mail },
  ];

  useEffect(() => {
    // Toggle a class on the `.okr` shell so CSS can lock scroll while the
    // full-viewport mobile menu is open.
    const shell = document.querySelector(".okr");
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    if (menuOpen) {
      shell?.classList.add("is-menu-open");
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      shell?.classList.remove("is-menu-open");
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    }

    return () => {
      shell?.classList.remove("is-menu-open");
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    function onResize() {
      if (window.innerWidth > 900) setMenuOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [menuOpen]);

  return (
    <>
      <header className="okr__header">
        <div className="okr__wrap okr__nav">
          <Link className="okr__brand" to="/" onClick={() => setMenuOpen(false)}>
            <span className="okr__logo-badge">
              <IsraAnwarMark decorative markSrc="/assets/brand/israanwar-mark-ia-v2-mono.png" />
            </span>
            <span className="okr__brand-wordmark">{settings.site_name || "Isra Anwar"}</span>
          </Link>
          <nav className="okr__navlinks" aria-label="Primary">
            {nav.map((item) => (
              item.dropdown ? (
                <div key={item.label} className="okr__navlink-group">
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) => `okr__navlink${isActive ? " is-active" : ""}`}
                  >
                    {item.label}
                  </NavLink>
                  <div className="okr__navlink-dropdown" role="menu">
                    {item.dropdown.map((sub) => {
                      const SubIcon = sub.icon;
                      return (
                        <a key={sub.to} href={sub.to} role="menuitem" className="okr__navlink-dropdown-item">
                          <span className="okr__navlink-dropdown-icon" aria-hidden="true">
                            <SubIcon size={18} strokeWidth={1.75} />
                          </span>
                          {sub.label}
                        </a>
                      );
                    })}
                  </div>
                </div>
              ) : item.route ? (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) => `okr__navlink${isActive ? " is-active" : ""}`}
                >
                  {item.label}
                </NavLink>
              ) : (
                <a key={item.label} href={item.to} className="okr__navlink">
                  {item.label}
                </a>
              )
            ))}
          </nav>
          <div className="okr__nav-actions">
            <LangThemeSwitcher />
            {hasProducts && (
              <Link to="/cart" className="okr__cart-link" aria-label={t("cart_aria")}>
                <ShoppingBag size={18} />
                {cartCount > 0 && (
                  <span className="okr__cart-count">{cartCount}</span>
                )}
              </Link>
            )}
            <button
              className="okr__mobile-menu-btn"
              type="button"
              aria-label={menuOpen ? t("nav_close_menu") : t("nav_open_menu")}
              aria-expanded={menuOpen}
              aria-controls="okr-mobile-nav"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </header>
      {/* Mobile menu is a SIBLING of <header>, not a child. `.okr__header` has
          `contain: layout` + `transform: translate3d(...)`, both of which turn
          the header into a containing block for `position: fixed` descendants —
          which would clip the menu to the 60px header box. Rendering here keeps
          the menu positioned against the viewport. */}
      <div className={`okr__mobile-menu${menuOpen ? " is-open" : ""}`} id="okr-mobile-nav">
        <button
          className="okr__mobile-menu-close"
          type="button"
          aria-label={t("nav_close_menu")}
          onClick={() => setMenuOpen(false)}
        >
          <X size={30} strokeWidth={2.2} />
        </button>
        <div className="okr__mobile-menu-content">
          <span className="okr__mobile-menu-kicker">INDEX</span>
          <nav className="okr__mobile-menu-panel" aria-label="Mobile primary">
            {nav.map((item) => {
              const Icon = item.icon;
              return item.route ? (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) => `okr__mobile-navlink${isActive ? " is-active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon size={30} strokeWidth={1.9} aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              ) : (
                <a key={item.label} href={item.to} className="okr__mobile-navlink" onClick={() => setMenuOpen(false)}>
                  <Icon size={30} strokeWidth={1.9} aria-hidden="true" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}

export function SiteFooter({ settings }) {
  const { lang, t } = useI18n();
  const description = localizeSiteDescription(settings.description, lang, settings.description_id) || t("site_description");
  return (
    <footer className="okr__footer">
      <FooterParticles />
      <div className="okr__wrap">
        <div className="okr__footer-card">
          <div className="okr__footer-grid">
            <div className="okr__footer-brand-col">
              <div className="okr__foot-brand">
                <span className="okr__logo-badge">
                  <IsraAnwarMark decorative markSrc="/assets/brand/israanwar-mark-ia-v2-mono.png" />
                </span>
                <span className="okr__brand-wordmark">{settings.site_name || "Isra Anwar"}</span>
              </div>
              <p className="okr__foot-desc">{description}</p>
              <div className="okr__foot-social">
                {settings.social_twitter && (
                  <a className="okr__foot-social-link" href={settings.social_twitter} target="_blank" rel="noreferrer" aria-label="X (Twitter)">
                    <X size={16} aria-hidden="true" />
                  </a>
                )}
                {settings.social_instagram && (
                  <a className="okr__foot-social-link" href={settings.social_instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                    <Instagram size={16} aria-hidden="true" />
                  </a>
                )}
                {settings.social_linkedin && (
                  <a className="okr__foot-social-link" href={settings.social_linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                    <Linkedin size={16} aria-hidden="true" />
                  </a>
                )}
                {settings.social_github && (
                  <a className="okr__foot-social-link" href={settings.social_github} target="_blank" rel="noreferrer" aria-label="GitHub">
                    <Github size={16} aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>

            <div className="okr__footer-col okr__footer-col--menu">
              <div className="okr__foot-title">{t("foot_menu")}</div>
              <ul className="okr__foot-list">
                <li><Link to="/">{t("nav_home")}</Link></li>
                <li><Link to="/about">{t("nav_about")}</Link></li>
                <li><Link to="/services">{t("nav_services")}</Link></li>
                <li><Link to="/portfolio">{t("nav_portfolio")}</Link></li>
                <li><Link to="/tools">{t("nav_tools")}</Link></li>
                <li><Link to="/store">{t("nav_store")}</Link></li>
                <li><Link to="/blog">{t("nav_blog")}</Link></li>
                <li><Link to="/contact">{t("nav_contact")}</Link></li>
              </ul>
            </div>

            <div className="okr__footer-col okr__footer-col--legal">
              <div className="okr__foot-title">{t("foot_legal")}</div>
              <ul className="okr__foot-list">
                <li><Link to="/privacy">{t("foot_privacy")}</Link></li>
                <li><Link to="/terms">{t("foot_terms")}</Link></li>
                <li><Link to="/sitemap">Sitemap</Link></li>
              </ul>
            </div>

            <div className="okr__footer-col okr__footer-col--contact">
              <div className="okr__foot-title">{t("foot_contact")}</div>
              <div className="okr__foot-contact">
                {settings.email && (
                  <a
                    className="okr__foot-contact-link"
                    href={`mailto:${settings.email}`}
                    aria-label={`${t("contact_label_email")} Isra Anwar`}
                    title={t("contact_label_email")}
                  >
                    <Mail size={17} aria-hidden="true" /> {t("contact_label_email")}
                  </a>
                )}
                {settings.whatsapp_number && (
                  <a className="okr__foot-contact-link" href={settings.whatsapp_url || `https://wa.me/${settings.whatsapp_number}`} target="_blank" rel="noreferrer">
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                )}
              </div>
            </div>

          </div>

          <div className="okr__footer-divider" role="presentation" />

          <div className="okr__foot-bottom">
            <span className="okr__foot-bottom-copy">© {new Date().getFullYear()} {settings.site_name || "Isra Anwar"}. {t("foot_rights")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function AuroraBackdrop() {
  const canvasRef = useRef(null);
  // The dark aurora backdrop belonged to the old dark theme. light-theme.css
  // now forces `.okr__aurora { display: none }` on every public route, so
  // this canvas is never visible — but without this gate it still ran a full
  // requestAnimationFrame gradient-draw loop on every desktop visit for
  // nothing. Hard-disabled rather than deleted, in case a future dark
  // surface wants it back.
  const renderCanvas = false;

  useEffect(() => {
    if (!renderCanvas) return undefined;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !ctx) return undefined;

    const state = {
      width: 0,
      height: 0,
      raf: 0,
      lastDraw: 0,
      scrollTimer: 0,
      scrolling: false,
      hidden: document.hidden,
      reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    };
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 0.82);
      state.width = Math.max(1, Math.ceil(window.innerWidth * dpr));
      state.height = Math.max(1, Math.ceil(window.innerHeight * dpr));
      canvas.width = state.width;
      canvas.height = state.height;
      buildGradients();
      draw(performance.now());
    }

    // Every gradient this canvas uses only depends on the current width/height
    // — none of their color stops move with time `t` (only the wave *paths*
    // painted with them do). Building them here once per resize instead of
    // once per animation frame avoids ~9 gradient allocations, 31 times a
    // second, for a pixel-identical result.
    function buildGradients() {
      const w = state.width;
      const h = state.height;

      state.baseGrad = (() => {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, "#111316");
        g.addColorStop(0.42, "#070809");
        g.addColorStop(1, "#000000");
        return g;
      })();

      state.veilGrad = (() => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(0.62, "rgba(0,0,0,0.22)");
        g.addColorStop(1, "rgba(0,0,0,0.92)");
        return g;
      })();

      state.radialGrads = AURORA_RADIALS.map((cfg) => {
        const g = ctx.createRadialGradient(w * cfg.x, h * cfg.y, 0, w * cfg.x, h * cfg.y, h * cfg.r);
        cfg.stops.forEach(([offset, color]) => g.addColorStop(offset, color));
        return g;
      });

      state.curtainFills = AURORA_CURTAINS.map((cfg) => {
        const topBase = cfg.base * h - cfg.depth * h * 0.18;
        const bottomBase = cfg.base * h + cfg.depth * h;
        const g = ctx.createLinearGradient(0, topBase, 0, bottomBase);
        cfg.stops.forEach(([offset, color]) => g.addColorStop(offset, color));
        return g;
      });

      state.filamentStrokes = AURORA_FILAMENTS.map((cfg) => {
        const g = ctx.createLinearGradient(-w * 0.12, 0, w * 1.12, 0);
        cfg.stops.forEach(([offset, color]) => g.addColorStop(offset, color));
        return g;
      });
    }

    function radial(gradient, alpha = 1) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = alpha;
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, state.width, state.height);
      ctx.restore();
    }

    function waveY(p, h, config, t, side = 1) {
      const primary = Math.sin((p * config.frequency + config.phase + t * config.drift) * Math.PI * 2);
      const secondary = Math.sin((p * config.frequency * 0.43 - config.phase * 1.6 + t * config.drift * -0.72) * Math.PI * 2);
      const tertiary = Math.sin((p * 2.7 + config.phase * 0.8 + t * 0.28 * side) * Math.PI * 2);
      return config.base * h + primary * config.amplitude * h + secondary * config.amplitude * h * 0.38 + tertiary * config.amplitude * h * 0.16;
    }

    function curtain(config, fill, t) {
      const w = state.width;
      const h = state.height;
      const xStart = -w * 0.18;
      const span = w * 1.36;
      const steps = 64;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = config.alpha;
      ctx.filter = `blur(${config.blur}px)`;
      ctx.fillStyle = fill;
      ctx.beginPath();

      for (let i = 0; i <= steps; i += 1) {
        const p = i / steps;
        const x = xStart + p * span;
        const y = waveY(p, h, config, t, 1);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      for (let i = steps; i >= 0; i -= 1) {
        const p = i / steps;
        const x = xStart + p * span;
        const y = waveY(p, h, config, t, -1)
          + config.depth * h
          + Math.sin((p * 1.9 + config.phase + t * config.drift * 0.42) * Math.PI * 2) * config.depth * h * 0.18;
        ctx.lineTo(x, y);
      }

      ctx.closePath();
      ctx.fill();
      ctx.filter = "none";
      ctx.restore();
    }

    function filament(config, stroke, t) {
      const w = state.width;
      const h = state.height;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = config.alpha;
      ctx.filter = `blur(${config.blur}px)`;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = config.width * h;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let i = 0; i <= 90; i += 1) {
        const p = i / 90;
        const x = -w * 0.12 + p * w * 1.24;
        const y = waveY(p, h, config, t, 1);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.filter = "none";
      ctx.restore();
    }

    function folds(t) {
      const w = state.width;
      const h = state.height;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.filter = `blur(${Math.max(10, h * 0.016)}px)`;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = 0; i < 7; i += 1) {
        const p = i / 6;
        const x = -w * 0.04 + p * w * 1.08 + Math.sin(t * (0.8 + i * 0.04) + i * 1.9) * w * 0.04;
        const top = h * (0.02 + Math.sin(i * 1.31 + t * 0.8) * 0.028);
        const bottom = h * (0.46 + Math.sin(i * 0.82 - t * 0.6) * 0.055);
        const stroke = ctx.createLinearGradient(0, top, 0, bottom);

        stroke.addColorStop(0, "rgba(217, 219, 222, 0)");
        stroke.addColorStop(0.2, "rgba(217, 219, 222, 0.08)");
        stroke.addColorStop(0.48, "rgba(119, 125, 133, 0.16)");
        stroke.addColorStop(0.72, "rgba(86, 99, 111, 0.11)");
        stroke.addColorStop(1, "rgba(86, 99, 111, 0)");

        ctx.globalAlpha = 0.2 + (i % 3) * 0.035;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = w * (0.038 + (i % 4) * 0.009);
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.bezierCurveTo(
          x + Math.sin(i * 1.7 + t) * w * 0.08,
          h * 0.16,
          x + Math.cos(i * 1.1 - t * 0.7) * w * 0.07,
          h * 0.32,
          x + Math.sin(i * 0.9 + t * 1.2) * w * 0.05,
          bottom,
        );
        ctx.stroke();
      }

      ctx.filter = "none";
      ctx.restore();
    }

    function draw(now) {
      const w = state.width;
      const h = state.height;
      if (!w || !h) return;
      if (state.raf && now - state.lastDraw < 32) {
        state.raf = window.requestAnimationFrame(draw);
        return;
      }
      state.lastDraw = now;

      const t = now * 0.00011;
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = state.baseGrad;
      ctx.fillRect(0, 0, w, h);

      AURORA_RADIALS.forEach((cfg, i) => radial(state.radialGrads[i], cfg.alpha));

      AURORA_CURTAINS.forEach((cfg, i) => curtain(cfg, state.curtainFills[i], t));

      folds(t);

      AURORA_FILAMENTS.forEach((cfg, i) => filament(cfg, state.filamentStrokes[i], t));

      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = state.veilGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      if (!state.reduceMotion && !state.hidden && !state.scrolling) {
        state.raf = window.requestAnimationFrame(draw);
      } else {
        state.raf = 0;
      }
    }

    function start() {
      if (!state.raf && !state.reduceMotion && !state.hidden && !state.scrolling) {
        state.raf = window.requestAnimationFrame(draw);
      }
    }

    function pauseForScroll() {
      state.scrolling = true;
      if (state.raf) {
        window.cancelAnimationFrame(state.raf);
        state.raf = 0;
      }
      window.clearTimeout(state.scrollTimer);
      state.scrollTimer = window.setTimeout(() => {
        state.scrolling = false;
        start();
      }, 180);
    }

    function onVisibility() {
      state.hidden = document.hidden;
      if (state.hidden && state.raf) {
        window.cancelAnimationFrame(state.raf);
        state.raf = 0;
      } else {
        start();
      }
    }

    function onMotionChange(event) {
      state.reduceMotion = event.matches;
      if (state.reduceMotion && state.raf) {
        window.cancelAnimationFrame(state.raf);
        state.raf = 0;
      } else {
        start();
      }
    }

    resize();
    start();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", pauseForScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      if (state.raf) window.cancelAnimationFrame(state.raf);
      window.clearTimeout(state.scrollTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", pauseForScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, [renderCanvas]);

  return (
    <div className="okr__aurora" aria-hidden="true">
      {renderCanvas && <canvas className="okr__aurora-canvas" ref={canvasRef} />}
      <span className="okr__aurora-grain" />
    </div>
  );
}

function NewsletterBand() {
  return (
    <div className="okr__newsletter-band">
      <div className="okr__wrap">
        <NewsletterForm source="footer" variant="band" />
      </div>
    </div>
  );
}

export function SiteChrome({ children, settings: providedSettings }) {
  // Selalu baca live settings — override kalau parent kasih.
  const liveSettings = useLiveSettings();
  const settings = providedSettings ?? liveSettings;
  return (
    <div className="okr">
      <SiteHeader settings={settings} />
      {children}
      <NewsletterBand />
      <SiteFooter settings={settings} />
      <SiteChatWidget />
    </div>
  );
}
