import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X, Check, Eye, Database } from "lucide-react";
import { getSiteSettings, updateSiteSettings } from "../../services/settingsService";
import { productsData, ordersData } from "../../lib/supabaseData";
import { pushLocalContentToSupabase } from "../../lib/supabaseSeed";
import { createDynamicQrisDataUrl } from "../../lib/qrisDynamic";
import { AdminPreviewModal } from "../../components/admin/AdminPreviewModal";

const QRIS_PREVIEW_AMOUNT = 149000;

const SECTIONS = [
  {
    title: "Situs",
    fields: [
      { key: "site_name", label: "Site name" },
      { key: "tagline", label: "Tagline" },
      { key: "description", label: "Description (EN)", textarea: true },
      { key: "description_id", label: "Description (ID)", textarea: true },
    ],
  },
  {
    title: "Kontak publik (footer & CTA)",
    fields: [
      { key: "whatsapp_number", label: "WhatsApp number" },
      { key: "whatsapp_url", label: "WhatsApp URL" },
      { key: "email", label: "Email" },
      { key: "social_linkedin", label: "LinkedIn URL" },
      { key: "social_github", label: "GitHub URL" },
      { key: "social_instagram", label: "Instagram URL" },
      { key: "social_twitter", label: "Twitter URL" },
    ],
  },
  {
    title: "Notifikasi admin (order baru)",
    fields: [
      { key: "admin_email", label: "Admin email" },
      { key: "admin_whatsapp", label: "Admin WhatsApp number" },
      { key: "admin_whatsapp_url", label: "Admin WhatsApp URL (wa.me/…)" },
    ],
  },
  {
    title: "SEO",
    fields: [
      { key: "seo_default_title", label: "Default title" },
      { key: "seo_default_description", label: "Default description (EN)", textarea: true },
      { key: "seo_default_description_id", label: "Default description (ID)", textarea: true },
    ],
  },
  {
    title: "Pembayaran QRIS",
    fields: [
      { key: "qris_merchant_name", label: "Merchant name" },
      { key: "qris_nmid", label: "NMID" },
      { key: "qris_terminal_label", label: "Terminal label" },
      { key: "qris_payload", label: "Payload QRIS statis (untuk nominal otomatis)", textarea: true },
      { key: "gopay_auto_label", label: "Auto payment label" },
      { key: "gopay_auto_enabled", label: "Aktifkan GoPay Merchant QRIS otomatis", checkbox: true },
    ],
    qrisUploader: true,
  },
];

