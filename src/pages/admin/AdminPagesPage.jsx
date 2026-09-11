import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { pagesData } from "../../lib/supabaseData";

const TABS = [
  { key: "about", label: "About", url: "/about" },
  { key: "contact", label: "Contact", url: "/contact" },
  { key: "portfolio", label: "Portfolio", url: "/portfolio" },
  { key: "privacy", label: "Privacy", url: "/privacy" },
  { key: "terms", label: "Terms", url: "/terms" },
];

export function AdminPagesPage() {
  const nav = useNavigate();
  const [tab, setTab] = useState("about");
  const [data, setData] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [inlineMsg, setInlineMsg] = useState(null);

  useEffect(() => {
    let alive = true;
    pagesData.get(tab).then((page) => {
      if (alive) setData(page);
    });
    setDirty(false);
    setInlineMsg(null);
    return () => { alive = false; };
  }, [tab]);

  if (!data) return <p>Loading…</p>;

  const set = (k, v) => {
    setData((d) => ({ ...d, [k]: v }));
    setDirty(true);
  };

  function switchTab(nextTab) {
    if (dirty && !confirm("Ada perubahan yang belum disimpan. Yakin pindah tab?")) return;
    setTab(nextTab);
  }

  async function save({ redirect = true } = {}) {
    setBusy(true);
    setInlineMsg(null);
    try {
      const clean = { ...data };
      delete clean.updated_at;
      await pagesData.update(tab, clean);
      setDirty(false);
      if (redirect) {
        nav("/admin", { state: { toast: { type: "success", text: `✓ Halaman "${tab}" tersimpan.` } } });
      } else {
        setData(await pagesData.get(tab));
        setInlineMsg({ type: "success", text: "✓ Tersimpan. Klik Preview untuk lihat hasilnya." });
      }
    } catch (e) {
      setInlineMsg({ type: "error", text: e.message ?? "Gagal menyimpan." });
    } finally { setBusy(false); }
  }

  async function previewOnly() {
    if (dirty) await save({ redirect: false });
    const url = TABS.find((x) => x.key === tab)?.url ?? "/";
    window.open(url, "_blank");
  }

  const activeTab = TABS.find((t) => t.key === tab);

  return (
    <>
      <div className="wpx__page-header">
        <h1>Pages {dirty && <span style={{ fontSize: 12, color: "#fbbf24", marginLeft: 8 }}>● belum disimpan</span>}</h1>
        <div className="spacer" />
        <button
          type="button"
          className="wpx__btn wpx__btn--secondary"
          onClick={previewOnly}
          title="Simpan sementara + buka di tab baru"
        >
          <ExternalLink size={14} /> Preview
        </button>
        <button
          type="button"
          className="wpx__btn wpx__btn--secondary"
          onClick={() => save({ redirect: false })}
          disabled={busy}
        >
          {busy ? "Menyimpan…" : "Simpan (tetap di sini)"}
        </button>
        <button
          type="button"
          className="wpx__btn wpx__btn--primary"
          onClick={() => save({ redirect: true })}
          disabled={busy}
        >
          {busy ? "…" : "Simpan & kembali"}
        </button>
      </div>

      {inlineMsg && (
        <div className={`wpx__notice wpx__notice--${inlineMsg.type}`} style={{ marginBottom: 16 }}>
          {inlineMsg.text}
          {inlineMsg.type === "success" && activeTab && (
            <> <a href={activeTab.url} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", marginLeft: 8 }}>
              Buka {activeTab.url} →
            </a></>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid var(--border)" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => switchTab(t.key)}
            style={{
              background: "transparent", border: "none",
              padding: "10px 20px", cursor: "pointer", fontSize: 14, fontWeight: 600,
              color: tab === t.key ? "var(--primary)" : "var(--text-dim)",
              borderBottom: `2px solid ${tab === t.key ? "var(--primary)" : "transparent"}`,
              marginBottom: -1,
            }}>{t.label}</button>
        ))}
      </div>

      {tab === "about" && <AboutEditor data={data} set={set} />}
      {tab === "contact" && <ContactEditor data={data} set={set} />}
      {tab === "portfolio" && <PortfolioEditor data={data} set={set} />}
      {(tab === "privacy" || tab === "terms") && <LegalEditor data={data} set={set} />}
    </>
  );
}

function PortfolioEditor({ data, set }) {
  return (
    <>
      <div className="wpx__card"><div className="wpx__card-header">Hero & Positioning</div>
        <div className="wpx__card-body">
          <div className="wpx__field"><label className="wpx__label">Hero kicker</label>
            <input className="wpx__input" value={data.hero_kicker ?? ""} onChange={(e) => set("hero_kicker", e.target.value)} /></div>
          <div className="wpx__field"><label className="wpx__label">Hero title</label>
            <input className="wpx__input" value={data.hero_title ?? ""} onChange={(e) => set("hero_title", e.target.value)} /></div>
          <div className="wpx__field"><label className="wpx__label">Hero subtitle</label>
            <input className="wpx__input" value={data.hero_subtitle ?? ""} onChange={(e) => set("hero_subtitle", e.target.value)} /></div>
        </div>
      </div>

      <TagsEditor label="Consultant focus (satu per baris)" items={data.core_expertise ?? []} onChange={(v) => set("core_expertise", v)} />

      <JobsEditor label="Consulting Projects" items={data.consulting ?? []} onChange={(v) => set("consulting", v)} />

      <PortfolioGroupsEditor items={data.portfolio_groups ?? []} onChange={(v) => set("portfolio_groups", v)} />

      <TagsEditor label="Tools & Stack (opsional, satu per baris)" items={data.tools ?? []} onChange={(v) => set("tools", v)} />
    </>
  );
}

function TagsEditor({ label, items, onChange }) {
  return (
    <div className="wpx__card"><div className="wpx__card-header">{label}</div>
      <div className="wpx__card-body">
        <textarea className="wpx__textarea" rows={5} style={{ fontFamily: "monospace", fontSize: 13 }}
          value={items.join("\n")}
          onChange={(e) => onChange(e.target.value.split("\n").map((x) => x.trim()).filter(Boolean))} />
      </div>
    </div>
  );
}

function JobsEditor({ label, items, onChange }) {
  const add = () => onChange([...items, { year: "", role: "", org: "", desc: "" }]);
  const upd = (i, k, v) => onChange(items.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const del = (i) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="wpx__card"><div className="wpx__card-header">{label}</div>
      <div className="wpx__card-body">
        {items.map((j, i) => (
          <div key={i} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 8, marginBottom: 12 }}>
            <div className="wpx__grid-2">
              <div className="wpx__field"><label className="wpx__label">Tahun</label>
                <input className="wpx__input" value={j.year ?? ""} onChange={(e) => upd(i, "year", e.target.value)} /></div>
              <div className="wpx__field"><label className="wpx__label">Role</label>
                <input className="wpx__input" value={j.role ?? ""} onChange={(e) => upd(i, "role", e.target.value)} /></div>
            </div>
            <div className="wpx__field"><label className="wpx__label">Organization</label>
              <input className="wpx__input" value={j.org ?? ""} onChange={(e) => upd(i, "org", e.target.value)} /></div>
            <div className="wpx__field"><label className="wpx__label">Deskripsi</label>
              <textarea className="wpx__textarea" rows={3} value={j.desc ?? ""} onChange={(e) => upd(i, "desc", e.target.value)} /></div>
            <button type="button" className="wpx__btn wpx__btn--danger" onClick={() => del(i)}>Hapus</button>
          </div>
        ))}
        <button type="button" className="wpx__btn wpx__btn--secondary" onClick={add}>+ Tambah entry</button>
      </div>
    </div>
  );
}

