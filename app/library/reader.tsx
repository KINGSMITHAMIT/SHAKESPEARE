"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  catalogue,
  copyPassage,
  filterEntries,
  formats,
  languages,
  type LibraryEntry,
} from "../../lib/library";
const PAGE_SIZE = 12;
const writers = [...new Set(catalogue.map((entry) => entry.writer))].sort();
export default function LibraryReader() {
  const [query, setQuery] = useState("");
  const [writer, setWriter] = useState("");
  const [language, setLanguage] = useState("");
  const [format, setFormat] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [offlineReady, setOfflineReady] = useState(false);
  const reading = useRef<HTMLElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const entries = filterEntries(catalogue, { query, writer, language, format });
  const entry = catalogue.find((item) => item.id === selected);
  useEffect(() => {
    function restore() {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("entry");
      setSelected(id);
      const lang = params.get("language");
      setLanguage(lang && lang in languages ? lang : "");
      setQuery("");
      setWriter("");
      setFormat("");
      setLimit(PAGE_SIZE);
      setMessage(
        id && !catalogue.some((item) => item.id === id)
          ? "This library entry could not be found. Browse the collection below."
          : "",
      );
    }
    const timer = setTimeout(restore, 0);
    window.addEventListener("popstate", restore);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => navigator.serviceWorker.ready)
        .then(() => setOfflineReady(true))
        .catch(() =>
          setMessage(
            "Offline caching is unavailable. You can still browse this page while it is open.",
          ),
        );
    return () => {
      clearTimeout(timer);
      window.removeEventListener("popstate", restore);
    };
  }, []);
  useEffect(() => {
    if (!selected) return;
    const frame = requestAnimationFrame(() => {
      reading.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
      reading.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [selected]);
  function close() {
    setSelected(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("entry");
    window.history.replaceState(null, "", url);
    requestAnimationFrame(() => {
      if (opener.current?.isConnected) opener.current.focus();
      else search.current?.focus();
    });
  }
  function change(setter: (value: string) => void, value: string) {
    setter(value);
    setLimit(PAGE_SIZE);
    setMessage("");
    setSelected(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("entry");
    const nextLanguage = setter === setLanguage ? value : language;
    if (nextLanguage) url.searchParams.set("language", nextLanguage);
    else url.searchParams.delete("language");
    window.history.replaceState(null, "", url);
  }
  function open(item: LibraryEntry, button: HTMLButtonElement) {
    opener.current = button;
    setSelected(item.id);
    setMessage("");
    const url = new URL(window.location.href);
    url.searchParams.set("entry", item.id);
    window.history.pushState(null, "", url);
  }
  function reset() {
    setQuery("");
    setWriter("");
    setLanguage("");
    setFormat("");
    setLimit(PAGE_SIZE);
    setMessage("");
    setSelected(null);
    window.history.replaceState(null, "", "/library");
  }
  async function copy(item: LibraryEntry) {
    const text = copyPassage(item);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Passage copied with attribution.");
    } catch {
      setMessage("Copy is unavailable. Select the passage text to copy it.");
    }
  }
  return (
    <>
      <header className="site-header">
        <Link href="/" prefetch={false} className="brand">
          The Bard’s Quill
          <span className="library-brand-mark" aria-hidden="true">
            ✧
          </span>
        </Link>
        <nav aria-label="Main navigation" className="library-nav">
          <Link href="/" prefetch={false}>
            The translator
          </Link>
          <Link href="/library" prefetch={false} aria-current="page">
            Dialogue library
          </Link>
        </nav>
      </header>
      <main className="library-main">
        <section className="library-hero">
          <span className="eyebrow">THE DIALOGUE LIBRARY</span>
          <h1>
            Words that outlive
            <br />
            <em>the stage.</em>
          </h1>
          <p>
            A collection of unforgettable voices. Read the words,
            <br className="desktop-break" /> discover their world, and follow
            the story further.
          </p>
          <div className="library-badges">
            <span>{catalogue.length} verified passages</span>
            <span>
              {offlineReady
                ? "Saved for offline reading"
                : "Read at your own pace"}
            </span>
          </div>
        </section>
        <aside className="catalogue-progress">
          <strong>An edition in progress.</strong> The planned collection
          contains 100 entries across six languages, including modern works.
          This preview contains {catalogue.length} source-checked passages in
          English, German, and French by Shakespeare, Goethe, and Molière.
          Hindi, Spanish, Russian, and modern-work sources still require
          verification. No unverified quotations have been added.
        </aside>
        <section className="library-controls" aria-label="Find a passage">
          <label className="library-search">
            Search the library
            <input
              ref={search}
              type="search"
              value={query}
              placeholder="A line, a writer, a character…"
              onChange={(e) => change(setQuery, e.target.value)}
            />
          </label>
          <div className="library-filters">
            <label>
              Writer
              <select
                value={writer}
                onChange={(e) => change(setWriter, e.target.value)}
              >
                <option value="">All writers</option>
                {writers.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Language
              <select
                value={language}
                onChange={(e) => change(setLanguage, e.target.value)}
              >
                <option value="">All languages</option>
                {Object.entries(languages).map(([code, name]) => (
                  <option value={code} key={code}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Format
              <select
                value={format}
                onChange={(e) => change(setFormat, e.target.value)}
              >
                <option value="">All formats</option>
                {Object.entries(formats).map(([code, name]) => (
                  <option value={code} key={code}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <button className="text-button" onClick={reset}>
              Reset filters
            </button>
          </div>
        </section>
        <div
          className="library-results-summary"
          role="status"
          aria-live="polite"
        >
          {entries.length} {entries.length === 1 ? "entry" : "entries"} found{" "}
          <span>Showing {Math.min(limit, entries.length)}</span>
        </div>
        {entry && (
          <section
            ref={reading}
            className="reading-view"
            tabIndex={-1}
            role="region"
            aria-label={`Reading: ${entry.title}`}
          >
            <div className="reading-heading">
              <span className="section-label">
                {formats[entry.format]} · {languages[entry.language]}
              </span>
              <button className="text-button" onClick={close}>
                Close reading view
              </button>
            </div>
            <h2>{entry.title}</h2>
            <p className="reading-attribution">
              {entry.writer} <span> / </span> {entry.work}
              {entry.locator && (
                <>
                  {" "}
                  <span> / </span> {entry.locator}
                </>
              )}
            </p>
            {entry.speakers.length > 0 && (
              <p className="reading-speakers">{entry.speakers.join(" · ")}</p>
            )}
            {entry.passage && (
              <>
                <h3 className="section-label">ORIGINAL PASSAGE · EXCERPT</h3>
                <blockquote
                  className="reading-passage"
                  lang={entry.language}
                  dir="auto"
                >
                  {entry.passage}
                </blockquote>
              </>
            )}
            {entry.translation && (
              <div className="reading-translation">
                <h3>English translation</h3>
                <p className="translator-credit">{entry.translation.credit}</p>
                <blockquote lang="en">{entry.translation.text}</blockquote>
              </div>
            )}
            <div className="reading-context">
              <h3>Behind the words</h3>
              <p>{entry.context}</p>
            </div>
            <details className="reading-source">
              <summary>Edition, sources &amp; permissions</summary>
              <p>{entry.source.edition}</p>
              <p>{entry.source.permissions}</p>
              {entry.source.evidenceUrl && (
                <a
                  href={entry.source.evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View the verified transcription
                </a>
              )}
              {entry.source.lines && (
                <p>
                  Source lines {entry.source.lines[0]}–{entry.source.lines[1]};
                  line wraps may be joined. Punctuation follows this edition.
                </p>
              )}
            </details>
            <div className="reading-actions">
              {entry.format !== "context" && entry.passage && (
                <button
                  className="translate-button"
                  onClick={() => copy(entry)}
                >
                  Copy passage
                </button>
              )}
              <a
                href={entry.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="library-link"
              >
                Read the source work <span aria-hidden="true">↗</span>
              </a>
              <span className="reading-network-note">
                Source links require internet.
              </span>
            </div>
            <p className="library-editorial-note">
              {entry.format === "context"
                ? "An original editorial summary; no passage from the work is reproduced."
                : "An attributed excerpt, not a translation generated by the translator. Wording can differ between editions."}
            </p>
          </section>
        )}
        {entries.length ? (
          <div className="library-grid">
            {entries.slice(0, limit).map((item) => (
              <article
                data-testid="library-card"
                className={`dialogue-card ${selected === item.id ? "is-selected" : ""}`}
                key={item.id}
              >
                <div className="card-meta">
                  <span>{languages[item.language]}</span>
                  <span>{formats[item.format]}</span>
                </div>
                <h2>{item.title}</h2>
                {item.passage ? (
                  <blockquote lang={item.language} dir="auto">
                    {item.passage}
                  </blockquote>
                ) : (
                  <p className="context-preview">{item.context}</p>
                )}
                <p className="card-attribution">
                  {item.writer}
                  <span>
                    {item.work}
                    {item.locator ? ` · ${item.locator}` : ""}
                  </span>
                </p>
                <button
                  aria-label={`Read ${item.title}`}
                  onClick={(event) => open(item, event.currentTarget)}
                  aria-expanded={selected === item.id}
                >
                  Read {item.format === "context" ? "context" : "passage"}{" "}
                  <span aria-hidden="true">→</span>
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="library-empty">
            <span aria-hidden="true">✧</span>
            <h2>No passages match these filters.</h2>
            <p>
              Try another word or reset the filters. Some language collections
              are awaiting source verification.
            </p>
            <button className="translate-button" onClick={reset}>
              Browse all passages
            </button>
          </div>
        )}
        {limit < entries.length && (
          <div className="show-more">
            <button
              className="translate-button"
              onClick={() => setLimit((value) => value + PAGE_SIZE)}
            >
              Show more
            </button>
          </div>
        )}
        <div className="library-message" role="status" aria-live="polite">
          {message}
        </div>
        <p className="library-editorial-note library-bottom-note">
          This is a curated collection, not a complete catalogue of all writers.
          Original quotations, editorial translations, and context-only entries
          are labeled separately. No AI is used to invent or attribute
          quotations.
        </p>
      </main>
      <footer>
        <Link href="/" className="footer-brand" prefetch={false}>
          The Bard’s Quill ✧
        </Link>
        <p>Every voice has a story. Read it in context.</p>
        <Link href="/" prefetch={false}>
          Back to the translator
        </Link>
      </footer>
    </>
  );
}
