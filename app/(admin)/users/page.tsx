"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Ban } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { User } from "@/lib/types";
import { PageHeader } from "@/components/app/PageHeader";
import { Table, Tr, Td } from "@/components/ui/Table";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Feedback";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setUsers(await apiFetch<User[]>("/api/v1/users"));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "İstifadəçilər yüklənmədi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deactivate = async (id: number) => {
    if (!confirm("Bu istifadəçini deaktiv etmək istəyirsiniz?")) return;
    try {
      await apiFetch(`/api/v1/users/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Deaktiv edilmədi");
    }
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        title="İstifadəçilər"
        subtitle="Əməkdaşları və rollarını idarə edin"
        action={
          <Link href="/users/create" className={buttonClasses("primary", "md")}>
            <Plus size={17} /> Yeni istifadəçi
          </Link>
        }
      />

      {error && <div className="mb-4 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

      {loading ? (
        <Loading />
      ) : (
        <Table headers={["Ad", "Şöbə", "Rollar", "Status", "Əməliyyat"]}>
          {users.map((u) => (
            <Tr key={u.id}>
              <Td>
                <div className="flex items-center gap-2.5">
                  <Avatar name={`${u.firstName} ${u.lastName}`} size={34} />
                  <div>
                    <div className="text-[13.5px] font-semibold text-fg">{u.firstName} {u.lastName}</div>
                    <div className="text-[11.5px] text-fg-faint">{u.email}</div>
                  </div>
                </div>
              </Td>
              <Td>{u.departmentName || "—"}</Td>
              <Td>
                <div className="flex flex-wrap gap-1.5">
                  {u.roles.map((r) => (
                    <RoleBadge key={r.id} role={r.name} />
                  ))}
                </div>
              </Td>
              <Td>
                <span
                  className={
                    "inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-semibold " +
                    (u.status === "ACTIVE" ? "bg-success-bg text-success-fg" : "bg-slate-100 text-slate-500")
                  }
                >
                  {u.status === "ACTIVE" ? "Aktiv" : "Deaktiv"}
                </span>
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <Link href={`/users/${u.id}/edit`} className="flex items-center gap-1 text-[13px] font-medium text-blue-600 hover:underline">
                    <Pencil size={14} /> Düzəliş
                  </Link>
                  {u.status === "ACTIVE" && (
                    <button onClick={() => deactivate(u.id)} className="flex items-center gap-1 text-[13px] font-medium text-danger hover:underline">
                      <Ban size={14} /> Deaktiv
                    </button>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
          {users.length === 0 && (
            <Tr>
              <Td colSpan={5} className="py-10 text-center text-fg-muted">İstifadəçi yoxdur.</Td>
            </Tr>
          )}
        </Table>
      )}
    </div>
  );
}
