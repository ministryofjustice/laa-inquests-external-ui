import {
  PARTY_NAME_ALLOWED_CHARACTERS_REGEX,
  PROSE_UNSAFE_CHARACTERS_REGEX,
  WORDS_ALLOWED_CHARACTERS_REGEX,
} from "#src/infrastructure/locales/constants.js";

/**
 * Trim, fold curly apostrophes and compose accents, as the API does before it validates,
 * so a value the UI accepts is not rejected by the API (iOS types curly apostrophes).
 */
export function normaliseFreeText(value: string): string {
  return value
    .replaceAll("\u2018", "'")
    .replaceAll("\u2019", "'")
    .normalize("NFC")
    .trim();
}

/** Letters, spaces, hyphens and apostrophes: a person's name, or a relationship description. */
export function isWordsText(value: string): boolean {
  return WORDS_ALLOWED_CHARACTERS_REGEX.test(normaliseFreeText(value));
}

/** A person or organisation named on a letter: letters, numbers, spaces and ' . , & -. */
export function isPartyName(value: string): boolean {
  return PARTY_NAME_ALLOWED_CHARACTERS_REGEX.test(normaliseFreeText(value));
}

export function hasUnsafeProseCharacters(value: string): boolean {
  return PROSE_UNSAFE_CHARACTERS_REGEX.test(value);
}
