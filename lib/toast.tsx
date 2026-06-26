"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type ToastTone = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: number;
  tone: ToastTone;
  title?: string;
  message: string;
}

interface ToastApi {
  show: (message: string, opts?: { tone?: ToastTone; title?: string; duration?: number }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

// Module-level counter so ids stay unique without Date.now()/Math.random().
let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback<ToastApi["show"]>((message, opts = {}) => {
    const id = ++counter;
    const tone = opts.tone ?? "info";
    const duration = opts.duration ?? (tone === "error" ? 6000 : 4000);
    setToasts((list) => [...list, { id, tone, title: opts.title, message }]);
    if (duration > 0) window.setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const api = useMemo<ToastApi>(() => ({
    show,
    success: (m, title) => show(m, { tone: "success", title }),
    error: (m, title) => show(m, { tone: "error", title }),
    warning: (m, title) => show(m, { tone: "warning", title }),
    info: (m, title) => show(m, { tone: "info", title }),
  }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const toneStyle: Record<ToastTone, { icon: React.ReactNode; tile: string; accent: string; defaultTitle: string }> = {
  // brand gold for warnings/info, conventional green/red for success/error
  success: { icon: <CheckCircle2 size={19} />, tile: "bg-[#DCFCE7] text-[#15803D]", accent: "#15803D", defaultTitle: "Uğurlu" },
  error:   { icon: <XCircle size={19} />,      tile: "bg-[#FEE2E2] text-[#B91C1C]", accent: "#DC2626", defaultTitle: "Xəta" },
  warning: { icon: <AlertTriangle size={18} />, tile: "bg-[#F7EFD8] text-[#8E6F17]", accent: "#B4902F", defaultTitle: "Xəbərdarlıq" },
  info:    { icon: <Info size={19} />,          tile: "bg-[#F7EFD8] text-[#8E6F17]", accent: "#B4902F", defaultTitle: "Məlumat" },
};

function Toaster({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-center gap-2.5 sm:inset-x-auto sm:right-5 sm:top-5 sm:items-end">
      {toasts.map((t) => {
        const s = toneStyle[t.tone];
        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-[400px] items-start gap-3 overflow-hidden rounded-[13px] border border-line bg-surface py-3 pl-3 pr-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.16)] sm:w-[380px]"
            style={{ borderLeft: `3px solid ${s.accent}`, animation: "toast-in 0.22s cubic-bezier(0.16,1,0.3,1)" }}
          >
            <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]", s.tile)}>
              {s.icon}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="text-[13.5px] font-semibold text-fg">{t.title ?? s.defaultTitle}</div>
              <div className="mt-0.5 text-[13px] leading-snug text-fg-muted">{t.message}</div>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Bağla"
              className="shrink-0 rounded-md p-1 text-fg-faint transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
