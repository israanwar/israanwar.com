import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TOOLS_CATALOG } from '../src/data/toolsCatalog.js';

// toolsI18n.js imports React/JSX, so read its dictionary keys from the source.
const dictSource = readFileSync(new URL('../src/lib/toolsI18n.js', import.meta.url), 'utf8');
const entries = [...dictSource.matchAll(/^  "((?:[^"\\]|\\.)*)": "((?:[^"\\]|\\.)*)",$/gm)];
const keys = new Set(entries.map((m) => JSON.parse(`"${m[1]}"`)));

const files = [
  '../src/pages/public/ToolsPage.jsx',
  '../src/pages/public/ToolDetailPage.jsx',
  '../src/components/tools/ImageCompressorWorkspace.jsx',
  '../src/components/tools/ImageResizerWorkspace.jsx',
  '../src/components/tools/InvoiceBuilderWorkspace.jsx',
];

// Printed on the generated invoice itself, which deliberately stays in English.
const DOCUMENT_ONLY = new Set(['From', 'Bill To']);

test('every tt("…") literal has an Indonesian entry', () => {
  const missing = [];
  for (const file of files) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    for (const m of source.matchAll(/\btt\(\s*"((?:[^"\\]|\\.)*)"/g)) {
      const key = JSON.parse(`"${m[1]}"`);
      if (!keys.has(key)) missing.push(`${file}: ${key}`);
    }
    // Label-like props that child components translate with tt(prop).
    for (const m of source.matchAll(/\b(?:label|title|detail|placeholder)="([A-Za-z][^"{}]*)"/g)) {
      if (!m[1].includes(' ') && !/^[A-Z]/.test(m[1])) continue; // example values like "instagram"
      if (m[1].startsWith('http') || DOCUMENT_ONLY.has(m[1])) continue;
      if (!keys.has(m[1])) missing.push(`${file}: ${m[1]}`);
    }
  }
  assert.deepEqual([...new Set(missing)], []);
});

test('catalog copy is fully translated', () => {
  const missing = [];
  for (const group of TOOLS_CATALOG) {
    for (const text of [group.name, group.description]) if (!keys.has(text)) missing.push(text);
    for (const tool of group.tools) for (const text of [tool.name, tool.description]) if (!keys.has(text)) missing.push(text);
  }
  assert.deepEqual(missing, []);
});

test('placeholders in {vars} survive translation', () => {
  for (const [, en, id] of entries) {
    const vars = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join();
    // Keys are the English text, values the Indonesian one.
    assert.equal(vars(id), vars(en), `${en} / ${id}`);
  }
});
