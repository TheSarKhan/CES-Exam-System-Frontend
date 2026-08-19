import { NextResponse } from "next/server";

// type, text, difficulty, score, optionA, optionB, optionC, optionD, correct, imageUrl
// — same 10-column shape buildDraft() in the import page parses (imageUrl is new,
// optional, and simply ignored by the Excel/CSV path where it's absent).
type Row = string[];

const ALLOWED_HOSTS = new Set([
  "docs.google.com",
  "forms.gle",
  "forms.office.com",
  "forms.microsoft.com",
  "forms.office365.com",
  "forms.cloud.microsoft",
]);

const FETCH_TIMEOUT_MS = 10_000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function emptyRow(type: string, text: string, options: string[] = [], imageUrl = ""): Row {
  const [a = "", b = "", c = "", d = ""] = options;
  return [type, text, "MEDIUM", "1", a, b, c, d, "", imageUrl];
}

async function fetchText(url: string, accept: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT, Accept: accept },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/** Shallow, bounded scan for the first string value matching `test` — used for
 * best-effort image extraction where the exact array shape isn't fully certain. */
function findFirstString(value: unknown, test: (s: string) => boolean, depth = 4): string | null {
  if (depth <= 0 || value == null) return null;
  if (typeof value === "string") return test(value) ? value : null;
  if (Array.isArray(value)) {
    for (const v of value) {
      const found = findFirstString(v, test, depth - 1);
      if (found) return found;
    }
  }
  return null;
}

const looksLikeImageUrl = (s: string) =>
  /^https?:\/\//.test(s) && (/googleusercontent\.com/.test(s) || /\.(png|jpe?g|gif|webp)(\?|$)/i.test(s));

// --- Google Forms -----------------------------------------------------

const GOOGLE_TYPE_MAP: Record<number, string> = {
  0: "SHORT_TEXT",
  1: "LONG_TEXT",
  2: "SINGLE_CHOICE", // radio
  3: "SINGLE_CHOICE", // dropdown
  4: "MULTIPLE_CHOICE", // checkboxes
};

function normalizeGoogleFormUrl(raw: string): string {
  const u = new URL(raw);
  u.search = "";
  u.hash = "";
  const path = u.pathname.replace(/\/(edit|viewform|closedform)\/?$/, "");
  u.pathname = `${path}/viewform`;
  return u.toString();
}

function parseGoogleForms(html: string): { rows: Row[]; warnings: string[] } {
  const match = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) throw new Error("FB_PUBLIC_LOAD_DATA_ tapılmadı");
  const data = JSON.parse(match[1]);
  const questions: unknown[] = data?.[1]?.[1] ?? [];

  const rows: Row[] = [];
  const warnings: string[] = [];

  for (const q of questions) {
    const item = q as [number, string, string, number, unknown[] | null, ...unknown[]];
    const title = (item[1] ?? "").toString().trim();
    const typeCode = item[3];
    if (!title) continue; // section headers / plain text blocks

    // Best-effort: an attached question image commonly shows up around index 8;
    // exact shape isn't officially documented, so we scan defensively and never
    // let a miss here drop the question itself.
    const imageUrl = findFirstString(item[8], looksLikeImageUrl) ?? "";

    const mapped = GOOGLE_TYPE_MAP[typeCode];
    if (!mapped) {
      warnings.push(`Dəstəklənməyən sual tipi (kod ${typeCode}) keçildi: "${title}"`);
      continue;
    }

    if (mapped === "SHORT_TEXT" || mapped === "LONG_TEXT") {
      rows.push(emptyRow(mapped, title, [], imageUrl));
      continue;
    }

    const optionEntries = (item[4]?.[0] as unknown as [unknown, unknown[]])?.[1] ?? [];
    const options = (optionEntries as unknown[])
      .map((o) => ((o as [string])?.[0] ?? "").toString().trim())
      .filter(Boolean)
      .slice(0, 4);

    if (options.length < 2) {
      warnings.push(`Ən azı 2 variantı olmayan sual keçildi: "${title}"`);
      continue;
    }
    rows.push(emptyRow(mapped, title, options, imageUrl));
  }

  if (rows.length === 0) throw new Error("Formda dəstəklənən sual tapılmadı");
  return { rows, warnings };
}

