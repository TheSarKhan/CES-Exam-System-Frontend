// Platform-wide date formatting. All dates render as gg.aa.iiii (dd.mm.yyyy).

const pad = (n: number) => String(n).padStart(2, "0");

type DateInput = string | number | Date | null | undefined;

/** gg.aa.iiii — e.g. 26.06.2026 */
export function formatDate(value: DateInput): string {
  if (value == null || value === "") return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

const AZ_WEEKDAYS = [
  "Bazar",            // 0 — Sunday
  "Bazar ertəsi",     // 1 — Monday
  "Çərşənbə axşamı",  // 2 — Tuesday
  "Çərşənbə",         // 3 — Wednesday
  "Cümə axşamı",      // 4 — Thursday
  "Cümə",             // 5 — Friday
  "Şənbə",            // 6 — Saturday
];

/** Relative Azerbaijani time, e.g. "5 dəq əvvəl", "2 saat əvvəl", falls back to gg.aa.iiii. */
export function timeAgoAz(value: DateInput): string {
  if (value == null || value === "") return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "indicə";
  if (diffMin < 60) return `${diffMin} dəq əvvəl`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h} saat əvvəl`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} gün əvvəl`;
  return formatDate(value);
}

/** Azerbaijani weekday name (e.g. "Cümə"). Empty string for invalid input. */
export function weekdayAz(value: DateInput): string {
  if (value == null || value === "") return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return AZ_WEEKDAYS[d.getDay()];
}

/** "Cümə, 26.06.2026" — Azerbaijani weekday + gg.aa.iiii. */
export function formatDateWithWeekdayAz(value: DateInput): string {
  const day = weekdayAz(value);
  const date = formatDate(value);
  return day ? `${day}, ${date}` : date;
}

/** gg.aa.iiii ss:dd — e.g. 26.06.2026 14:30 */
export function formatDateTime(value: DateInput): string {
  if (value == null || value === "") return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
