# Handoff: Corporate Assessment Platform — UI Kit

## Overview
This package documents the UI kit and screen designs for a **Corporate Assessment Platform** — an internal system for knowledge exams, candidate assessments, and surveys. It covers a complete design foundation (colors, type, spacing), a component library (buttons, forms, badges, cards, tables, feedback, 11 question types), and five full screen mockups (Admin Dashboard, Analytics, Question Bank, Exam Screen, Employee Panel).

Interface copy is in **Azerbaijani** — keep it as-is, or wire it to your i18n layer using the strings provided here as the `az` locale.

## About the Design Files
The file in this bundle — `Assessment UI Kit.dc.html` — is a **design reference**, not production code. It is authored as a "Design Component" that runs on a proprietary HTML runtime (custom `<x-dc>`, `<sc-for>`, `{{ }}` templating, and a `DCLogic` class). **Do not copy it directly into your codebase** — it will not run without that runtime.

Your task is to **recreate these designs in the target codebase's existing environment** (React, Vue, Svelte, etc.) using its established patterns and component libraries. If no environment exists yet, the recommended stack is **React + TypeScript + Tailwind CSS** (the design maps cleanly to Tailwind's scale) with **lucide-react** for icons (all icons in the mock are Lucide).

The good news: **all styling in the source file is inline**, so every color, size, radius, and spacing value is directly readable from the markup if you need a value not captured below.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, and component states are all specified. Recreate the UI pixel-accurately using your codebase's libraries. Exact hex values, font sizes, and weights are listed in the **Design Tokens** section and per-component below.

---

## Design Tokens

### Colors — Primary (Corporate Blue)
| Token | Hex | Usage |
|---|---|---|
| blue-50  | `#EFF5FF` | Selected row / option background, info surfaces |
| blue-100 | `#DBEAFE` | Light fills, chart bars |
| blue-200 | `#BFDBFE` | Borders on tinted surfaces, chart bars |
| blue-300 | `#93C5FD` | Hover borders, chart bars |
| blue-400 | `#60A5FA` | Sidebar accent, dark-bg icon |
| blue-500 | `#3B82F6` | Gradient partner |
| **blue-600** | **`#2563EB`** | **Primary action, brand — the main accent** |
| blue-700 | `#1D4ED8` | Primary hover, gradient end, avatars |
| blue-800 | `#1E40AF` | Dark text on blue tint |
| blue-900 | `#1E3A8A` | Deepest blue |

### Colors — Neutral (Slate)
| Token | Hex | Usage |
|---|---|---|
| slate-50  | `#F8FAFC` | Zebra rows, subtle fills, input bg |
| slate-100 | `#F1F5F9` | Track backgrounds, segmented control bg, chips |
| slate-200 | `#E2E8F0` | Default borders |
| slate-300 | `#CBD5E1` | Unchecked controls, disabled fills, scrollbar |
| slate-400 | `#94A3B8` | Muted/placeholder text, secondary icons |
| slate-500 | `#64748B` | Body-secondary text |
| slate-600 | `#475569` | Ghost button text, tertiary |
| slate-700 | `#334155` | Strong body text |
| slate-800 | `#1E293B` | — |
| slate-900 | `#0F172A` | Primary text |

### Colors — App-specific surfaces
| Token | Hex | Usage |
|---|---|---|
| app-bg | `#EEF1F6` | Application background (behind cards) |
| surface | `#FFFFFF` | Cards, panels, table |
| border | `#E6EAF1` | Card/panel border (slightly cooler than slate-200) |
| sidebar | `#0E1B33` | Dark navy sidebar / dark surfaces |
| sidebar-2 | `#16294A` / `#1D3A6B` | Sidebar gradient partners (hero) |

