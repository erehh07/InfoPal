// ============================================================
//  InfoPal — InfoPal.jsx
//  All React components. Imports utils/theme from ./infopal.js
// ============================================================

import { useState, useRef, useEffect, useCallback } from "react";
import {
  C, DOC_COLORS, SYSTEM_PROMPT, GLOBAL_STYLES,
  extractText, chunkText, retrieveChunks,
  fmtSize, fmtTime, uid,
} from "./infopal.js";

// ============================================================
//  ICONS
// ============================================================

const SendIco = () => (
  <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const FileIco = ({ s = 15 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const TrashIco = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const UploadIco = ({ s = 26 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const MenuIco = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const PlusIco = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const BotIco = ({ s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <circle cx="12" cy="5" r="2"/>
    <path d="M12 7v4"/>
    <circle cx="8"  cy="16" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none"/>
  </svg>
);

const NewChatIco = () => (
  <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);

const SpinIco = ({ s = 18, c }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
    stroke={c || C.accent} strokeWidth="2.2"
    style={{ animation: "ip-spin .7s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const ChatTabIco = ({ on }) => (
  <svg width={22} height={22} viewBox="0 0 24 24"
    fill={on ? "currentColor" : "none"} stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const DocsTabIco = ({ on }) => (
  <svg width={22} height={22} viewBox="0 0 24 24"
    fill={on ? "currentColor" : "none"} stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

// ============================================================
//  MARKDOWN RENDERER
// ============================================================

function InlineText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return <strong key={i} style={{ fontWeight: 700 }}>{p.slice(2, -2)}</strong>;
        if (p.startsWith("`") && p.endsWith("`"))
          return (
            <code key={i} style={{
              background: "#1a1a1a", borderRadius: 4, padding: "1px 6px",
              fontSize: 12.5, fontFamily: "monospace", color: "#e2e8f0",
            }}>
              {p.slice(1, -1)}
            </code>
          );
        if (p.startsWith("*") && p.endsWith("*"))
          return <em key={i}>{p.slice(1, -1)}</em>;
        return p;
      })}
    </>
  );
}

function MsgBody({ text }) {
  const lines = text.split("\n");
  const elems = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      elems.push(<div key={`sp${i}`} style={{ height: 6 }} />);
      i++; continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, "")); i++;
      }
      elems.push(
        <ol key={`ol${i}`} style={{ paddingLeft: 20, margin: "4px 0", display: "flex", flexDirection: "column", gap: 3 }}>
          {items.map((it, j) => (
            <li key={j} style={{ fontSize: 14, lineHeight: 1.65, color: C.text }}>
              <InlineText text={it} />
            </li>
          ))}
        </ol>
      ); continue;
    }

    if (/^[-•*]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-•*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-•*]\s/, "")); i++;
      }
      elems.push(
        <ul key={`ul${i}`} style={{ paddingLeft: 18, margin: "4px 0", display: "flex", flexDirection: "column", gap: 3 }}>
          {items.map((it, j) => (
            <li key={j} style={{ fontSize: 14, lineHeight: 1.65, color: C.text, listStyleType: "disc" }}>
              <InlineText text={it} />
            </li>
          ))}
        </ul>
      ); continue;
    }

    if (/^#{1,3}\s/.test(line)) {
      const level = (line.match(/^#+/) || [""])[0].length;
      const txt   = line.replace(/^#+\s/, "");
      const sz    = level === 1 ? 18 : level === 2 ? 16 : 14.5;
      elems.push(
        <p key={`h${i}`} style={{ fontSize: sz, fontWeight: 700, color: C.text, margin: "10px 0 4px" }}>
          <InlineText text={txt} />
        </p>
      );
      i++; continue;
    }

    if (line.startsWith("```")) {
      const codeLines = []; i++;
      while (i < lines.length && !lines[i].startsWith("```")) { codeLines.push(lines[i]); i++; }
      elems.push(
        <div key={`cb${i}`} style={{ margin: "8px 0", borderRadius: 8, overflow: "hidden", background: "#1a1a1a", border: `1px solid ${C.border}` }}>
          <pre style={{ padding: "12px 14px", margin: 0, overflowX: "auto", fontSize: 13, lineHeight: 1.6, color: "#e2e8f0", fontFamily: "monospace" }}>
            {codeLines.join("\n")}
          </pre>
        </div>
      );
      i++; continue;
    }

    elems.push(
      <p key={`p${i}`} style={{ fontSize: 14, lineHeight: 1.7, color: C.text, margin: "1px 0" }}>
        <InlineText text={line} />
      </p>
    );
    i++;
  }

  return <div>{elems}</div>;
}

// ============================================================
//  CHAT COMPONENTS
// ============================================================

function WelcomeScreen() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", gap: 24 }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent }}>
        <BotIco s={32} />
      </div>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, marginBottom: 10, letterSpacing: "-0.02em" }}>
          Welcome to InfoPal
        </h1>
        <p style={{ fontSize: 15, color: C.textSub, lineHeight: 1.7 }}>
          Your AI assistant for anything. Chat freely or upload documents — I'll answer from them with scanned PDF support via OCR.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 420, width: "100%" }}>
        {[
          ["💬", "Ask me anything"],
          ["📄", "Upload documents"],
          ["🔍", "Scanned PDF + OCR"],
          ["✍️", "Help with writing"],
        ].map(([icon, text], i) => (
          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 19 }}>{icon}</span>
            <span style={{ fontSize: 13, color: C.textMid, fontWeight: 500 }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 20 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
        <BotIco s={16} />
      </div>
      <div style={{ paddingTop: 10, display: "flex", gap: 5 }}>
        {[0, 1, 2].map(j => (
          <div key={j} style={{
            width: 7, height: 7, borderRadius: "50%", background: C.textSub,
            animation: "ip-blink 1.3s ease infinite",
            animationDelay: `${j * 0.22}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  if (msg.role === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "18px 4px 18px 18px", padding: "10px 15px" }}>
            <MsgBody text={msg.content} />
          </div>
          <span style={{ fontSize: 10.5, color: C.textSub }}>{fmtTime(msg.timestamp)}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "flex-start" }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0, marginTop: 2 }}>
        <BotIco s={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>InfoPal</span>
          <span style={{ fontSize: 10.5, color: C.textSub }}>{fmtTime(msg.timestamp)}</span>
        </div>
        <MsgBody text={msg.content} />
        {msg.sources?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {msg.sources.map((s, j) => (
              <span key={j} style={{
                fontSize: 11, color: C.accent, background: "rgba(16,163,127,.12)",
                border: "1px solid rgba(16,163,127,.25)", borderRadius: 20,
                padding: "2px 10px", display: "flex", alignItems: "center", gap: 5, fontWeight: 500,
              }}>
                <FileIco s={11} /> {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatMessages({ messages, loading, chatEndRef }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "0 0 8px" }}>
      {messages.length === 0 ? (
        <WelcomeScreen />
      ) : (
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px 16px 0" }}>
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
          {loading && <TypingDots />}
          <div ref={chatEndRef} />
        </div>
      )}
    </div>
  );
}

// ============================================================
//  INPUT BAR
// ============================================================

function InputBar({
  input, loading, inputFocused, isMobile,
  textareaRef, fileRef, desktopFileRef,
  handleInputChange, handleKey, sendMessage, setInputFocused,
}) {
  return (
    <div style={{ padding: isMobile ? "10px 12px" : "12px 20px 18px", background: C.bg, flexShrink: 0 }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{
          display: "flex", alignItems: "flex-end", gap: 8,
          background: C.input,
          border: `1px solid ${inputFocused ? C.accent : C.border}`,
          borderRadius: 14, padding: "10px 10px 10px 14px",
          boxShadow: inputFocused ? "0 0 0 2px rgba(16,163,127,.18)" : "0 2px 8px rgba(0,0,0,.2)",
          transition: "border-color .2s, box-shadow .2s",
        }}>
          <button
            onClick={() => (isMobile ? fileRef : desktopFileRef).current?.click()}
            title="Attach file"
            style={{ color: C.textSub, padding: "4px 2px", transition: "color .15s", flexShrink: 0, display: "flex", alignItems: "center", border: "none", background: "none", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.color = C.accent}
            onMouseLeave={e => e.currentTarget.style.color = C.textSub}
          >
            <PlusIco />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKey}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Message InfoPal…"
            rows={1}
            style={{
              flex: 1, background: "transparent", color: C.text,
              fontSize: 14.5, resize: "none", border: "none", outline: "none",
              lineHeight: 1.55, fontFamily: "inherit", padding: 0,
              minHeight: 26, maxHeight: 140,
            }}
          />

          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: input.trim() && !loading ? C.accent : C.surfaceHov,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: input.trim() && !loading ? "#fff" : C.textSub,
              transition: "all .2s", border: "none",
              cursor: input.trim() && !loading ? "pointer" : "default",
            }}
          >
            {loading ? <SpinIco s={16} c="#fff" /> : <SendIco />}
          </button>
        </div>

        {!isMobile && (
          <p style={{ fontSize: 11, color: C.textSub, marginTop: 7, textAlign: "center" }}>
            ↵ Send · Shift+↵ New line · + to attach files
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
//  DOCUMENT PANEL
// ============================================================

function StatBox({ label, val, col }) {
  return (
    <div style={{ flex: 1, background: C.surface, borderRadius: 8, padding: "8px 4px", textAlign: "center", border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: col }}>{val}</div>
      <div style={{ fontSize: 9.5, color: C.textSub, marginTop: 2, textTransform: "uppercase", letterSpacing: ".07em" }}>{label}</div>
    </div>
  );
}

function DropZone({ refEl, uploadStatus, dragOver, setDragOver, processFiles }) {
  return (
    <div
      onDrop={e => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files); }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onClick={() => refEl.current?.click()}
      style={{
        border: `2px dashed ${dragOver ? C.accent : C.border}`,
        borderRadius: 12, padding: "20px 16px", textAlign: "center",
        background: dragOver ? "rgba(16,163,127,.06)" : C.surface,
        cursor: "pointer", transition: "all .2s",
      }}
    >
      <input
        ref={refEl} type="file" multiple
        accept=".txt,.md,.csv,.pdf,.doc,.docx"
        style={{ display: "none" }}
        onChange={e => processFiles(e.target.files)}
      />
      {uploadStatus?.type === "progress" ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <SpinIco s={26} />
          <p style={{ fontSize: 12.5, color: C.accent, fontWeight: 500 }}>{uploadStatus.text}</p>
        </div>
      ) : (
        <>
          <div style={{ color: dragOver ? C.accent : C.textSub, marginBottom: 8 }}><UploadIco /></div>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: dragOver ? C.accent : C.textMid, marginBottom: 4 }}>
            {dragOver ? "Drop to upload!" : "Drop files or click"}
          </p>
          <p style={{ fontSize: 11.5, color: C.textSub }}>PDF · DOCX · TXT · MD</p>
          <p style={{ fontSize: 11, color: C.textSub, marginTop: 3 }}>Scanned PDFs supported via OCR</p>
        </>
      )}
    </div>
  );
}

function DocItem({ doc, idx, onRemove }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: C.surface, border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${DOC_COLORS[idx % DOC_COLORS.length]}`,
      borderRadius: 10, padding: "10px 12px",
    }}>
      <div style={{ color: DOC_COLORS[idx % DOC_COLORS.length], flexShrink: 0 }}><FileIco s={15} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12.5, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {doc.name}
        </p>
        <p style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>
          {doc.chunks.length} chunks · {fmtSize(doc.size)}{doc.ocrUsed ? " · OCR" : ""}
        </p>
      </div>
      <button
        onClick={() => onRemove(doc.id)}
        style={{ color: C.textSub, padding: 4, borderRadius: 6, transition: "color .15s", flexShrink: 0, border: "none", background: "none", cursor: "pointer" }}
        onMouseEnter={e => e.currentTarget.style.color = C.danger}
        onMouseLeave={e => e.currentTarget.style.color = C.textSub}
      >
        <TrashIco />
      </button>
    </div>
  );
}

// ============================================================
//  DESKTOP SIDEBAR
// ============================================================

function DesktopSidebar({
  open, docs, stats, uploadStatus, dragOver, setDragOver,
  processFiles, desktopFileRef, removeDoc, clearChat,
}) {
  return (
    <div style={{
      width: open ? 260 : 0, minWidth: open ? 260 : 0,
      background: C.sidebar, display: "flex", flexDirection: "column",
      overflow: "hidden", transition: "all .3s cubic-bezier(.4,0,.2,1)",
      borderRight: `1px solid ${C.border}`, flexShrink: 0,
    }}>
      {open && (
        <>
          <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                <BotIco s={19} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>InfoPal</p>
                <p style={{ fontSize: 10.5, color: C.textSub }}>AI Assistant</p>
              </div>
              <button
                onClick={clearChat} title="New chat"
                style={{ color: C.textSub, padding: 6, borderRadius: 7, transition: "all .15s", border: "none", background: "none", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.color = C.text; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSub; }}
              >
                <NewChatIco />
              </button>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <StatBox label="Docs"    val={stats.docs}    col={C.accent} />
              <StatBox label="Chunks"  val={stats.chunks}  col="#6366f1" />
              <StatBox label="Queries" val={stats.queries} col="#f59e0b" />
            </div>
          </div>

          <div style={{ padding: "14px 14px 10px" }}>
            <p style={{ fontSize: 10.5, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 10 }}>
              Documents
            </p>
            <DropZone
              refEl={desktopFileRef} uploadStatus={uploadStatus}
              dragOver={dragOver} setDragOver={setDragOver} processFiles={processFiles}
            />
            {uploadStatus?.type === "done" && (
              <div style={{ marginTop: 8, padding: "7px 10px", background: "rgba(16,163,127,.1)", border: "1px solid rgba(16,163,127,.25)", borderRadius: 8, fontSize: 12, color: C.accent }}>
                {uploadStatus.text}
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            {docs.length === 0
              ? <p style={{ fontSize: 12, color: C.textSub, textAlign: "center", padding: "20px 0" }}>No documents yet</p>
              : docs.map((doc, idx) => <DocItem key={doc.id} doc={doc} idx={idx} onRemove={removeDoc} />)}
          </div>

          <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.success, boxShadow: `0 0 5px ${C.success}`, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: C.textSub }}>Online · Claude Sonnet</span>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
//  HEADERS & MOBILE NAV
// ============================================================

function DesktopHeader({ docs, stats, messages, sidebarOpen, setSidebarOpen, clearChat }) {
  return (
    <header style={{ padding: "12px 20px", background: C.bg, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
      <button
        onClick={() => setSidebarOpen(p => !p)}
        style={{ color: C.textSub, padding: 6, borderRadius: 8, transition: "all .15s", border: "none", background: "none", cursor: "pointer" }}
        onMouseEnter={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.color = C.text; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSub; }}
      >
        <MenuIco />
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
          <BotIco s={16} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>InfoPal</p>
          <p style={{ fontSize: 11, color: C.textSub }}>
            {docs.length > 0 ? `${docs.length} doc${docs.length !== 1 ? "s" : ""} · ${stats.chunks} chunks` : "General AI Assistant"}
          </p>
        </div>
      </div>
      {messages.length > 0 && (
        <button
          onClick={clearChat}
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, color: C.textMid, fontSize: 12.5, fontWeight: 500, transition: "all .15s", cursor: "pointer" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMid; }}
        >
          <NewChatIco /> New chat
        </button>
      )}
    </header>
  );
}

function MobileHeader({ docs, messages, mobileTab, clearChat }) {
  return (
    <header style={{ padding: "11px 14px", background: C.nav, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <BotIco s={16} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>InfoPal</p>
        <p style={{ fontSize: 11, color: C.textSub }}>
          {mobileTab === "chat" ? (docs.length > 0 ? `${docs.length} docs loaded` : "AI Assistant") : "Document Manager"}
        </p>
      </div>
      {mobileTab === "chat" && messages.length > 0 && (
        <button
          onClick={clearChat}
          style={{ color: C.textSub, padding: 6, borderRadius: 8, border: "none", background: "none", cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.color = C.text}
          onMouseLeave={e => e.currentTarget.style.color = C.textSub}
        >
          <NewChatIco />
        </button>
      )}
    </header>
  );
}

function MobileBottomNav({ mobileTab, setMobileTab, docCount }) {
  const tabs = [
    { id: "chat", label: "Chat",      Icon: ChatTabIco, badge: 0 },
    { id: "docs", label: "Documents", Icon: DocsTabIco, badge: docCount },
  ];
  return (
    <nav style={{ display: "flex", background: C.nav, borderTop: `1px solid ${C.border}`, paddingBottom: "env(safe-area-inset-bottom,4px)", flexShrink: 0 }}>
      {tabs.map(({ id, label, Icon, badge }) => {
        const on = mobileTab === id;
        return (
          <button
            key={id} onClick={() => setMobileTab(id)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 4px 8px", color: on ? C.accent : C.textSub, borderTop: `2px solid ${on ? C.accent : "transparent"}`, transition: "color .15s", border: "none", background: "none", cursor: "pointer" }}
          >
            <div style={{ position: "relative" }}>
              <Icon on={on} />
              {badge > 0 && (
                <div style={{ position: "absolute", top: -5, right: -7, width: 16, height: 16, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff", border: `2px solid ${C.nav}` }}>
                  {badge > 9 ? "9+" : badge}
                </div>
              )}
            </div>
            <span style={{ fontSize: 10.5, fontWeight: on ? 600 : 400 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ============================================================
//  MOBILE DOCS TAB
// ============================================================

function MobileDocsTab({ docs, stats, uploadStatus, dragOver, setDragOver, processFiles, fileRef, removeDoc }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <StatBox label="Docs"    val={stats.docs}    col={C.accent} />
        <StatBox label="Chunks"  val={stats.chunks}  col="#6366f1" />
        <StatBox label="Queries" val={stats.queries} col="#f59e0b" />
      </div>

      <DropZone
        refEl={fileRef} uploadStatus={uploadStatus}
        dragOver={dragOver} setDragOver={setDragOver} processFiles={processFiles}
      />

      {uploadStatus?.type === "done" && (
        <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(16,163,127,.1)", border: "1px solid rgba(16,163,127,.25)", borderRadius: 8, fontSize: 12.5, color: C.accent }}>
          {uploadStatus.text}
        </div>
      )}

      {docs.length > 0 ? (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>
            Indexed Files
          </p>
          {docs.map((doc, idx) => <DocItem key={doc.id} doc={doc} idx={idx} onRemove={removeDoc} />)}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "32px 0", color: C.textSub }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
          <p style={{ fontSize: 14, fontWeight: 500, color: C.textMid }}>No documents yet</p>
          <p style={{ fontSize: 12.5, marginTop: 5, lineHeight: 1.6 }}>
            Upload files above.<br />Scanned PDFs supported via OCR.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
//  ROOT APP COMPONENT
// ============================================================

export default function InfoPal() {
  const [docs, setDocs]                 = useState([]);
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [dragOver, setDragOver]         = useState(false);
  const [mobileTab, setMobileTab]       = useState("chat");
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [isMobile, setIsMobile]         = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const fileRef        = useRef(null);
  const desktopFileRef = useRef(null);
  const chatEndRef     = useRef(null);
  const textareaRef    = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  }, [messages, loading]);

  const stats = {
    docs:    docs.length,
    chunks:  docs.reduce((a, d) => a + d.chunks.length, 0),
    queries: messages.filter(m => m.role === "user").length,
  };

  const processFiles = useCallback(async (files) => {
    const allowed = [".txt", ".md", ".csv", ".pdf", ".doc", ".docx"];
    const list = Array.from(files).filter(f =>
      allowed.includes("." + f.name.split(".").pop().toLowerCase())
    );
    if (!list.length) return;
    const results = [];
    for (const file of list) {
      setUploadStatus({ text: `Processing ${file.name}…`, type: "progress" });
      try {
        const { text, ocrUsed } = await extractText(
          file, prog => setUploadStatus({ text: prog, type: "progress" })
        );
        if (text.trim()) results.push({
          id: uid(), name: file.name, size: file.size,
          text, chunks: chunkText(text), ocrUsed, uploadedAt: new Date(),
        });
      } catch {
        setUploadStatus({ text: `Failed: ${file.name}`, type: "error" });
        await new Promise(r => setTimeout(r, 1500));
      }
    }
    if (results.length) {
      setDocs(p => [...p, ...results]);
      setUploadStatus({ text: `✓ ${results.length} file${results.length > 1 ? "s" : ""} indexed`, type: "done" });
      const summary = results.map(d =>
        `• **${d.name}** — ${d.chunks.length} chunks${d.ocrUsed ? " (OCR)" : ""}`
      ).join("\n");
      setMessages(p => [...p, {
        id: uid(), role: "assistant",
        content: `📎 **Indexed ${results.length} file${results.length > 1 ? "s" : ""}:**\n${summary}\n\nYou can now ask me anything about ${results.length > 1 ? "these documents" : "this document"}, or just chat normally!`,
        timestamp: new Date(),
      }]);
      if (isMobile) setMobileTab("chat");
    }
    setTimeout(() => setUploadStatus(null), 2500);
  }, [isMobile]);

  const removeDoc = useCallback(id => setDocs(p => p.filter(d => d.id !== id)), []);
  const clearChat = useCallback(() => setMessages([]), []);

  const sendMessage = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setMessages(p => [...p, { id: uid(), role: "user", content: q, timestamp: new Date() }]);
    setLoading(true);
    try {
      const chunks  = retrieveChunks(q, docs);
      const sources = [...new Set(chunks.map(c => c.docName))];
      const ctx     = chunks.length
        ? `\n\n[DOCUMENT CONTEXT]\n${chunks.map(c => `Source: "${c.docName}"\n${c.chunk}`).join("\n\n---\n")}\n[END CONTEXT]\n\n`
        : "";
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          system: SYSTEM_PROMPT,
          messages: [...history, { role: "user", content: `${ctx}${q}` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "Sorry, I couldn't generate a response.";
      setMessages(p => [...p, {
        id: uid(), role: "assistant", content: text,
        timestamp: new Date(), sources: chunks.length ? sources : [],
      }]);
    } catch {
      setMessages(p => [...p, {
        id: uid(), role: "assistant",
        content: "⚠️ Connection error. Please try again.",
        timestamp: new Date(),
      }]);
    }
    setLoading(false);
    textareaRef.current?.focus();
  }, [input, loading, docs, messages]);

  const handleKey = useCallback(e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }, [sendMessage]);

  const handleInputChange = useCallback(e => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  }, []);

  const inputBarProps = {
    input, loading, inputFocused, isMobile,
    textareaRef, fileRef, desktopFileRef,
    handleInputChange, handleKey, sendMessage, setInputFocused,
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", color: C.text, overflow: "hidden" }}>
      <style>{GLOBAL_STYLES}</style>

      {isMobile ? (
        /* ── Mobile layout ── */
        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
          <MobileHeader docs={docs} messages={messages} mobileTab={mobileTab} clearChat={clearChat} />
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {mobileTab === "chat" ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <ChatMessages messages={messages} loading={loading} chatEndRef={chatEndRef} />
                <InputBar {...inputBarProps} />
              </div>
            ) : (
              <MobileDocsTab
                docs={docs} stats={stats} uploadStatus={uploadStatus}
                dragOver={dragOver} setDragOver={setDragOver}
                processFiles={processFiles} fileRef={fileRef} removeDoc={removeDoc}
              />
            )}
          </div>
          <MobileBottomNav mobileTab={mobileTab} setMobileTab={setMobileTab} docCount={docs.length} />
        </div>
      ) : (
        /* ── Desktop layout ── */
        <>
          <DesktopSidebar
            open={sidebarOpen} docs={docs} stats={stats}
            uploadStatus={uploadStatus} dragOver={dragOver} setDragOver={setDragOver}
            processFiles={processFiles} desktopFileRef={desktopFileRef}
            removeDoc={removeDoc} clearChat={clearChat}
          />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <DesktopHeader
              docs={docs} stats={stats} messages={messages}
              sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
              clearChat={clearChat}
            />
            <ChatMessages messages={messages} loading={loading} chatEndRef={chatEndRef} />
            <InputBar {...inputBarProps} />
          </div>
        </>
      )}
    </div>
  );
}
