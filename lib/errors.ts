// Maps backend/technical error messages to clear Azerbaijani text for the UI.
// Anything already Azerbaijani (most of our backend messages) passes through unchanged.

const MAP: { test: RegExp; message: string }[] = [
  { test: /bad credentials/i, message: "E-poçt və ya şifrə yanlışdır" },
  { test: /user is disabled|account is disabled|disabled/i, message: "Hesabınız deaktiv edilib. Adminlə əlaqə saxlayın." },
  { test: /account is locked|locked/i, message: "Hesabınız kilidlənib. Adminlə əlaqə saxlayın." },
  { test: /credentials? (have )?expired/i, message: "Şifrənizin müddəti bitib" },
  { test: /bad request/i, message: "Sorğu düzgün deyil" },
  { test: /unauthorized/i, message: "İcazəniz yoxdur" },
  { test: /forbidden|access denied/i, message: "Bu əməliyyat üçün icazəniz yoxdur" },
  // Exam-session states (backend emits these in English)
  { test: /session is not active/i, message: "Bu imtahan sessiyası artıq aktiv deyil." },
  { test: /already submitted|already completed/i, message: "Bu imtahan artıq tamamlanıb." },
  { test: /not yet completed/i, message: "İmtahan hələ tamamlanmayıb." },
  { test: /invalid or expired exam link|invalid access token/i, message: "İmtahan linki etibarsızdır və ya vaxtı bitib." },
  { test: /this link has already been used|artıq istifadə olunub/i, message: "Bu link artıq istifadə olunub." },
  { test: /has not started yet/i, message: "İmtahan hələ başlamayıb." },
  { test: /deadline has passed/i, message: "İmtahanın son tarixi keçib." },
  { test: /session not found/i, message: "İmtahan sessiyası tapılmadı." },
  { test: /exam has no questions/i, message: "Bu imtahanda sual yoxdur." },
  { test: /not found/i, message: "Tapılmadı" },
  // Network-level failures (fetch threw before a response)
  { test: /failed to fetch|networkerror|load failed/i, message: "Serverə qoşulmaq mümkün olmadı. Bağlantını yoxlayın." },
  { test: /timeout|timed out/i, message: "Server cavab vermədi. Yenidən cəhd edin." },
];

/** Returns a user-facing Azerbaijani message for any error/string. */
export function humanizeError(err: unknown, fallback = "Xəta baş verdi"): string {
  const raw = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  if (!raw) return fallback;
  for (const { test, message } of MAP) {
    if (test.test(raw)) return message;
  }
  return raw; // already meaningful (e.g. our own Azerbaijani validation messages)
}
