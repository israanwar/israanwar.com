import postcss from 'postcss';

// Preserve the complete stylesheet and its cascade, while eliminating the
// additional stylesheet request before readable public HTML can paint.
export function inlineStylesheet(css, href) {
  return css.replace(/url\(([^)]+)\)/g, (original, token) => {
    const value = token.trim().replace(/^['"]|['"]$/g, '');
    if (/^(?:\/|data:|https?:|#)/i.test(value)) return original;
    const url = new URL(value, `https://build.invalid${href}`);
    return `url("${url.pathname}${url.search}${url.hash}")`;
  });
}

// Keep font registrations in their own persistent sheet. The matching
// selector rules can then be retired once the complete cascade is active.
export function separateFontFaces(css) {
  const root = postcss.parse(css);
  const fontNames = /^(font-face|font-feature-values|font-palette-values)$/i;
  function fontNode(node) {
    if (node.type !== 'atrule') return null;
    if (fontNames.test(node.name)) return node.clone();
    if (!node.nodes) return node.name === 'layer' ? node.clone() : null;
    const copy = node.clone({ nodes: [] });
    for (const child of node.nodes) {
      const selected = fontNode(child);
      if (selected) copy.append(selected);
    }
    // Preserve layer declaration order even when a layer has no fonts.
    return copy.nodes.length || node.name === 'layer' ? copy : null;
  }
  const fonts = postcss.root();
  for (const node of root.nodes) {
    const selected = fontNode(node);
    if (selected) fonts.append(selected);
  }
  root.walkAtRules(fontNames, rule => rule.remove());
  return { fonts: fonts.toString(), rules: root.toString() };
}

export function publicStartup(entry, adsSource, stylesheets = []) {
  return `
const firstPaint = new Promise(resolve => {
  if (document.hidden || performance.getEntriesByType('paint').some(e => e.name === 'first-contentful-paint')) return resolve();
  if (!globalThis.PerformanceObserver?.supportedEntryTypes.includes('paint')) return requestAnimationFrame(() => requestAnimationFrame(resolve));
  const observer = new PerformanceObserver(list => {
    if (list.getEntries().some(e => e.name === 'first-contentful-paint')) finish();
  });
  const visibility = () => { if (document.hidden) finish(); };
  function finish() { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); resolve(); }
  document.addEventListener('visibilitychange', visibility);
  observer.observe({type:'paint', buffered:true});
});
await firstPaint;
if (!document.hidden) {
  // Let bundled fonts settle without making app startup wait indefinitely
  // for a font request. The visible HTML is retained throughout this phase.
  await Promise.race([document.fonts?.ready, new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))]);
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}
await Promise.all(${JSON.stringify(stylesheets)}.map(href => new Promise(resolve => {
  const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = href;
  // The initial inline CSS already installs every font face. Keep this sheet
  // inactive until its duplicate faces are removed, then activate its complete
  // non-font cascade atomically. This also retains the original asset URL for
  // Vite's dependency deduplication and leaves private/invoice CSS untouched.
  link.media = 'not all';
  link.onload = () => {
    function removeDuplicateFaces(sheet) {
      for (let index = sheet.cssRules.length - 1; index >= 0; index--) {
        const rule = sheet.cssRules[index];
        if (rule.type === CSSRule.FONT_FACE_RULE) sheet.deleteRule(index);
        else if (rule.cssRules) removeDuplicateFaces(rule);
      }
    }
    try { removeDuplicateFaces(link.sheet); }
    catch (error) { console.warn('Deferred font deduplication failed:', error); }
    link.media = 'all';
    // Retain the original font-face registrations while removing redundant
    // bootstrap selector rules. Failed downloads retain their initial CSS.
    for (const style of document.querySelectorAll('style[data-build-stylesheet]')) {
      if (style.dataset.buildStylesheet === href && style.dataset.initialRules === 'true') style.remove();
    }
    resolve();
  };
  link.onerror = () => { console.warn('Deferred stylesheet failed:', href); resolve(); };
  document.head.append(link);
})));
await import(${JSON.stringify(entry)});
${adsSource ? `const loadAds = () => {
  const script = document.createElement('script');
  script.async = true; script.crossOrigin = 'anonymous';
  script.src = ${JSON.stringify(adsSource)};
  document.head.append(script);
};
if ('requestIdleCallback' in window) requestIdleCallback(loadAds, {timeout:1000});
else requestAnimationFrame(loadAds);` : ''}
`;
}

function insideKeyframes(rule) {
  for (let parent = rule.parent; parent; parent = parent.parent) {
    if (parent.type === 'atrule' && /keyframes$/i.test(parent.name)) return true;
  }
  return false;
}

export function stylesheetSelectors(css) {
  const selectors = new Set();
  postcss.parse(css).walkRules(rule => { if (!insideKeyframes(rule)) selectors.add(rule.selector); });
  return [...selectors];
}

// Keep the original declarations, browser fallbacks, media conditions, and
// order. The browser only answers which selectors match the existing DOM;
// its CSSOM serialization must not discard another browser's declarations.
export function matchedStylesheet(css, matched) {
  const root = postcss.parse(css);
  root.walkRules(rule => { if (!insideKeyframes(rule) && !matched.has(rule.selector)) rule.remove(); });
  root.walkAtRules(rule => { if (rule.nodes?.length === 0 && rule.name !== 'layer') rule.remove(); });
  return root.toString();
}