### Colors — Semantic
| Meaning | Solid | Tint bg | Tint text |
|---|---|---|---|
| Success / Pass | `#16A34A` | `#DCFCE7` | `#15803D` |
| Danger / Fail | `#DC2626` | `#FEE2E2` | `#B91C1C` |
| Warning / Flag | `#D97706` | `#FEF3C7` | `#B45309` |
| Info / Review | `#0891B2` | `#CFFAFE` | `#0E7490` |
| Category — HR (purple) | `#7E22CE` | `#F3E8FF` | `#7E22CE` |
| Rating star (filled) | `#F59E0B` | — | — |

### Typography
- **UI font:** `Geist` (weights 300/400/500/600/700). Fallback: `system-ui, sans-serif`.
- **Numeric/data font:** `Geist Mono` (weights 400/500/600) — used for scores, percentages, timers, IDs, table figures, counts. Always use for tabular numerics.
- Google Fonts import: `https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap`

| Role | Size / Weight | Letter-spacing | Notes |
|---|---|---|---|
| Display | 42px / 700 | -1.2px | Hero headlines |
| H1 | 30px / 700 | -0.7px | Section/page titles |
| H2 | 22px / 650 | -0.4px | Sub-section |
| H3 | 16px / 600 | — | Card titles |
| Body | 15px / 400 | — | line-height 1.6 |
| Small | 13px / 400 | — | Secondary text |
| Label | 13px / 600 | — | Form labels |
| Caption | 11px / 600 | 1px (uppercase) | Eyebrows, meta |
| Section eyebrow | 12px / 650 | 1.6px, uppercase | blue-600, above H1 in component pages |
| Mono data | 11–28px / 600 | — | Geist Mono |

> Note: weight `650` appears throughout. With variable Geist it renders directly; if using static weights, map `650 → 600` (semibold).

### Spacing scale (4px base)
`4, 8, 12, 16, 24, 32, 48, 64` px. Cards typically use `18–30px` padding; page gutters `26–52px`; grid gaps `16–18px`.

### Border radius
| Token | Value | Usage |
|---|---|---|
| sm | 6–7px | Chips, small tags, mono badges |
| md | 8–9px | Inputs, buttons, small icon tiles |
| lg | 11–14px | Cards, panels, modals |
| xl | 16px | Hero/large cards, exam question card |
| full | 99px | Pills, status badges, toggles, progress tracks |

### Elevation (shadows)
| Token | Value | Usage |
|---|---|---|
| sm (card) | `0 1px 2px rgba(15,23,42,0.04)` — sometimes `0 1px 3px rgba(15,23,42,0.05)` | Resting cards |
| md (pop) | `0 4px 12px rgba(15,23,42,0.08)` | Popovers, raised buttons |
| lg (modal) | `0 12px 32px rgba(15,23,42,0.16)` | Modals |
| primary btn | `0 1px 2px rgba(37,99,235,0.4)`; hover `0 4px 12px rgba(37,99,235,0.45)` | Primary CTA |
| toast (dark) | `0 8px 24px rgba(14,27,51,0.3)` | Dark toast |

### Icons
All icons are **Lucide** (1.8–2.2 stroke width, `round` linecap/linejoin). Use `lucide-react` or equivalent. Notable: `check-square` (logo), `layout-grid`, `file-text`, `users`, `bar-chart`, `settings`, `bell`, `search`, `clock`, `calendar`, `alert-triangle`, `check`, `x`, `chevron-down/right`, `plus`, `minus`, `download`, `upload`, `trash-2`, `pencil/edit`, `flag`, `box`/`package`, `star`, `arrow-right/left`.

---

## Global Layout Patterns

**Two sidebar treatments:**
1. **Kit navigator (the `.dc.html` shell):** 264px dark navy (`#0E1B33`) sidebar with grouped text nav (Foundations / Components / Screens). Active item: `rgba(59,130,246,0.16)` bg, white text, 600 weight, with a 5px blue-400 dot on the right.
2. **App icon rail (inside screen mockups):** 62px dark navy rail with 40px icon tiles. Active tile: `rgba(59,130,246,0.18)` bg, blue-400 icon.

