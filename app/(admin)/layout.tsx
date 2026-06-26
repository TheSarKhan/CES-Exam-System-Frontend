import React from "react";
import { AdminSidebar } from "@/components/app/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-app">
      <AdminSidebar />
      <main className="min-w-0 flex-1 p-[26px]">{children}</main>
    </div>
  );
}
