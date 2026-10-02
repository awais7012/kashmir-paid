/**
 * A story is written in one language: English or Urdu. There is no translation
 * layer, so the language travels with the story rather than with the reader.
 */
export type StoryLanguage = "en" | "ur";

export const STORY_LANGUAGE_OPTIONS: { value: StoryLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "ur", label: "اردو (Urdu)" },
];

/**
 * Urdu runs right to left, and Nastaliq cannot carry the editorial treatment
 * the design applies to English: letter-spacing breaks the joined script,
 * italic is synthesised and looks broken, and the script's descenders need
 * more leading than the Latin sizes assume. These utilities undo each of
 * those, so this class is appended last where a heading or label is Urdu.
 */
export const URDU_TEXT_CLASS = "font-urdu tracking-normal normal-case not-italic leading-[1.7]";

export function isUrdu(language: string | null | undefined): boolean {
  return language === "ur";
}

/**
 * For text whose language is not stored anywhere — a nav label, or a category
 * an editor typed. A story carries its language, but a label does not, so the
 * script itself is the signal.
 */
export function looksUrdu(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text);
}

/** `dir`/`lang` for a block of story text; inert for English. */
export function storyTextAttrs(language: string | null | undefined): {
  dir: "rtl" | undefined;
  lang: "ur" | undefined;
} {
  return isUrdu(language) ? { dir: "rtl", lang: "ur" } : { dir: undefined, lang: undefined };
}
