// Client-side mirrors of the backend validation policy (backend stays the source
// of truth; these just give instant inline feedback).

export const PASSWORD_HINT = "Ən azı 8 simvol, ən azı bir hərf və bir rəqəm.";

export function passwordError(pw: string): string | null {
  if (!pw) return "Parol tələb olunur";
  if (pw.length < 8) return "Parol ən azı 8 simvol olmalıdır";
  if (!/[A-Za-z]/.test(pw)) return "Parol ən azı bir hərf içerməlidir";
  if (!/\d/.test(pw)) return "Parol ən azı bir rəqəm içerməlidir";
  return null;
}

export function nameError(name: string, label = "Ad"): string | null {
  const v = (name ?? "").trim();
  if (v.length < 2) return `${label} ən azı 2 simvol olmalıdır`;
  if (!/^\p{L}+(?:[ '-]\p{L}+)*$/u.test(v)) return `${label} yalnız hərflərdən ibarət olmalıdır`;
  return null;
}

// Strips characters a valid person-name can never contain (digits, symbols);
// apply on every keystroke so the field can never hold an invalid value.
export function sanitizeName(value: string): string {
  return value.replace(/[^\p{L} '-]/gu, "");
}

// Client-side mirror of the backend @Email check; the message stays in
// Azerbaijani so email validation matches every other field's message.
export function emailError(email: string): string | null {
  const v = (email ?? "").trim();
  if (!v) return "E-poçt tələb olunur";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "E-poçt düzgün deyil";
  return null;
}
