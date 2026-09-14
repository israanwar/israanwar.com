import { useEffect, useRef, useState } from "react";
import { Bot, Check, Copy, FileText, Loader2, Maximize2, Minimize2, Paperclip, RotateCcw, Send, X } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { answerBalao } from "../../lib/balaoKnowledge";
import { useBalaoKnowledge } from "../../hooks/useBalaoKnowledge";
import { DocumentReadError, extractDocumentText } from "../../lib/extractDocumentText";
import "./chat.css";

// navigator.clipboard needs a secure context and isn't universally
// available (older WebViews, some in-app browsers) — falls back to the
// classic hidden-textarea + execCommand trick, and just no-ops if neither
// works rather than throwing.
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy fallback below
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return true;
  } catch {
    return false;
  }
}

// Maps a DocumentReadError's `reason` to its i18n key — kept as a small
// lookup rather than string-concatenation so a typo here fails loudly
// (missing i18n key) instead of silently showing a blank message.
const DOC_ERROR_KEYS = {
  "too-large": "chat_doc_error_too_large",
  "unsupported-type": "chat_doc_error_unsupported_type",
  empty: "chat_doc_error_empty",
  "parse-failed": "chat_doc_error_parse_failed",
};

// Cycled through while "sending" — a staged "thinking" status (read the
// question, search the knowledge base, put together an answer) rather than
// a static "typing…" label, so the pause before a reply reads as Balao
// actually doing something, not just a canned template appearing instantly.
// It's still just a timed cosmetic sequence, not a real reasoning trace —
// this project has no AI model running underneath to trace.
const THINKING_STAGE_KEYS = ["chat_thinking_1", "chat_thinking_2", "chat_thinking_3"];
const THINKING_STAGE_MS = 600;

// Once "thinking" ends, the reply is revealed character-by-character (a
// fast typewriter effect) instead of popping in all at once — visible
// typing reads as Balao actively producing the answer, not just pasting a
// pre-written block of text in one frame. Fixed step count (not fixed
// characters-per-tick) so a short reply and a long comparison answer both
// finish revealing in roughly the same, brisk amount of time.
const REVEAL_TICK_MS = 16;
const REVEAL_STEPS = 46;

