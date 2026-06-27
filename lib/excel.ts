// Excel (.xlsx) import/export for question bulk upload.
// Each field is its own cell, so commas inside question text are never a problem
// (the CSV pain point), and `type`/`difficulty` are dropdowns so they can't be
// mistyped. exceljs is loaded dynamically so it only ships on the import page.

export const EXCEL_COLUMNS = [
  "type", "text", "difficulty", "score", "optionA", "optionB", "optionC", "optionD", "correct",
] as const;

const TYPE_VALUES = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_TEXT", "LONG_TEXT"];
const DIFFICULTY_VALUES = ["EASY", "MEDIUM", "HARD"];

const EXAMPLE_ROWS: (string | number)[][] = [
  ["SINGLE_CHOICE", "Azərbaycanın paytaxtı hansıdır?", "EASY", 1, "Bakı", "Gəncə", "Sumqayıt", "Şəki", "A"],
  ["MULTIPLE_CHOICE", "Hansılar proqramlaşdırma dilidir?", "MEDIUM", 2, "Java", "HTML", "Python", "CSS", "A C"],
  ["TRUE_FALSE", "Yer Günəş ətrafında fırlanır.", "EASY", 1, "", "", "", "", "A"],
  ["SHORT_TEXT", "HTTP abreviaturası nəyi bildirir?", "MEDIUM", 2, "", "", "", "", ""],
];

/** Read the first sheet of an .xlsx/.xls file into rows of trimmed strings. */
export async function parseExcelToRows(file: File): Promise<string[][]> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws = wb.worksheets[0];
  if (!ws) return [];
  const colCount = Math.max(ws.columnCount, EXCEL_COLUMNS.length);
  const rows: string[][] = [];
  ws.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = [];
    for (let c = 1; c <= colCount; c++) {
      const t = row.getCell(c).text;
      cells.push(t == null ? "" : String(t).trim());
    }
    if (cells.some((c) => c !== "")) rows.push(cells);
  });
  return rows;
}

/** Build and download an .xlsx template with dropdowns on type & difficulty. */
export async function downloadExcelTemplate(filename = "ces-sual-shablon.xlsx") {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Suallar");

  ws.addRow(EXCEL_COLUMNS as unknown as string[]);
  EXAMPLE_ROWS.forEach((r) => ws.addRow(r));

  // Header styling
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).alignment = { vertical: "middle" };
  ws.columns = [
    { width: 16 }, { width: 46 }, { width: 12 }, { width: 8 },
    { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 12 },
  ];
  ws.views = [{ state: "frozen", ySplit: 1 }];

  // Dropdowns for the typo-prone columns, applied to a generous row range.
  const lastRow = 500;
  for (let r = 2; r <= lastRow; r++) {
    ws.getCell(`A${r}`).dataValidation = {
      type: "list", allowBlank: false, formulae: [`"${TYPE_VALUES.join(",")}"`],
      showErrorMessage: true, errorTitle: "Yanlış tip", error: "Siyahıdan seçin.",
    };
    ws.getCell(`C${r}`).dataValidation = {
      type: "list", allowBlank: true, formulae: [`"${DIFFICULTY_VALUES.join(",")}"`],
      showErrorMessage: true, errorTitle: "Yanlış çətinlik", error: "EASY / MEDIUM / HARD seçin.",
    };
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
