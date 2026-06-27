import React from "react";

export const AUTH_GOLD = "#C9A24B";

/** Dark, brand-styled centered card used by the public auth pages (forgot / reset password). */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10" style={{ background: "#0b0b09" }}>
      <div className="w-full max-w-[420px]">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-white/10 bg-white/[0.03]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="CES" className="h-6 w-auto object-contain" />
          </span>
          <div className="leading-tight">
            <div className="text-[13.5px] font-bold tracking-[-0.2px] text-white">
              Construction <span style={{ color: AUTH_GOLD }}>Equipment</span> Services
            </div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[1.6px] text-white/40">
              Qiymətləndirmə Platforması
            </div>
          </div>
        </div>
        <div className="rounded-[16px] border border-white/10 bg-white/[0.025] p-7">{children}</div>
      </div>
    </main>
  );
}
