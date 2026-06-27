"use client";

import React from "react";
import { cn } from "@/lib/cn";

/* ---------- KPI / Stat card ---------- */
type Tone = "blue" | "green" | "purple" | "amber" | "red";
const toneTile: Record<Tone, { bg: string; fg: string }> = {
  blue: { bg: "#F7EFD8", fg: "#8E6F17" },
  green: { bg: "#DCFCE7", fg: "#15803D" },
  purple: { bg: "#F3E8FF", fg: "#7E22CE" },
  amber: { bg: "#FEF3C7", fg: "#B45309" },
  red: { bg: "#FEE2E2", fg: "#B91C1C" },
};

export function KpiCard({
  icon,
  tone = "blue",
  value,
  label,
  topRight,
}: {
  icon: React.ReactNode;
  tone?: Tone;
  value: React.ReactNode;
  label: string;
  topRight?: React.ReactNode;
}) {
  const t = toneTile[tone];
  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-[11px]"
          style={{ background: t.bg, color: t.fg }}
        >
          {icon}
        </div>
        {topRight}
      </div>
      <div>
        <div className="num text-[27px] font-semibold leading-none text-fg">{value}</div>
        <div className="mt-1.5 text-[13px] text-fg-muted">{label}</div>
      </div>
    </div>
  );
}

/* ---------- Progress bar ---------- */
export function scoreColor(v: number) {
  if (v >= 80) return "#16A34A";
  if (v >= 60) return "#B4902F";
  if (v >= 45) return "#D97706";
  return "#DC2626";
}

export function ProgressBar({
  value,
  color,
  height = 9,
  className,
}: {
  value: number;
  color?: string;
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-slate-100", className)}
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color ?? scoreColor(value) }}
      />
    </div>
  );
}

/* ---------- Score gauge (donut) ---------- */
export function Gauge({
  value,
  label,
  color,
  size = 132,
}: {
  value: number;
  label?: string;
  color?: string;
  size?: number;
}) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const offset = c * (1 - pct / 100);
  const stroke = color ?? scoreColor(value);
  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`${label ? label + ": " : ""}${Math.round(pct)}%`}>
      <svg width={size} height={size} viewBox="0 0 132 132" aria-hidden="true">
        <circle cx="66" cy="66" r={r} fill="none" stroke="#EEF2F7" strokeWidth="14" className="dark:stroke-white/10" />
        <circle
          cx="66"
          cy="66"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 66 66)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num text-[26px] font-semibold text-fg">{Math.round(pct)}%</span>
        {label && (
          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-fg-muted">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------- Segmented control ---------- */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex gap-1 rounded-[10px] bg-slate-100 p-1 dark:bg-surface-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-[7px] px-3 py-1.5 text-[13px] font-medium transition-colors",
              active
                ? "bg-surface text-fg shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                : "text-fg-muted hover:text-fg-soft",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Underline tabs ---------- */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-6 border-b border-line">
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className={cn(
              "-mb-px border-b-2 pb-2.5 text-[14px] transition-colors",
              active
                ? "border-blue-600 font-semibold text-blue-600"
                : "border-transparent font-medium text-fg-muted hover:text-fg-soft",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
