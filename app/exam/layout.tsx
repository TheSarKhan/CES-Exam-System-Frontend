import React from "react";
import { BrandLogo } from "@/components/app/BrandLogo";

export default function ExamTokenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-app">
      <header className="flex h-14 items-center border-b border-line bg-surface px-6">
        <BrandLogo
          className="h-8 w-auto object-contain"
          fallback={<span className="text-[14px] font-bold tracking-[-0.2px] text-fg">CES Assessment</span>}
        />
      </header>
      <main>{children}</main>
    </div>
  );
}