// Floating chat widget ("Balao"), mounted once in SiteChrome so it's
// available on every public page. Answers are computed entirely
// client-side by answerBalao() (keyword matching against a knowledge
// object built from the site's own live data — see useBalaoKnowledge) —
// no network call, no API key, no ongoing cost. Conversation lives in
// plain React state only (no persistence) — closing the tab starts fresh.
// The staged delay below is purely cosmetic (a reply that appears with
// zero delay reads as broken, not fast).
//
// Document upload: a visitor can attach one file — text, PDF, DOCX, or an
// image/scanned document read via OCR — extracted entirely in the browser
// (see extractDocumentText.js). The file itself is never uploaded
// anywhere. Balao then does literal keyword search within the extracted
// text, not real comprehension (see balaoKnowledge.js's header comment) —
// it can find and quote matching parts, not summarize or reason about them.
export function SiteChatWidget() {
  const { t, lang } = useI18n();
  const knowledge = useBalaoKnowledge();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [thinkingStage, setThinkingStage] = useState(0);
  const [revealText, setRevealText] = useState(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [copiedKey, setCopiedKey] = useState(null);
  const [doc, setDoc] = useState(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState(null);
  const listRef = useRef(null);
  const fileInputRef = useRef(null);
  const replyTimeoutRef = useRef(null);
  const thinkingIntervalRef = useRef(null);
  const revealIntervalRef = useRef(null);
  const copiedTimeoutRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, sending, revealedCount, open]);

  // Clear any pending timeouts/intervals on unmount so they can't fire
  // after the widget is gone (e.g. navigating away mid-"typing" or
  // mid-"copied!").
  useEffect(() => () => {
    window.clearTimeout(replyTimeoutRef.current);
    window.clearInterval(thinkingIntervalRef.current);
    window.clearInterval(revealIntervalRef.current);
    window.clearTimeout(copiedTimeoutRef.current);
  }, []);

  // `key` is "greeting" for the fixed intro bubble, or the message's index
  // for everything else — just needs to be unique enough to know which
  // bubble's icon should flip to a checkmark.
  async function handleCopy(key, text) {
    const ok = await copyToClipboard(text);
    if (!ok) return;
    window.clearTimeout(copiedTimeoutRef.current);
    setCopiedKey(key);
    copiedTimeoutRef.current = window.setTimeout(() => setCopiedKey(null), 1500);
  }

  function sendMessage(event) {
    event.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((current) => [...current, { role: "user", content: text }]);
    setInput("");
    setSending(true);
    setThinkingStage(0);

    thinkingIntervalRef.current = window.setInterval(() => {
      setThinkingStage((s) => Math.min(s + 1, THINKING_STAGE_KEYS.length - 1));
    }, THINKING_STAGE_MS);

    replyTimeoutRef.current = window.setTimeout(() => {
      window.clearInterval(thinkingIntervalRef.current);
      const reply = answerBalao(text, lang, knowledge, doc);
      startReveal(reply);
    }, THINKING_STAGE_MS * THINKING_STAGE_KEYS.length);
  }

  // Reveals `fullText` a chunk at a time (a fast typewriter effect) rather
  // than pushing it into `messages` all at once — see REVEAL_STEPS/
  // REVEAL_TICK_MS above. Only once fully revealed does it become a real
  // entry in `messages` (so the copy button, etc. only ever applies to a
  // complete answer).
  function startReveal(fullText) {
    // Respect a reduced-motion preference by skipping the character-by-
    // character animation and showing the finished answer immediately —
    // the "thinking" stage already ran, so this doesn't skip straight past
    // every cue that Balao did something, just the rapid text motion.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setMessages((current) => [...current, { role: "assistant", content: fullText }]);
      setSending(false);
      return;
    }

    setRevealText(fullText);
    setRevealedCount(0);
    const perTick = Math.max(1, Math.ceil(fullText.length / REVEAL_STEPS));
    revealIntervalRef.current = window.setInterval(() => {
      setRevealedCount((count) => {
        const next = count + perTick;
        if (next >= fullText.length) {
          window.clearInterval(revealIntervalRef.current);
          setMessages((current) => [...current, { role: "assistant", content: fullText }]);
          setRevealText(null);
          setSending(false);
          return fullText.length;
        }
        return next;
      });
    }, REVEAL_TICK_MS);
  }

  // Clears the conversation back to just the greeting bubble, and drops
  // any attached document along with it — a fresh conversation should
  // also mean starting without a document Balao would otherwise still be
  // silently referencing. Also cancels any reply still "typing" so it
  // can't reappear right after a reset.
  function resetConversation() {
    window.clearTimeout(replyTimeoutRef.current);
    window.clearInterval(thinkingIntervalRef.current);
    window.clearInterval(revealIntervalRef.current);
    setMessages([]);
    setInput("");
    setSending(false);
    setThinkingStage(0);
    setRevealText(null);
    setRevealedCount(0);
    setDoc(null);
    setDocError(null);
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setDocError(null);
    setDocLoading(true);
    try {
      const text = await extractDocumentText(file);
      setDoc({ name: file.name, text });
    } catch (err) {
      setDoc(null);
      setDocError(err instanceof DocumentReadError ? err.reason : "parse-failed");
    } finally {
      setDocLoading(false);
    }
  }

  function removeDocument() {
    setDoc(null);
    setDocError(null);
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
        <div className={`okr__chat-panel${expanded ? " okr__chat-panel--expanded" : ""}`} role="dialog" aria-label={t("chat_title")}>
          <div className="okr__chat-panel-header">
            <span className="okr__chat-panel-icon" aria-hidden="true"><Bot size={16} /></span>
            <span className="okr__chat-panel-title">{t("chat_title")}</span>
            <button
              type="button"
              className="okr__chat-panel-expand"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? t("chat_collapse_label") : t("chat_expand_label")}
              title={expanded ? t("chat_collapse_label") : t("chat_expand_label")}
            >
              {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            <button
              type="button"
              className="okr__chat-panel-reset"
              onClick={resetConversation}
              disabled={messages.length === 0 && !doc}
              aria-label={t("chat_reset_label")}
              title={t("chat_reset_label")}
            >
              <RotateCcw size={16} />
            </button>
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
              <p className="okr__chat-bubble-text" dir="auto">{t("chat_greeting")}</p>
              <button
                type="button"
                className="okr__chat-copy"
                onClick={() => handleCopy("greeting", t("chat_greeting"))}
                aria-label={copiedKey === "greeting" ? t("chat_copied_label") : t("chat_copy_label")}
                title={copiedKey === "greeting" ? t("chat_copied_label") : t("chat_copy_label")}
              >
                {copiedKey === "greeting" ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
            {messages.map((m, i) => (
              <div key={i} className={`okr__chat-bubble okr__chat-bubble--${m.role}`}>
                <p className="okr__chat-bubble-text" dir="auto">{m.content}</p>
                {m.role === "assistant" && (
                  <button
                    type="button"
                    className="okr__chat-copy"
                    onClick={() => handleCopy(i, m.content)}
                    aria-label={copiedKey === i ? t("chat_copied_label") : t("chat_copy_label")}
                    title={copiedKey === i ? t("chat_copied_label") : t("chat_copy_label")}
                  >
                    {copiedKey === i ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                )}
              </div>
            ))}
            {sending && revealText === null && (
              <div className="okr__chat-bubble okr__chat-bubble--assistant okr__chat-bubble--typing">
                <span className="okr__chat-thinking-text">{t(THINKING_STAGE_KEYS[thinkingStage])}</span>
                <span className="okr__chat-thinking-dots"><span /><span /><span /></span>
              </div>
            )}
            {sending && revealText !== null && (
              <div className="okr__chat-bubble okr__chat-bubble--assistant">
                <p className="okr__chat-bubble-text" dir="auto">
                  {revealText.slice(0, revealedCount)}
                  <span className="okr__chat-caret" aria-hidden="true" />
                </p>
              </div>
            )}
          </div>

          {(doc || docLoading || docError) && (
            <div className="okr__chat-doc-bar">
              {docLoading ? (
                <span className="okr__chat-doc-chip okr__chat-doc-chip--loading">
                  <Loader2 size={14} className="okr__chat-doc-spinner" />
                  {t("chat_doc_reading")}
                </span>
              ) : doc ? (
                <span className="okr__chat-doc-chip">
                  <FileText size={14} />
                  <span className="okr__chat-doc-name">{doc.name}</span>
                  <button
                    type="button"
                    className="okr__chat-doc-remove"
                    onClick={removeDocument}
                    aria-label={t("chat_doc_remove_label")}
                    title={t("chat_doc_remove_label")}
                  >
                    <X size={13} />
                  </button>
                </span>
              ) : (
                <span className="okr__chat-doc-chip okr__chat-doc-chip--error">{t(DOC_ERROR_KEYS[docError])}</span>
              )}
            </div>
          )}

          <form className="okr__chat-form" onSubmit={sendMessage}>
            <input
              type="file"
              ref={fileInputRef}
              className="okr__chat-file-input"
              accept=".txt,.md,.pdf,.docx,.png,.jpg,.jpeg,.webp,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="okr__chat-upload"
              onClick={() => fileInputRef.current?.click()}
              disabled={docLoading}
              aria-label={t("chat_upload_label")}
              title={t("chat_upload_label")}
            >
              <Paperclip size={17} />
            </button>
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
