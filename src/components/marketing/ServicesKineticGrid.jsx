import { useCallback, useEffect, useRef } from "react";

const CELL_SIZE = 64;
const INFLUENCE_RADIUS = 250;
const MAX_WARP = 20;
const DOT_SPACING = 30;
const LERP_SPEED = 0.08;
const LINE_BASE = { r: 255, g: 255, b: 255, a: 0.11 };
const LAVENDER = { r: 203, g: 183, b: 255, a: 0.78 };

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function colorBetween(start, end, amount) {
  return `rgba(${Math.round(lerp(start.r, end.r, amount))}, ${Math.round(lerp(start.g, end.g, amount))}, ${Math.round(lerp(start.b, end.b, amount))}, ${lerp(start.a, end.a, amount).toFixed(3)})`;
}

export function ServicesKineticGrid({ scope = "section" }) {
  const canvasRef = useRef(null);
  const pointerRef = useRef({ x: -9999, y: -9999 });
  const targetRef = useRef({ x: -9999, y: -9999 });
  const ripplesRef = useRef([]);
  const frameRef = useRef(0);
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });

  const draw = useCallback((now) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const { width, height, dpr } = sizeRef.current;
    const pointer = pointerRef.current;
    const ripples = ripplesRef.current;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    context.fillStyle = "rgba(255, 255, 255, 0.055)";
    for (let x = DOT_SPACING / 2; x < width; x += DOT_SPACING) {
      for (let y = DOT_SPACING / 2; y < height; y += DOT_SPACING) {
        context.beginPath();
        context.arc(x, y, 0.65, 0, Math.PI * 2);
        context.fill();
      }
    }

    for (let index = ripples.length - 1; index >= 0; index -= 1) {
      const age = (now - ripples[index].born) / 1000;
      ripples[index].radius = age * 330;
      ripples[index].opacity = Math.max(0, 1 - age * 1.15);
      if (!ripples[index].opacity) ripples.splice(index, 1);
    }

    const columns = Math.max(2, Math.ceil(width / CELL_SIZE)) + 1;
    const rows = Math.max(2, Math.ceil(height / CELL_SIZE)) + 1;
    const cellWidth = width / (columns - 1);
    const cellHeight = height / (rows - 1);
    const points = [];
    const proximity = [];

    for (let row = 0; row < rows; row += 1) {
      points[row] = [];
      proximity[row] = [];
      for (let column = 0; column < columns; column += 1) {
        const x = column * cellWidth;
        const y = row * cellHeight;
        const edge = Math.min(column / 1.5, (columns - 1 - column) / 1.5, row / 1.5, (rows - 1 - row) / 1.5, 1);
        const pin = Math.max(0, edge) ** 2;
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const distance = Math.hypot(dx, dy);
        const near = Math.max(0, 1 - distance / INFLUENCE_RADIUS) * pin;
        let rippleX = 0;
        let rippleY = 0;

        ripples.forEach((ripple) => {
          const rippleDx = x - ripple.x;
          const rippleDy = y - ripple.y;
          const rippleDistance = Math.hypot(rippleDx, rippleDy);
          const difference = rippleDistance - ripple.radius;
          if (Math.abs(difference) < 52) {
            const force = (1 - Math.abs(difference) / 52) * ripple.opacity * 15 * pin;
            const angle = Math.atan2(rippleDy, rippleDx);
            const direction = difference < 0 ? 1 : -1;
            rippleX += Math.cos(angle) * force * direction;
            rippleY += Math.sin(angle) * force * direction;
          }
        });

        let warpX = 0;
        let warpY = 0;
        if (distance > 0 && distance < INFLUENCE_RADIUS) {
          const eased = (1 - distance / INFLUENCE_RADIUS) ** 2 * Math.min(1, distance / 58);
          const angle = Math.atan2(dy, dx);
          warpX = -Math.cos(angle) * eased * MAX_WARP * pin;
          warpY = -Math.sin(angle) * eased * MAX_WARP * pin;
        }

        points[row][column] = { x: x + warpX + rippleX, y: y + warpY + rippleY };
        proximity[row][column] = near;
      }
    }

    const drawLine = (start, end, startNear, endNear) => {
      const amount = ((startNear + endNear) / 2) ** 2;
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.strokeStyle = colorBetween(LINE_BASE, LAVENDER, amount);
      context.lineWidth = lerp(0.7, 1.35, amount);
      context.stroke();
    };

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns - 1; column += 1) {
        drawLine(points[row][column], points[row][column + 1], proximity[row][column], proximity[row][column + 1]);
      }
    }
    for (let column = 0; column < columns; column += 1) {
      for (let row = 0; row < rows - 1; row += 1) {
        drawLine(points[row][column], points[row + 1][column], proximity[row][column], proximity[row + 1][column]);
      }
    }

    points.forEach((row, rowIndex) => row.forEach((point, columnIndex) => {
      const amount = proximity[rowIndex][columnIndex] ** 2;
      if (amount > 0.06) {
        context.beginPath();
        context.arc(point.x, point.y, lerp(1.1, 2.5, amount), 0, Math.PI * 2);
        context.fillStyle = colorBetween({ ...LINE_BASE, a: 0.12 }, { ...LAVENDER, a: 0.9 }, amount);
        context.fill();
      }
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const surface = scope === "page" ? canvas?.closest(".okr") : canvas?.closest(".okr__services-section");
    if (!canvas || !surface) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const servicesSection = scope === "page" ? surface.querySelector(".okr__services-section") : null;
    const updateClip = () => {
      if (!servicesSection) return;
      const boundary = Math.min(window.innerHeight, Math.max(0, servicesSection.getBoundingClientRect().top));
      const inset = `inset(${boundary}px 0 0 0)`;
      canvas.style.clipPath = inset;
      canvas.style.webkitClipPath = inset;
    };
    const resize = () => {
      const bounds = scope === "page"
        ? { width: window.innerWidth, height: window.innerHeight }
        : surface.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const height = scope === "page" ? bounds.height : surface.scrollHeight;
      sizeRef.current = { width: bounds.width, height, dpr };
      canvas.width = Math.round(bounds.width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${bounds.width}px`;
      canvas.style.height = `${height}px`;
      updateClip();
      draw(performance.now());
    };
    const localPoint = (event) => {
      const bounds = scope === "page" ? { left: 0, top: 0 } : surface.getBoundingClientRect();
      return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    };
    const onPointerMove = (event) => {
      const point = localPoint(event);
      targetRef.current = point;
      if (pointerRef.current.x < -9000) pointerRef.current = { ...point };
    };
    const onPointerLeave = () => { targetRef.current = { x: -9999, y: -9999 }; };
    const onPointerDown = (event) => {
      const point = localPoint(event);
      ripplesRef.current.push({ ...point, radius: 0, opacity: 1, born: performance.now() });
    };
    const animate = (now) => {
      updateClip();
      pointerRef.current.x = lerp(pointerRef.current.x, targetRef.current.x, LERP_SPEED);
      pointerRef.current.y = lerp(pointerRef.current.y, targetRef.current.y, LERP_SPEED);
      draw(now);
      frameRef.current = window.requestAnimationFrame(animate);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(surface);
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", updateClip, { passive: true });
    resize();
    window.requestAnimationFrame(updateClip);
    if (!reducedMotion) {
      surface.addEventListener("pointermove", onPointerMove, { passive: true });
      surface.addEventListener("pointerleave", onPointerLeave);
      surface.addEventListener("pointerdown", onPointerDown, { passive: true });
      frameRef.current = window.requestAnimationFrame(animate);
    }

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", updateClip);
      surface.removeEventListener("pointermove", onPointerMove);
      surface.removeEventListener("pointerleave", onPointerLeave);
      surface.removeEventListener("pointerdown", onPointerDown);
      window.cancelAnimationFrame(frameRef.current);
    };
  }, [draw, scope]);

  return (
    <canvas
      ref={canvasRef}
      className={`services-kinetic-grid${scope === "page" ? " services-kinetic-grid--page" : ""}`}
      aria-hidden="true"
    />
  );
}
