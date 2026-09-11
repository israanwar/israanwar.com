import React from "react";

// Renderer teks sederhana dengan dukungan markdown ringan:
// - **bold**  → <strong>
// - Baris kosong → paragraf baru
// - Baris yang diawali `- ` → list item
export function renderRichText(text) {
  if (!text) return null;
  const paragraphs = text.split(/\n\n+/);
  return paragraphs.map((p, i) => {
    const lines = p.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;
    const isList = lines.every((l) => l.startsWith("- "));
    if (isList) {
      return (
        <ul key={i} style={{ paddingLeft: 20, margin: "0 0 20px" }}>
          {lines.map((l, j) => <li key={j} style={{ marginBottom: 6 }}>{renderInline(l.slice(2))}</li>)}
        </ul>
      );
    }
    return (
      <p key={i} style={{ margin: "0 0 20px" }}>
        {lines.map((l, j) => (
          <React.Fragment key={j}>
            {j > 0 && <br />}
            {renderInline(l)}
          </React.Fragment>
        ))}
      </p>
    );
  });
}

function renderInline(text) {
  const parts = [];
  const regex = /\*\*([^*]+)\*\*/g;
  let last = 0, m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<strong key={`b-${m.index}`} style={{ color: "var(--okr-text)" }}>{m[1]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}
