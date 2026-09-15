import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bold, Check, Download, FileSpreadsheet, FileText, ImagePlus, Italic, Monitor,
  Palette, Plus, RotateCcw, SlidersHorizontal, Smartphone, StickyNote, Tablet,
  Trash2, X,
} from "lucide-react";
import {
  exportInvoiceCsv, exportInvoiceExcel, exportInvoiceWord, paginateInvoiceItems,
} from "../../lib/invoiceExport";
import "./InvoiceBuilderWorkspace.css";

const STORAGE_KEY = "israanwar.invoice-builder.v1";
const ITEMS_PER_PAGE = 8;

const CURRENCIES = [
  { code: "IDR", locale: "id-ID", label: "Indonesian Rupiah (IDR)" },
  { code: "USD", locale: "en-US", label: "US Dollar (USD)" },
  { code: "SGD", locale: "en-SG", label: "Singapore Dollar (SGD)" },
  { code: "EUR", locale: "de-DE", label: "Euro (EUR)" },
  { code: "GBP", locale: "en-GB", label: "British Pound (GBP)" },
  { code: "MYR", locale: "ms-MY", label: "Malaysian Ringgit (MYR)" },
];

const THEMES = [
  { id: "terracotta", name: "Terracotta", ink: "#1b1817", accent: "#e94f25", soft: "#f7eee9" },
  { id: "midnight", name: "Midnight", ink: "#111827", accent: "#315b8a", soft: "#eef2f7" },
  { id: "forest", name: "Forest", ink: "#183129", accent: "#35735b", soft: "#e7f1ec" },
  { id: "plum", name: "Plum", ink: "#30213b", accent: "#80558c", soft: "#f1eaf3" },
  { id: "graphite", name: "Graphite", ink: "#1d1e21", accent: "#555b66", soft: "#eceef1" },
];

const DEFAULT_CUSTOM_THEME = { ink: "#111827", accent: "#3b82f6", soft: "#eef2ff" };
const FONT_FAMILIES = [
  { id: "system", name: "System Sans", stack: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
  { id: "jakarta", name: "Modern Sans", stack: '"Plus Jakarta Sans", system-ui, sans-serif' },
  {
    id: "cormorant", name: "Elegant Serif", stack: '"Cormorant Garamond", Georgia, serif',
    loadCss: [
      () => import("@fontsource/cormorant-garamond/400.css"),
      () => import("@fontsource/cormorant-garamond/500.css"),
      () => import("@fontsource/cormorant-garamond/600.css"),
      () => import("@fontsource/cormorant-garamond/700.css"),
      () => import("@fontsource/cormorant-garamond/400-italic.css"),
      () => import("@fontsource/cormorant-garamond/700-italic.css"),
    ],
  },
  { id: "georgia", name: "Classic Serif", stack: 'Georgia, "Times New Roman", serif' },
  { id: "mono", name: "Ledger Mono", stack: '"Courier New", ui-monospace, monospace' },
];
const FONT_SIZES = [
  { id: "compact", name: "Compact", scale: 0.88 },
  { id: "standard", name: "Standard", scale: 1 },
  { id: "large", name: "Large", scale: 1.18 },
];
const TABS = [
  { id: "details", label: "Details", icon: FileText },
  { id: "items", label: "Items", icon: SlidersHorizontal },
  { id: "design", label: "Design", icon: Palette },
  { id: "notes", label: "Notes", icon: StickyNote },
];

function today() { return new Date().toISOString().slice(0, 10); }
function addDays(date, days) { const next = new Date(`${date}T00:00:00`); next.setDate(next.getDate() + days); return next.toISOString().slice(0, 10); }
function newItem(overrides = {}) { return { id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, description: "Professional service", quantity: 1, rate: 0, ...overrides }; }

function initialInvoice() {
  const issuedAt = today();
  return {
    type: "invoice", number: `INV-${issuedAt.replaceAll("-", "")}-001`, issuedAt, dueAt: addDays(issuedAt, 14), currency: "IDR",
    theme: "terracotta", customTheme: { ...DEFAULT_CUSTOM_THEME }, template: "modern",
    fontFamily: "system", fontSize: "standard", bold: false, italic: false,
    issuer: { name: "", email: "", phone: "", address: "", website: "" }, client: { name: "", email: "", phone: "", address: "" },
    items: [newItem()], discount: 0, tax: 11, shipping: 0, notes: "Thank you for your business!", paymentDetails: "", logo: "", clientLogo: "",
  };
}

function loadDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !Array.isArray(saved.items)) return initialInvoice();
    const fallback = initialInvoice();
    return { ...fallback, ...saved, issuer: { ...fallback.issuer, ...saved.issuer }, client: { ...fallback.client, ...saved.client }, customTheme: { ...fallback.customTheme, ...saved.customTheme } };
  } catch { return initialInvoice(); }
}

