import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import "../../styles/process-card-slider.css";

const AUTOPLAY_DELAY = 6200;

function getRelativePosition(index, activeIndex, itemCount) {
  let position = index - activeIndex;
  const midpoint = itemCount / 2;

  if (position > midpoint) position -= itemCount;
  if (position < -midpoint) position += itemCount;

  return position;
}

function getPositionClass(position) {
  if (position === 0) return "is-active";
  if (position === -1) return "is-prev";
  if (position === 1) return "is-next";
  if (position < -1) return "is-far-prev";
  return "is-far-next";
}

export function ProcessCardSlider({ items, lang = "en", detailLabel, pointsLabel }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const activeCardRef = useRef(null);
  const pointerStartRef = useRef(null);
  const headingId = useId();
  const itemCount = items.length;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setPrefersReducedMotion(media.matches);

    syncPreference();
    media.addEventListener("change", syncPreference);
    return () => media.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    if (itemCount < 2 || isPaused || isHovering || prefersReducedMotion) return undefined;

    const timer = window.setInterval(() => {
      if (!document.hidden) setActiveIndex((current) => (current + 1) % itemCount);
    }, AUTOPLAY_DELAY);

    return () => window.clearInterval(timer);
  }, [activeIndex, isHovering, isPaused, itemCount, prefersReducedMotion]);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(itemCount - 1, 0)));
  }, [itemCount]);

  function selectCard(index) {
    setActiveIndex(index);
  }

  function move(direction) {
    setActiveIndex((current) => (current + direction + itemCount) % itemCount);
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectCard(0);
    } else if (event.key === "End") {
      event.preventDefault();
      selectCard(itemCount - 1);
    }
  }

  function handlePointerDown(event) {
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event) {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start) return;

    const distanceX = event.clientX - start.x;
    const distanceY = event.clientY - start.y;
    if (Math.abs(distanceX) < 44 || Math.abs(distanceX) < Math.abs(distanceY)) return;

    move(distanceX > 0 ? -1 : 1);
  }

  function handlePointerMove(event) {
    if (event.pointerType !== "mouse" || !activeCardRef.current || prefersReducedMotion) return;
    const bounds = activeCardRef.current.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    activeCardRef.current.style.setProperty("--card-tilt-x", `${(-y * 4.5).toFixed(2)}deg`);
    activeCardRef.current.style.setProperty("--card-tilt-y", `${(x * 6).toFixed(2)}deg`);
  }

  function resetTilt() {
    if (!activeCardRef.current) return;
    activeCardRef.current.style.setProperty("--card-tilt-x", "0deg");
    activeCardRef.current.style.setProperty("--card-tilt-y", "0deg");
  }

  if (!itemCount) return null;

  const previousLabel = lang === "id" ? "Tahap sebelumnya" : "Previous stage";
  const nextLabel = lang === "id" ? "Tahap berikutnya" : "Next stage";
  const pauseLabel = lang === "id" ? "Jeda putar otomatis" : "Pause autoplay";
  const playLabel = lang === "id" ? "Mulai putar otomatis" : "Start autoplay";

  return (
    <div
      id="process-stages"
      className="process-slider"
      role="region"
      aria-labelledby={headingId}
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        resetTilt();
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pointerStartRef.current = null;
        resetTilt();
      }}
      onPointerMove={handlePointerMove}
    >
      <span className="process-slider__sr-title" id={headingId}>
        {lang === "id" ? "Tahapan proses" : "Process stages"}
      </span>

      <div className="process-slider__stage">
        <ol className="process-slider__cards">
          {items.map((item, index) => {
            const position = getRelativePosition(index, activeIndex, itemCount);
            const isActive = position === 0;
            const positionClass = getPositionClass(position);

            return (
              <li
                className={`process-slider__card-wrap ${positionClass}`}
                key={`${item.n || index}-${item.title}`}
                style={{ "--card-order": Math.abs(position) }}
              >
                <article
                  className={`process-slider__card${item.title.length > 10 ? " has-long-title" : ""}`}
                  ref={isActive ? activeCardRef : null}
                  aria-hidden={!isActive}
                >
                  <span className="process-slider__watermark" aria-hidden="true">
                    {item.n || String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="process-slider__card-topline">
                    <span>{detailLabel}</span>
                    <span>{item.n || String(index + 1).padStart(2, "0")} / {String(itemCount).padStart(2, "0")}</span>
                  </div>
                  <div className="process-slider__card-copy">
                    <p className="process-slider__summary">{item.body}</p>
                    <h3>{item.title}</h3>
                    <p className="process-slider__detail">{item.detail || item.body}</p>
                  </div>
                  {item.points?.length > 0 && (
                    <div className="process-slider__points">
                      <span>{pointsLabel}</span>
                      <ul>
                        {item.points.map((point) => <li key={point}>{point}</li>)}
                      </ul>
                    </div>
                  )}
                </article>

                {!isActive && (
                  <button
                    className="process-slider__card-select"
                    type="button"
                    onClick={() => selectCard(index)}
                    aria-label={`${lang === "id" ? "Tampilkan tahap" : "Show stage"} ${item.title}`}
                  >
                    <span>{item.n || String(index + 1).padStart(2, "0")}</span>
                    <strong>{item.title}</strong>
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="process-slider__controls">
        <button type="button" onClick={() => move(-1)} aria-label={previousLabel}>
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <div className="process-slider__dots" aria-label={lang === "id" ? "Pilih tahap" : "Choose a stage"}>
          {items.map((item, index) => (
            <button
              type="button"
              className={index === activeIndex ? "is-active" : ""}
              key={`${item.title}-dot`}
              onClick={() => selectCard(index)}
              aria-label={`${lang === "id" ? "Tahap" : "Stage"} ${index + 1}: ${item.title}`}
              aria-current={index === activeIndex ? "step" : undefined}
            />
          ))}
        </div>
        {!prefersReducedMotion && (
          <button
            type="button"
            onClick={() => setIsPaused((current) => !current)}
            aria-label={isPaused ? playLabel : pauseLabel}
            aria-pressed={isPaused}
          >
            {isPaused ? <Play size={17} aria-hidden="true" /> : <Pause size={17} aria-hidden="true" />}
          </button>
        )}
        <button type="button" onClick={() => move(1)} aria-label={nextLabel}>
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
      <p className="process-slider__status" aria-live="polite">
        <span>{String(activeIndex + 1).padStart(2, "0")}</span>
        {items[activeIndex]?.title}
      </p>
    </div>
  );
}
