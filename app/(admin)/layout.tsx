import React from "react";
import { IconRail } from "@/components/app/IconRail";
import { TopBar } from "@/components/app/TopBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-app">
      <IconRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 p-[26px]">{children}</main>
      </div>
    </div>
  );
}