**App top bar:** 62px tall, white, `#E6EAF1` bottom border, 26px horizontal padding. Left = page title (17px/700, -0.3px). Right = search input (38px tall, slate-50 bg) + bell with red count badge + avatar cluster (36px circle, blue-700 bg, white initials + name/role stack).

**Cards:** white bg, `1px solid #E6EAF1`, radius 14px, padding 18–24px, shadow-sm.

---

## Components

### Buttons
Min height 42px (md). Radius 9px. Font 14px/600. `transition: all .15s`.
- **Primary:** bg `#2563EB`, white text, shadow `0 1px 2px rgba(37,99,235,0.4)`. Hover: bg `#1D4ED8`, shadow `0 4px 12px rgba(37,99,235,0.45)`, `translateY(-1px)`. Active: `translateY(0)`.
- **Secondary:** bg `#F1F5F9`, text `#334155`, border `1px #E2E8F0`. Hover bg `#E2E8F0`.
- **Outline:** bg white, text `#2563EB`, border `1px #BFDBFE`. Hover bg `#EFF5FF`, border `#2563EB`.
- **Ghost:** transparent, text `#475569`, no border. Hover bg `#F1F5F9`.
- **Danger:** bg `#DC2626`, white. Hover `#B91C1C`.
- **Success:** bg `#16A34A`, white. Hover `#15803D`.
- **Sizes:** sm = 30px tall / 12.5px / radius 7px / pad 0 12px; md = 42px / 14px / radius 9px / pad 0 18px; lg = 50px / 15px / radius 11px / pad 0 24px.
- **Icon button:** square (30/42px), centered icon. **With icon:** `gap:8px`, 16px icon.
- **States:** Disabled = bg `#CBD5E1`, white, `cursor:not-allowed`, opacity 0.75. Focus = 2px `#93C5FD` border + `0 0 0 4px rgba(37,99,235,0.18)` ring. Loading = 15px spinner (`border:2px rgba(255,255,255,.4)`, top `#fff`, `spin .7s linear infinite`) + label.

### Forms & Inputs
- **Text input:** height 42px, pad `0 13px`, border `1px #D6DEE9`, radius 9px, font 14px. Focus: border `#2563EB` + `0 0 0 3px rgba(37,99,235,0.14)`. Helper text 12px slate-400 below.
- **Error input:** border `1.5px #DC2626` + `0 0 0 3px rgba(220,38,38,0.12)`; error message 12px `#DC2626` with alert icon.
- **Disabled input:** border `#E6EAF1`, text slate-400, bg `#F8FAFC`.
- **Input with leading icon:** 17px search icon abs-positioned left 13px; input `padding-left:38px`.
- **Select:** same as input, `appearance:none`, custom chevron-down (16px slate-600) abs right 13px.
- **Textarea:** pad `11px 13px`, `resize:vertical`, line-height 1.5. Optional char counter (11.5px slate-400, right-aligned).
- **Checkbox:** 20px, radius 6px. Checked = bg `#2563EB` + white check (3px stroke). Unchecked = `1.5px #CBD5E1` border. Disabled = `#E2E8F0` border, `#F1F5F9` fill.
- **Radio:** 20px circle. Selected = `5px solid #2563EB` border (donut). Unselected = `1.5px #CBD5E1`.
- **Toggle:** 42×24px track, radius 99px. On = `#2563EB`; off = `#CBD5E1`. Knob 20px white circle, `top:2px`, shadow `0 1px 3px rgba(0,0,0,0.2)`, sits left (off) / right (on).

