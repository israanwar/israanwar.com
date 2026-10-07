// Parse the locked document directly: no separate copy of the prices to drift.
export const categorySlugs = ['web-development', 'mobile-app-development', 'ui-ux-design', 'search-optimization', 'ai-automation', 'branding-marketing-selling', 'content-creative', 'e-commerce-solutions', 'analytics-data-intelligence', 'digital-systems', 'strategy-digital-transformation', 'support-growth'];
export function parseRateCard(markdown) {
  let category = '', categoryName = '', section = '', kind = 'service', packages = false;
  const items = [];
  for (const line of markdown.split('\n')) {
    const heading = line.match(/^# (\d+)\. (.+)$/);
    if (heading) { category = categorySlugs[Number(heading[1]) - 1]; categoryName = heading[2]; section = categoryName; kind = 'service'; packages = false; continue; }
    if (line.startsWith('# ')) { packages = line === '# Ready-Made Packages'; category = packages ? 'packages' : ''; categoryName = 'Ready-Made Packages'; section = categoryName; kind = 'package'; }
    if (line.startsWith('##')) { section = line.replace(/^#+ /, ''); kind = /add-ons/i.test(section) ? 'addon' : 'service'; }
    if (!category || !line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map(s => s.trim());
    const [name, price] = cells;
    if (!name || !/^(Rp|Custom Quote|Build Your Own)/.test(price || '')) continue;
    const amount = price.startsWith('Rp') ? Number(price.match(/^Rp([\d.]+)/)[1].replaceAll('.', '')) : null;
    const unit = price.includes('/') ? price.split('/')[1] : 'project';
    const monthly = unit === 'month';
    const minMonths = monthly && ((category === 'search-optimization') || name === 'SEO Maintenance' || (packages && /SEO/.test(name))) ? 3 : 1;
    items.push({ id: `${category}:${section}:${name}`, category, categoryName, section, kind, name, price, amount, unit, monthly, minMonths, custom: amount === null, openEnded: price.includes('+') });
  }
  return items;
}
export const rupiah = value => `Rp${new Intl.NumberFormat('id-ID').format(value)}`;
export function priceLabel(item, lang = 'id') {
  if (!item) return lang === 'id' ? 'Custom Quote' : 'Custom Quote';
  if (item.custom) return item.price;
  const units = { project: lang === 'id' ? 'proyek' : 'project', month: lang === 'id' ? 'bulan' : 'month', page: lang === 'id' ? 'halaman' : 'page', screen: 'screen', flow: 'flow', language: lang === 'id' ? 'bahasa' : 'language', integration: lang === 'id' ? 'integrasi' : 'integration', article: lang === 'id' ? 'artikel' : 'article', content: lang === 'id' ? 'konten' : 'content', email: 'email', slide: 'slide', post: 'post', schema: 'schema', product: lang === 'id' ? 'produk' : 'product', category: lang === 'id' ? 'kategori' : 'category', platform: 'platform', event: 'event', API: 'API', process: lang === 'id' ? 'proses' : 'process' };
  return `${lang === 'id' ? 'Mulai dari' : 'Starting from'} ${rupiah(item.amount)}${item.openEnded ? '+' : ''} / ${units[item.unit] || item.unit}`;
}
const aliases = {
  'Android App Development': 'Android App', 'iOS App Development': 'iOS App', 'Cross-Platform App Development': 'Cross-Platform App', 'Progressive Web App (PWA)': 'Progressive Web App', 'AI Agent Development': 'AI Agent', 'AI Chatbot Development': 'AI Chatbot', 'Custom AI Solution Development': 'Custom AI Solution', 'Search Engine Marketing (SEM)': 'SEM', 'Conversion Rate Optimization (CRO)': 'CRO', 'E-Commerce Website Development': 'E-Commerce Website', 'Inventory System Integration': 'Inventory Integration', 'Google Tag Manager Setup': 'Google Tag Manager', 'Business Intelligence Dashboard': 'BI Dashboard', 'Client Portal Development': 'Client Portal', 'Customer Portal Development': 'Customer Portal', 'Employee Portal Development': 'Employee Portal', 'Learning Management System (LMS)': 'LMS', 'Booking & Reservation System': 'Booking System', 'Internal Dashboard Development': 'Internal Dashboard', 'Document Management System': 'Document Management', 'Custom Business System Development': 'Custom Business System', 'Growth Strategy Consulting': 'Growth Strategy', 'Answer Engine Optimization (AEO)': 'Website AEO Optimization', 'Generative Engine Optimization (GEO)': 'Website GEO Optimization', 'Entity SEO': 'Entity SEO Optimization',
};
export function serviceRate(items, service) {
  if (!service) return null;
  const category = service.kind === 'category' ? service.slug : service.parent_slug;
  const candidates = items.filter(i => i.category === category && i.kind === 'service');
  if (service.kind === 'category') return candidates.filter(i => !i.custom).sort((a,b) => a.amount - b.amount)[0];
  const name = aliases[service.name] || service.name;
  return candidates.find(i => i.name === name) || null;
}
export function equivalentRate(a, b) {
  const normalize = name => ({ 'GA4': 'ga4-setup', 'GA4 Setup': 'ga4-setup', 'Google Analytics Setup': 'ga4-setup', 'Search Console': 'search-console', 'Search Console Setup': 'search-console', 'Google Tag Manager Setup': 'Google Tag Manager' }[name] || name);
  return a.amount !== null && a.amount === b.amount && a.unit === b.unit && normalize(a.name) === normalize(b.name);
}
export function calculateEstimate(items, selection) {
  const rows = items.filter(i => selection[i.id]).map(item => ({ ...item, quantity: Math.min(9999, Math.max(1, Math.floor(Number(selection[item.id]) || 1))) }));
  return { rows, project: rows.filter(i => !i.monthly).reduce((sum,i) => sum + (i.amount || 0) * i.quantity, 0), monthly: rows.filter(i => i.monthly).reduce((sum,i) => sum + i.amount * i.quantity, 0), commitment: rows.filter(i => i.monthly).reduce((sum,i) => sum + i.amount * i.quantity * i.minMonths, 0), custom: rows.some(i => i.custom), review: rows.length > 1 || rows.some(i => i.kind === 'addon' || i.kind === 'package') };
}
