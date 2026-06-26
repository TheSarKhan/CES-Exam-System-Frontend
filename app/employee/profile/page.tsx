"use client";

import React, { useEffect, useState } from "react";
import {
  User2,
  Mail,
  Building2,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  Hourglass,
  TrendingUp,
  Award,
  Trophy,
  Save,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { AccountProfile } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input } from "@/components/ui/Field";
import { Alert, Loading } from "@/components/ui/Feedback";
import { ChangePasswordCard } from "@/components/account/ChangePasswordCard";
import { formatDate } from "@/lib/format";

export default function EmployeeProfilePage() {
  const { updateProfile } = useAuth();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<AccountProfile>("/api/v1/account/me")
      .then(setProfile)
      .catch((e) => setError(e instanceof Error ? e.message : "Profil yüklənmədi"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (error || !profile)
    return (
      <Alert tone="danger" title="Xəta">
        {error || "Profil tapılmadı"}
      </Alert>
    );

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const s = profile.stats;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[22px] font-bold tracking-[-0.4px] text-fg">Profil</h2>
        <p className="mt-0.5 text-[13.5px] text-fg-muted">Hesab məlumatların və nəticə statistikan</p>
      </div>

      {/* Identity banner */}
      <div
        className="relative overflow-hidden rounded-[16px] p-6 text-white sm:p-7"
        style={{ background: "linear-gradient(135deg,#24221C 0%,#332F26 55%,#463F2E 100%)" }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full"
          style={{ background: "radial-gradient(circle,rgba(201,165,76,0.30),transparent 70%)" }}
        />
        <div className="relative flex flex-wrap items-center gap-5">
          <Avatar name={fullName || profile.email} size={68} bg="#8E6F17" />
          <div className="min-w-0">
            <h3 className="text-[21px] font-bold tracking-[-0.3px]">{fullName || "—"}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-slate-300">
              <span className="flex items-center gap-1.5"><Mail size={14} /> {profile.email}</span>
              {profile.departmentName && (
                <span className="flex items-center gap-1.5"><Building2 size={14} /> {profile.departmentName}</span>
              )}
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} /> Qoşulub: <span className="num">{formatDate(profile.memberSince)}</span>
              </span>
            </div>
            {profile.roles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.roles.map((r) => (
                  <span
                    key={r}
                    className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11.5px] font-medium"
                  >
                    <ShieldCheck size={12} /> {r}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat icon={<Award size={17} />} tone="slate" value={s.assigned} label="Təyin olunmuş" />
        <Stat icon={<CheckCircle2 size={17} />} tone="blue" value={s.completed} label="Tamamlanmış" />
        <Stat icon={<Hourglass size={17} />} tone="amber" value={s.pending} label="Gözləyən" />
        <Stat icon={<TrendingUp size={17} />} tone="violet" value={s.avgScore == null ? "—" : `${s.avgScore}%`} label="Orta nəticə" />
        <Stat icon={<Trophy size={17} />} tone="green" value={s.bestScore == null ? "—" : `${s.bestScore}%`} label="Ən yüksək" />
        <Stat icon={<ShieldCheck size={17} />} tone="green" value={s.passed} label="Keçilmiş imtahan" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileForm profile={profile} onSaved={(p) => { setProfile(p); updateProfile(p.firstName, p.lastName); }} />
        <ChangePasswordCard />
      </div>
    </div>
  );
}

/* ---------- Stat tile ---------- */
function Stat({
  icon,
  tone,
  value,
  label,
}: {
  icon: React.ReactNode;
  tone: "slate" | "blue" | "amber" | "violet" | "green";
  value: React.ReactNode;
  label: string;
}) {
  const tones = {
    slate: { bg: "#F1F5F9", fg: "#475569" },
    blue: { bg: "#F7EFD8", fg: "#8E6F17" },
    amber: { bg: "#FEF3C7", fg: "#B45309" },
    violet: { bg: "#F3E8FF", fg: "#7E22CE" },
    green: { bg: "#DCFCE7", fg: "#15803D" },
  } as const;
  const t = tones[tone];
  return (
    <div className="card flex flex-col gap-2 p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px]" style={{ background: t.bg, color: t.fg }}>
        {icon}
      </span>
      <div>
        <div className="num text-[20px] font-semibold leading-none text-fg">{value}</div>
        <div className="mt-1 text-[11.5px] text-fg-muted">{label}</div>
      </div>
    </div>
  );
}

/* ---------- Edit personal info ---------- */
function ProfileForm({
  profile,
  onSaved,
}: {
  profile: AccountProfile;
  onSaved: (p: AccountProfile) => void;
}) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const dirty = firstName.trim() !== profile.firstName || lastName.trim() !== profile.lastName;
  const valid = firstName.trim().length > 0 && lastName.trim().length > 0;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty || !valid) return;
    setSaving(true);
    setMsg(null);
    try {
      const updated = await apiFetch<AccountProfile>("/api/v1/account/profile", {
        method: "PUT",
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }),
      });
      onSaved(updated);
      setMsg({ tone: "success", text: "Məlumat yeniləndi" });
    } catch (err) {
      setMsg({ tone: "danger", text: err instanceof Error ? err.message : "Yadda saxlanmadı" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="card flex flex-col gap-4 p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-blue-50 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400">
          <User2 size={17} />
        </span>
        <h3 className="text-[15px] font-semibold text-fg">Şəxsi məlumat</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Ad" htmlFor="firstName">
          <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={100} />
        </FieldGroup>
        <FieldGroup label="Soyad" htmlFor="lastName">
          <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={100} />
        </FieldGroup>
      </div>

      <FieldGroup label="E-poçt" hint="E-poçtu yalnız administrator dəyişə bilər.">
        <Input value={profile.email} disabled readOnly />
      </FieldGroup>

      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

      <div className="flex justify-end">
        <Button type="submit" icon={<Save size={15} />} loading={saving} disabled={!dirty || !valid}>
          Yadda saxla
        </Button>
      </div>
    </form>
  );
}
