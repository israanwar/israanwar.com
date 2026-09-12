import { useEffect, useRef } from "react";

// A quiet, monochrome particle field behind the footer content — three
// nested, slowly-breathing/rotating Fibonacci-sphere shells, flattened into
// a wide band so they read well in the footer's short, wide viewport.
// Deliberately conservative on cost since the footer mounts on every page:
//   - three.js is dynamically imported, not bundled with the main chunk.
//   - The WebGL context isn't created until the footer actually scrolls
//     near the viewport (IntersectionObserver), so pages nobody scrolls to
//     the bottom of never pay for it at all.
//   - Particle count halves on narrow/mobile screens.
//   - `prefers-reduced-motion` renders one static frame instead of looping.
//   - The render loop pauses via the page visibility API instead of
//     spinning in a hidden tab.
export function FooterParticles() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let disposed = false;
    let started = false;
    let cleanup = () => {};

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started) {
          started = true;
          init();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(container);

    async function init() {
      const THREE = await import("three");
      if (disposed) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const count = window.innerWidth < 640 ? 4500 : 10000;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
      camera.position.set(0, 0, 26);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);

      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.34,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

      function resize() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w === 0 || h === 0) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      resize();
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);

      // Zero-allocation per-frame update: every particle's position/color
      // is pure math over its own index (Fibonacci-sphere distribution),
      // written straight into the typed arrays already backing the
      // geometry — nothing is created inside this loop.
      function updateParticles(time) {
        const posArr = geometry.attributes.position.array;
        const colArr = geometry.attributes.color.array;
        for (let i = 0; i < count; i++) {
          const shell = i % 3;
          const yUnit = 1 - (i / (count - 1)) * 2;
          const radiusAtY = Math.sqrt(Math.max(0, 1 - yUnit * yUnit));
          const theta = GOLDEN_ANGLE * i;
          const x = Math.cos(theta) * radiusAtY;
          const z = Math.sin(theta) * radiusAtY;

          const breathe = 1 + 0.12 * Math.sin(time * 0.25 + i * 0.0007);
          const shellScale = 1 + shell * 0.4;
          const radius = 9 * shellScale * breathe;

          const angleOffset = time * (0.04 + shell * 0.015);
          const cosA = Math.cos(angleOffset);
          const sinA = Math.sin(angleOffset);
          const xr = x * cosA - z * sinA;
          const zr = x * sinA + z * cosA;

          const idx = i * 3;
          // Flattened wide: stretched on X, compressed on Y/Z so the
          // sphere reads as a band spanning the footer's width instead
          // of mostly being cropped by its short height.
          posArr[idx] = xr * radius * 2.6;
          posArr[idx + 1] = yUnit * radius * 0.5;
          posArr[idx + 2] = zr * radius * 0.6;

          const brightness = 0.32 + 0.48 * ((yUnit + 1) / 2);
          colArr[idx] = brightness;
          colArr[idx + 1] = brightness;
          colArr[idx + 2] = brightness;
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.color.needsUpdate = true;
      }

      let rafId = 0;
      const clock = new THREE.Clock();

      function animate() {
        rafId = requestAnimationFrame(animate);
        updateParticles(clock.getElapsedTime());
        renderer.render(scene, camera);
      }

      if (reduceMotion) {
        updateParticles(0);
        renderer.render(scene, camera);
      } else {
        animate();
      }

      let pausedForVisibility = false;
      function onVisibilityChange() {
        if (document.hidden) {
          pausedForVisibility = true;
          cancelAnimationFrame(rafId);
        } else if (pausedForVisibility && !reduceMotion) {
          pausedForVisibility = false;
          animate();
        }
      }
      document.addEventListener("visibilitychange", onVisibilityChange);

      cleanup = () => {
        cancelAnimationFrame(rafId);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        resizeObserver.disconnect();
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      };
    }

    return () => {
      disposed = true;
      observer.disconnect();
      cleanup();
    };
  }, []);

  return <div ref={containerRef} className="okr__footer-particles" aria-hidden="true" />;
}
