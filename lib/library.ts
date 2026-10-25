export type Language = "en" | "hi" | "fr" | "de" | "es" | "ru";
export type Format = "quote" | "speech" | "exchange" | "context";
export type LibraryEntry = {
  id: string;
  title: string;
  writer: string;
  work: string;
  language: Language;
  format: Format;
  speakers: string[];
  locator?: string;
  passage?: string;
  translation?: { text: string; credit: string };
  context: string;
  source: {
    url: string;
    edition: string;
    permissions: string;
    encoding?: "utf8" | "latin1";
    evidenceUrl?: string;
    lines?: [number, number];
  };
};
export const languages: Record<Language, string> = {
  en: "English",
  hi: "Hindi",
  fr: "French",
  de: "German",
  es: "Spanish",
  ru: "Russian",
};
export const formats: Record<Format, string> = {
  quote: "Quote",
  speech: "Speech",
  exchange: "Exchange",
  context: "Context only",
};
export type LibraryFilters = {
  query?: string;
  writer?: string;
  language?: string;
  format?: string;
};
import { verifiedEntries } from "./catalogue";
import { worldEntries } from "./catalogue-world";
export const catalogue: LibraryEntry[] = [...verifiedEntries, ...worldEntries];
const normalize = (text: string) =>
  text
    .normalize("NFKC")
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/(\p{Script=Latin})\p{M}+/gu, "$1")
    .replace(/\s+/g, " ")
    .trim();
export function filterEntries(
  entries: LibraryEntry[],
  filters: LibraryFilters,
) {
  const query = normalize(filters.query || "");
  return entries.filter(
    (entry) =>
      (!filters.writer || entry.writer === filters.writer) &&
      (!filters.language || entry.language === filters.language) &&
      (!filters.format || entry.format === filters.format) &&
      (!query ||
        normalize(
          [
            entry.title,
            entry.passage,
            entry.translation?.text,
            entry.writer,
            entry.work,
            ...entry.speakers,
            entry.context,
          ].join(" "),
        ).includes(query)),
  );
}
export function copyPassage(entry: LibraryEntry): string | null {
  if (entry.format === "context" || !entry.passage) return null;
  return `${entry.passage}\n\n— ${entry.writer}, ${entry.work}${entry.locator ? `, ${entry.locator}` : ""}\n${entry.source.edition}\n${entry.translation ? `\nEnglish translation (${entry.translation.credit}):\n${entry.translation.text}\n` : ""}${entry.source.url}`;
}
