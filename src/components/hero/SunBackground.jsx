import { useEffect, useRef, useState } from "react";
import "./HeroPointCloud.css";
const FALLBACK_SRC = "/assets/3d/okka-fallback.jpg";
function getKeepAliveHost() {
 let host=document.getElementById("okr-sun-keepalive");
 if(!host){host=document.createElement("div");host.id="okr-sun-keepalive";host.style.cssText="position:fixed;top:0;left:0;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none";document.body.appendChild(host);}return host;
}
async function createRenderer(shell, canvas, menu) {
  const isMobile = innerWidth <= 767;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (typeof Worker !== "undefined" && typeof canvas.transferControlToOffscreen === "function") {
    let worker;
    const cleanups = [];
    const failureListeners = new Set();
    let failure = null;
    let readyResolve, readyReject, frameResolve, frameReject;
    const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
    let painted;
    const dispose = () => {
      worker?.terminate();
      cleanups.splice(0).forEach(cleanup => cleanup());
    };
    const fail = error => {
      if (failure) return;
      failure = error instanceof Error ? error : new Error(error?.message || "Sun worker failed");
      readyReject(failure);
      frameReject?.(failure);
      dispose();
      failureListeners.forEach(listener => listener(failure));
    };
    try {
      worker = new Worker(new URL("./sun.worker.js", import.meta.url), { type: "module" });
      worker.onmessage = ({ data }) => {
        if (data.type === "ready") readyResolve();
        else if (data.type === "frame") frameResolve?.();
        else if (data.type === "error") fail(new Error(data.message));
      };
      worker.onerror = event => { event.preventDefault(); fail(event); };
      const offscreen = canvas.transferControlToOffscreen();
      worker.postMessage({ type: "init", canvas: offscreen, isMobile, reducedMotion, menu,
        pixelRatio: devicePixelRatio || 1, height: innerHeight }, [offscreen]);
      await ready;
      painted = new Promise((resolve, reject) => { frameResolve = resolve; frameReject = reject; });
      // A stopped/failed renderer can be released before its first draw.
      painted.catch(() => {});
      shell.dataset.renderer = "worker";
      const send = (type, extra = {}) => { if (!failure) worker.postMessage({ type, ...extra }); };
      const resize = () => {
        const r = shell.getBoundingClientRect();
        if (r.width && r.height) send("resize", { bounds: { left: r.left, top: r.top,
          width: r.width, height: r.height }, height: innerHeight });
      };
      const listen = (target, type, listener) => {
        target.addEventListener(type, listener, { passive: true });
        cleanups.push(() => target.removeEventListener(type, listener));
      };
      const forward = (target, type) => event => send("event", { target, eventType: type,
        event: { clientX: event.clientX, clientY: event.clientY } });
      for (const type of ["pointermove", "pointerleave", "pointerdown"]) listen(shell, type, forward("surface", type));
      for (const type of ["pointermove", "pointerup", "pointercancel"]) listen(window, type, forward("window", type));
      listen(window, "scroll", () => { resize(); send("scroll"); });
      listen(document, "visibilitychange", () => send("visibility", { hidden: document.hidden }));
      const observer = new ResizeObserver(resize);
      observer.observe(shell);
      cleanups.push(() => observer.disconnect());
      return {
        resize, dispose,
        start() { if (failure) return Promise.reject(failure); resize(); send("start"); return painted; },
        stop() { send("stop"); },
        onFailure(listener) { failureListeners.add(listener); return () => failureListeners.delete(listener); },
      };
    } catch {
      dispose();
      // A transferred canvas cannot be used by the compatibility renderer.
      // Replace it before trying the same animation on the main thread.
      canvas.replaceWith(canvas = document.createElement("canvas"));
    }
  }
  const { createSunEngine } = await import("./sunEngine.js");
  shell.dataset.renderer = "main";
  return createSunEngine({ canvas, surface: shell, isMobile, reducedMotion, menu,
    environment: { window, document, ResizeObserver,
      requestAnimationFrame: requestAnimationFrame.bind(window),
      cancelAnimationFrame: cancelAnimationFrame.bind(window) } });
}
function createSharedSunFactory({ menu = false } = {}) {
  let shared = null, pending = null;
  return function ensure() {
    if (shared) return Promise.resolve(shared);
    if (pending) return pending;
    pending = (async () => {
      const shell = document.createElement("div");
      shell.className = "okr__isra-cloud-stage";
      shell.setAttribute("aria-hidden", "true");
      const canvas = document.createElement("canvas");
      shell.appendChild(canvas);
      const renderer = await createRenderer(shell, canvas, menu);
      const wrappers = new Map(), failureListeners = new Set();
      let attachedWrapper = null;
      const instance = {
        shellEl: shell,
        onFailure(listener) { failureListeners.add(listener); return () => failureListeners.delete(listener); },
        async attach(wrapper) {
          wrappers.set(wrapper, (wrappers.get(wrapper) || 0) + 1);
          if (attachedWrapper !== wrapper) { wrapper.appendChild(shell); attachedWrapper = wrapper; }
          await renderer.start();
          requestAnimationFrame(renderer.resize);
        },
        detach(wrapper) {
          const remaining = (wrappers.get(wrapper) || 0) - 1;
          if (remaining > 0) wrappers.set(wrapper, remaining);
          else wrappers.delete(wrapper);
          if (wrappers.size) return;
          renderer.stop();
          if (attachedWrapper === wrapper) { getKeepAliveHost().appendChild(shell); attachedWrapper = null; }
        },
      };
      renderer.onFailure?.(error => {
        if (shared === instance) shared = null;
        renderer.dispose();
        shell.remove();
        failureListeners.forEach(listener => listener(error));
      });
      shared = instance;
      return instance;
    })().finally(() => { pending = null; });
    return pending;
  };
}
const ensureShared=createSharedSunFactory();
const ensureMenuShared=createSharedSunFactory({menu:true});
export function SunBackground({ onReady, variant = "page" }) {
  const ensure = variant === "menu" ? ensureMenuShared : ensureShared;
  const wrapperRef = useRef(null);
  const [mode, setMode] = useState("loading");

  useEffect(() => {
    onReady?.(mode !== "loading");
  }, [mode, onReady]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || mode === "fallback") return undefined;
    let cancelled = false;
    let attachedShared = null;
    let attached = false;
    let observer = null;
    let unsubscribeFailure = null;
    const handleFailure = () => {
      observer?.disconnect();
      if (!cancelled) setMode("fallback");
    };

    ensure()
      .then(async (instance) => {
        if (cancelled) return;
        attachedShared = instance;
        unsubscribeFailure = instance.onFailure(handleFailure);
        attached = true;
        await instance.attach(wrapper);
        if (cancelled) { instance.detach(wrapper); return; }
        attached = true;
        if (variant === "page" && typeof IntersectionObserver !== "undefined") {
          observer = new IntersectionObserver(([entry]) => {
            if (cancelled) return;
            if (entry.isIntersecting && !attached) {
              instance.attach(wrapper).catch(handleFailure);
              attached = true;
            } else if (!entry.isIntersecting && attached) {
              instance.detach(wrapper);
              attached = false;
            }
          });
          observer.observe(wrapper);
        }
        setMode("ready");
      })
      .catch(handleFailure);

    return () => {
      cancelled = true;
      observer?.disconnect();
      unsubscribeFailure?.();
      if (attached) attachedShared?.detach(wrapper);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wrapperClass = variant === "menu" ? "okr__isra-cloud" : "okr__isra-cloud okr__sun-hero-bg";
  return (
    <div ref={wrapperRef} className={wrapperClass} data-mode={mode}>
      {mode === "fallback" && (
        <img className="okr__isra-cloud-fallback" src={FALLBACK_SRC} alt="" aria-hidden="true" loading="lazy" />
      )}
    </div>
  );
}
