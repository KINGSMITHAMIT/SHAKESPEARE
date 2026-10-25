export type Style = "faithful" | "dramatic";
export type Translation = { translation: string; note: string };
function casing(source: string, target: string) {
  return source === source.toUpperCase() && source.length > 1
    ? target.toUpperCase()
    : /^[A-Z]/.test(source)
      ? target[0].toUpperCase() + target.slice(1)
      : target;
}
const phrases: Record<string, string> = {
  hello: "hail",
  hi: "hail",
  no: "nay",
  yes: "aye",
  "good morning": "good morrow",
  "good evening": "good even",
  goodbye: "fare thee well",
  "thank you": "I thank thee",
  "how are you": "how dost thou fare",
  "what is your name": "by what name art thou called",
  "where are you": "where art thou",
  "i miss you": "I long for thee",
  "see you later": "farewell till we meet again",
};
const verbs: Record<string, string> = {
  are: "art",
  have: "hast",
  do: "dost",
  will: "wilt",
  shall: "shalt",
  can: "canst",
  would: "wouldst",
  could: "couldst",
  should: "shouldst",
  know: "knowest",
  love: "lovest",
  think: "thinkest",
  want: "desirest",
  need: "needest",
  see: "seest",
  say: "sayest",
  go: "goest",
  come: "comest",
  speak: "speakest",
  live: "livest",
  look: "lookest",
  work: "workest",
};
export function translateLocal(text: string, style: Style): Translation {
  let translation = text.trim().replace(/[’]/g, "'");
  translation = translation.replace(
    /\b(you're|you've|you'll|you'd|don't|can't|won't|it's|I'm)\b/gi,
    (s) =>
      casing(
        s,
        (
          {
            "you're": "you are",
            "you've": "you have",
            "you'll": "you will",
            "you'd": "you would",
            "don't": "do not",
            "can't": "cannot",
            "won't": "will not",
            "it's": "it is",
            "i'm": "I am",
          } as Record<string, string>
        )[s.toLowerCase()],
      ),
  );
  translation = translation
    .split(/([.!?]+\s*)/)
    .map((part) => {
      const match = part.trim().toLowerCase();
      if (phrases[match])
        return part.replace(part.trim(), casing(part.trim(), phrases[match]));
      return part
        .replace(
          /\b(do|are|have|will|shall|can|would|could|should)\s+you\b/gi,
          (s, v: string) => casing(s, `${verbs[v.toLowerCase()]} thou`),
        )
        .replace(
          /\byou\s+(\w+)\b/gi,
          (s, v: string, offset: number, sentence: string) =>
            /\b(saw|see|heard|hear|watch|watched|let|help|helped|made|make|love|thank|ask|asked|tell|told|for|with|to)\s*$/i.test(
              sentence.slice(0, offset),
            )
              ? s
              : verbs[v.toLowerCase()]
                ? casing(s, `thou ${verbs[v.toLowerCase()]}`)
                : s,
        )
        .replace(/\byour\s+([aeiou]\w*)/gi, (s, noun: string) =>
          casing(s, `thine ${noun}`),
        )
        .replace(
          /\b(yourself|yours|your|you|perhaps|please)\b/gi,
          (s: string) =>
            casing(
              s,
              (
                {
                  yourself: "thyself",
                  yours: "thine",
                  your: "thy",
                  you: "thee",
                  perhaps: "perchance",
                  please: "prithee",
                } as Record<string, string>
              )[s.toLowerCase()],
            ),
        );
    })
    .join("");
  if (style === "dramatic")
    translation = `Hark! ${translation}${/[.!?]$/.test(translation) ? "" : "."} Thus speaks the heart.`;
  return {
    translation,
    note: "An approximate, rule-based adaptation. Thou = you (subject); thee = you (object); thy/thine = your/yours. Unknown words are preserved; context and historical grammar may be imperfect.",
  };
}