function PortfolioGroupsEditor({ items, onChange }) {
  const toList = (value) => Array.isArray(value)
    ? value.map(String)
    : String(value ?? "")
      .replace(/\.$/, "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  const add = () => onChange([...items, { label: "", items: [] }]);
  const upd = (i, k, v) => onChange(items.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const del = (i) => onChange(items.filter((_, idx) => idx !== i));
  const updItem = (groupIndex, itemIndex, value) => onChange(items.map((group, idx) => {
    if (idx !== groupIndex) return group;
    const list = toList(group.items);
    list[itemIndex] = value;
    return { ...group, items: list };
  }));
  const addItem = (groupIndex) => onChange(items.map((group, idx) => (
    idx === groupIndex ? { ...group, items: [...toList(group.items), ""] } : group
  )));
  const delItem = (groupIndex, itemIndex) => onChange(items.map((group, idx) => (
    idx === groupIndex
      ? { ...group, items: toList(group.items).filter((_, i) => i !== itemIndex) }
      : group
  )));
  const moveItem = (groupIndex, itemIndex, dir) => onChange(items.map((group, idx) => {
    if (idx !== groupIndex) return group;
    const list = toList(group.items);
    const target = itemIndex + dir;
    if (target < 0 || target >= list.length) return group;
    [list[itemIndex], list[target]] = [list[target], list[itemIndex]];
    return { ...group, items: list };
  }));
  return (
    <div className="wpx__card"><div className="wpx__card-header">Selected Portfolio (grup)</div>
      <div className="wpx__card-body">
        {items.map((g, i) => (
          <div key={i} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 8, marginBottom: 12 }}>
            <div className="wpx__field"><label className="wpx__label">Label grup</label>
              <input className="wpx__input" value={g.label ?? ""} onChange={(e) => upd(i, "label", e.target.value)}
                placeholder="misal: Website Development" /></div>
            <div className="wpx__field">
              <label className="wpx__label">Project / brand items</label>
              {toList(g.items).map((item, itemIndex) => (
                <div key={`${i}-${itemIndex}`} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 6, marginBottom: 8 }}>
                  <input
                    className="wpx__input"
                    value={item}
                    onChange={(e) => updItem(i, itemIndex, e.target.value)}
                    placeholder="Nama brand/project tanpa ekstensi domain"
                  />
                  <button type="button" className="wpx__btn wpx__btn--secondary" onClick={() => moveItem(i, itemIndex, -1)} disabled={itemIndex === 0}>↑</button>
                  <button type="button" className="wpx__btn wpx__btn--secondary" onClick={() => moveItem(i, itemIndex, 1)} disabled={itemIndex === toList(g.items).length - 1}>↓</button>
                  <button type="button" className="wpx__btn wpx__btn--danger" onClick={() => delItem(i, itemIndex)}>Hapus</button>
                </div>
              ))}
              <button type="button" className="wpx__btn wpx__btn--secondary" onClick={() => addItem(i)}>+ Tambah project</button>
            </div>
            <button type="button" className="wpx__btn wpx__btn--danger" onClick={() => del(i)}>Hapus grup</button>
          </div>
        ))}
        <button type="button" className="wpx__btn wpx__btn--secondary" onClick={add}>+ Tambah grup</button>
      </div>
    </div>
  );
}

