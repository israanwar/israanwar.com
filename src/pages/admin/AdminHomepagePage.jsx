import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { getHomepageSections, updateSection } from "../../services/homepageService";

export function AdminHomepagePage() {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => { getHomepageSections().then(setData); }, []);
  if (!data) return <p>Loading…</p>;

  const setSection = (key, patch) => {
    setData((d) => ({ ...d, [key]: { ...(d[key] ?? {}), ...patch } }));
    setDirty(true);
  };
  const setSectionRaw = (key, val) => {
    setData((d) => ({ ...d, [key]: val }));
    setDirty(true);
  };

  async function save({ redirect = false } = {}) {
    setBusy(true); setMsg(null);
    try {
      for (const key of Object.keys(data)) {
        await updateSection(key, data[key] ?? {});
      }
      setDirty(false);
      if (redirect) {
        nav("/admin", { state: { toast: { type: "success", text: "✓ Homepage saved." } } });
      } else {
        setMsg({ type: "success", text: "✓ Saved. Click Preview to see." });
      }
    } catch (e) {
      setMsg({ type: "error", text: e.message ?? "Failed to save." });
    } finally { setBusy(false); }
  }

  function preview() {
    if (dirty) save({ redirect: false });
    window.open("/", "_blank");
  }

  const hero = data.hero ?? {};
  const cta = data.cta ?? {};
  const process = data.process ?? { title: "", items: [] };
  const services = data.services ?? { items: [] };
  const cases = data.cases ?? { title: "", items: [] };

  return (
    <>
      <div className="wpx__page-header">
        <h1>Homepage {dirty && <span style={{ fontSize: 12, color: "#fbbf24", marginLeft: 8 }}>● unsaved</span>}</h1>
        <div className="spacer" />
        <button type="button" className="wpx__btn wpx__btn--secondary" onClick={preview}>
          <ExternalLink size={14} /> Preview
        </button>
        <button type="button" className="wpx__btn wpx__btn--secondary" onClick={() => save({ redirect: false })} disabled={busy}>
          {busy ? "Saving…" : "Save (stay here)"}
        </button>
        <button type="button" className="wpx__btn wpx__btn--primary" onClick={() => save({ redirect: true })} disabled={busy}>
          {busy ? "…" : "Save & return"}
        </button>
      </div>

      {msg && <div className={`wpx__notice wpx__notice--${msg.type}`}>{msg.text}</div>}

      <div className="wpx__card"><div className="wpx__card-header">Hero</div>
        <div className="wpx__card-body">
          <Field label="Kicker" value={hero.kicker} onChange={(v) => setSection("hero", { kicker: v })} />
          <div className="wpx__grid-2">
            <Field label="Title line 1" value={hero.title_line1} onChange={(v) => setSection("hero", { title_line1: v })} />
            <Field label="Title line 2 (gradient)" value={hero.title_line2} onChange={(v) => setSection("hero", { title_line2: v })} />
          </div>
          <Field label="Subtitle (EN)" textarea value={hero.subtitle} onChange={(v) => setSection("hero", { subtitle: v })} />
          <Field label="Subtitle (ID)" textarea value={hero.subtitle_id} onChange={(v) => setSection("hero", { subtitle_id: v })} />
          <div className="wpx__grid-2">
            <Field label="Primary CTA label" value={hero.cta_primary_label} onChange={(v) => setSection("hero", { cta_primary_label: v })} />
            <Field label="Secondary CTA label" value={hero.cta_secondary_label} onChange={(v) => setSection("hero", { cta_secondary_label: v })} />
          </div>
        </div>
      </div>

      <div className="wpx__card"><div className="wpx__card-header">CTA Section</div>
        <div className="wpx__card-body">
          <Field label="Title" value={cta.title} onChange={(v) => setSection("cta", { title: v })} />
          <Field label="Subtitle" textarea value={cta.subtitle} onChange={(v) => setSection("cta", { subtitle: v })} />
          <Field label="Button label" value={cta.button_label} onChange={(v) => setSection("cta", { button_label: v })} />
        </div>
      </div>

      <ItemsEditor
        title="Services (landing preview)"
        items={services.items ?? []}
        onChange={(items) => setSectionRaw("services", { items })}
        fields={[{ key: "title", label: "Title" }, { key: "body", label: "Body", textarea: true }]}
      />

      <div className="wpx__card"><div className="wpx__card-header">Process</div>
        <div className="wpx__card-body">
          <Field label="Section title" value={process.title} onChange={(v) => setSectionRaw("process", { ...process, title: v })} />
        </div>
      </div>
      <ItemsEditor
        title="Process Steps"
        items={process.items ?? []}
        onChange={(items) => setSectionRaw("process", { ...process, items })}
        fields={[
          { key: "n", label: "Number (01, 02, …)" },
          { key: "title", label: "Title" },
          { key: "body", label: "Body" },
          { key: "detail", label: "Popup detail", textarea: true },
          { key: "points", label: "Popup points (one per line)", textarea: true, list: true },
        ]}
      />

      <div className="wpx__card"><div className="wpx__card-header">Cases</div>
        <div className="wpx__card-body">
          <Field label="Section title" value={cases.title} onChange={(v) => setSectionRaw("cases", { ...cases, title: v })} />
        </div>
      </div>
      <ItemsEditor
        title="Case Studies"
        items={cases.items ?? []}
        onChange={(items) => setSectionRaw("cases", { ...cases, items })}
        fields={[
          { key: "tags", label: "Tags (mis. FASHION · SEO)" },
          { key: "title", label: "Title" },
          { key: "body", label: "Body", textarea: true },
          { key: "img", label: "Image URL" },
        ]}
      />

      <div style={{ textAlign: "right", marginTop: 20, paddingBottom: 20 }}>
        <button className="wpx__btn wpx__btn--primary" onClick={() => save({ redirect: true })} disabled={busy}
          style={{ padding: "12px 24px", fontSize: 15 }}>
          {busy ? "Saving…" : "Save & return"}
        </button>
      </div>
    </>
  );
}

