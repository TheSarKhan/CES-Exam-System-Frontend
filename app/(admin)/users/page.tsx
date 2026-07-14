"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Ban, CheckCircle2, Search, KeyRound, Eye, EyeOff, RefreshCw, Copy, Check } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { humanizeError } from "@/lib/errors";
import type { Department, User } from "@/lib/types";
import { PageHeader } from "@/components/app/PageHeader";
import { Table, Tr, Td } from "@/components/ui/Table";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Alert, Loading, Modal } from "@/components/ui/Feedback";
import { passwordError, PASSWORD_HINT } from "@/lib/validate";

type RoleFilter = "platform" | "admin" | "employee" | "candidate" | "all";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const PAGE_SIZE = 20;
  const ROLE_MAP: Record<RoleFilter, string> = {
    platform: "PLATFORM", admin: "ADMIN", employee: "EMPLOYEE", candidate: "CANDIDATE", all: "ALL",
  };

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("platform");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all"); // department id as string, or "all"

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);

  // password reset
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [resetError, setResetError] = useState("");
  const [copied, setCopied] = useState(false);

  // Departments load once for the filter dropdown.
  useEffect(() => {
    apiFetch<Department[]>("/api/v1/departments")
      .then(setDepartments)
      .catch(() => { /* dropdown stays empty */ });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("role", ROLE_MAP[roleFilter]);
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (deptFilter !== "all") params.set("departmentId", deptFilter);
      params.set("page", String(page));
      params.set("size", String(PAGE_SIZE));
      const res = await apiFetch<{ content: User[]; totalPages: number; totalElements: number }>(
        `/api/v1/users/search?${params.toString()}`,
      );
      setUsers(res.content ?? []);
      setTotalPages(res.totalPages ?? 1);
      setTotal(res.totalElements ?? 0);
    } catch (e) {
      toast.error(humanizeError(e, "İstifadəçilər yüklənmədi"));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, search, statusFilter, deptFilter, page]);

  // Debounced fetch on any filter/search/page change.
  useEffect(() => {
    const t = setTimeout(() => { load(); }, 250);
    return () => clearTimeout(t);
  }, [load]);

  // Reset to the first page whenever the filters or search change.
  useEffect(() => { setPage(0); }, [search, roleFilter, statusFilter, deptFilter]);

  const activate = async (id: number) => {
    setBusy(true);
    try {
      await apiFetch(`/api/v1/users/${id}/activate`, { method: "POST" });
      await load();
      toast.success("İstifadəçi aktivləşdirildi");
    } catch (e) {
      toast.error(humanizeError(e, "Aktivləşdirilmədi"));
    } finally {
      setBusy(false);
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    const name = `${deactivateTarget.firstName} ${deactivateTarget.lastName}`;
    setBusy(true);
    try {
      await apiFetch(`/api/v1/users/${deactivateTarget.id}`, { method: "DELETE" });
      setDeactivateTarget(null);
      await load();
      toast.success(`${name} deaktiv edildi`);
    } catch (e) {
      toast.error(humanizeError(e, "Deaktiv edilmədi"));
      setDeactivateTarget(null);
    } finally {
      setBusy(false);
    }
  };

  const openReset = (u: User) => {
    setResetTarget(u);
    setNewPassword("");
    setShowPw(true);
    setResetDone(false);
    setResetError("");
    setCopied(false);
  };

  const genPassword = () => {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    const digits = "23456789";
    const chars = letters + digits + "@#%";
    const arr = new Uint32Array(14);
    crypto.getRandomValues(arr);
    const pick = (set: string, n: number) => set[n % set.length];
    // Guarantee the policy (≥1 letter and ≥1 digit) so a generated password never fails validation.
    const body = Array.from(arr.subarray(2), (n) => pick(chars, n));
    body.unshift(pick(letters, arr[0]), pick(digits, arr[1]));
    setNewPassword(body.join(""));
    setShowPw(true);
  };

  const submitReset = async () => {
    if (!resetTarget || passwordError(newPassword)) return;
    setResetting(true);
    setResetError("");
    try {
      await apiFetch(`/api/v1/users/${resetTarget.id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ password: newPassword }),
      });
      setResetDone(true);
      toast.success(`${resetTarget.firstName} ${resetTarget.lastName} üçün parol yeniləndi`);
    } catch (e) {
      setResetError(humanizeError(e, "Parol yenilənmədi"));
    } finally {
      setResetting(false);
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
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

      {/* filter bar */}
      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="field w-full pl-9 text-[13.5px]" placeholder="Ad və ya e-poçt üzrə axtar…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleFilter)} className="sm:w-[190px]">
          <option value="platform">Platforma (admin+işçi)</option>
          <option value="admin">Admin</option>
          <option value="employee">İşçi</option>
          <option value="candidate">Namizədlər (link)</option>
          <option value="all">Hamısı</option>
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-[150px]">
          <option value="all">Bütün statuslar</option>
          <option value="ACTIVE">Aktiv</option>
          <option value="INACTIVE">Deaktiv</option>
        </Select>
        <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="sm:w-[170px]">
          <option value="all">Bütün şöbələr</option>
          {departments.map((d) => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
        </Select>
      </div>

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
                  {u.roles.map((r) => <RoleBadge key={r.id} role={r.name} />)}
                </div>
              </Td>
              <Td>
                <span
                  className={
                    "inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-semibold " +
                    (u.status === "ACTIVE" ? "bg-success-bg text-success-fg" : "bg-slate-100 text-slate-500 dark:bg-surface-2")
                  }
                >
                  {u.status === "ACTIVE" ? "Aktiv" : "Deaktiv"}
                </span>
              </Td>
              <Td>
                <div className="flex items-center gap-3">
                  <Link href={`/users/${u.id}/edit`} className="text-fg-muted hover:text-fg" title="Düzəliş"><Pencil size={15} /></Link>
                  <button onClick={() => openReset(u)} className="text-fg-muted hover:text-blue-600 dark:hover:text-blue-400" title="Parolu yenilə"><KeyRound size={15} /></button>
                  {u.id === currentUser?.id ? (
                    <span className="text-[11px] font-medium text-fg-faint" title="Bu sizsiniz">Siz</span>
                  ) : u.status === "ACTIVE" ? (
                    <button onClick={() => setDeactivateTarget(u)} className="text-fg-muted hover:text-danger" title="Deaktiv et"><Ban size={15} /></button>
                  ) : (
                    <button onClick={() => activate(u.id)} disabled={busy} className="text-fg-muted hover:text-success-fg disabled:opacity-50" title="Aktivləşdir"><CheckCircle2 size={15} /></button>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
          {users.length === 0 && (
            <Tr>
              <Td colSpan={5} className="py-10 text-center text-fg-muted">
                Filtrə uyğun istifadəçi tapılmadı.
              </Td>
            </Tr>
          )}
        </Table>
      )}

      {!loading && total > 0 && (
        <div className="mt-4 flex items-center justify-between text-[13px] text-fg-muted">
          <span className="num">{total} istifadəçi · səhifə {page + 1}/{Math.max(1, totalPages)}</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Əvvəlki</Button>
            <Button variant="secondary" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Növbəti</Button>
          </div>
        </div>
      )}

      <Modal
        open={deactivateTarget != null}
        onClose={() => !busy && setDeactivateTarget(null)}
        icon={<Ban size={20} />}
        iconTone="red"
        title="İstifadəçini deaktiv et"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeactivateTarget(null)} disabled={busy} className="flex-1">Ləğv et</Button>
            <Button variant="danger" onClick={confirmDeactivate} loading={busy} className="flex-1">Deaktiv et</Button>
          </>
        }
      >
        <span className="font-medium text-fg">{deactivateTarget?.firstName} {deactivateTarget?.lastName}</span> deaktiv ediləcək — daxil ola və imtahan verə bilməyəcək. İstənilən vaxt yenidən aktivləşdirə bilərsiniz.
      </Modal>

      {/* reset password */}
      <Modal
        open={resetTarget != null}
        onClose={() => !resetting && setResetTarget(null)}
        icon={resetDone ? <Check size={18} /> : <KeyRound size={18} />}
        iconTone={resetDone ? "green" : "blue"}
        title={resetDone ? "Parol yeniləndi" : "Parolu yenilə"}
        footer={
          resetDone ? (
            <Button onClick={() => setResetTarget(null)} className="flex-1">Bağla</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setResetTarget(null)} disabled={resetting} className="flex-1">Ləğv et</Button>
              <Button onClick={submitReset} loading={resetting} disabled={!!passwordError(newPassword)} className="flex-1">Yenilə</Button>
            </>
          )
        }
      >
        {resetDone ? (
          <div className="mt-1 flex flex-col gap-3">
            <p>
              <span className="font-medium text-fg">{resetTarget?.firstName} {resetTarget?.lastName}</span> üçün yeni parol təyin olundu. Bu parolu istifadəçiyə çatdırın — sonra onu yenidən görə bilməyəcəksiniz.
            </p>
            <div className="flex items-center justify-between gap-2 rounded-[10px] border border-line bg-surface-2 px-3 py-2.5">
              <code className="num truncate text-[14px] text-fg">{newPassword}</code>
              <button
                onClick={copyPassword}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-[8px] border border-line px-2.5 py-1.5 text-[12px] font-medium text-fg-muted transition-colors hover:bg-surface hover:text-fg"
              >
                {copied ? <Check size={13} className="text-success-fg" /> : <Copy size={13} />}
                {copied ? "Kopyalandı" : "Kopyala"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-1 flex flex-col gap-3">
            <p>
              <span className="font-medium text-fg">{resetTarget?.firstName} {resetTarget?.lastName}</span> ({resetTarget?.email}) üçün yeni parol təyin edin.
            </p>
            <div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitReset()}
                  placeholder="Yeni parol"
                  autoFocus
                  className="field w-full pr-[64px] text-[13.5px]"
                />
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  <button type="button" onClick={() => setShowPw((s) => !s)} className="rounded-md p-1 text-fg-muted hover:text-fg" title={showPw ? "Gizlət" : "Göstər"}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button type="button" onClick={genPassword} className="rounded-md p-1 text-fg-muted hover:text-blue-600 dark:hover:text-blue-400" title="Təsadüfi parol yarat">
                    <RefreshCw size={15} />
                  </button>
                </div>
              </div>
              {newPassword && passwordError(newPassword) ? (
                <p className="mt-1.5 text-[12px] text-danger">{passwordError(newPassword)}</p>
              ) : (
                <p className="mt-1.5 text-[12px] text-fg-faint">{PASSWORD_HINT} <button type="button" onClick={genPassword} className="font-medium text-blue-600 hover:underline dark:text-blue-400">Təsadüfi yarat</button></p>
              )}
            </div>
            {resetError && <Alert tone="danger">{resetError}</Alert>}
          </div>
        )}
      </Modal>
    </div>
  );
}