function AboutEditor({ data, set }) {
  return (
    <>
      <div className="wpx__card"><div className="wpx__card-header">Hero</div>
        <div className="wpx__card-body">
          <div className="wpx__field"><label className="wpx__label">Kicker</label>
            <input className="wpx__input" value={data.hero_kicker ?? ""} onChange={(e) => set("hero_kicker", e.target.value)} /></div>
          <div className="wpx__field"><label className="wpx__label">Title</label>
            <input className="wpx__input" value={data.hero_title ?? ""} onChange={(e) => set("hero_title", e.target.value)} /></div>
          <div className="wpx__field"><label className="wpx__label">Subtitle</label>
            <textarea className="wpx__textarea" value={data.hero_subtitle ?? ""} onChange={(e) => set("hero_subtitle", e.target.value)} /></div>
        </div>
      </div>
      <div className="wpx__card"><div className="wpx__card-header">Story</div>
        <div className="wpx__card-body">
          <div className="wpx__field"><label className="wpx__label">Judul</label>
            <input className="wpx__input" value={data.story_title ?? ""} onChange={(e) => set("story_title", e.target.value)} /></div>
          <div className="wpx__field"><label className="wpx__label">Isi</label>
            <textarea className="wpx__textarea" rows={6} value={data.story_body ?? ""} onChange={(e) => set("story_body", e.target.value)} /></div>
        </div>
      </div>
      <ArrayEditor label="Nilai (values)" items={data.values ?? []} onChange={(v) => set("values", v)}
        fields={[{ key: "title", label: "Title" }, { key: "body", label: "Body", textarea: true }]} />
      <ArrayEditor label="Stats" items={data.stats ?? []} onChange={(v) => set("stats", v)}
        fields={[{ key: "value", label: "Value (misal: 50+)" }, { key: "label", label: "Label" }]} />
    </>
  );
}

