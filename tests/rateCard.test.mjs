import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseRateCard, calculateEstimate, equivalentRate, serviceRate, categorySlugs } from '../src/lib/rateCard.js';
import { ISRA_ANWAR_SERVICES_SEED } from '../src/data/serviceCatalog.js';
const items = parseRateCard(readFileSync(new URL('../israanwar-master-rate-card-v2.md', import.meta.url), 'utf8'));
test('every locked price row is available with exact amount and unit', () => {
  const source = readFileSync(new URL('../israanwar-master-rate-card-v2.md', import.meta.url), 'utf8');
  const rows = source.split('# Global Pricing Rules')[0].split('\n').filter(l => /^\|[^|]+\| (Rp|Custom Quote|Build Your Own)/.test(l));
  assert.equal(items.length, rows.length);
  assert.equal(new Set(items.map(i => i.id)).size, items.length);
  assert.equal(new Set(items.filter(i => i.category !== 'packages').map(i => i.category)).size, 12);
  for (const i of items) if (i.amount !== null) assert.equal(i.amount, Number(i.price.match(/^Rp([\d.]+)/)[1].replaceAll('.', '')));
});
test('all existing services and categories resolve to locked prices', () => {
  for (const service of ISRA_ANWAR_SERVICES_SEED) assert.ok(serviceRate(items, service), service.name);
  assert.equal(categorySlugs.length, 12);
});
test('cross-category package separates project, recurring and minimum commitment', () => {
  const choose = (category, name) => items.find(i => i.category === category && i.name === name && i.kind === 'service');
  const rows = [choose('web-development', 'Landing Page Development'), choose('content-creative', 'Landing Page Copywriting'), items.find(i => i.category === 'web-development' && i.name === 'Basic SEO'), items.find(i => i.category === 'web-development' && i.name === 'GA4'), choose('support-growth', 'Website Maintenance'), choose('search-optimization', 'SEO Starter')];
  const result = calculateEstimate(items, Object.fromEntries(rows.map(i => [i.id, 1])));
  assert.equal(result.project, 1100000); assert.equal(result.monthly, 1800000); assert.equal(result.commitment, 4800000); assert.equal(result.review, true);
});
test('unit quantities, removal, and custom quotes do not invent fixed amounts', () => {
  const page = items.find(i => i.name === 'Additional Page');
  const custom = items.find(i => i.name === 'Enterprise Web Development');
  const total = calculateEstimate(items, { [page.id]: 3, [custom.id]: 1 });
  assert.equal(total.project, 300000); assert.equal(total.custom, true);
  assert.equal(calculateEstimate(items, {}).project, 0);
});

test('equivalent cross-category entries are identified without conflating different scopes', () => {
  const ga4 = items.find(i => i.category === 'web-development' && i.name === 'GA4');
  assert.equal(equivalentRate(ga4, items.find(i => i.name === 'Google Analytics Setup')), true);
  const bookings = items.filter(i => i.name === 'Booking System');
  assert.equal(equivalentRate(bookings[0], bookings[1]), false);
});
