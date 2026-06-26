"use client";

import React, { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/cn";

const MONTHS_AZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
  "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
];
// Monday-first week, matching Azerbaijani convention.
const WEEKDAYS_AZ = ["B.e", "Ç.a", "Ç", "C.a", "C", "Ş", "B"];

const pad = (n: number) => String(n).padStart(2, "0");

interface Parts { y: number; mo: number; d: number; h: number; mi: number }

/** Accepts "yyyy-MM-dd" or "yyyy-MM-ddTHH:mm". */
function parse(value: string): Parts | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!m) return null;
  return { y: +m[1], mo: +m[2] - 1, d: +m[3], h: m[4] ? +m[4] : 0, mi: m[5] ? +m[5] : 0 };
}

function display(p: Parts, withTime: boolean): string {
  const base = `${pad(p.d)}.${pad(p.mo + 1)}.${p.y}`;
  return withTime ? `${base} ${pad(p.h)}:${pad(p.mi)}` : base;
}

function toValue(p: Parts, withTime: boolean): string {
  const base = `${p.y}-${pad(p.mo + 1)}-${pad(p.d)}`;
  return withTime ? `${base}T${pad(p.h)}:${pad(p.mi)}` : base;
}

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  withTime?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function DatePicker({
  value,
  onChange,
  withTime = false,
  placeholder = "gg.aa.iiii",
  className,
  id,
}: DatePickerProps) {
  const parts = parse(value);
  const [open, setOpen] = useState(false);
  const now = new Date();
  const [viewY, setViewY] = useState(parts?.y ?? now.getFullYear());
  const [viewMo, setViewMo] = useState(parts?.mo ?? now.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && parts) { setViewY(parts.y); setViewMo(parts.mo); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const emit = (p: Parts) => onChange(toValue(p, withTime));

  const pickDay = (d: number) => {
    emit({ y: viewY, mo: viewMo, d, h: parts?.h ?? 9, mi: parts?.mi ?? 0 });
    if (!withTime) setOpen(false);
  };

  const setTime = (h: number, mi: number) => {
    const base = parts ?? { y: viewY, mo: viewMo, d: now.getDate(), h: 9, mi: 0 };
    emit({ ...base, h, mi });
  };

  const prevMonth = () => (viewMo === 0 ? (setViewMo(11), setViewY(viewY - 1)) : setViewMo(viewMo - 1));
  const nextMonth = () => (viewMo === 11 ? (setViewMo(0), setViewY(viewY + 1)) : setViewMo(viewMo + 1));

  const firstDow = (new Date(viewY, viewMo, 1).getDay() + 6) % 7; // Monday-first offset
  const daysInMonth = new Date(viewY, viewMo + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isSelected = (d: number) => parts && parts.y === viewY && parts.mo === viewMo && parts.d === d;
  const isToday = (d: number) => now.getFullYear() === viewY && now.getMonth() === viewMo && now.getDate() === d;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className={cn("field flex w-full items-center justify-between text-left", className)}
      >
        <span className={cn("num", !parts && "text-fg-faint")}>{parts ? display(parts, withTime) : placeholder}</span>
        <Calendar size={16} className="shrink-0 text-fg-muted" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-[296px] rounded-[12px] border border-line bg-surface p-3 shadow-[0_12px_32px_rgba(15,23,42,0.16)]">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="rounded-md p-1.5 text-fg-muted hover:bg-surface-2"><ChevronLeft size={16} /></button>
            <span className="text-[13.5px] font-semibold text-fg">{MONTHS_AZ[viewMo]} {viewY}</span>
            <button type="button" onClick={nextMonth} className="rounded-md p-1.5 text-fg-muted hover:bg-surface-2"><ChevronRight size={16} /></button>
          </div>

          <div className="grid grid-cols-7">
            {WEEKDAYS_AZ.map((w) => (
              <span key={w} className="py-1 text-center text-[10.5px] font-semibold text-fg-faint">{w}</span>
            ))}
            {cells.map((d, i) =>
              d === null ? (
                <span key={i} />
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => pickDay(d)}
                  className={cn(
                    "num m-0.5 flex h-8 items-center justify-center rounded-[8px] text-[12.5px] transition-colors",
                    isSelected(d)
                      ? "bg-blue-600 font-semibold text-white"
                      : isToday(d)
                        ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-600/10"
                        : "text-fg hover:bg-surface-2",
                  )}
                >
                  {d}
                </button>
              ),
            )}
          </div>

          {withTime && (
            <div className="mt-2.5 flex items-center gap-2 border-t border-line pt-2.5">
              <Clock size={15} className="text-fg-muted" />
              <select className="field !h-8 !w-auto appearance-none pr-2 text-[13px]" value={parts?.h ?? 9} onChange={(e) => setTime(+e.target.value, parts?.mi ?? 0)}>
                {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{pad(h)}</option>)}
              </select>
              <span className="text-fg-muted">:</span>
              <select className="field !h-8 !w-auto appearance-none pr-2 text-[13px]" value={parts?.mi ?? 0} onChange={(e) => setTime(parts?.h ?? 9, +e.target.value)}>
                {Array.from({ length: 60 }, (_, m) => <option key={m} value={m}>{pad(m)}</option>)}
              </select>
              <button type="button" onClick={() => setOpen(false)} className="ml-auto rounded-[8px] bg-blue-600 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-blue-700">Hazır</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