### Badges & Status
- **Result pills** (radius 99px, 12.5px/650, `gap:6px`, pad `5px 12px`): Pass = `#DCFCE7`/`#15803D` + check; Fail = `#FEE2E2`/`#B91C1C` + x; Manual Review = `#CFFAFE`/`#0E7490` + clock.
- **Exam status pills** (with leading 7px dot): Active = `#EFF5FF`/`#1D4ED8`, dot `#2563EB` **pulsing** (`pulse 1.6s ease infinite`, opacity 1→.45); Draft = `#F1F5F9`/`#475569`, dot `#94A3B8`; Scheduled = `#FEF3C7`/`#B45309`, dot `#D97706`; Expired = `#F1F5F9`/`#94A3B8`, dot `#CBD5E1`.
- **Category tags** (radius 7px, 12.5px/600, pad `5px 11px`): Safety `#EAF1FE`/`#1D4ED8`; HR `#F3E8FF`/`#7E22CE`; Accounting `#DCFCE7`/`#15803D`; Fire Safety `#FEF3C7`/`#B45309`; First Aid `#FFE4E6`/`#BE123C`. Removable variant has trailing 11px x.
- **Role badges** (pills): Admin = `#0E1B33`/white + shield; Employee = `#EAF1FE`/`#1D4ED8`; Candidate = `#FEF3C7`/`#B45309`.
- **Severity tags** (radius 6px, 11.5px/700, pad `3px 10px`): WARNING `#FEF3C7`/`#B45309`; CRITICAL `#FEE2E2`/`#B91C1C`; LOGGED `#F1F5F9`/`#475569`.
- **Notification count:** red `#DC2626` pill, white 10.5px/700, `2px #fff` border, abs top-right of a 42px icon tile.
- **Delta chips** (Geist Mono, radius 99px, pad `3px 9px`): positive `#DCFCE7`/`#15803D`; negative `#FEE2E2`/`#B91C1C`; neutral `#EFF5FF`/`#1D4ED8`.

### Cards & Stats
- **KPI card:** 36–42px rounded icon tile (tinted bg) top-left + delta chip top-right; then mono value (26–28px/600) + label (12.5–13px slate-500). Tinted icon tiles: blue `#EAF1FE`, green `#DCFCE7`, purple `#F3E8FF`, amber `#FEF3C7`, red `#FEE2E2`.
- **Score gauge (donut):** SVG, r=52, `stroke-width:14`, track `#EEF2F7`, value stroke semantic color, `stroke-linecap:round`, rotated -90°. Center = mono value + tiny uppercase label. Dasharray = 2πr (≈326.7 for r=52); offset encodes the remaining portion.
- **Progress bars:** 8–9px track `#F1F5F9` radius 99px; fill semantic by threshold (green ≥80, blue 60–79, amber 45–62, red <48 in the mock). Label + mono value above.

### Data Tables
- Container: white card, radius 14px, overflow hidden. **Header strip:** title + mono count pill + search (36px) + Filter button. **`thead`:** bg `#F8FAFC`, cells 11.5px/650 uppercase slate-400, 0.6px tracking, pad `11px 16px`; sortable column is blue-600 with a `▼`. **Rows:** `1px #F1F5F9` top border, zebra `#FBFCFE` on alternate rows, cell pad `13px 16px`. Checkbox column 44px (checked = blue square w/ check). **User cell:** 34px avatar circle (semantic bg, white initials) + name (13.5px/600) + email/sub (11.5px slate-400). Right-most = 3-dot menu (vertical, slate-400). **Footer:** range text (12.5px slate-400) + pager — 32px square buttons radius 7px; active = blue-600/white, others = white/`#E2E8F0` border; disabled arrow slate-400 `not-allowed`.

### Tabs & Feedback
- **Underline tabs:** row with `gap:26px`, `1px #E6EAF1` bottom border. Active = blue-600 text, 600, `2px #2563EB` underline (`margin-bottom:-1px`). Inactive = slate-500/500.
- **Segmented control:** `4px` padding wrapper, bg `#F1F5F9`, radius 10px. Active segment = white, radius 7px, shadow `0 1px 2px rgba(15,23,42,0.08)`. Inactive = slate-500.
- **Alerts** (radius 11px, pad `15px 18px`, leading 19px icon, title 13.5px/650 + body 13px): Info `#EFF5FF`/border `#BFDBFE`; Success `#F0FDF4`/`#BBF7D0`; Warning `#FFFBEB`/`#FDE68A`; Danger `#FEF2F2`/`#FECACA`. (Text colors match the semantic tint-text values.)
- **Modal:** max-width 380px, white, radius 16px, shadow-lg. 44px tinted icon tile, title 17px/650, body 13.5px slate-500. Footer = two equal buttons (`gap:10px`), Cancel (secondary outline) + confirm (danger/primary).
- **Toast (dark):** bg `#0E1B33`, radius 13px, pad `16px 18px`, 32px semantic icon tile + title (13.5px/600 white) + sub (12px slate-400) + close x. Shadow `0 8px 24px rgba(14,27,51,0.3)`.
- **Empty state:** centered, 54px slate-100 icon tile, title 15px/650, body 13px slate-500 (max 240px), optional primary button.

