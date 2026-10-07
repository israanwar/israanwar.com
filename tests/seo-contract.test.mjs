import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildArticle, buildWebsite, buildWebPage, buildPerson, buildService, buildProduct } from '../src/lib/structuredData.js';
import { SLUG_RENAMES } from '../src/data/slugRenames.js';
import { publicPostPath } from '../src/lib/publicPostUrls.js';

test('every legacy article resolves to the HTTP redirect destination used by the build', () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
  for (const [oldSlug, newSlug] of Object.entries(SLUG_RENAMES)) {
    const redirect = config.redirects.find(r => r.source === `/blog/${oldSlug}`);
    assert.equal(redirect?.destination, publicPostPath({slug:oldSlug}));
    assert.equal(publicPostPath({slug:newSlug}), redirect.destination);
    assert.equal(redirect.permanent, true);
  }
});

test('schema identifies actual content without invented reading, portrait, or search capabilities', () => {
  assert.equal(buildWebsite().potentialAction, undefined);
  assert.deepEqual(buildWebsite().inLanguage, ['en', 'id-ID']);
  assert.equal(buildPerson().image, undefined);
  const page = buildWebPage('/about', 'About', 'About the studio', undefined, 'en');
  assert.equal(page.speakable, undefined);
  assert.equal(page.primaryImageOfPage, undefined);
  const article = buildArticle({slug:'test',title:'Article',reading_time:20,language:'id',content:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Empat kata yang nyata'}]}]}});
  assert.equal(article.wordCount, 4);
  assert.equal(article.inLanguage, 'id-ID');
  assert.equal(article.author['@id'], 'https://www.israanwar.com/#founder');
  const service = buildService({slug:'landing-page',name:'Landing page',kind:'service'});
  assert.equal(service['@type'], 'Service');
  assert.equal(service.offers, undefined);
  assert.equal(buildService({kind:'category'}), null);
  const product = buildProduct({slug:'guide',name:'Guide',price:25000});
  assert.equal(product.offers.price, '25000');
  assert.equal(product.offers.priceCurrency, 'IDR');
  assert.equal(product.aggregateRating, undefined);
  assert.equal(product.offers.availability, undefined);
  assert.equal(buildProduct({slug:'guide',price:null}).offers, undefined);
});

test('dedicated AI bot rules preserve the private-route exclusions', () => {
  const groups = readFileSync('public/robots.txt','utf8').split(/User-agent:\s*/i).slice(1);
  for (const group of groups) {
    const agent = group.split('\n')[0];
    assert.match(group,/Allow: \/\s/,agent);
    for (const path of ['/admin','/cart','/checkout','/orders/','/order/','/private-shell.html']) {
      assert.ok(group.includes(`Disallow: ${path}\n`), `${agent}: ${path} is not excluded`);
    }
  }
});
