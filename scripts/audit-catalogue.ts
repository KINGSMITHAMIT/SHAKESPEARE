import { execFileSync } from "node:child_process";
import { catalogue, languages } from "../lib/library";
const fold = (text: string) => text.replace(/\s+/g, " ").trim();
const texts = new Map<string, string>();
let failures = 0;
if (process.argv.includes("--sources")) {
  for (const entry of catalogue) {
    if (entry.format === "context") continue;
    const url = entry.source.evidenceUrl;
    if (!url || !entry.source.lines) {
      console.error(`Missing source evidence: ${entry.id}`);
      failures++;
      continue;
    }
    try {
      if (!texts.has(url)) {
        const bytes = execFileSync(
          "curl",
          [
            "--fail",
            "--silent",
            "--show-error",
            "--location",
            "--max-time",
            "30",
            url,
          ],
          { maxBuffer: 5 * 1024 * 1024 },
        );
        texts.set(url, bytes.toString(entry.source.encoding || "utf8"));
      }
      const [start, end] = entry.source.lines;
      const snippet = texts
        .get(url)!
        .split(/\r?\n/)
        .slice(start - 1, end)
        .join("\n");
      if (!entry.passage || !fold(snippet).includes(fold(entry.passage))) {
        console.error(`Wording/line evidence mismatch: ${entry.id}`);
        failures++;
      }
    } catch {
      console.error(`Source could not be retrieved: ${entry.id}`);
      failures++;
    }
  }
  console.log(
    `Source audit: ${catalogue.filter((e) => e.format !== "context").length} reproduced passages, ${texts.size} pinned source files, ${failures} failures. Context and translations still require human editorial review.`,
  );
}
if (process.argv.includes("--release")) {
  const problems: string[] = [];
  if (catalogue.length !== 100)
    problems.push(`Expected 100 entries; currently ${catalogue.length}.`);
  const passages = catalogue.filter((e) => e.format !== "context").length;
  const contexts = catalogue.length - passages;
  if (passages !== 80)
    problems.push(`Expected 80 reproduced passages; currently ${passages}.`);
  if (contexts !== 20)
    problems.push(
      `Expected 20 modern-work context entries; currently ${contexts}.`,
    );
  for (const [language, name] of Object.entries(languages)) {
    const count = catalogue.filter((e) => e.language === language).length;
    if (count < 10) problems.push(`${name}: ${count}/10 minimum entries.`);
  }
  if (new Set(catalogue.map((e) => e.id)).size !== catalogue.length)
    problems.push("Duplicate stable IDs.");
  if (problems.length) {
    console.error(
      "100-entry release audit NOT PASSED:\n" +
        problems.map((p) => `- ${p}`).join("\n"),
    );
    failures += problems.length;
  } else console.log("100-entry release composition audit passed.");
}
process.exitCode = failures ? 1 : 0;
