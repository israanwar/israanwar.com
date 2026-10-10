// Fetch/parse the worker while CSS settles. SunBackground still owns rendering.
if (location.pathname === "/" && typeof Worker !== "undefined"
    && typeof HTMLCanvasElement.prototype.transferControlToOffscreen === "function"
    && !window.__ISRA_EARLY_SUN_WORKER__) {
  try {
    const worker = new Worker(new URL("./components/hero/sun.worker.js", import.meta.url), {type:"module"});
    const prepared = {worker, failed:false, timeout:0};
    window.__ISRA_EARLY_SUN_WORKER__ = prepared;
    const release = () => {
      clearTimeout(prepared.timeout);
      prepared.failed = true;
      worker.terminate();
      if (window.__ISRA_EARLY_SUN_WORKER__ === prepared) delete window.__ISRA_EARLY_SUN_WORKER__;
    };
    worker.onerror = event => { event.preventDefault(); release(); };
    prepared.timeout = window.setTimeout(release, 30000);
  } catch { /* Normal worker/main-thread fallback remains available. */ }
}
