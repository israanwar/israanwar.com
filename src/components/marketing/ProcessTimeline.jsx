import { useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import "../../styles/process-timeline.css";

function StageDetail({ item, index, lang }) {
  return (
    <div className="process-timeline__detail">
      <span className="process-timeline__eyebrow">{lang === "id" ? "Tahap" : "Stage"} {item.n || String(index + 1).padStart(2, "0")}</span>
      <h3>{item.title}</h3>
      {item.body && <p className="process-timeline__summary">{item.body}</p>}
      <div className="process-timeline__content">
        <p className="process-timeline__description">{item.detail || item.body}</p>
        {item.points?.length > 0 && (
          <div className="process-timeline__points">
            <h4>{lang === "id" ? "Yang dikerjakan pada tahap ini" : "What happens at this stage"}</h4>
            <ul>{item.points.map((point, i) => <li key={i}><Check size={17} aria-hidden="true" /><span>{point}</span></li>)}</ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProcessTimeline({ items, lang = "en" }) {
  const [selected, setSelected] = useState(0);
  const [expanded, setExpanded] = useState(0);
  const tabs = useRef([]);
  const prefix = useId();
  if (!items.length) return null;
  const active = Math.min(selected, items.length - 1);
  function select(index) { setSelected(index); setExpanded(index); }
  function navigate(event, index) {
    let next;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % items.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + items.length) % items.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
    if (next !== undefined) { event.preventDefault(); select(next); tabs.current[next]?.focus(); }
  }
  return (
    <div id="process-stages" className="process-timeline">
      <div className="process-timeline__desktop">
        <div className="process-timeline__steps" role="tablist" aria-label={lang === "id" ? "Tahapan proses" : "Process stages"} style={{ "--process-count": items.length }}>
          {items.map((item, index) => (
            <button key={index} type="button" role="tab" id={`${prefix}-tab-${index}`} aria-controls={`${prefix}-panel-${index}`} aria-selected={active === index} tabIndex={active === index ? 0 : -1} ref={node => { tabs.current[index] = node; }} onClick={() => select(index)} onKeyDown={event => navigate(event, index)}>
              <span className="process-timeline__number">{item.n || String(index + 1).padStart(2, "0")}</span>
              <span>{item.title}</span>
            </button>
          ))}
        </div>
        {items.map((item, index) => (
          <section key={index} className="process-timeline__panel" role="tabpanel" id={`${prefix}-panel-${index}`} aria-labelledby={`${prefix}-tab-${index}`} hidden={active !== index} tabIndex={0}>
            <StageDetail item={item} index={index} lang={lang} />
          </section>
        ))}
      </div>
      <div className="process-timeline__mobile">
        {items.map((item, index) => (
          <div className="process-timeline__accordion" key={index}>
            <h3><button type="button" aria-expanded={expanded === index} aria-controls={`${prefix}-mobile-${index}`} id={`${prefix}-toggle-${index}`} onClick={() => { setSelected(index); setExpanded(expanded === index ? null : index); }}>
              <span className="process-timeline__number">{item.n || String(index + 1).padStart(2, "0")}</span>
              <span>{item.title}</span>
              <ChevronDown size={20} aria-hidden="true" />
            </button></h3>
            <div id={`${prefix}-mobile-${index}`} role="region" aria-labelledby={`${prefix}-toggle-${index}`} hidden={expanded !== index}>
              <StageDetail item={item} index={index} lang={lang} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
