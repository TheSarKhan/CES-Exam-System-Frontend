/** Minimal RFC-4180-ish CSV parser: handles quoted fields, escaped "", commas, CRLF/LF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;

  const endField = () => { row.push(field); field = ""; };
  const endRow = () => { rows.push(row); row = []; };

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ",") { endField(); i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") { endField(); endRow(); i++; continue; }
    field += c; i++;
  }
  // flush trailing field/row
  if (field.length > 0 || row.length > 0) { endField(); endRow(); }

  // drop fully-empty rows
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Build a downloadable CSV string and trigger a browser download. */
export function downloadCsv(filename: string, content: string) {
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
