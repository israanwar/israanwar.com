import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const base = process.env.LANGUAGE_URL || 'http://127.0.0.1:3000';
const browser = await chromium.launch();
try {
 for (const width of [390,1440]) {
  const page = await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  async function ready(htmlLanguage, schemaLanguage) {
   await page.waitForFunction(({htmlLanguage,schemaLanguage}) => {
    const element=document.querySelector('[data-schema="webpage"]');
    return document.documentElement.lang===htmlLanguage && element && JSON.parse(element.textContent).inLanguage===schemaLanguage;
   }, {htmlLanguage,schemaLanguage});
   assert.deepEqual(await page.locator('[data-schema="website"]').evaluate(e=>JSON.parse(e.textContent).inLanguage),['en','id-ID']);
  }
  await page.goto(base+'/services');await ready('en','en');
  assert.equal(await page.locator('[property="og:locale"]').getAttribute('content'),'en_US');
  await page.locator('.okr__lang-toggle').click();await ready('id','id-ID');
  assert.equal(await page.locator('[property="og:locale"]').getAttribute('content'),'id_ID');
  await page.reload();await ready('id','id-ID');
  await page.locator('.okr__lang-toggle').click();await ready('en','en');
  await page.goto(base+'/blog/website-nya-sudah-cantik-tapi-kok-tetap-tidak-ada-yang-beli');await ready('id','id-ID');
  assert.equal(await page.locator('article[lang]').first().getAttribute('lang'),'id');
  assert.equal(await page.locator('[data-schema="article"]').evaluate(e=>JSON.parse(e.textContent).inLanguage),'id-ID');
  await page.goto(base+'/services');await ready('en','en');
  assert.equal(await page.locator('link[hreflang]').count(),0);
  assert.deepEqual(errors,[]);
  console.log(`PASS ${width}: EN/ID toggle, reload preference, article language, navigation, locale, schema`);
  await page.close();
 }
} finally { await browser.close(); }
