import React from "react";
import Link from "next/link";
import { CheckSquare } from "lucide-react";
import { EmployeeNav } from "./EmployeeNav";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-app">
      <header className="sticky top-0 z-30 flex h-[64px] flex-none items-center justify-between border-b border-line bg-surface px-5 sm:px-8">
        <Link href="/employee/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.4)]">
            <CheckSquare size={18} strokeWidth={2.2} className="text-white" />
          </span>
          <span className="hidden text-[15px] font-bold tracking-[-0.3px] text-fg sm:block">
            Assessment
          </span>
        </Link>
        <EmployeeNav />
      </header>
      <main className="mx-auto w-full max-w-[1080px] flex-1 p-5 sm:p-8">{children}</main>
    </div>
  );
}