function Field({ label, value, onChange, textarea }) {
  return (
    <div className="wpx__field">
      <label className="wpx__label">{label}</label>
      {textarea
        ? <textarea className="wpx__textarea" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
        : <input className="wpx__input" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}

function ItemsEditor({ title, items, onChange, fields }) {
  const add = () => onChange([...items, Object.fromEntries(fields.map((f) => [f.key, f.list ? [] : ""]))]);
  const upd = (i, k, v) => onChange(items.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const valueFor = (item, field) => field.list
    ? (Array.isArray(item[field.key]) ? item[field.key].join("\n") : String(item[field.key] ?? ""))
    : item[field.key];
  const parseValue = (value, field) => field.list
    ? value.split("\n").map((line) => line.trim()).filter(Boolean)
    : value;
  const del = (i) => onChange(items.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const list = [...items];
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    onChange(list);
  };
  return (
    <div className="wpx__card"><div className="wpx__card-header">{title}</div>
      <div className="wpx__card-body">
        {items.length === 0 && <p style={{ color: "var(--text-mute)", fontSize: 13, margin: "0 0 12px" }}>No items yet.</p>}
        {items.map((it, i) => (
          <div key={i} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 8, marginBottom: 12 }}>
            {fields.map((f) => (
              <Field key={f.key} label={f.label} value={valueFor(it, f)} onChange={(v) => upd(i, f.key, parseValue(v, f))} textarea={f.textarea} />
            ))}
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" className="wpx__btn wpx__btn--secondary" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button type="button" className="wpx__btn wpx__btn--secondary" onClick={() => move(i, 1)} disabled={i === items.length - 1}>↓</button>
              <button type="button" className="wpx__btn wpx__btn--danger" onClick={() => del(i)}>Delete</button>
            </div>
          </div>
        ))}
        <button type="button" className="wpx__btn wpx__btn--secondary" onClick={add}>+ Add item</button>
      </div>
    </div>
  );
}