export function AdminSettingsPage() {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");
  const [toast, setToast] = useState(null); // {type, text}
  const [previewOrderPath, setPreviewOrderPath] = useState("");
  const [dynamicQrisPreview, setDynamicQrisPreview] = useState(null);
  const [dynamicQrisPreviewError, setDynamicQrisPreviewError] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { getSiteSettings().then(setData); }, []);

  useEffect(() => {
    if (!data?.qris_payload) {
      setDynamicQrisPreview(null);
      setDynamicQrisPreviewError(null);
      return undefined;
    }

    let alive = true;
    setDynamicQrisPreview(null);
    setDynamicQrisPreviewError(null);
    createDynamicQrisDataUrl(data.qris_payload, QRIS_PREVIEW_AMOUNT, { width: 420 })
      .then((preview) => {
        if (alive) setDynamicQrisPreview(preview);
      })
      .catch((error) => {
        if (alive) setDynamicQrisPreviewError(error.message ?? "Gagal membuat preview QRIS dinamis.");
      });
    return () => { alive = false; };
  }, [data?.qris_payload]);

  // Auto-hide toast setelah 4 detik
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!data) return <p>Loading…</p>;

  function set(k, v) { setData((d) => ({ ...d, [k]: v })); }

  async function onQrisFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setToast({ type: "error", text: "File harus berupa gambar (PNG/JPG/WEBP)." });
      e.target.value = "";
      return;
    }
    if (file.size > 1024 * 1024) {
      setToast({ type: "error", text: "Ukuran maksimal 1MB. Compress dulu di tinypng.com." });
      e.target.value = "";
      return;
    }
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      set("qris_image", dataUrl);
      setToast({ type: "success", text: "Gambar QRIS statis di-preview. Nominal otomatis tetap memakai payload QRIS di bawah." });
    } catch (err) {
      setToast({ type: "error", text: "Gagal membaca file: " + err.message });
    } finally {
      e.target.value = "";
    }
  }

  function removeQris() {
    set("qris_image", "");
    setToast({ type: "info", text: "Gambar QRIS dihapus. Klik Simpan untuk konfirmasi." });
  }

  async function generateTestOrder(currentData) {
    setToast(null);
    try {
      // Simpan dulu settings terbaru (biar QRIS current ter-apply di test order)
      const patch = { ...currentData };
      delete patch.updated_at;
      await updateSiteSettings(patch);
      const anyProduct = (await productsData.list({ status: "active" }))[0] ?? {
        id: "test-item", name: "Test Item", price: 149000, image_url: "",
      };
      const testOrder = await ordersData.create({
        customer_name: "Test Customer (admin preview)",
        customer_email: "test@israanwar.com",
        customer_phone: currentData.admin_whatsapp ?? "",
        shipping_address: "Preview order — bisa dihapus dari /admin/orders",
        notes: "Order preview yang dibuat dari halaman Settings",
        payment_method: "qris",
        items: [{ product_id: anyProduct.id, name: anyProduct.name, price: anyProduct.price ?? 149000, qty: 1, subtotal: anyProduct.price ?? 149000 }],
        total: anyProduct.price ?? 149000,
      });
      setPreviewOrderPath(`/order/${testOrder.order_number}`);
    } catch (e) {
      setToast({ type: "error", text: e.message ?? "Gagal membuat order preview." });
    }
  }

  async function save() {
    setBusy(true);
    setToast(null);
    try {
      const patch = { ...data };
      delete patch.updated_at;
      await updateSiteSettings(patch);
      // Redirect ke dashboard, toast dipassing via navigation state
      nav("/admin", { state: { toast: { type: "success", text: "✓ Settings tersimpan." } } });
    } catch (e) {
      const msg = e?.name === "QuotaExceededError"
        ? "Storage penuh. Gambar QRIS terlalu besar — coba compress di tinypng.com."
        : (e?.message ?? "Gagal menyimpan.");
      setToast({ type: "error", text: msg });
      setBusy(false);
    }
  }

  async function syncLocalContent() {
    setSyncBusy(true);
    setSyncStatus("starting");
    setToast(null);
    try {
      const result = await pushLocalContentToSupabase({
        onProgress: (status) => setSyncStatus(status),
      });
      setToast({
        type: "success",
        text: `Konten lokal terkirim ke Supabase: ${result.posts} posts, ${result.products} products, ${result.services} services, ${result.pages} pages.`,
      });
    } catch (e) {
      setToast({ type: "error", text: e.message ?? "Gagal sync ke Supabase." });
    } finally {
      setSyncBusy(false);
      setSyncStatus("");
    }
  }

  return (
    <>
      {/* Toast — floating fixed di kanan atas biar selalu terlihat tanpa harus scroll */}
      {toast && (
        <div style={{
          position: "fixed", top: 76, right: 24, zIndex: 100,
          minWidth: 300, maxWidth: 420,
          padding: "14px 18px", borderRadius: 10,
          background: toast.type === "success" ? "rgba(34, 197, 94, 0.15)"
            : toast.type === "error" ? "rgba(239, 68, 68, 0.15)"
            : "rgba(201, 87, 50, 0.15)",
          border: `1px solid ${
            toast.type === "success" ? "rgba(34,197,94,0.5)"
            : toast.type === "error" ? "rgba(239,68,68,0.5)"
            : "rgba(201,87,50,0.5)"
          }`,
          color: toast.type === "success" ? "#86efac"
            : toast.type === "error" ? "#fca5a5"
            : "var(--primary)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", gap: 10,
          fontSize: 14, fontWeight: 500,
        }}>
          {toast.type === "success" && <Check size={16} />}
          <span>{toast.text}</span>
        </div>
      )}

      <div className="wpx__page-header">
        <h1>Settings</h1>
        <div className="spacer" />
        <button className="wpx__btn wpx__btn--secondary" onClick={syncLocalContent} disabled={syncBusy}>
          <Database size={14} /> {syncBusy ? `Syncing ${syncStatus ? `· ${syncStatus}` : "…"}` : "Sync local → Supabase"}
        </button>
        <button className="wpx__btn wpx__btn--primary" onClick={save} disabled={busy}>
          {busy ? "Menyimpan…" : "Simpan"}
        </button>
      </div>

      {SECTIONS.map((section) => (
        <div className="wpx__card" key={section.title}>
          <div className="wpx__card-header">{section.title}</div>
          <div className="wpx__card-body">
            {section.qrisUploader && (
              <div className="wpx__field">
                <label className="wpx__label">Gambar QRIS</label>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
                  {/* Preview container — flex+centered, dijamin tidak overflow */}
                  <div style={{
                    width: 220, height: 220,
                    background: "#ffffff", borderRadius: 12,
                    border: "1px solid var(--border)",
                    position: "relative",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}>
                    {data.qris_image ? (
                      <>
                        <img
                          src={data.qris_image}
                          alt="QRIS preview"
                          style={{
                            width: "100%", height: "100%",
                            objectFit: "contain",
                            display: "block",
                            padding: 10,
                            boxSizing: "border-box",
                          }}
                        />
                        <button
                          type="button" onClick={removeQris}
                          title="Hapus"
                          style={{
                            position: "absolute", top: 6, right: 6,
                            width: 26, height: 26, borderRadius: "50%",
                            background: "#ef4444", color: "#fff", border: "2px solid #fff",
                            cursor: "pointer", display: "grid", placeItems: "center",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                          }}
                        ><X size={14} /></button>
                      </>
                    ) : (
                      <div style={{
                        width: "100%", height: "100%",
                        display: "grid", placeItems: "center",
                        color: "#888", fontSize: 12, textAlign: "center",
                      }}>
                        Belum ada QRIS
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 220 }}>
                    <button
                      type="button"
                      className="wpx__btn wpx__btn--secondary"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload size={14} /> {data.qris_image ? "Ganti gambar QRIS" : "Upload gambar QRIS"}
                    </button>
                    <input
                      ref={fileRef} type="file" accept="image/*"
                      onChange={onQrisFile} style={{ display: "none" }}
                    />
                    <p className="wpx__help" style={{ marginTop: 10 }}>
                      Upload screenshot QRIS (PNG/JPG, maks 1MB) hanya sebagai arsip/fallback visual. Nominal otomatis dibuat dari field <b>Payload QRIS statis</b>.
                    </p>
                    <p className="wpx__help" style={{ marginTop: 6 }}>
                      💡 Tips: kalau file terlalu besar, kompres gambar sebelum diunggah.
                    </p>
                    {data.qris_image && (
                      <button
                        type="button"
                        className="wpx__btn wpx__btn--secondary"
                        style={{ marginTop: 12 }}
                        onClick={() => generateTestOrder(data)}
                      >
                        <Eye size={13} /> Test di halaman pembayaran customer
                      </button>
                    )}
                  </div>
                </div>

                {/* Preview: how customer sees the payment page */}
                {(data.qris_image || dynamicQrisPreview || dynamicQrisPreviewError) && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{
                      padding: "10px 14px", background: "rgba(34,197,94,0.08)",
                      border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8,
                      fontSize: 13, color: "#86efac", marginBottom: 14,
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <Check size={14} /> QRIS tersimpan — payment page membuat QR baru sesuai total order
                    </div>
                    <div style={{
                      background: "#0a0912", borderRadius: 12, padding: 24,
                      border: "1px solid var(--border)",
                    }}>
                      <div style={{ fontSize: 11, color: "var(--primary)", letterSpacing: 2, marginBottom: 4, textTransform: "uppercase" }}>Preview QRIS nominal otomatis</div>
                      {/* This panel's background is a literal dark color (phone/scanner
                          mockup, independent of the dashboard's light theme), so its text
                          is hardcoded light rather than the var(--text*) tokens — those
                          now mean "dark text for the light dashboard" everywhere else. */}
                      <div style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 18, lineHeight: 1.5 }}>
                        Scan preview ini untuk mengetes nominal Rp 149.000. Jangan scan gambar QRIS statis di kiri karena nominalnya memang kosong.
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, alignItems: "center" }}>
                        <div style={{
                          background: "#fff", padding: 12, borderRadius: 10,
                          width: 180, height: 180,
                        }}>
                          {dynamicQrisPreview ? (
                            <img src={dynamicQrisPreview.dataUrl} alt="Preview QRIS dinamis" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#111", textAlign: "center", fontSize: 12 }}>
                              {dynamicQrisPreviewError || "Membuat preview..."}
                            </div>
                          )}
                        </div>
                        <div style={{ color: "#ececf1", fontSize: 13 }}>
                          <div style={{ color: "#71717a", fontSize: 11, marginBottom: 4 }}>Merchant</div>
                          <div style={{ fontWeight: 700, marginBottom: 10 }}>{data.qris_merchant_name || "—"}</div>
                          <div style={{ color: "#71717a", fontSize: 11, marginBottom: 4 }}>NMID</div>
                          <div style={{ fontFamily: "monospace", marginBottom: 10 }}>{data.qris_nmid || "—"}</div>
                          <div style={{ color: "#71717a", fontSize: 11, marginBottom: 4 }}>Terminal</div>
                          <div style={{ fontFamily: "monospace", marginBottom: 10 }}>{data.qris_terminal_label || "—"}</div>
                          <div style={{ color: "#71717a", fontSize: 11, marginBottom: 4 }}>Total</div>
                          <div style={{ color: "var(--primary)", fontSize: 22, fontWeight: 700 }}>Rp {QRIS_PREVIEW_AMOUNT.toLocaleString("id-ID")}</div>
                          {dynamicQrisPreview && (
                            <div style={{ color: "#71717a", fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>
                              Mode QRIS: dinamis / amount embedded
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {section.fields.map((f) => (
              <div key={f.key} className="wpx__field">
                <label className="wpx__label">{f.label}</label>
                {f.checkbox ? (
                  <label style={{
                    display: "inline-flex", alignItems: "center", gap: 10,
                    color: "var(--text)", fontSize: 14, fontWeight: 600,
                  }}>
                    <input
                      type="checkbox"
                      checked={data[f.key] === true || data[f.key] === "true"}
                      onChange={(e) => set(f.key, e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: "var(--primary)" }}
                    />
                    {data[f.key] === true || data[f.key] === "true" ? "Aktif" : "Nonaktif"}
                  </label>
                ) : f.textarea ? (
                  <textarea className="wpx__textarea" value={data[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
                ) : (
                  <input className="wpx__input" value={data[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ textAlign: "right", marginTop: 20, paddingBottom: 20 }}>
        <button className="wpx__btn wpx__btn--primary" onClick={save} disabled={busy}
          style={{ padding: "12px 24px", fontSize: 15 }}>
          {busy ? "Menyimpan…" : "Simpan semua"}
        </button>
      </div>
      {previewOrderPath && <AdminPreviewModal path={previewOrderPath} title="Preview pembayaran customer" onClose={() => setPreviewOrderPath("")} />}
    </>
  );
}
