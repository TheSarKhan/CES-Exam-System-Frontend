import React from "react";
import { Check, X, Clock, Shield } from "lucide-react";
import { cn } from "@/lib/cn";

/* ---------- Result pills (Pass / Fail / Manual Review / Survey) ---------- */
export function ResultPill({
  result,
}: {
  result: "pass" | "fail" | "review" | "survey";
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-[5px] text-[12.5px] font-semibold";
  if (result === "pass")
    return (
      <span className={cn(base, "bg-success-bg text-success-fg")}>
        <Check size={14} strokeWidth={2.6} /> Keçdi
      </span>
    );
  if (result === "fail")
    return (
      <span className={cn(base, "bg-danger-bg text-danger-fg")}>
        <X size={14} strokeWidth={2.6} /> Kəsildi
      </span>
    );
  if (result === "review")
    return (
      <span className={cn(base, "bg-info-bg text-info-fg")}>
        <Clock size={13} strokeWidth={2.4} /> Manual yoxlama
      </span>
    );
  return (
    <span className={cn(base, "bg-slate-100 text-slate-600")}>Sorğu</span>
  );
}

/* ---------- Exam status pills (with leading dot) ---------- */
type ExamStatus = "active" | "draft" | "scheduled" | "expired";
const statusMap: Record<
  ExamStatus,
  { label: string; bg: string; fg: string; dot: string; pulse?: boolean }
> = {
  active: { label: "Aktiv", bg: "#EFF5FF", fg: "#1D4ED8", dot: "#2563EB", pulse: true },
  draft: { label: "Qaralama", bg: "#F1F5F9", fg: "#475569", dot: "#94A3B8" },
  scheduled: { label: "Planlanıb", bg: "#FEF3C7", fg: "#B45309", dot: "#D97706" },
  expired: { label: "Bitib", bg: "#F1F5F9", fg: "#94A3B8", dot: "#CBD5E1" },
};

export function StatusPill({ status, label }: { status: ExamStatus; label?: string }) {
  const s = statusMap[status];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-[5px] text-[12.5px] font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      <span
        className={cn("h-[7px] w-[7px] rounded-full", s.pulse && "animate-[pulse-dot_1.6s_ease_infinite]")}
        style={{ background: s.dot }}
      />
      {label ?? s.label}
    </span>
  );
}

/* ---------- Category tags ---------- */
const categoryColors: Record<string, { bg: string; fg: string }> = {
  Safety: { bg: "#EAF1FE", fg: "#1D4ED8" },
  HR: { bg: "#F3E8FF", fg: "#7E22CE" },
  Accounting: { bg: "#DCFCE7", fg: "#15803D" },
  "Fire Safety": { bg: "#FEF3C7", fg: "#B45309" },
  "First Aid": { bg: "#FFE4E6", fg: "#BE123C" },
};
const fallbackCats = [
  { bg: "#EAF1FE", fg: "#1D4ED8" },
  { bg: "#F3E8FF", fg: "#7E22CE" },
  { bg: "#DCFCE7", fg: "#15803D" },
  { bg: "#FEF3C7", fg: "#B45309" },
  { bg: "#CFFAFE", fg: "#0E7490" },
];

export function categoryColor(name: string) {
  if (categoryColors[name]) return categoryColors[name];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return fallbackCats[h % fallbackCats.length];
}

export function CategoryTag({ name, onRemove }: { name: string; onRemove?: () => void }) {
  const c = categoryColor(name);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[7px] px-[11px] py-[5px] text-[12.5px] font-semibold"
      style={{ background: c.bg, color: c.fg }}
    >
      {name}
      {onRemove && (
        <button onClick={onRemove} className="opacity-70 hover:opacity-100">
          <X size={11} strokeWidth={2.6} />
        </button>
      )}
    </span>
  );
}

/* ---------- Role badges ---------- */
export function RoleBadge({ role }: { role: string }) {
  const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold";
  const r = role.replace("ROLE_", "").toUpperCase();
  if (r === "ADMIN")
    return (
      <span className={cn(base, "text-white")} style={{ background: "#0E1B33" }}>
        <Shield size={12} strokeWidth={2.4} /> Admin
      </span>
    );
  if (r === "CANDIDATE")
    return (
      <span className={base} style={{ background: "#FEF3C7", color: "#B45309" }}>
        Namizəd
      </span>
    );
  return (
    <span className={base} style={{ background: "#EAF1FE", color: "#1D4ED8" }}>
      İşçi
    </span>
  );
}

/* ---------- Severity tags (anti-cheat) ---------- */
export function SeverityTag({ level }: { level: "WARNING" | "CRITICAL" | "LOGGED" }) {
  const map = {
    WARNING: { bg: "#FEF3C7", fg: "#B45309" },
    CRITICAL: { bg: "#FEE2E2", fg: "#B91C1C" },
    LOGGED: { bg: "#F1F5F9", fg: "#475569" },
  } as const;
  const m = map[level];
  return (
    <span
      className="inline-flex items-center rounded-[6px] px-2.5 py-[3px] text-[11.5px] font-bold tracking-wide"
      style={{ background: m.bg, color: m.fg }}
    >
      {level}
    </span>
  );
}

/* ---------- Delta chips (mono) ---------- */
export function DeltaChip({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const positive = value >= 0;
  return (
    <span
      className="num inline-flex items-center rounded-full px-[9px] py-[3px] text-[11.5px] font-semibold"
      style={
        positive
          ? { background: "#DCFCE7", color: "#15803D" }
          : { background: "#FEE2E2", color: "#B91C1C" }
      }
    >
      {positive ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

/* ---------- Neutral count pill ---------- */
export function CountPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="num inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[12px] font-semibold text-blue-700">
      {children}
    </span>
  );
}