### Question Types (11)
Each is a card (radius 14px, 22px pad) with an eyebrow (11px/700 uppercase, tracking 0.6px — blue-600 for graded, `#0E7490` for manual, `#D97706` for survey) + a mono index top-right.
1. **Single Choice** — radio rows; selected row = `1.5px #2563EB` border, `#EFF5FF` bg, donut radio, blue-800 text.
2. **Multiple Choice** — checkbox rows; selected = blue check square + `#EFF5FF` row.
3. **True/False** — two equal buttons; selected (true) = `1.5px #16A34A` border, `#F0FDF4` bg, green check; other = slate.
4. **Short text (manual)** — single input + "HR tərəfindən yoxlanılacaq" review chip (`#CFFAFE`/`#0E7490`).
5. **Long text (manual)** — textarea (4 rows) + `0/1000` counter.
6. **Image question** — 110px media placeholder (dark gradient `#1E293B→#334155`, centered image icon, mono filename bottom-left) + question + input.
7. **Image-choice** — 2-col grid of image tiles; selected tile = `2px #2563EB` border + blue check circle badge top-right.
8. **Date** — input with leading calendar icon, value in Geist Mono.
9. **Number** — stepper: `−` / centered mono value / `+`, each 42px, dividers `#E2E8F0`, total border `1px #D6DEE9` radius 9px.
10. **Rating (survey)** — 5 × 32px stars; filled `#F59E0B`, empty `#CBD5E1` stroke; "4/5 ulduz" caption.
11. **Likert (survey)** — 5 equal emoji buttons (38px), selected = `2px #2563EB` + `#EFF5FF`; tiny label under each (Tam yox → Tam bəli).

> "File Upload" is intentionally shown as a disabled/"tezliklə" (coming soon) option in the checkbox group — keep it disabled until backend support exists.

---

## Screens

### 1. Admin Dashboard
- **Layout:** 62px icon rail + main column (62px top bar, then 26px-padded content).
- **Greeting row:** "Xoş gəldin, Aysel 👋" (22px/700) + date/summary sub; right = "Yeni imtahan" primary button (42px, plus icon).
- **KPI grid:** 4 cards — Ümumi imtahan `248` (+8%), Aktiv qiymətləndirmə `17` (live), Orta nəticə `74%` (+3.2), Anti-cheat pozuntu `12`.
- **Charts row (1.6fr / 1fr):** Left = "İmtahan iştirakı" bar chart, 6 months, bars rounded `7px 7px 0 0`, June highlighted blue-600, others blue-100/200/300; segmented 6 ay / İl toggle. Right = Pass/Fail donut (r=50, sw=16, track `#FEE2E2`, value `#16A34A`), 68% center, legend Pass 96 / Fail 46.
- **List card:** "Yaxınlaşan periodik imtahanlar" — rows with 38px tinted icon tile + title/sub + scheduled status pill ("3 gün sonra" etc.).

