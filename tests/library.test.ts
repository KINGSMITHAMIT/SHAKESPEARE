import { describe, it, expect } from "vitest";
import {
  catalogue,
  filterEntries,
  copyPassage,
  languages,
} from "../lib/library";
describe("catalogue integrity", () => {
  it("preserves distinctions between Indic vowel signs", () => {
    const base = catalogue[0];
    expect(
      filterEntries(
        [
          {
            ...base,
            language: "hi",
            title: "test",
            passage: "दिन",
            context: "test",
            speakers: [],
            writer: "test",
            work: "test",
          },
        ],
        { query: "दीन" },
      ),
    ).toHaveLength(0);
  });
  it("has unique source-checked records with permissions and context", () => {
    expect(catalogue.length).toBeGreaterThan(0);
    expect(new Set(catalogue.map((e) => e.id)).size).toBe(catalogue.length);
    for (const entry of catalogue) {
      expect(entry.source.url).toMatch(/^https:\/\//);
      expect(entry.source.edition).toBeTruthy();
      expect(entry.source.permissions).toBeTruthy();
      expect(entry.context).toBeTruthy();
      if (entry.format === "context") {
        expect(entry.passage).toBeUndefined();
      } else expect(entry.passage?.trim()).toBeTruthy();
    }
  });
  it("combines search, writer, language and format filters", () => {
    expect(
      filterEntries(catalogue, {
        query: "to be",
        writer: "William Shakespeare",
        language: "en",
        format: "speech",
      }).map((e) => e.id),
    ).toContain("hamlet-to-be");
    expect(
      filterEntries(catalogue, {
        query: "to be",
        writer: "Molière",
        language: "en",
        format: "speech",
      }),
    ).toHaveLength(0);
  });
  it("finds speaker and work as well as passage", () => {
    expect(
      filterEntries(catalogue, { query: "Ophelia" }).some(
        (e) => e.id === "hamlet-what-we-may-be",
      ),
    ).toBe(true);
    expect(
      filterEntries(catalogue, { query: "Hamlet" }).length,
    ).toBeGreaterThan(0);
  });
  it("copies passage and attribution, never a context-only summary", () => {
    const entry = catalogue.find((e) => e.id === "hamlet-to-be")!;
    expect(copyPassage(entry)).toContain("William Shakespeare");
    expect(copyPassage(entry)).toContain("Act III, Scene I");
    expect(
      copyPassage({ ...entry, format: "context", passage: undefined }),
    ).toBeNull();
  });
  it("supports all six languages and original script searching", () => {
    expect(Object.keys(languages)).toHaveLength(6);
    const base = catalogue[0];
    for (const [language, passage] of [
      ["hi", "अंधेर नगरी"],
      ["ru", "Быть или не быть"],
      ["fr", "être"],
      ["de", "Sein"],
      ["es", "sueño"],
    ] as const) {
      const sample = { ...base, language, passage };
      expect(
        filterEntries([sample], { query: passage, language }),
      ).toHaveLength(1);
    }
  });
});
