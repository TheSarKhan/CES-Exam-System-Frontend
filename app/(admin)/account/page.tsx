"use client";

import React, { useEffect, useState } from "react";
import { User2, Mail, CalendarDays, ShieldCheck, Save } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { humanizeError } from "@/lib/errors";
import type { AccountProfile } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input } from "@/components/ui/Field";
import { Loading } from "@/components/ui/Feedback";
import { ChangePasswordCard } from "@/components/account/ChangePasswordCard";
import { formatDate } from "@/lib/format";
import { isValidName, sanitizeNameInput, NAME_ERROR_MESSAGE } from "@/lib/validation";

export default function AdminAccountPage() {
  const toast = useToast();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AccountProfile>("/api/v1/account/me")
      .then(setProfile)
      .catch((e) => toast.error(humanizeError(e, "Profil yüklənmədi")))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return <Loading />;
  if (!profile) return <div className="card p-6 text-center text-[14px] text-danger-fg">Profil tapılmadı</div>;

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6">
      <div>
        <h2 className="text-[22px] font-bold tracking-[-0.4px] text-fg">Hesabım</h2>
        <p className="mt-0.5 text-[13.5px] text-fg-muted">Şəxsi məlumat və təhlükəsizlik</p>
      </div>

      {/* identity banner */}
      <div
        className="relative overflow-hidden rounded-[16px] p-6 text-white sm:p-7"
        style={{ background: "linear-gradient(135deg,#24221C 0%,#332F26 55%,#463F2E 100%)" }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full"
          style={{ background: "radial-gradient(circle,rgba(201,165,76,0.30),transparent 70%)" }}
        />
        <div className="relative flex flex-wrap items-center gap-5">
          <Avatar name={fullName || profile.email} size={64} bg="#8E6F17" />
          <div className="min-w-0">
            <h3 className="text-[21px] font-bold tracking-[-0.3px]">{fullName || "—"}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-slate-300">
              <span className="flex items-center gap-1.5"><Mail size={14} /> {profile.email}</span>
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} /> Qoşulub: <span className="num">{formatDate(profile.memberSince)}</span>
              </span>
            </div>
            {profile.roles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.roles.map((r) => (
                  <span key={r} className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11.5px] font-medium">
                    <ShieldCheck size={12} /> {r}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileForm profile={profile} onSaved={setProfile} />
        <ChangePasswordCard />
      </div>
    </div>
  );
}

function ProfileForm({ profile, onSaved }: { profile: AccountProfile; onSaved: (p: AccountProfile) => void }) {
  const toast = useToast();
  const { updateProfile } = useAuth();
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [saving, setSaving] = useState(false);

  const dirty = firstName.trim() !== profile.firstName || lastName.trim() !== profile.lastName;
  const firstNameValid = isValidName(firstName);
  const lastNameValid = isValidName(lastName);
  const valid = firstName.trim().length > 0 && lastName.trim().length > 0 && firstNameValid && lastNameValid;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty || !valid) return;
    setSaving(true);
    try {
      const updated = await apiFetch<AccountProfile>("/api/v1/account/profile", {
        method: "PUT",
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }),
      });
      onSaved(updated);
      updateProfile(updated.firstName, updated.lastName);
      toast.success("Məlumat yeniləndi");
    } catch (err) {
      toast.error(humanizeError(err, "Yadda saxlanmadı"));
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
        <FieldGroup label="Ad" htmlFor="firstName" error={firstName && !firstNameValid ? NAME_ERROR_MESSAGE : undefined}>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(sanitizeNameInput(e.target.value))}
            maxLength={100}
            invalid={!!firstName && !firstNameValid}
          />
        </FieldGroup>
        <FieldGroup label="Soyad" htmlFor="lastName" error={lastName && !lastNameValid ? NAME_ERROR_MESSAGE : undefined}>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(sanitizeNameInput(e.target.value))}
            maxLength={100}
            invalid={!!lastName && !lastNameValid}
          />
        </FieldGroup>
      </div>

      <FieldGroup label="E-poçt" hint="E-poçtu dəyişmək üçün başqa admin lazımdır.">
        <Input value={profile.email} disabled readOnly />
      </FieldGroup>

      <div className="flex justify-end">
        <Button type="submit" icon={<Save size={15} />} loading={saving} disabled={!dirty || !valid}>
          Yadda saxla
        </Button>
      </div>
    </form>
  );
}
