import Link from "next/link";
import { catalogue, languages, type Language } from "../lib/library";
export default function LibraryPreview() {
  return (
    <section
      className="library-preview"
      aria-labelledby="library-preview-title"
    >
      <div className="library-section-heading">
        <div>
          <span className="section-label">FROM PAGE TO STAGE</span>
          <h2 id="library-preview-title">Words worth returning to.</h2>
          <p>
            Discover the lines, speeches, and conversations that stay with us.
          </p>
        </div>
        <Link href="/library" prefetch={false} className="library-link">
          Explore the library <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="featured-grid">
        {(Object.keys(languages) as Language[]).map((language) => {
          const entry = catalogue.find((item) => item.language === language);
          return (
            <Link
              prefetch={false}
              key={language}
              href={
                entry
                  ? `/library?entry=${entry.id}`
                  : `/library?language=${language}`
              }
              className={`featured-card ${entry ? "" : "awaiting-source"}`}
            >
              <span className="section-label">{languages[language]}</span>
              {entry ? (
                <>
                  <blockquote lang={language} dir="auto">
                    {entry.passage}
                  </blockquote>
                  <span className="featured-credit">
                    {entry.writer} · {entry.work}
                  </span>
                </>
              ) : (
                <>
                  <h3>A stage awaiting its voices.</h3>
                  <p>Entries awaiting source verification.</p>
                </>
              )}
              <span className="featured-action">
                {entry ? "Read the passage" : "View language collection"}{" "}
                <span aria-hidden="true">→</span>
              </span>
            </Link>
          );
        })}
      </div>
      <p className="library-editorial-note">
        A growing, curated collection—not a complete catalogue. Only
        source-checked passages appear here. The planned six-language, 100-entry
        edition is still being researched.
      </p>
    </section>
  );
}
