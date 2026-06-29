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
  if (!/\p{L}/u.test(v)) return `${label} hərf içerməlidir`;
  return null;
}
