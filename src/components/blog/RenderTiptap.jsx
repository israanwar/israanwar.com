// Simple TipTap JSON → HTML renderer. Handles common blocks.
export function RenderTiptap({ doc }) {
  if (!doc || !doc.content) return null;
  return (
    <div className="okr__prose">
      {doc.content.map((node, i) => <Node key={i} node={node} />)}
    </div>
  );
}

function Node({ node }) {
  const marks = (n) => renderInline(n);
  switch (node.type) {
    case "paragraph":
      return <p>{node.content?.map((c, i) => <React.Fragment key={i}>{marks(c)}</React.Fragment>) ?? null}</p>;
    case "heading": {
      const level = node.attrs?.level ?? 2;
      const H = `h${level}`;
      return <H>{node.content?.map((c, i) => <React.Fragment key={i}>{marks(c)}</React.Fragment>) ?? null}</H>;
    }
    case "bulletList":
      return <ul>{node.content?.map((li, i) => <Node key={i} node={li} />) ?? null}</ul>;
    case "orderedList":
      return <ol>{node.content?.map((li, i) => <Node key={i} node={li} />) ?? null}</ol>;
    case "listItem":
      return <li>{node.content?.map((c, i) => <Node key={i} node={c} />) ?? null}</li>;
    case "blockquote":
      return <blockquote>{node.content?.map((c, i) => <Node key={i} node={c} />) ?? null}</blockquote>;
    case "hardBreak":
      return <br />;
    case "text":
      return renderInline(node);
    default:
      return null;
  }
}

function renderInline(node) {
  if (node.type !== "text") return <Node node={node} />;
  let el = node.text;
  const marks = node.marks ?? [];
  for (const m of marks) {
    if (m.type === "bold") el = <strong>{el}</strong>;
    else if (m.type === "italic") el = <em>{el}</em>;
    else if (m.type === "strike") el = <s>{el}</s>;
    else if (m.type === "code") el = <code>{el}</code>;
    else if (m.type === "link") {
      const href = m.attrs?.href ?? "#";
      const isInternal = href.startsWith("/") || href.startsWith("#");
      el = isInternal
        ? <a href={href}>{el}</a>
        : <a href={href} target="_blank" rel="noreferrer">{el}</a>;
    }
  }
  return el;
}

import React from "react";
