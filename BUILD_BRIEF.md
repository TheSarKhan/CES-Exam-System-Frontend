# BUILD BRIEF — Corporate Assessment Platform (Frontend Redesign)

> **For the autonomous agent continuing this work.** This file is self-contained.
> Read it fully, then read `design_handoff_assessment_ui_kit/README.md` (the complete
> design spec) before writing code. Goal: finish the visual overhaul + missing modules
> so the frontend is review-ready. Commit frequently. Open a PR when done.

## 0. Mission

The platform was previously built with low-quality output. We are doing a full visual
overhaul to match the provided **UI Kit** and completing missing modules. The single
source of design truth is:

- `design_handoff_assessment_ui_kit/README.md` — full token + component + screen spec
- `design_handoff_assessment_ui_kit/Assessment UI Kit.dc.html` — reference markup (do
  NOT ship; read inline styles for any exact value)
- `../Corporate Assessment Platform.pdf` requirements are summarized in §6 below.

**Interface language: Azerbaijani (az).** The UI kit already contains AZ copy — use it.

## 1. Tech stack & environment (READ FIRST)

- **Next.js 16.2.9 (App Router, Turbopack)** + **React 19.2.4** + **TypeScript**.
- This is a NEWER Next than training data. Before using any Next API, read the relevant
  guide under `node_modules/next/dist/docs/01-app/`. Heed deprecations.
  - Known: the `middleware` file convention is deprecated → rename `middleware.ts` to
    `proxy.ts` (see `node_modules/next/dist/docs` / the `middleware-to-proxy` message).
    Keep the same matcher/logic, just the new convention.
- **Styling: Tailwind CSS v4** (already set up: `postcss.config.mjs`, `@import "tailwindcss"`
  in `app/globals.css`). Dark mode = `.dark` class on `<html>` (class-based variant).
- **Fonts:** Geist + Geist Mono via `next/font/google` (wired in `app/layout.tsx`).
  **Every number that is data (scores, %, timers, counts, IDs) must use Geist Mono** —
  apply the `num` utility class (defined in globals.css).
- **Icons:** `lucide-react` (installed). All kit icons are Lucide.
- Dev: `npm run dev` (port 3000). Build check: `npm run build` — MUST pass before PR.
- Do **not** modify the backend. API contracts in `lib/types.ts` are fixed.

## 2. Design system already built (USE THESE — do not reinvent)

`app/globals.css` defines the full token system:
- Tailwind `@theme` colors: `blue-50..900` (brand, blue-600 = primary `#2563EB`),
  `slate-50..900`, semantic `success/danger/warning/info/purple` (+ `-bg`/`-fg` tints),
  `star`. Radii `--radius-sm/md/lg/xl`. Shadows `--shadow-card/pop/modal/primary*`.
- Semantic theme-aware surfaces (auto light/dark): use utilities
  `bg-app bg-surface bg-surface-2 border-line border-line-strong
   text-fg text-fg-soft text-fg-muted text-fg-faint bg-sidebar bg-sidebar-2`.
- Component classes: `.card`, `.btn` (+ `.btn-primary/secondary/outline/ghost/danger/
  success`, `.btn-sm/lg`), `.field` (+ `.field-error`), `.focus-ring`, `.spinner`, `.num`.

Reusable React components in `components/ui/`:
- `Button.tsx` — `<Button variant size loading icon iconRight>` + `buttonClasses()` for links.
- `Badge.tsx` — `ResultPill`, `StatusPill`, `CategoryTag` + `categoryColor()`, `RoleBadge`,
  `SeverityTag`, `DeltaChip`, `CountPill`.
- `Card.tsx` — `Card`, `CardHeader`.
- `Field.tsx` — `Label`, `FieldGroup`, `Input`, `Textarea`, `Select`, `IconInput`.
- `DataViz.tsx` — `KpiCard`, `ProgressBar` + `scoreColor()`, `Gauge`, `Segmented`, `Tabs`.
- `Feedback.tsx` — `Alert`, `EmptyState`, `Modal`, `Loading`.
- `Avatar.tsx` — `Avatar` (initials, deterministic color).