function ContactEditor({ data, set }) {
  return (
    <div className="wpx__card"><div className="wpx__card-header">Contact page content</div>
      <div className="wpx__card-body">
        {[
          ["hero_kicker", "Hero kicker"], ["hero_title", "Hero title"],
          ["hero_subtitle", "Hero subtitle", true], ["address", "Alamat"],
          ["hours", "Jam kerja"], ["response_time", "Response time note"],
        ].map(([k, label, textarea]) => (
          <div className="wpx__field" key={k}>
            <label className="wpx__label">{label}</label>
            {textarea
              ? <textarea className="wpx__textarea" value={data[k] ?? ""} onChange={(e) => set(k, e.target.value)} />
              : <input className="wpx__input" value={data[k] ?? ""} onChange={(e) => set(k, e.target.value)} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function LegalEditor({ data, set }) {
  return (
    <div className="wpx__card"><div className="wpx__card-header">Konten</div>
      <div className="wpx__card-body">
        <div className="wpx__field"><label className="wpx__label">Title</label>
          <input className="wpx__input" value={data.title ?? ""} onChange={(e) => set("title", e.target.value)} /></div>
        <div className="wpx__field"><label className="wpx__label">Updated (tanggal)</label>
          <input className="wpx__input" value={data.updated ?? ""} onChange={(e) => set("updated", e.target.value)} /></div>
        <div className="wpx__field"><label className="wpx__label">Body (markdown ringan — pakai **bold** dan - untuk list)</label>
          <textarea className="wpx__textarea" rows={20} style={{ fontFamily: "monospace", fontSize: 13 }}
            value={data.body ?? ""} onChange={(e) => set("body", e.target.value)} /></div>
      </div>
    </div>
  );
}

function ArrayEditor({ label, items, onChange, fields }) {
  const add = () => onChange([...items, Object.fromEntries(fields.map((f) => [f.key, ""]))]);
  const upd = (i, k, v) => onChange(items.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const del = (i) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="wpx__card"><div className="wpx__card-header">{label}</div>
      <div className="wpx__card-body">
        {items.map((it, i) => (
          <div key={i} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 8, marginBottom: 12 }}>
            {fields.map((f) => (
              <div className="wpx__field" key={f.key}>
                <label className="wpx__label">{f.label}</label>
                {f.textarea
                  ? <textarea className="wpx__textarea" value={it[f.key] ?? ""} onChange={(e) => upd(i, f.key, e.target.value)} />
                  : <input className="wpx__input" value={it[f.key] ?? ""} onChange={(e) => upd(i, f.key, e.target.value)} />}
              </div>
            ))}
            <button type="button" className="wpx__btn wpx__btn--danger" onClick={() => del(i)}>Hapus</button>
          </div>
        ))}
        <button type="button" className="wpx__btn wpx__btn--secondary" onClick={add}>+ Tambah</button>
      </div>
    </div>
  );
}
