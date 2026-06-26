"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "./ThemeToggle";

const titleMap: { prefix: string; title: string }[] = [
  { prefix: "/dashboard", title: "İdarə paneli" },
  { prefix: "/exams/create", title: "Yeni imtahan" },
  { prefix: "/exams/assign", title: "İmtahan təyini" },
  { prefix: "/exams", title: "İmtahanlar" },
  { prefix: "/question-bank/create", title: "Yeni sual" },
  { prefix: "/question-bank", title: "Sual bankı" },
  { prefix: "/analytics", title: "Analitika" },
  { prefix: "/reports", title: "Hesabatlar" },
  { prefix: "/users/create", title: "Yeni istifadəçi" },
  { prefix: "/users", title: "İstifadəçilər" },
  { prefix: "/departments", title: "Şöbələr" },
];

function pageTitle(pathname: string) {
  const match = titleMap.find((t) => pathname.startsWith(t.prefix));
  return match?.title ?? "İdarə paneli";
}

export function TopBar({ notifications = 0 }: { notifications?: number }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const fullName = user ? `${user.firstName} ${user.lastName}` : "İstifadəçi";
  const isAdmin = user?.roles.includes("ROLE_ADMIN");

  return (
    <header className="sticky top-0 z-30 flex h-[62px] flex-none items-center justify-between border-b border-line bg-surface px-[26px]">
      <h1 className="text-[17px] font-bold tracking-[-0.3px] text-fg">
        {pageTitle(pathname)}
      </h1>

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            placeholder="Axtar…"
            className="h-[38px] w-[200px] rounded-[9px] border border-line bg-surface-2 pl-9 pr-3 text-[13px] text-fg outline-none transition-colors focus:border-blue-600"
          />
        </div>

        <button
          className="relative flex h-[38px] w-[38px] items-center justify-center rounded-[9px] text-fg-muted transition-colors hover:bg-slate-100 hover:text-fg dark:hover:bg-surface-2"
          aria-label="Bildirişlər"
        >
          <Bell size={19} />
          {notifications > 0 && (
            <span className="num absolute right-1 top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full border-2 border-surface bg-danger px-1 text-[9.5px] font-bold leading-none text-white">
              {notifications}
            </span>
          )}
        </button>

        <ThemeToggle />

        <div className="ml-1 flex items-center gap-2.5 border-l border-line pl-3">
          <Avatar name={fullName} size={36} bg="#1D4ED8" />
          <div className="hidden leading-tight md:block">
            <div className="text-[13px] font-semibold text-fg">{fullName}</div>
            <div className="text-[11.5px] text-fg-muted">{isAdmin ? "Admin" : "İşçi"}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