Theme: `lib/theme.tsx` (`ThemeProvider`, `useTheme()` → `{theme, toggle, setTheme}`).
Add a dark-mode toggle (sun/moon Lucide icon) in both app top bars.

Build new small primitives in `components/ui/` if needed; keep the same conventions.

## 3. App architecture (existing, keep)

- Auth: `lib/auth.tsx` (`useAuth()` → user/login/logout/isAdmin/isEmployee). Login routes
  ADMIN → `/dashboard`, others → `/employee/dashboard`.
- API: `lib/api.ts` (`apiFetch`), `lib/publicApi.ts` (candidate token flow), `lib/types.ts`.
- Route groups: `app/(admin)/*` (admin layout+sidebar), `app/employee/*` (employee layout),
  `app/exam/token/[token]/*` (candidate magic-link flow), `app/login`.

## 4. TASK LIST (priority order). Commit after each item.

1. **App shell** — Rebuild `app/(admin)/layout.tsx` and `app/employee/layout.tsx` to the kit:
   - Admin: 62px dark-navy **icon rail** (Lucide tiles: dashboard/exams/question-bank/users/
     departments/reports/analytics/settings; active tile = `rgba(59,130,246,0.18)` bg,
     blue-400 icon) + 62px white **top bar** (page title left; search + bell w/ red count +
     avatar cluster + **dark-mode toggle** right). Content area `bg-app`, 26px padding.
   - Employee: top bar (brand + "Mənim Qiymətləndirmələrim" + user cluster + theme toggle).
   - Make a shared `components/app/IconRail.tsx`, `TopBar.tsx`, `ThemeToggle.tsx`.
2. **Login** (`app/login/page.tsx` + css) — clean centered card, brand mark (check-square
   Lucide in a blue gradient tile), AZ copy ("Daxil ol", "E-poçt", "Şifrə"). Remove the
   tacky purple gradient/pulse. Use `field`/`Button`. Keep `useAuth().login` logic.
3. **Landing** `/` — keep redirect to `/login`.
4. **Admin Dashboard** (`app/(admin)/dashboard/page.tsx`) — greeting row + "Yeni imtahan"
   button; 4 KPI cards (use `KpiCard`); charts row (bar chart "İmtahan iştirakı" + Pass/Fail
   `Gauge`); "Yaxınlaşan periodik imtahanlar" list. Wire real data from
   `GET /api/v1/admin/dashboard` (`DashboardStats`); fill chart gaps with graceful empty
   states where the API lacks data. See README §Screens/1.
5. **Analytics** (`app/(admin)/analytics/page.tsx`, NEW + add rail item) — line/area pass-rate
   chart (inline SVG), question-type distribution donut, department performance bars
   (`ProgressBar`), hardest-questions list, anti-cheat log stat grid. Use real report data
   where available; otherwise clearly-labeled placeholders. README §Screens/2.
6. **Question Bank** (`app/(admin)/question-bank/*`) — left category tree (248px) with
   expandable categories→topics (counts), right topic header + question rows (mono ID + type
   tag + points + edit/delete), and the dashed "exam-builder" stepper callout. Add
   category/topic create UI (APIs exist). README §Screens/3.
7. **Exam-taking screen** — Rebuild `app/employee/exams/[sessionId]/take/page.tsx` AND
   `app/exam/token/[token]/[sessionId]/take/page.tsx` (share a component
   `components/exam/ExamRunner.tsx`): 64px top bar (brand + title + taker + anti-cheat
   counter chip + mono **timer** in a navy pill), full-width progress bar, big question card
   (mono "Sual X/Y" + category tag + type·points + flag button), large answer rows, footer
   (Əvvəlki / "Avtomatik yadda saxlanıldı" / Növbəti), right **navigator** (268px) grid of
   question chips (answered=blue, flagged=amber, current=outline, empty=grey) + legend +
   "İmtahanı bitir". README §Screens/4.