### 2. Analytics
- **Top bar:** title + date-range selector ("Son 6 ay", calendar + chevron) + "Hesabat (PDF)" primary button (download icon).
- **Row 1 (1.7fr / 1fr):** Left = "Keçid faizinin dinamikası" line+area chart (SVG; blue line `#2563EB` 3px with area fill at 0.08 opacity, grey comparison line `#CBD5E1`, end-point dot, month labels, gridlines `#F1F5F9`). Right = "Sual növü bölgüsü" segmented donut (blue/purple/cyan/grey arcs) + legend with % (Single 45 / Multiple 25 / True-False 18 / Açıq 12).
- **Row 2 (1fr / 1fr):** Left = "Şöbələr üzrə performans" progress bars (Safety 88 green, HR 76 blue, Accounting 63 amber, IT 48 red). Right = "Ən çətin suallar" list (mono ID, truncated text, % chip colored by difficulty).
- **Anti-cheat log:** title + "12 hadisə" red count; 4-col stat grid — Tab dəyişdirmə 7 (amber), DevTools cəhdi 3 (red), Copy cəhdi 2 (grey), Avtomatik bitmə 2 (red). Each tile uses the matching semantic tint bg + border.

### 3. Question Bank
- **Layout:** 62px rail + main (top bar with breadcrumb "Sual Bankı › Safety", Import + "Yeni sual" buttons).
- **Left tree panel (248px, white, right border):** "Kateqoriyalar" eyebrow; expandable category rows (chevron + box icon + name + mono count). Expanded **Safety** shows nested topics (PPE active = blue-600 bg/white, Fire Safety, First Aid) with leading dots + counts. Other categories HR (purple box), Accounting (green box) collapsed.
- **Right content:** topic header ("PPE", 18px/700 + "14 sual · Safety kateqoriyası") + search. **Question rows:** card per question — mono `#PPE-014` + type tag + points tag, then question text (14.5px/600); right = edit (outline) + delete (red-tinted) icon buttons.
- **Exam-builder callout:** dashed `#BFDBFE` border, `#F8FAFF` bg, plus icon tile + explanatory text + a number stepper ("PPE-dən [5] sual") — defines how many random questions to pull from the topic.

### 4. Exam Screen (test taker)
- **Top bar (64px):** brand + exam title + taker name; right = anti-cheat counter chip ("2/3 xəbərdarlıq", amber, warning icon) + **timer** (`#0E1B33` pill, blue-400 clock, Geist Mono 18px "14:32").
- **Progress bar:** full-width 5px, `#E6EAF1` track, blue gradient fill at current %.
- **Main (max-width 1280px, flex):** Left = **question card** (radius 16px, 34px pad) — meta row (mono "Sual 14/30" + category tag + "Single Choice · 2 bal") + "İşarələ" flag button; question text (21px/650, lh 1.4); answer options as large rows (16px pad, radius 12px) — selected = `2px #2563EB` + `#EFF5FF` + blue letter chip; A/B/C/D 26px letter chips. Footer = "Əvvəlki" (outline) + "Avtomatik yadda saxlanıldı" (green check) + "Növbəti" (primary, arrow).
- **Right navigator (268px card):** "Suallar 13/30"; 6-col grid of question chips (aspect-1, radius 8px) — answered = blue-600/white, flagged = `#FEF3C7` + `1.5px #FCD34D`, current = white + `2px #2563EB`, empty = `#F1F5F9`/slate-400; legend (Cavablanıb/İşarələnib/Boş); "İmtahanı bitir" success button (46px, full width).

### 5. Employee Panel
- **Top bar:** brand + "Mənim Qiymətləndirmələrim" + user cluster (Safety şöbəsi).
- **Hero card (max-width 1080px):** gradient `#0E1B33→#1D3A6B`, radius 16px, radial glow top-right. "Növbəti təyin olunmuş imtahan" label + title "Fire Safety — Q3 Bilik Yoxlaması" (21px/700) + meta (25 dəqiqə · 30 sual, son tarix). Right = white "İmtahana başla" button (48px, blue-700 text, arrow, big shadow).
- **Mini KPIs (3-col):** Tamamlanmış `12`, Orta nəticəm `83%` (green), Gözləyən `1` (amber).
- **History section:** "Keçmiş nəticələrim" + segmented filter (Hamısı/Pass/Fail). **Result rows:** 44px semantic icon tile (green check / red x) + title/sub (department · date; failed rows add a "Təkrar imtahan mümkündür" blue link) + right-aligned mono score + "X/Y bal" + Pass/Fail pill + arrow button.

