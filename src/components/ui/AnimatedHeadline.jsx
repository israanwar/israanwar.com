import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getGradientColor } from "../../lib/gradientText";

export function AnimatedHeadline({
  as: Tag = "h1",
  text,
  className = "okr__h2",
  highlightFrom,
  highlightLast,
  highlightRatio = 0.48,
  replayDelay = 220,
  assemble = false,
  assembleLetters = false,
  ...props
}) {
  const location = useLocation();
  const value = text ? String(text) : "";
  const shouldHoldForRoute = location.key !== "default" && replayDelay > 0;
  const [ready, setReady] = useState(!shouldHoldForRoute);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    if (!shouldHoldForRoute) {
      setReady(true);
      return undefined;
    }

    setReady(false);
    const timer = window.setTimeout(() => {
      setRunId((current) => current + 1);
      setReady(true);
    }, replayDelay);

    return () => window.clearTimeout(timer);
  }, [location.key, location.pathname, replayDelay, shouldHoldForRoute, value]);

  if (!value) return null;

  const chunks = value.split(/(\s+)/);
  const wordTotal = chunks.filter((chunk) => chunk && !/^\s+$/.test(chunk)).length;
  const highlightStart = getHighlightStart({
    highlightFrom,
    highlightLast,
    highlightRatio,
    wordTotal,
  });
  let wordIndex = -1;
  let glyphIndex = -1;
  const hasAssembly = assemble || assembleLetters;

  return (
    <Tag
      className={`okr__headline okr__headline--stagger${hasAssembly ? " okr__headline--assemble" : ""}${assembleLetters ? " okr__headline--assemble-letters" : ""} ${ready ? "is-ready" : "is-waiting"} ${className}`}
      aria-label={value}
      {...props}
    >
      {chunks.map((chunk, index) => {
        if (/^\s+$/.test(chunk)) return chunk;

        wordIndex += 1;
        const wordClassName = `okr__word${wordIndex >= highlightStart ? " is-grad" : ""}`;

        if (assembleLetters) {
          const glyphs = Array.from(chunk);
          return (
            <span key={`${runId}-${chunk}-${index}`} className={wordClassName} aria-hidden="true">
              {glyphs.map((glyph, glyphInWord) => {
                glyphIndex += 1;
                return (
                  <span
                    key={`${runId}-${glyph}-${glyphIndex}`}
                    className="okr__glyph"
                    style={{
                      "--glyph-i": glyphIndex,
                      "--word-i": wordIndex,
                      "--glyph-local": glyphInWord,
                      "--glyph-color": wordIndex >= highlightStart
                        ? getGradientColor(glyphInWord, glyphs.length)
                        : "#20181b",
                      "--scatter-x": `${[-96, 66, -52, 84, -72, 46, -62, 90][glyphIndex % 8]}px`,
                      "--scatter-y": `${[66, -74, 88, -48, -84, 56, -62, 78][glyphIndex % 8]}px`,
                      "--scatter-r": `${[-8, 5, -4, 7, -6, 4, -5, 6][glyphIndex % 8]}deg`,
                    }}
                  >
                    {glyph}
                  </span>
                );
              })}
            </span>
          );
        }

        return (
          <span
            key={`${runId}-${chunk}-${index}`}
            className={wordClassName}
            style={{
              "--i": wordIndex,
              "--scatter-x": `${[-0.1, 0.07, -0.05, 0.08, -0.06][wordIndex % 5]}em`,
              "--scatter-y": `${[0.32, 0.25, 0.29, 0.22, 0.27][wordIndex % 5]}em`,
              "--scatter-r": `${[-0.7, 0.45, -0.35, 0.55, -0.4][wordIndex % 5]}deg`,
            }}
          >
            {chunk}
          </span>
        );
      })}
    </Tag>
  );
}

function getHighlightStart({ highlightFrom, highlightLast, highlightRatio, wordTotal }) {
  if (wordTotal <= 1) return 0;

  if (Number.isFinite(highlightFrom)) {
    return Math.max(0, Math.min(highlightFrom, wordTotal - 1));
  }

  if (Number.isFinite(highlightLast)) {
    return Math.max(0, wordTotal - highlightLast);
  }

  return Math.max(1, Math.floor(wordTotal * highlightRatio));
}
