import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useLiveSettings } from '../../hooks/usePageData';
import { RATE_CARD } from '../../data/rateCard';
import { calculateEstimate, equivalentRate, priceLabel, rupiah, serviceRate } from '../../lib/rateCard';
import '../../styles/service-pricing.css';

export function ServicePrice({ service, lang }) {
  const item = serviceRate(RATE_CARD, service);
  return <p className="service-price">{priceLabel(item, lang)}{item?.monthly && item.minMonths > 1 && <small>{lang === 'id' ? 'Minimum' : 'Minimum'} {item.minMonths} {lang === 'id' ? 'bulan' : 'months'}</small>}</p>;
}
export function ServicePackageLink({ service, lang }) {
  const item = serviceRate(RATE_CARD, service);
  const isCategory = service?.kind === 'category';
  const query = isCategory ? `?category=${encodeURIComponent(service.slug)}` : item ? `?rate=${encodeURIComponent(item.id)}` : '';
  return <Link className="okr__btn okr__btn--primary" to={`/services${query}#build-package`}>{isCategory ? 'Build Your Own Package' : lang === 'id' ? 'Tambahkan ke Paket' : 'Add to Custom Package'}</Link>;
}

export function ServicePricing({ lang }) {
  const id = lang === 'id';
  const settings = useLiveSettings();
  const [params] = useSearchParams();
  const location = useLocation();
  useEffect(() => {
    if (location.hash !== "#build-package") return;
    const frame = requestAnimationFrame(() => document.getElementById("build-package")?.scrollIntoView());
    return () => cancelAnimationFrame(frame);
  }, [location.hash, location.search]);
  const [category, setCategory] = useState('web-development');
  const [search, setSearch] = useState('');
  const [selection, setSelection] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('israanwar-service-package') || '{}');
      return Object.fromEntries(RATE_CARD.filter(item => saved?.[item.id]).map(item => [item.id, Math.min(9999, Math.max(1, Math.floor(Number(saved[item.id]) || 1)))]));
    } catch { return {}; }
  });
  useEffect(() => {
    try { sessionStorage.setItem('israanwar-service-package', JSON.stringify(selection)); } catch { /* Selection still works without browser storage. */ }
  }, [selection]);
  useEffect(() => {
    const requestedCategory = params.get('category');
    if (RATE_CARD.some(item => item.category === requestedCategory)) setCategory(requestedCategory);
    const item = RATE_CARD.find(i => i.id === params.get('rate'));
    if (item) { setSelection(s => RATE_CARD.some(row => s[row.id] && row.id !== item.id && equivalentRate(row, item)) ? s : ({ ...s, [item.id]: s[item.id] || 1 })); setCategory(item.category); }
  }, [params]);
  const categories = useMemo(() => [...new Map(RATE_CARD.map(i => [i.category, i.categoryName])).entries()], []);
  const visible = RATE_CARD.filter(i => i.price !== 'Build Your Own' && (search ? `${i.name} ${i.categoryName} ${i.section}`.toLowerCase().includes(search.toLowerCase()) : i.category === category));
  const groups = [...new Set(visible.map(i => i.section))];
  const totals = calculateEstimate(RATE_CARD, selection);
  const change = (item, checked) => setSelection(s => { const next = { ...s }; if (checked) next[item.id] = 1; else delete next[item.id]; return next; });
  const message = [id ? 'Halo, saya ingin penawaran untuk paket berikut:' : 'Hi, I would like a quote for this package:', ...totals.rows.map(i => `${i.categoryName} / ${i.section}: ${i.name} × ${i.quantity} — ${i.price}${i.minMonths > 1 ? ` (minimum ${i.minMonths} ${id ? 'bulan' : 'months'})` : ''}`), `${id ? 'Estimasi proyek' : 'Project estimate'}: ${rupiah(totals.project)}`, `${id ? 'Estimasi bulanan' : 'Monthly estimate'}: ${rupiah(totals.monthly)}`, totals.rows.some(i => i.minMonths > 1) ? `${id ? 'Total komitmen minimum layanan bulanan' : 'Minimum commitment for monthly services'}: ${rupiah(totals.commitment)}` : '', totals.custom ? (id ? 'Pilihan custom memerlukan penawaran tambahan.' : 'Additional custom quote required.') : '', id ? 'Scope dan fitur yang tumpang tindih perlu dikonfirmasi. Biaya pihak ketiga tidak termasuk.' : 'Final scope and overlap review required. Third-party costs excluded.'].filter(Boolean).join('\n');
  const downloadSummary = () => {
    const url = URL.createObjectURL(new Blob([message], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'israanwar-package-estimate.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  let quoteUrl = '/contact';
  try { const url = new URL(settings.whatsapp_url); if (['http:', 'https:'].includes(url.protocol)) { url.searchParams.set('text', message); quoteUrl = url.href; } } catch { /* Contact fallback while settings load. */ }
  return <section id="build-package" className="okr__section service-pricing">
    <div className="okr__wrap">
      <span className="okr__eyebrow">// BUILD YOUR OWN PACKAGE</span>
      <h2 className="okr__h2">{id ? 'Pilih layanan. Susun paketmu.' : 'Choose services. Build your package.'}</h2>
      <p className="service-pricing-intro">{id ? 'Gabungkan layanan dan add-on lintas kategori. Lihat estimasi biaya proyek dan bulanan sebelum meminta penawaran.' : 'Combine services and add-ons across categories. See project and monthly estimates before requesting a quote.'}</p>
      <div className="service-pricing-layout">
        <div>
          <div className="service-pricing-mobilebar" aria-live="polite">
            <span>{id ? 'Estimasi proyek' : 'Project estimate'}: <strong>{rupiah(totals.project)}</strong><br />{id ? 'Bulanan' : 'Monthly'}: <strong>{rupiah(totals.monthly)}</strong>{totals.custom ? ' + Custom Quote' : ''}</span>
            <a href="#package-summary">{id ? 'Lihat paket' : 'View package'} ({totals.rows.length})</a>
          </div>
          <div className="service-pricing-filters">
            <label>{id ? 'Kategori' : 'Category'}<select value={category} onChange={e => { setCategory(e.target.value); setSearch(''); }}>{categories.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
            <label>{id ? 'Cari semua layanan' : 'Search all services'}<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={id ? 'Nama layanan atau add-on…' : 'Service or add-on name…'} /></label>
          </div>
          {visible.length === 0 && <p>{id ? 'Layanan tidak ditemukan.' : 'No services found.'}</p>}
          {groups.map(group => <fieldset key={group} className="service-pricing-group"><legend>{group}</legend>{visible.filter(i => i.section === group).map(item => { const duplicate = totals.rows.find(row => row.id !== item.id && equivalentRate(row, item)); return <div key={item.id} className={`service-pricing-item ${selection[item.id] ? 'is-selected' : ''}`}>
            <label><input type="checkbox" checked={Boolean(selection[item.id])} disabled={Boolean(duplicate)} onChange={e => change(item, e.target.checked)} /><span><strong>{item.name}</strong><span>{priceLabel(item, lang)}</span>{item.minMonths > 1 && <small>{id ? 'Minimum komitmen 3 bulan' : 'Minimum commitment: 3 months'}</small>}{duplicate && <small>{id ? 'Sudah dipilih sebagai' : 'Already selected as'} {duplicate.name}. {id ? 'Hapus pilihan tersebut untuk menggantinya.' : 'Remove that selection to replace it.'}</small>}{/Blog/.test(item.name) && <small>{id ? 'Produksi artikel dihitung terpisah.' : 'Article production is priced separately.'}</small>}{item.kind === 'package' && <small>{id ? 'Isi paket dikonfirmasi dalam penawaran.' : 'Package contents confirmed in the quote.'}</small>}</span></label>
            {selection[item.id] && !item.custom && <label className="service-pricing-quantity">{id ? 'Jumlah' : 'Quantity'}<input type="number" min="1" max="9999" step="1" aria-label={`${id ? 'Jumlah' : 'Quantity'} ${item.name}`} value={selection[item.id]} onChange={e => setSelection(s => ({ ...s, [item.id]: Math.min(9999, Math.max(1, Math.floor(Number(e.target.value) || 1))) }))} /></label>}
          </div>; })}</fieldset>)}
        </div>
        <aside id="package-summary" className="service-pricing-summary" aria-label={id ? 'Ringkasan paket' : 'Package summary'}>
          <h3>{id ? 'Paket pilihanmu' : 'Your selected package'}</h3>
          {!totals.rows.length && <p>{id ? 'Pilih layanan untuk melihat estimasi.' : 'Select a service to see your estimate.'}</p>}
          <ul>{totals.rows.map(item => <li key={item.id}><div><strong>{item.name} × {item.quantity}</strong><small>{item.categoryName} · {item.section}</small><span>{item.custom ? item.price : `${rupiah(item.amount * item.quantity)}${item.monthly ? (id ? '/bulan' : '/month') : ''}`}</span></div><button type="button" onClick={() => change(item, false)} aria-label={`${id ? 'Hapus' : 'Remove'} ${item.name}`}>×</button></li>)}</ul>
          <div aria-live="polite" aria-atomic="true" className="service-pricing-totals"><p>{id ? 'Estimasi proyek' : 'Project estimate'}<strong>{rupiah(totals.project)}</strong></p><p>{id ? 'Estimasi bulanan' : 'Monthly estimate'}<strong>{rupiah(totals.monthly)}{id ? '/bulan' : '/month'}</strong></p>{totals.rows.some(i => i.minMonths > 1) && <p>{id ? 'Total komitmen minimum layanan bulanan' : 'Minimum commitment for monthly services'}<strong>{rupiah(totals.commitment)}</strong></p>}{totals.custom && <p>{id ? '+ Penawaran custom untuk pilihan tanpa harga tetap.' : '+ Custom quote for unpriced selections.'}</p>}</div>
          {totals.review && <p className="service-pricing-review">{id ? 'Pilihan add-on, paket, dan layanan serupa akan direview untuk memastikan kecocokan serta menghindari biaya ganda. Estimasi ini belum mengurangi fitur yang tumpang tindih.' : 'Add-ons, packages, and similar services require a scope review to confirm compatibility and avoid duplicate charges. This estimate has not deducted overlapping features.'}</p>}
          {totals.rows.some(item => ['SEM', 'Performance Marketing', 'Google Ads Setup', 'Meta Ads Setup', 'TikTok Ads Setup', 'Marketplace Ads Setup'].includes(item.name)) && <p className="service-pricing-review">{id ? 'Untuk akun iklan besar, fee pengelolaan adalah fee minimum atau 10% belanja iklan, mana yang lebih tinggi. Nilai belanja iklan dan klasifikasi akun dikonfirmasi dalam penawaran.' : 'For large advertising accounts, the management fee is the minimum fee or 10% of ad spend, whichever is higher. Ad spend and account classification are confirmed in the quote.'}</p>}
          <p className="service-pricing-note">{id ? 'Harga awal, bukan tagihan final. Scope, fitur, integrasi, konten, volume, timeline, dan dukungan dikonfirmasi dalam penawaran. Biaya hosting, domain, API/AI, SaaS, lisensi, iklan, dan transaksi pihak ketiga tidak termasuk.' : 'Starting prices, not a final invoice. Scope, features, integrations, content, volume, timeline, and support are confirmed in the quote. Hosting, domain, API/AI, SaaS, licenses, ad spend, and third-party transaction fees are excluded.'}</p>
          {totals.rows.length > 0 && <><a className="okr__btn okr__btn--primary" href={quoteUrl} target={quoteUrl.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{id ? 'Minta Penawaran Paket Ini' : 'Request Package Quote'}</a><button className="service-pricing-clear" type="button" onClick={downloadSummary}>{id ? 'Unduh Ringkasan Paket' : 'Download Package Summary'}</button><button className="service-pricing-clear" type="button" onClick={() => setSelection({})}>{id ? 'Kosongkan paket' : 'Clear package'}</button></>}
          <Link className="okr__link" to="/contact">{id ? 'Enterprise / Custom? Diskusikan kebutuhanmu' : 'Enterprise / Custom? Discuss your needs'}</Link>
        </aside>
      </div>
    </div>
  </section>;
}
