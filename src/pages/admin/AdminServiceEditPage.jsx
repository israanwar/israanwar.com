import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { servicesData } from "../../lib/supabaseData";

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const ICON_OPTIONS = ["code", "search", "sparkles", "file-text", "settings", "bar-chart", "zap", "wrench"];

export function AdminServiceEditPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const isNew = id === "new";
  const [s, setS] = useState({
    name: "", slug: "", tagline: "", body: "", description: "",
    icon: "sparkles", deliverables: [], kind: "service", parent_slug: "", parent_name: "",
    service_count: "", child_slugs: [], status: "active", order: 100,
  });
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (isNew) return;
    servicesData.get(id).then((existing) => {
      if (existing) setS(existing);
    });
  }, [id, isNew]);

  const set = (k, v) => setS((x) => ({ ...x, [k]: v }));

  async function save() {
    setMsg(null);
    try {
      const payload = {
        ...s,
        slug: s.slug || slugify(s.name),
        order: Number(s.order) || 100,
        service_count: s.service_count === "" ? undefined : Number(s.service_count),
      };
      if (payload.kind === "category") {
        payload.parent_slug = "";
        payload.parent_name = "";
      }
      if (!Number.isFinite(payload.service_count)) delete payload.service_count;
      if (isNew) {
        const created = await servicesData.create(payload);
        nav(`/admin/services/${created.id}`, { replace: true });
      } else {
        await servicesData.update(id, payload);
        setMsg({ type: "success", text: "Tersimpan." });
      }
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  }

  return (
    <>
      <div className="wpx__page-header">
        <h1>{isNew ? "Layanan baru" : "Edit layanan"}</h1>
        <div className="spacer" />
        <button className="wpx__btn wpx__btn--primary" onClick={save}>Simpan</button>
      </div>

      {msg && <div className={`wpx__notice wpx__notice--${msg.type}`}>{msg.text}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        <div>
          <div className="wpx__card"><div className="wpx__card-body">
            <div className="wpx__field"><label className="wpx__label">Nama layanan</label>
              <input className="wpx__input" value={s.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div className="wpx__field"><label className="wpx__label">Slug</label>
              <input className="wpx__input" value={s.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto dari nama" /></div>
            <div className="wpx__field"><label className="wpx__label">Tagline (satu kalimat)</label>
              <input className="wpx__input" value={s.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} /></div>
            <div className="wpx__field"><label className="wpx__label">Body singkat (untuk grid card)</label>
              <textarea className="wpx__textarea" rows={3} value={s.body ?? ""} onChange={(e) => set("body", e.target.value)} /></div>
            <div className="wpx__field"><label className="wpx__label">Description panjang (untuk halaman detail)</label>
              <textarea className="wpx__textarea" rows={6} value={s.description ?? ""} onChange={(e) => set("description", e.target.value)} /></div>
            <div className="wpx__field"><label className="wpx__label">Deliverables (satu per baris)</label>
              <textarea className="wpx__textarea" rows={6}
                value={(s.deliverables ?? []).join("\n")}
                onChange={(e) => set("deliverables", e.target.value.split("\n").map((x) => x.trim()).filter(Boolean))} /></div>
          </div></div>
        </div>

        <aside>
          <div className="wpx__card">
            <div className="wpx__card-header">Detail</div>
            <div className="wpx__card-body">
              <div className="wpx__field"><label className="wpx__label">Icon</label>
                <select className="wpx__select" value={s.icon} onChange={(e) => set("icon", e.target.value)}>
                  {ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                </select></div>
              <div className="wpx__field"><label className="wpx__label">Tipe</label>
                <select className="wpx__select" value={s.kind ?? "service"} onChange={(e) => set("kind", e.target.value)}>
                  <option value="category">Category page</option>
                  <option value="service">Service detail</option>
                </select></div>
              {(s.kind ?? "service") === "service" && (
                <>
                  <div className="wpx__field"><label className="wpx__label">Parent category slug</label>
                    <input className="wpx__input" value={s.parent_slug ?? ""} onChange={(e) => set("parent_slug", e.target.value)} placeholder="web-development" /></div>
                  <div className="wpx__field"><label className="wpx__label">Parent category name</label>
                    <input className="wpx__input" value={s.parent_name ?? ""} onChange={(e) => set("parent_name", e.target.value)} placeholder="Web Development" /></div>
                </>
              )}
              {(s.kind ?? "service") === "category" && (
                <>
                  <div className="wpx__field"><label className="wpx__label">Service count</label>
                    <input className="wpx__input" type="number" min="0" value={s.service_count ?? ""} onChange={(e) => set("service_count", e.target.value)} placeholder="Auto dari child slugs" /></div>
                  <div className="wpx__field"><label className="wpx__label">Child service slugs (satu per baris)</label>
                    <textarea className="wpx__textarea" rows={5}
                      value={(s.child_slugs ?? []).join("\n")}
                      onChange={(e) => set("child_slugs", e.target.value.split("\n").map((x) => x.trim()).filter(Boolean))} /></div>
                </>
              )}
              <div className="wpx__field"><label className="wpx__label">Urutan (order)</label>
                <input className="wpx__input" type="number" value={s.order ?? 100} onChange={(e) => set("order", e.target.value)} /></div>
              <div className="wpx__field"><label className="wpx__label">Status</label>
                <select className="wpx__select" value={s.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="active">Active (tampil)</option>
                  <option value="draft">Draft (tidak tampil)</option>
                </select></div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