---

## Interactions & Behavior
- **Kit navigation:** sidebar items switch the active section (single-page, `state.section`). In your app these become routes.
- **Buttons:** hover/active transforms and shadows as specified (`transition: all .15s`). Primary lifts `-1px` on hover.
- **Option/answer selection:** clicking an option applies the selected treatment (blue border + tint). Single Choice = one selection; Multiple = many; True/False & Likert = one of N.
- **Exam timer:** counts down from the allotted time (mock shows 14:32). When it hits 0, auto-submit. Persist remaining time + answers to survive reload (mock notes "Avtomatik yadda saxlanıldı" / auto-save at intervals).
- **Anti-cheat:** detect tab/visibility change, devtools, copy. Each event increments a counter and shows an escalating warning alert (1st/2nd = warning, 3rd = critical → auto-terminate, result flagged and sent to HR). Severity tags: WARNING / CRITICAL / LOGGED.
- **Pulsing dot** on "Active" status: opacity 1→.45 keyframe, 1.6s ease infinite.
- **Spinner** on loading buttons: 0.7s linear infinite rotation.
- **Manual-review questions** (open text) are not auto-scored — they enter a "Review" queue for HR; result shows "Manual Review" until graded.
- **Random question selection:** exams pull N random questions per topic (set in the builder callout) so each taker gets a different set — implement server-side.

## State Management
Suggested state per area (adapt to your framework):
- **Kit/router:** `activeSection` (or real routes per screen).
- **Exam runtime:** `questions[]`, `currentIndex`, `answers{}`, `flagged Set`, `remainingSeconds`, `violations[]` + `violationCount`, `status` (`active|submitted|terminated`). Persist `answers`/`remainingSeconds` to storage; sync to backend on interval.
- **Question Bank:** `categories[] → topics[] → questions[]` tree, `selectedTopicId`, `search`, builder `pullCount` per topic.
- **Dashboard/Analytics:** fetched aggregates (KPIs, time-series, distribution, department scores, hardest questions, anti-cheat log) + `dateRange`.
- **Employee:** `assignedExams[]`, `history[]`, `filter` (all/pass/fail).
- **Tables:** `selectedRows Set`, `sortColumn`/`sortDir`, `page`.

## Responsive behavior
Mockups are desktop-first (designed ~1280–1440px wide). For narrower viewports: collapse multi-column grids to single column; convert the 62px rail to a hamburger drawer; the exam navigator can move below the question card; tables become horizontally scrollable or card-stacked. No mobile mocks were produced — use your codebase's responsive conventions.

## Assets
- **Fonts:** Geist + Geist Mono via Google Fonts (link above). If self-hosting, pull from the Geist package.
- **Icons:** Lucide (`lucide-react` recommended) — no custom SVG assets needed; all glyphs are Lucide.
- **Images:** none shipped. The "image question" types use placeholders — wire to your media upload/storage. Avatars use colored circles with initials (no photos in the mock).
- **Emoji:** the Likert scale and the dashboard greeting use system emoji (😀🙂😐🙁😠, 👋). Keep or replace with an icon set as you prefer.

## Files
- `Assessment UI Kit.dc.html` — the full design reference (Foundations, Components, all 5 screens). Open it in a browser to view; read its inline styles for any exact value not captured above. **Reference only — do not ship.**

## Notes for implementation
- The accent is **one** corporate blue (`#2563EB`). Keep a single primary action per view.
- Use **Geist Mono for every number** that represents data (scores, %, timers, counts, IDs) — it's a deliberate part of the visual language.
- Card border is `#E6EAF1` (cooler than slate-200) on an `#EEF1F6` app background — preserve that subtle contrast.
- Weight `650` → semibold (600) if your font lacks it.
- A dark mode was discussed for the platform but is **not** included in these mocks; if you implement it, derive surfaces from the `#0E1B33` sidebar family.
