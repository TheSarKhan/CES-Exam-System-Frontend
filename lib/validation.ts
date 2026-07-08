// Person-name validation shared by profile and user-management forms.
// Accepts letters (any language) with a single space/hyphen/apostrophe between words —
// rejects digits, dots and other symbols (e.g. "Nermin123", ".").
export const NAME_REGEX = /^\p{L}+(?:[ '-]\p{L}+)*$/u;

export function isValidName(value: string): boolean {
  return NAME_REGEX.test(value.trim());
}

/** Strips characters a valid name can never contain; apply on every keystroke. */
export function sanitizeNameInput(value: string): string {
  return value.replace(/[^\p{L} '-]/gu, "");
}

export const NAME_ERROR_MESSAGE = "Yalnız hərflərdən ibarət olmalıdır";

// Looser check for free-text names (categories, topics, etc.) that may contain digits,
// spaces or punctuation, but must not be made up of symbols alone (e.g. ".", "---").
export function hasLetter(value: string): boolean {
  return /\p{L}/u.test(value);
}

export const NAME_LETTER_ERROR_MESSAGE = "Ad ən azı bir hərf ehtiva etməlidir";