function amount(value) { const parsed = Number(value); return Number.isFinite(parsed) ? Math.max(0, parsed) : 0; }
function displayDate(value) { return value ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`)) : "—"; }

export function InvoiceBuilderWorkspace() {
  const [invoice, setInvoice] = useState(loadDraft);
  const [activeTab, setActiveTab] = useState("details");
  const [previewMode, setPreviewMode] = useState("desktop");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState("");
  const businessLogoRef = useRef(null);
  const clientLogoRef = useRef(null);
  const [printHost] = useState(() => { if (typeof window === "undefined") return null; const node = window.document.createElement("div"); node.id = "okr-invoice-print-root"; return node; });

  const currency = CURRENCIES.find((item) => item.code === invoice.currency) ?? CURRENCIES[0];
  const customTheme = { ...DEFAULT_CUSTOM_THEME, ...invoice.customTheme };
  const theme = invoice.theme === "custom" ? { id: "custom", name: "Custom", ...customTheme } : THEMES.find((item) => item.id === invoice.theme) ?? THEMES[0];
  const fontFamily = FONT_FAMILIES.find((item) => item.id === invoice.fontFamily) ?? FONT_FAMILIES[0];
  const fontSize = FONT_SIZES.find((item) => item.id === invoice.fontSize) ?? FONT_SIZES[1];
  const money = useMemo(() => new Intl.NumberFormat(currency.locale, { style: "currency", currency: currency.code, maximumFractionDigits: currency.code === "IDR" ? 0 : 2 }), [currency.code, currency.locale]);
  const pages = useMemo(() => paginateInvoiceItems(invoice.items, ITEMS_PER_PAGE), [invoice.items]);
  const totals = useMemo(() => {
    const subtotal = invoice.items.reduce((sum, item) => sum + amount(item.quantity) * amount(item.rate), 0);
    const discountRate = Math.min(100, amount(invoice.discount));
    const afterDiscount = subtotal * (1 - discountRate / 100);
    const tax = afterDiscount * (amount(invoice.tax) / 100);
    return { subtotal, discount: subtotal - afterDiscount, tax, total: afterDiscount + tax + amount(invoice.shipping) };
  }, [invoice.discount, invoice.items, invoice.shipping, invoice.tax]);

  useEffect(() => { if (!printHost) return undefined; window.document.body.appendChild(printHost); return () => printHost.remove(); }, [printHost]);
  useEffect(() => { fontFamily.loadCss?.forEach((load) => load()); }, [fontFamily]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(invoice)); setSaved(true); window.setTimeout(() => setSaved(false), 1200); }
      catch { setError("Draft could not be saved. Try using smaller logo files."); }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [invoice]);

  function setField(field, value) { setInvoice((current) => ({ ...current, [field]: value })); setError(""); }
  function setDocumentType(nextType) {
    setInvoice((current) => {
      if (current.type === nextType) return current;
      const prefixMap = { invoice: "INV-", quote: "QUO-" };
      const currentPrefix = prefixMap[current.type] ?? prefixMap.invoice;
      const nextPrefix = prefixMap[nextType] ?? prefixMap.invoice;
      const number = current.number.startsWith(currentPrefix) ? `${nextPrefix}${current.number.slice(currentPrefix.length)}` : current.number;
      return { ...current, type: nextType, number };
    });
    setError("");
  }
  function setParty(party, field, value) { setInvoice((current) => ({ ...current, [party]: { ...current[party], [field]: value } })); setError(""); }
  function setItem(id, field, value) { setInvoice((current) => ({ ...current, items: current.items.map((item) => item.id === id ? { ...item, [field]: value } : item) })); setError(""); }
  function setCustomTheme(field, value) { setInvoice((current) => ({ ...current, theme: "custom", customTheme: { ...current.customTheme, [field]: value } })); }
  function removeItem(id) { setInvoice((current) => ({ ...current, items: current.items.length === 1 ? current.items : current.items.filter((item) => item.id !== id) })); }

  function chooseLogo(field, file) {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) { setError("Choose a PNG, JPG, or WebP logo under 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setField(field, String(reader.result));
    reader.onerror = () => setError("The logo could not be read.");
    reader.readAsDataURL(file);
  }

  function removeLogo(field, inputRef) { setField(field, ""); if (inputRef.current) inputRef.current.value = ""; }
  function validate() {
    if (!invoice.issuer.name.trim() || !invoice.client.name.trim()) { setError("Add both your business name and the client name before exporting."); return false; }
    if (!invoice.items.some((item) => item.description.trim())) { setError("Add at least one item description before exporting."); return false; }
    setError(""); return true;
  }

  async function handleExport(format) {
    if (!validate()) return;
    if (format === "pdf") { window.print(); return; }
    setExporting(format);
    try {
      if (format === "word") await exportInvoiceWord(invoice, totals, (value) => money.format(value));
      if (format === "excel") await exportInvoiceExcel(invoice, totals);
      if (format === "csv") exportInvoiceCsv(invoice, totals);
    } catch (exportError) { console.error(exportError); setError(`Could not export ${format.toUpperCase()}. Please try again.`); }
    finally { setExporting(""); }
  }

  function resetDraft() {
    if (!window.confirm("Clear this invoice and start a new one?")) return;
    localStorage.removeItem(STORAGE_KEY); setInvoice(initialInvoice()); setActiveTab("details"); setError("");
    if (businessLogoRef.current) businessLogoRef.current.value = "";
    if (clientLogoRef.current) clientLogoRef.current.value = "";
  }

  const label = invoice.type === "quote" ? "Quotation" : "Invoice";
  const pageProps = { invoice, label, money, pages, theme, totals, fontFamily, fontSize };

  return <div className="okr__invoice-builder">
    <div className="okr__invoice-workspace">
      <section className="okr__invoice-control-card" aria-label="Invoice editor">
        <nav className="okr__invoice-tabs" aria-label="Invoice sections">{TABS.map(({ id, label: tabLabel, icon: Icon }) => <button key={id} type="button" className={activeTab === id ? "is-active" : ""} onClick={() => setActiveTab(id)} aria-pressed={activeTab === id}><Icon size={17} /><span>{tabLabel}</span></button>)}</nav>
        <div className="okr__invoice-tab-panel">
          {activeTab === "details" && <DetailsPanel invoice={invoice} label={label} setField={setField} setParty={setParty} setDocumentType={setDocumentType} />}
          {activeTab === "items" && <ItemsPanel invoice={invoice} money={money} totals={totals} setField={setField} setItem={setItem} removeItem={removeItem} />}
          {activeTab === "design" && <DesignPanel invoice={invoice} customTheme={customTheme} businessLogoRef={businessLogoRef} clientLogoRef={clientLogoRef} setField={setField} setCustomTheme={setCustomTheme} chooseLogo={chooseLogo} removeLogo={removeLogo} />}
          {activeTab === "notes" && <NotesPanel invoice={invoice} setField={setField} />}
        </div>
        <div className="okr__invoice-save-line"><span className={saved ? "is-saved" : ""}><Check size={13} /> {saved ? "Saved locally" : "Autosave enabled"}</span><span>{pages.length} A4 {pages.length === 1 ? "page" : "pages"}</span></div>
      </section>

      <section className="okr__invoice-preview-card" aria-label="Live invoice preview">
        <div className="okr__invoice-preview-toolbar"><h3>Live Preview</h3><div className="okr__invoice-preview-actions"><label><span>Template</span><select value={invoice.template} onChange={(event) => setField("template", event.target.value)}><option value="modern">Modern</option><option value="classic">Classic</option><option value="minimal">Minimal</option></select></label><div className="okr__invoice-device-buttons" aria-label="Preview size">{[["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]].map(([mode, Icon]) => <button key={mode} type="button" className={previewMode === mode ? "is-active" : ""} onClick={() => setPreviewMode(mode)} aria-label={`${mode} preview`} aria-pressed={previewMode === mode}><Icon size={16} /></button>)}</div></div></div>
        <div className={`okr__invoice-preview-stage is-${previewMode}`}><InvoicePages {...pageProps} /></div>
        <div className="okr__invoice-download-grid">
          <DownloadButton className="is-primary" label="Download PDF" icon={Download} onClick={() => handleExport("pdf")} />
          <DownloadButton className="is-word" label="Download Word" icon={FileText} loading={exporting === "word"} onClick={() => handleExport("word")} />
          <DownloadButton className="is-excel" label="Download Excel" icon={FileSpreadsheet} loading={exporting === "excel"} onClick={() => handleExport("excel")} />
          <DownloadButton label="Download CSV" icon={FileText} loading={exporting === "csv"} onClick={() => handleExport("csv")} />
          <button type="button" className="okr__invoice-reset-button" onClick={resetDraft}><RotateCcw size={17} /> Reset</button>
        </div>
        {error && <p className="okr__tool-error okr__invoice-error" role="alert">{error}</p>}
      </section>
    </div>

    <div className="okr__invoice-benefits" aria-label="Invoice builder benefits"><Benefit icon={FileText} title="Professional Templates" detail="Modern and clean designs for any business." /><Benefit icon={Download} title="Fast and Easy" detail="Create and download in seconds." /><Benefit icon={Check} title="Privacy First" detail="No data is stored. Everything works in your browser." /></div>
    {printHost && createPortal(<InvoicePages {...pageProps} printable />, printHost)}
  </div>;
}

function PanelHeading({ title, detail, action }) { return <div className="okr__invoice-panel-heading"><div><h3>{title}</h3><p>{detail}</p></div>{action}</div>; }

function DetailsPanel({ invoice, label, setField, setParty, setDocumentType }) {
  return <><DocumentTypeToggle value={invoice.type} onChange={setDocumentType} /><PanelHeading title="Document Information" detail="Enter the basic details for your invoice." /><div className="okr__invoice-form-grid"><Field label={`${label} Number`}><input value={invoice.number} onChange={(event) => setField("number", event.target.value)} /></Field><Field label="Issue Date"><input type="date" value={invoice.issuedAt} onChange={(event) => setField("issuedAt", event.target.value)} /></Field><Field label={invoice.type === "quote" ? "Valid Until" : "Due Date"}><input type="date" value={invoice.dueAt} onChange={(event) => setField("dueAt", event.target.value)} /></Field><Field label="Currency"><select value={invoice.currency} onChange={(event) => setField("currency", event.target.value)}>{CURRENCIES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></Field><Field label="Tax (Optional)" className="is-half"><div className="okr__invoice-suffix-input"><input type="number" min="0" step="0.01" value={invoice.tax} onChange={(event) => setField("tax", event.target.value)} /><span>%</span></div></Field></div><PanelDivider /><PanelHeading title="Your Business" detail="Enter your business information." /><PartyForm party="issuer" value={invoice.issuer} onChange={setParty} includeWebsite /><PanelDivider /><PanelHeading title="Client Information" detail="Enter your client's details." /><PartyForm party="client" value={invoice.client} onChange={setParty} compact /></>;
}

function ItemsPanel({ invoice, money, totals, setField, setItem, removeItem }) {
  return <><PanelHeading title="Products & Services" detail="Add everything included in this invoice." action={<button type="button" className="okr__invoice-add-button" onClick={() => setField("items", [...invoice.items, newItem({ description: "" })])}><Plus size={15} /> Add item</button>} /><div className="okr__invoice-item-list">{invoice.items.map((item, index) => <div className="okr__invoice-item-row" key={item.id}><span>{String(index + 1).padStart(2, "0")}</span><Field label="Description"><input value={item.description} placeholder="Service or product" onChange={(event) => setItem(item.id, "description", event.target.value)} /></Field><Field label="Qty"><input type="number" min="0" step="0.01" value={item.quantity} onChange={(event) => setItem(item.id, "quantity", event.target.value)} /></Field><Field label="Rate"><input type="number" min="0" step="0.01" value={item.rate} onChange={(event) => setItem(item.id, "rate", event.target.value)} /></Field><strong>{money.format(amount(item.quantity) * amount(item.rate))}</strong><button type="button" onClick={() => removeItem(item.id)} disabled={invoice.items.length === 1} aria-label={`Remove item ${index + 1}`}><Trash2 size={15} /></button></div>)}</div><p className="okr__invoice-pagination-note">A new A4 page is created automatically after every {ITEMS_PER_PAGE} line items.</p><PanelDivider /><div className="okr__invoice-adjustments"><Field label="Discount (%)"><input type="number" min="0" max="100" step="0.01" value={invoice.discount} onChange={(event) => setField("discount", event.target.value)} /></Field><Field label="Shipping / Fee"><input type="number" min="0" step="0.01" value={invoice.shipping} onChange={(event) => setField("shipping", event.target.value)} /></Field><div><span>Invoice Total</span><strong>{money.format(totals.total)}</strong></div></div></>;
}

function DesignPanel({ invoice, customTheme, businessLogoRef, clientLogoRef, setField, setCustomTheme, chooseLogo, removeLogo }) {
  return <><PanelHeading title="Template & Colours" detail="Choose a professional style for your invoice." /><Field label="Template"><select value={invoice.template} onChange={(event) => setField("template", event.target.value)}><option value="modern">Modern</option><option value="classic">Classic</option><option value="minimal">Minimal</option></select></Field><ThemePicker value={invoice.theme} customTheme={customTheme} onPresetChange={(value) => setField("theme", value)} onCustomChange={setCustomTheme} /><PanelDivider /><PanelHeading title="Typography" detail="Set the font and text style used across the document." /><div className="okr__invoice-form-grid"><Field label="Font"><select value={invoice.fontFamily} onChange={(event) => setField("fontFamily", event.target.value)}>{FONT_FAMILIES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Font size"><select value={invoice.fontSize} onChange={(event) => setField("fontSize", event.target.value)}>{FONT_SIZES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field></div><div className="okr__invoice-text-style-toggles"><button type="button" className={invoice.bold ? "is-active" : ""} onClick={() => setField("bold", !invoice.bold)} aria-pressed={invoice.bold}><Bold size={14} /> Bold</button><button type="button" className={invoice.italic ? "is-active" : ""} onClick={() => setField("italic", !invoice.italic)} aria-pressed={invoice.italic}><Italic size={14} /> Italic</button></div><PanelDivider /><PanelHeading title="Logos" detail="Add your logo and an optional client logo." /><div className="okr__invoice-logo-grid"><LogoPicker label="Business logo" value={invoice.logo} inputRef={businessLogoRef} onChoose={(file) => chooseLogo("logo", file)} onRemove={() => removeLogo("logo", businessLogoRef)} /><LogoPicker label="Client logo (optional)" value={invoice.clientLogo} inputRef={clientLogoRef} onChoose={(file) => chooseLogo("clientLogo", file)} onRemove={() => removeLogo("clientLogo", clientLogoRef)} /></div></>;
}

function NotesPanel({ invoice, setField }) { return <><PanelHeading title="Notes & Payment" detail="Add a message, terms, or payment instructions." /><div className="okr__invoice-notes-grid"><Field label="Notes"><textarea rows="5" value={invoice.notes} onChange={(event) => setField("notes", event.target.value)} placeholder="Thank you, terms, or additional context" /></Field><Field label="Payment Details"><textarea rows="5" value={invoice.paymentDetails} onChange={(event) => setField("paymentDetails", event.target.value)} placeholder="Bank name, account number, or payment instructions" /></Field></div></>; }
function Field({ label, className = "", children }) { return <label className={`okr__invoice-field ${className}`}><span>{label}</span>{children}</label>; }

function PartyForm({ party, value, onChange, includeWebsite = false, compact = false }) {
  return <div className={`okr__invoice-party-form${compact ? " is-compact" : ""}`}><Field label={party === "issuer" ? "Business Name" : "Client Name"}><input value={value.name} onChange={(event) => onChange(party, "name", event.target.value)} placeholder={party === "issuer" ? "Your business name" : "Client name"} /></Field><Field label="Address"><input value={value.address} onChange={(event) => onChange(party, "address", event.target.value)} placeholder={party === "issuer" ? "Jakarta, Indonesia" : "Client address"} /></Field><Field label="Email"><input type="email" value={value.email} onChange={(event) => onChange(party, "email", event.target.value)} placeholder="name@example.com" /></Field><Field label="Phone"><input value={value.phone} onChange={(event) => onChange(party, "phone", event.target.value)} placeholder="+62 ..." /></Field>{includeWebsite && <Field label="Website (Optional)" className="is-wide"><input value={value.website ?? ""} onChange={(event) => onChange(party, "website", event.target.value)} placeholder="https://example.com" /></Field>}</div>;
}

function PanelDivider() { return <div className="okr__invoice-panel-divider" />; }
function DocumentTypeToggle({ value, onChange }) { return <div className="okr__invoice-type-toggle" role="radiogroup" aria-label="Document type">{[["invoice", "Invoice"], ["quote", "Quotation"]].map(([id, docLabel]) => <button key={id} type="button" role="radio" aria-checked={value === id} className={value === id ? "is-active" : ""} onClick={() => onChange(id)}>{docLabel}</button>)}</div>; }
function ThemePicker({ value, customTheme, onPresetChange, onCustomChange }) { return <fieldset className="okr__invoice-theme-picker"><legend>Invoice colour theme</legend><div className="okr__invoice-theme-presets">{THEMES.map((theme) => <button key={theme.id} type="button" className={value === theme.id ? "is-active" : ""} onClick={() => onPresetChange(theme.id)} aria-pressed={value === theme.id}><span style={{ "--swatch-ink": theme.ink, "--swatch-accent": theme.accent }} /><strong>{theme.name}</strong>{value === theme.id && <Check size={13} />}</button>)}</div><div className={`okr__invoice-custom-theme${value === "custom" ? " is-active" : ""}`}><strong>Custom colours</strong><div>{[["Primary", "ink"], ["Accent", "accent"], ["Soft background", "soft"]].map(([label, field]) => <label key={field}><span>{label}</span><span><input type="color" value={customTheme[field]} onChange={(event) => onCustomChange(field, event.target.value)} /><code>{customTheme[field].toUpperCase()}</code></span></label>)}</div></div></fieldset>; }
function LogoPicker({ label, value, inputRef, onChoose, onRemove }) { return <div className="okr__invoice-logo-picker"><span>{label}</span><div>{value && <img src={value} alt="Selected logo preview" />}<label><input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onChoose(event.target.files?.[0])} /><ImagePlus size={15} />{value ? "Replace" : "Add logo"}</label>{value && <button type="button" onClick={onRemove} aria-label={`Remove ${label.toLowerCase()}`} title="Remove logo"><X size={14} /></button>}</div></div>; }
function DownloadButton({ label, icon: Icon, loading, onClick, className = "" }) { return <button type="button" className={className} onClick={onClick} disabled={loading}><span><Icon size={18} /></span>{loading ? "Preparing…" : label}</button>; }
function Benefit({ icon: Icon, title, detail }) { return <div><span><Icon size={22} /></span><div><strong>{title}</strong><p>{detail}</p></div></div>; }

function InvoicePages({ invoice, label, money, pages, theme, totals, fontFamily, fontSize, printable = false }) {
  const style = { "--invoice-ink": theme.ink, "--invoice-accent": theme.accent, "--invoice-soft": theme.soft, "--invoice-font-family": fontFamily?.stack, "--invoice-font-scale": fontSize?.scale ?? 1 };
  const paperClass = `okr__invoice-paper is-${invoice.template ?? "modern"}${invoice.bold ? " is-bold-text" : ""}${invoice.italic ? " is-italic-text" : ""}`;
  return <div className={`okr__invoice-pages${printable ? " okr__invoice-pages--print" : ""}`} style={style}>{pages.map((items, pageIndex) => {
    const isFirst = pageIndex === 0; const isLast = pageIndex === pages.length - 1;
    return <article className={paperClass} key={`${pageIndex}-${items[0]?.id ?? "empty"}`}><header className="okr__invoice-paper-head"><div className="okr__invoice-brand">{invoice.logo ? <img src={invoice.logo} alt="Business logo" /> : <span>IA</span>}<div><strong>{invoice.issuer.name || "Your Business"}</strong><small>{invoice.issuer.website || "Strategy. Design. Technology."}</small></div></div><div className="okr__invoice-paper-title"><span>{label}</span><strong>{invoice.number || "—"}</strong></div></header>{isFirst ? <><div className="okr__invoice-parties-preview"><PartyPreview title="From" party={invoice.issuer} fallback="Your Business" /><PartyPreview title="Bill To" party={invoice.client} fallback="Client Name" logo={invoice.clientLogo} /></div><dl className="okr__invoice-date-strip"><div><dt>Issue Date</dt><dd>{displayDate(invoice.issuedAt)}</dd></div><div><dt>{invoice.type === "quote" ? "Valid Until" : "Due Date"}</dt><dd>{displayDate(invoice.dueAt)}</dd></div><div><dt>Currency</dt><dd>{invoice.currency}</dd></div></dl></> : <div className="okr__invoice-continuation"><span>Continued for</span><strong>{invoice.client.name || "Client Name"}</strong></div>}<table className="okr__invoice-paper-table"><thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead><tbody>{items.map((item, index) => <tr key={item.id}><td>{pageIndex * ITEMS_PER_PAGE + index + 1}</td><td>{item.description || "Untitled item"}</td><td>{amount(item.quantity)}</td><td>{money.format(amount(item.rate))}</td><td>{money.format(amount(item.quantity) * amount(item.rate))}</td></tr>)}</tbody></table>{isLast && <dl className="okr__invoice-paper-totals"><div><dt>Subtotal</dt><dd>{money.format(totals.subtotal)}</dd></div>{totals.discount > 0 && <div><dt>Discount</dt><dd>− {money.format(totals.discount)}</dd></div>}<div><dt>Tax ({amount(invoice.tax)}%)</dt><dd>{money.format(totals.tax)}</dd></div>{amount(invoice.shipping) > 0 && <div><dt>Shipping / Fee</dt><dd>{money.format(amount(invoice.shipping))}</dd></div>}<div className="is-total"><dt>Total</dt><dd>{money.format(totals.total)}</dd></div></dl>}<footer className="okr__invoice-paper-footer"><span>{isLast ? invoice.notes : ""}</span><span>{invoice.issuer.website || `Page ${pageIndex + 1} of ${pages.length}`}</span></footer></article>;
  })}</div>;
}

function PartyPreview({ title, party, fallback, logo }) { return <div>{logo && <img src={logo} alt="Client logo" />}<span>{title}</span><strong>{party.name || fallback}</strong><p>{party.address}</p><p>{party.email}</p><p>{party.phone}</p>{party.website && <p>{party.website}</p>}</div>; }
