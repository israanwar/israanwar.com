import { useEffect, useRef, useState } from "react";
import { Bot, Send, X } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { answerBalao } from "../../lib/balaoKnowledge";
import { useBalaoKnowledge } from "../../hooks/useBalaoKnowledge";
import "./chat.css";

// Floating chat widget ("Balao"), mounted once in SiteChrome so it's
// available on every public page. Answers are computed entirely
// client-side by answerBalao() (keyword matching against a knowledge
// object built from the site's own live data — see useBalaoKnowledge) —
// no network call, no API key, no ongoing cost. Conversation lives in
// plain React state only (no persistence) — closing the tab starts fresh.
// The short setTimeout below is purely cosmetic (a reply that appears
// with zero delay reads as broken, not fast).
export function SiteChatWidget() {
  const { t, lang } = useI18n();
  const knowledge = useBalaoKnowledge();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, sending, open]);

  function sendMessage(event) {
    event.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((current) => [...current, { role: "user", content: text }]);
    setInput("");
    setSending(true);

    window.setTimeout(() => {
      const reply = answerBalao(text, lang, knowledge);
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
      setSending(false);
    }, 450);
  }

  return (
    <div className="okr__chat">
      <button
        type="button"
        className="okr__chat-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t("chat_close_label") : t("chat_open_label")}
        aria-expanded={open}
      >
        {open ? <X size={22} /> : <Bot size={22} />}
      </button>

      {open && (
        <div className="okr__chat-panel" role="dialog" aria-label={t("chat_title")}>
          <div className="okr__chat-panel-header">
            <span className="okr__chat-panel-icon" aria-hidden="true"><Bot size={16} /></span>
            <span className="okr__chat-panel-title">{t("chat_title")}</span>
            <button
              type="button"
              className="okr__chat-panel-close"
              onClick={() => setOpen(false)}
              aria-label={t("chat_close_label")}
            >
              <X size={18} />
            </button>
          </div>

          <div className="okr__chat-messages" ref={listRef}>
            <div className="okr__chat-bubble okr__chat-bubble--assistant">
              {t("chat_greeting")}
            </div>
            {messages.map((m, i) => (
              <div key={i} className={`okr__chat-bubble okr__chat-bubble--${m.role}`}>
                {m.content}
              </div>
            ))}
            {sending && (
              <div className="okr__chat-bubble okr__chat-bubble--assistant okr__chat-bubble--typing">
                <span /><span /><span />
              </div>
            )}
          </div>

          <form className="okr__chat-form" onSubmit={sendMessage}>
            <input
              type="text"
              className="okr__chat-input"
              placeholder={t("chat_placeholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              maxLength={2000}
              aria-label={t("chat_placeholder")}
            />
            <button
              type="submit"
              className="okr__chat-send"
              disabled={sending || !input.trim()}
              aria-label={t("chat_send")}
            >
              <Send size={17} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
