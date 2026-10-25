"use client";
import { useEffect, useRef, useState } from "react";
import LibraryPreview from "../components/LibraryPreview";
import {
  translateLocal,
  type Style,
  type Translation,
} from "../lib/translator";
type Mode = "offline" | "ai";
type Entry = Translation & {
  id: string;
  source: string;
  mode: Mode;
  style: Style;
  timestamp: number;
};
const HISTORY = "bards-quill-history-v1";
const examples = ["How are you?", "I love you.", "Good morning", "Thank you"];
function Arrow() {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        d="M3 13 13 3M4 3h9v9"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function Quill() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M8 41 36 7c7 16-1 29-17 29L8 41Zm12-15L32 13M7 42l7-13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
function isEntry(value: unknown): value is Entry {
  if (!value || typeof value !== "object") return false;
  const e = value as Entry;
  return (
    typeof e.id === "string" &&
    typeof e.source === "string" &&
    e.source.length <= 1000 &&
    typeof e.translation === "string" &&
    e.translation.length <= 12000 &&
    typeof e.note === "string" &&
    e.note.length <= 3000 &&
    ["offline", "ai"].includes(e.mode) &&
    ["faithful", "dramatic"].includes(e.style) &&
    typeof e.timestamp === "number" &&
    Number.isFinite(e.timestamp)
  );
}
export default function Home() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("offline");
  const [style, setStyle] = useState<Style>("faithful");
  const [result, setResult] = useState<Entry | null>(null);
  const [history, setHistory] = useState<Entry[]>([]);
  const historyRef = useRef<Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const pending = useRef(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = JSON.parse(localStorage.getItem(HISTORY) || "[]");
        if (Array.isArray(stored)) {
          const entries = stored.filter(isEntry).slice(0, 20);
          historyRef.current = entries;
          setHistory(entries);
        }
      } catch {
        setNotice("Device history is unavailable. You can still translate.");
      }
    }, 0);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => navigator.serviceWorker.ready)
        .then(() => setOfflineReady(true))
        .catch(() =>
          setNotice(
            "Offline caching is unavailable in this browser. Local translation still works while this page is open.",
          ),
        );
    return () => clearTimeout(timer);
  }, []);
  function save(entries: Entry[]) {
    historyRef.current = entries;
    setHistory(entries);
    try {
      localStorage.setItem(HISTORY, JSON.stringify(entries));
    } catch {
      setNotice("History could not be saved on this device.");
    }
  }
  async function translate(event: React.FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    const source = text.trim();
    setError("");
    setCopied(false);
    if (!source || source.length > 1000) {
      setError("Please enter 1–1,000 characters.");
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      let translated: Translation;
      if (mode === "offline") translated = translateLocal(source, style);
      else {
        if (!navigator.onLine)
          throw Error(
            "AI needs an internet connection. Please use offline mode.",
          );
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: source, style }),
          signal: AbortSignal.timeout(25000),
        });
        const data = await response.json();
        if (!response.ok)
          throw Error(
            data.error || "AI is unavailable. Please use offline mode.",
          );
        if (
          typeof data.translation !== "string" ||
          typeof data.note !== "string"
        )
          throw Error("AI returned an incomplete response.");
        translated = data;
      }
      const entry: Entry = {
        ...translated,
        id: crypto.randomUUID(),
        source,
        mode,
        style,
        timestamp: Date.now(),
      };
      setResult(entry);
      save([entry, ...historyRef.current].slice(0, 20));
    } catch (cause) {
      setError(
        cause instanceof Error &&
          ["TimeoutError", "AbortError"].includes(cause.name)
          ? "AI took too long. Please try again or use offline mode."
          : cause instanceof TypeError
            ? "Could not reach AI. Check your connection or use offline mode."
            : cause instanceof Error
              ? cause.message
              : "Translation failed. Please try again.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  function clear() {
    setText("");
    setResult(null);
    setError("");
    setCopied(false);
    input.current?.focus();
  }
  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.translation);
      setCopied(true);
    } catch {
      setNotice("Copy is unavailable. Select the translation text to copy it.");
    }
  }
  return (
    <>
      <header className="site-header">
        <a className="brand" href="/" aria-label="The Bard’s Quill home">
          <span className="brand-icon">
            <Quill />
          </span>
          <span>
            The Bard’s Quill
            <span className="brand-sub">
              A LITTLE LANGUAGE. A LITTLE MAGIC.
            </span>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#translator">The translator</a>
          <a href="/library" className="mobile-library-link">
            Dialogue library
          </a>
          <a href="#about">Behind the quill</a>
          <button
            className="history-nav"
            onClick={() => setShowHistory(!showHistory)}
          >
            ◷ <span>Your collection</span>
            <span className="count">{history.length}</span>
          </button>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="eyebrow">
            <span /> WORDS, WITH A TOUCH OF THE EXTRAORDINARY <span />
          </div>
          <h1>
            Every word deserves
            <br />a little <em>theatre.</em>
          </h1>
          <p>
            From everyday English to the language of the Bard.
            <br className="desktop-break" /> Give thy thoughts a voice worthy of
            the stage.
          </p>
          <div className="hero-ornament" aria-hidden="true">
            ────── ✧ ──────
          </div>
        </section>
        <section
          id="translator"
          className="workspace"
          aria-label="Shakespearean translator"
        >
          <div className="workspace-top">
            <div className="section-label">THE WRITING DESK</div>
            <div
              className="mode-switch"
              role="group"
              aria-label="Translation mode"
            >
              <button
                aria-pressed={mode === "offline"}
                disabled={busy}
                onClick={() => {
                  setMode("offline");
                  setError("");
                }}
              >
                ♧ Offline
              </button>
              <button
                aria-pressed={mode === "ai"}
                disabled={busy}
                onClick={() => {
                  setMode("ai");
                  setError("");
                }}
              >
                ✧ AI enhanced
              </button>
            </div>
          </div>
          <form onSubmit={translate}>
            <div className="editor-grid">
              <div className="input-panel">
                <div className="panel-heading">
                  <label htmlFor="words">Your words</label>
                  <span>MODERN ENGLISH</span>
                </div>
                <textarea
                  ref={input}
                  id="words"
                  maxLength={1000}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={busy}
                  placeholder="What wouldst thou like to say?"
                  aria-describedby="input-help"
                />
                <div className="input-footer">
                  <span id="input-help">
                    A word, a thought, a declaration of love…
                  </span>
                  <span>
                    {text.length}
                    <span className="muted"> / 1,000</span>
                  </span>
                </div>
              </div>
              <div className={`output-panel ${result ? "has-result" : ""}`}>
                <div className="panel-heading">
                  <span>The Bard’s rendition</span>
                  <span>SHAKESPEARE-INSPIRED</span>
                </div>
                {result ? (
                  <div className="result-content">
                    <div className="result-tags">
                      {result.mode === "offline"
                        ? "Offline · approximate"
                        : "AI enhanced"}{" "}
                      <span> / </span> {result.style}
                    </div>
                    <blockquote data-testid="translation">
                      {result.translation}
                    </blockquote>
                    <p className="language-note">{result.note}</p>
                  </div>
                ) : (
                  <div className="empty-result">
                    <Quill />
                    <p>A blank page. A world of possibility.</p>
                    <span>Thy words, reimagined, shall appear here.</span>
                  </div>
                )}
                <div className="output-footer">
                  {result ? (
                    <button
                      type="button"
                      className="text-button"
                      aria-label={copied ? "Copied!" : "Copy translation"}
                      onClick={copy}
                    >
                      {copied ? "✓ Copied!" : "▣ Copy translation"}
                    </button>
                  ) : (
                    <span>LET THE QUILL WORK ITS MAGIC</span>
                  )}
                  <span aria-hidden="true">✧</span>
                </div>
              </div>
            </div>
            <div className="toolbar">
              <div className="style-control">
                <span>Set the mood</span>
                <div role="group" aria-label="Writing style">
                  <button
                    type="button"
                    disabled={busy}
                    aria-pressed={style === "faithful"}
                    onClick={() => setStyle("faithful")}
                  >
                    Faithful
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    aria-pressed={style === "dramatic"}
                    onClick={() => setStyle("dramatic")}
                  >
                    Dramatic
                  </button>
                </div>
                <span className="style-description">
                  {style === "faithful"
                    ? "True to thy meaning."
                    : "A flourish fit for the stage."}
                </span>
              </div>
              <div className="actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={clear}
                  disabled={busy}
                >
                  Clear
                </button>
                <button
                  className="translate-button"
                  disabled={busy}
                  type="submit"
                >
                  {busy ? "The quill is writing…" : "Translate"}{" "}
                  <span aria-hidden="true">
                    <Arrow />
                  </span>
                </button>
              </div>
            </div>
          </form>
          {error && (
            <div className="error" role="alert">
              {error}{" "}
              {mode === "ai" && (
                <button
                  onClick={() => {
                    setMode("offline");
                    setError("");
                  }}
                >
                  Use offline mode
                </button>
              )}
            </div>
          )}
          <div className="desk-footnote">
            <span className="status-dot" />
            {mode === "offline"
              ? "On-device translation. No account, no waiting."
              : "AI sends your phrase to OpenAI. No API key needed from visitors."}
            <span className="cache-status">
              {offlineReady
                ? "Ready for offline use"
                : "Shakespeare-inspired. Never a quotation."}
            </span>
          </div>
        </section>
        <div className="examples">
          <span>NEED A LITTLE INSPIRATION?</span>
          {examples.map((example) => (
            <button
              key={example}
              onClick={() => {
                if (busy) return;
                setText(example);
                setError("");
                input.current?.focus();
              }}
            >
              {example}
              <span aria-hidden="true">
                <Arrow />
              </span>
            </button>
          ))}
        </div>
        <LibraryPreview />
        <section
          className="collection"
          hidden={!showHistory}
          aria-label="Your collection"
        >
          <div className="collection-heading">
            <div>
              <span className="section-label">A RECORD OF THY WORDS</span>
              <h2>Your collection</h2>
            </div>
            <button
              className="text-button"
              onClick={() => {
                save([]);
                setResult(null);
              }}
            >
              Clear history
            </button>
          </div>
          <p className="collection-note">
            Your latest 20 translations live only in this browser. Anyone using
            this device can see them.
          </p>
          {history.length ? (
            history.map((entry) => (
              <div className="history-item" key={entry.id}>
                <button
                  disabled={busy}
                  aria-label={`Open translation: ${entry.source}`}
                  onClick={() => {
                    setText(entry.source);
                    setStyle(entry.style);
                    setMode(entry.mode);
                    setResult(entry);
                    setCopied(false);
                    setError("");
                    document
                      .getElementById("translator")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <span>{entry.source}</span>
                  <small>
                    {entry.mode} · {entry.style} ·{" "}
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </small>
                </button>
                <button
                  className="delete"
                  aria-label={`Delete translation: ${entry.source}`}
                  onClick={() =>
                    save(history.filter((item) => item.id !== entry.id))
                  }
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <p>Your story starts here.</p>
          )}
        </section>
        <section id="about" className="about">
          <div>
            <span className="feature-icon">♧</span>
            <h2>Always at thy service.</h2>
            <p>
              Offline mode works on your device. Visit once online, then take
              the quill wherever inspiration finds you.
            </p>
          </div>
          <div>
            <span className="feature-icon">✧</span>
            <h2>A touch more imagination.</h2>
            <p>
              Let AI find the poetry in your prose, with richer phrasing and a
              little dramatic flair.
            </p>
          </div>
          <div>
            <span className="feature-icon">❧</span>
            <h2>Inspired, not imitated.</h2>
            <p>
              A playful nod to Early Modern English. Original adaptations, not
              lines from Shakespeare’s plays.
            </p>
          </div>
        </section>
        <section className="closing-quote">
          <span aria-hidden="true">“</span>
          <blockquote>
            We know what we are, but know not what we may be.
          </blockquote>
          <p>
            WILLIAM SHAKESPEARE <span>·</span> HAMLET, ACT IV
          </p>
        </section>
      </main>
      <footer>
        <span className="footer-brand">
          The Bard’s Quill <span>✧</span>
        </span>
        <p>A little old-world wonder for your everyday words.</p>
        <span>CRAFTED FOR THE LOVE OF LANGUAGE</span>
      </footer>
      <div className="sr-only" role="status" aria-live="polite">
        {busy
          ? "Translating"
          : copied
            ? "Translation copied"
            : result
              ? "Translation ready"
              : ""}
      </div>
      {notice && (
        <div className="notice" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss notice">
            ×
          </button>
        </div>
      )}
    </>
  );
}