// --- Microsoft Forms ----------------------------------------------------
// The response page (forms.office.com / forms.cloud.microsoft / ...) embeds a
// "prefetchFormUrl" pointing at the same public runtime API it uses to render
// itself: .../formapi/api/{tenant}/users/{user}/light/runtimeForms('{id}')
// ?$expand=questions($expand=choices). No auth/cookies needed for a form shared
// with "anyone can respond". Verified against a live link — see plan file.

interface MsChoice {
  Description?: string;
}
interface MsQuestionInfo {
  Choices?: MsChoice[];
  Multiline?: boolean;
}
interface MsQuestion {
  title?: string;
  type?: string;
  allowMultipleValues?: boolean | null;
  questionInfo?: string;
  image?: { resourceUrl?: string | null };
}

function extractPrefetchApiUrl(html: string): string {
  const m = html.match(/"prefetchFormUrl"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (!m) throw new Error("Form API linki tapılmadı");
  return JSON.parse(`"${m[1]}"`);
}

function parseMicrosoftForms(rawJson: string): { rows: Row[]; warnings: string[] } {
  const data = JSON.parse(rawJson) as { questions?: MsQuestion[] };
  const questions = data.questions ?? [];
  if (questions.length === 0) throw new Error("Sual siyahısı boşdur");

  const rows: Row[] = [];
  const warnings: string[] = [];

  for (const q of questions) {
    const title = (q.title ?? "").trim();
    if (!title) continue;
    const imageUrl = q.image?.resourceUrl ?? "";
    let info: MsQuestionInfo = {};
    try {
      info = q.questionInfo ? JSON.parse(q.questionInfo) : {};
    } catch {
      // leave info empty; handled per-type below
    }

    if (q.type === "Question.Choice") {
      const options = (info.Choices ?? [])
        .map((c) => (c.Description ?? "").trim())
        .filter(Boolean)
        .slice(0, 4);
      if (options.length < 2) {
        warnings.push(`Ən azı 2 variantı olmayan sual keçildi: "${title}"`);
        continue;
      }
      const type = q.allowMultipleValues ? "MULTIPLE_CHOICE" : "SINGLE_CHOICE";
      rows.push(emptyRow(type, title, options, imageUrl));
    } else if (q.type === "Question.TextField") {
      rows.push(emptyRow(info.Multiline ? "LONG_TEXT" : "SHORT_TEXT", title, [], imageUrl));
    } else {
      warnings.push(`Dəstəklənməyən sual tipi (${q.type ?? "naməlum"}) keçildi: "${title}"`);
    }
  }

  if (rows.length === 0) throw new Error("Formda dəstəklənən sual tapılmadı");
  return { rows, warnings };
}

// --- Route --------------------------------------------------------------

export async function POST(request: Request) {
  let url: string;
  try {
    const body = await request.json();
    url = (body?.url ?? "").toString().trim();
  } catch {
    return NextResponse.json({ error: "Keçərsiz sorğu" }, { status: 400 });
  }
  if (!url) return NextResponse.json({ error: "Link daxil edin" }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Keçərsiz link" }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return NextResponse.json(
      { error: "Yalnız Google Forms və ya Microsoft Forms linki dəstəklənir" },
      { status: 400 },
    );
  }

  const isGoogle = parsed.hostname === "docs.google.com" || parsed.hostname === "forms.gle";
  const provider = isGoogle ? "google" : "microsoft";

  try {
    let rows: Row[];
    let warnings: string[];
    if (isGoogle) {
      const html = await fetchText(normalizeGoogleFormUrl(url), "text/html");
      ({ rows, warnings } = parseGoogleForms(html));
    } else {
      const html = await fetchText(url, "text/html");
      const apiUrl = extractPrefetchApiUrl(html);
      const json = await fetchText(apiUrl, "application/json");
      ({ rows, warnings } = parseMicrosoftForms(json));
    }
    return NextResponse.json({ provider, rows, warnings });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    const hint = isGoogle
      ? "Formun paylaşım ayarında 'Hər kəs linklə görə bilər' aktiv olduğuna əmin olun."
      : "Formun paylaşım linkinin ictimai ('Hər kəs cavab verə bilər') olduğuna əmin olun.";
    return NextResponse.json(
      { error: `Form linki oxuna bilmədi. ${hint}`, detail },
      { status: 422 },
    );
  }
}
