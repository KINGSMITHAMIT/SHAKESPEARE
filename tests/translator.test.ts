import { describe, it, expect } from "vitest";
import { translateLocal } from "../lib/translator";
describe("local translation", () => {
  it.each([
    ["Hello!", "Hail!"],
    ["I love you.", "I love thee."],
    ["You are kind.", "Thou art kind."],
    ["Your book is yours.", "Thy book is thine."],
    ["You're my friend.", "Thou art my friend."],
    ["Do you know me?", "Dost thou know me?"],
    ["You have my book.", "Thou hast my book."],
    ["I saw you yesterday.", "I saw thee yesterday."],
    ["The quantum computer works.", "The quantum computer works."],
    ["No one is here.", "No one is here."],
    ["No problem.", "No problem."],
    ["No!", "Nay!"],
    ["You work hard.", "Thou workest hard."],
    ["I saw you go.", "I saw thee go."],
  ])("%s → %s", (input, output) =>
    expect(translateLocal(input, "faithful").translation).toBe(output),
  );
  it("adds dramatic framing without losing the phrase", () =>
    expect(translateLocal("I love you.", "dramatic").translation).toContain(
      "I love thee",
    ));
  it("explains approximation", () =>
    expect(translateLocal("Hello", "faithful").note).toContain("approximate"));
});
