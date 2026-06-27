"use client";

import React from "react";
import { Info, CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/cn";

/* ---------- Alert ---------- */
type AlertTone = "info" | "success" | "warning" | "danger";
const alertStyle: Record<
  AlertTone,
  { bg: string; border: string; fg: string; icon: React.ReactNode }
> = {
  info: { bg: "#EFF5FF", border: "#BFDBFE", fg: "#1D4ED8", icon: <Info size={19} /> },
  success: { bg: "#F0FDF4", border: "#BBF7D0", fg: "#15803D", icon: <CheckCircle2 size={19} /> },
  warning: { bg: "#FFFBEB", border: "#FDE68A", fg: "#B45309", icon: <AlertTriangle size={19} /> },
  danger: { bg: "#FEF2F2", border: "#FECACA", fg: "#B91C1C", icon: <XCircle size={19} /> },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const s = alertStyle[tone];
  return (
    <div
      className={cn("flex gap-3 rounded-[11px] border px-[18px] py-[15px]", className)}
      style={{ background: s.bg, borderColor: s.border, color: s.fg }}
    >
      <span className="mt-px shrink-0">{s.icon}</span>
      <div className="min-w-0">
        {title && <div className="text-[13.5px] font-semibold">{title}</div>}
        {children && <div className="text-[13px] opacity-90">{children}</div>}
      </div>
    </div>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div className="flex h-[54px] w-[54px] items-center justify-center rounded-[14px] bg-slate-100 text-slate-400 dark:bg-surface-2">
        {icon}
      </div>
      <h3 className="mt-4 text-[15px] font-semibold text-fg">{title}</h3>
      {description && (
        <p className="mt-1 max-w-[260px] text-[13px] text-fg-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------- Modal ---------- */
export function Modal({
  open,
  onClose,
  icon,
  iconTone = "blue",
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  icon?: React.ReactNode;
  iconTone?: "blue" | "red" | "amber" | "green";
  title: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  const tones = {
    blue: { bg: "#F7EFD8", fg: "#8E6F17" },
    red: { bg: "#FEE2E2", fg: "#B91C1C" },
    amber: { bg: "#FEF3C7", fg: "#B45309" },
    green: { bg: "#DCFCE7", fg: "#15803D" },
  } as const;
  const t = tones[iconTone];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[400px] rounded-[16px] bg-surface p-6 shadow-[0_12px_32px_rgba(15,23,42,0.16)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          {icon && (
            <div
              className="flex h-11 w-11 items-center justify-center rounded-[11px]"
              style={{ background: t.bg, color: t.fg }}
            >
              {icon}
            </div>
          )}
          <button onClick={onClose} className="btn-ghost rounded-md p-1 text-fg-muted">
            <X size={18} />
          </button>
        </div>
        <h3 className="mt-3 text-[17px] font-semibold text-fg">{title}</h3>
        {children && <div className="mt-1.5 text-[13.5px] text-fg-muted">{children}</div>}
        {footer && <div className="mt-5 flex gap-2.5">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Inline loading ---------- */
export function Loading({ label = "Yüklənir…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2.5 py-8 text-[14px] text-fg-muted">
      <span
        className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-blue-600"
        style={{ animation: "spin 0.7s linear infinite" }}
      />
      {label}
    </div>
  );
}
