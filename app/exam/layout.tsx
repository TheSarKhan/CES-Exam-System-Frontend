import React from "react";
import { CheckSquare } from "lucide-react";

export default function ExamTokenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-app">
      <header className="flex h-14 items-center border-b border-line bg-surface px-6">
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-blue-500 to-blue-700">
            <CheckSquare size={16} className="text-white" />
          </span>
          <span className="text-[14px] font-bold tracking-[-0.2px] text-fg">CES Assessment</span>
        </span>
      </header>
      <main>{children}</main>
    </div>
  );
}
