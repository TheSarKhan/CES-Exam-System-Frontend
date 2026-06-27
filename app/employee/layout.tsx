import React from "react";
import { EmployeeSidebar } from "./EmployeeSidebar";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-app">
      <EmployeeSidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1080px] p-5 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