8. **11 question types** — `components/exam/QuestionInput.tsx` rendering by `question.type`:
   SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, SHORT_TEXT (+manual-review chip), LONG_TEXT
   (+counter), IMAGE_QUESTION, IMAGE_CHOICE, DATE_PICKER, NUMBER_INPUT (stepper), RATING
   (stars), LIKERT_SCALE (emoji). README §"Question Types (11)". Backend currently stores a
   single `selectedOptionId`/`textAnswer` per question (see `SessionAnswerRequest`); for
   MULTIPLE_CHOICE/RATING/LIKERT encode the answer into the available fields (e.g. comma list
   in `textAnswer`) without breaking the contract — document any such encoding in code.
9. **Anti-cheat** (`components/exam/useAntiCheat.ts`) — detect: tab/visibility change, window
   blur, fullscreen exit, page refresh attempt (beforeunload), offline, right-click, copy,
   paste, devtools-open heuristic, long inactivity. Log each with timestamp. Escalating
   warning alerts (1st/2nd = warning, 3rd = critical → auto-submit/terminate, flag result).
   Limit configurable (default 3). README §"Interactions/Anti-cheat".
10. **Employee panel** (`app/employee/dashboard/page.tsx`, `exams/page.tsx`) — gradient hero
    card (next assigned exam + "İmtahana başla"), 3 mini KPIs, "Keçmiş nəticələrim" history
    rows with Pass/Fail tiles + segmented filter. README §Screens/5. Wire `GET
    /api/v1/assignments/my`.
11. **Result screens** — `app/employee/exams/[sessionId]/result/page.tsx` and the candidate
    one: score `Gauge`, Pass/Fail pill, breakdown (correct/wrong/blank, mono), per-answer
    review. Wire `GET /api/v1/sessions/{id}/result`.
12. **Remaining admin pages** — Users (`+[id]/edit`), Departments, Exams (`+create`,
    `+assign`), Reports (filters + table + export button). Restyle to kit (DataTable look:
    header strip + mono count pill + search + Filter; zebra rows; avatar user cells; footer
    pager). Keep existing data fetching. Add category/topic/role create where noted.
13. **Candidate flow** (`app/exam/token/[token]/*`) — name/surname entry screen + reuse
    `ExamRunner`. Uses `lib/publicApi.ts`. README §Candidate.
14. **Polish** — responsive (collapse grids; rail → drawer on mobile; tables scroll), empty/
    loading/error states everywhere, dark-mode pass, remove dead CSS modules, fix `middleware`
    → `proxy`. Run `npm run build` until clean. Update `progress_plan.md`.

## 5. Definition of done

- `npm run build` passes with no type/lint errors.
- All screens above restyled to the kit, AZ copy, in both light and dark.
- 11 question types render; anti-cheat works; timer + autosave + navigator work.
- Frequent commits with clear messages; final PR against `main` titled
  "Redesign: UI-kit visual overhaul + missing modules", body summarizing what's done and any
  TODOs left for human review (be honest about gaps — do NOT claim untested things work).

## 6. Backend API (available; do not change)

Auth `/api/v1/auth/login|logout`. Admin: `/admin/dashboard`, `/admin/reports`,
`/departments`, `/users` (+`/{id}`), `/question-bank/categories`, `.../{id}/topics`,
`/question-bank/topics`, `.../{id}/questions`, `/question-bank/questions`, `/exams`,
`/exams/assign`. Sessions: `/sessions/start`, `/sessions/{id}`, `/sessions/{id}/submit`,
`/sessions/{id}/result`, `/assignments/my`. Candidate token endpoints via
`PublicExamTokenController` (see `lib/publicApi.ts`). Exact DTO shapes: `lib/types.ts`.

## 7. Guardrails

- Match the kit's exact values (hex, radius, spacing, weights). Geist Mono for all data nums.
- One primary action per view. Single corporate-blue accent.
- Don't break API contracts or auth. Don't touch the backend repo.
- If something is genuinely blocked, leave a `// TODO(human):` note and keep going.
