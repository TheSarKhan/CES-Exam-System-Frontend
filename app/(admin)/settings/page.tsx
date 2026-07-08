"use client";

import React, { useEffect, useState } from "react";
import { Building2, Mail, GraduationCap, Clock, CalendarClock, ShieldCheck, Save, Shuffle, Eye } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { humanizeError } from "@/lib/errors";
import type { AppSettings } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { FieldGroup, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert, Loading } from "@/components/ui/Feedback";
import { cn } from "@/lib/cn";

const EMAIL_RE =
  /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]*[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;

interface FormState {
  orgName: string;
  supportEmail: string;
  defaultPassMark: string;
  defaultDurationMinutes: string;
  defaultLinkValidityDays: string;
  proctoringEnabled: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultToCandidate: boolean;
  tabSwitchLimit: string;
}

function toForm(s: AppSettings): FormState {
  return {
    orgName: s.orgName ?? "",
    supportEmail: s.supportEmail ?? "",
    defaultPassMark: String(s.defaultPassMark),
    defaultDurationMinutes: String(s.defaultDurationMinutes),
    defaultLinkValidityDays: String(s.defaultLinkValidityDays),
    proctoringEnabled: s.proctoringEnabled,
    shuffleQuestions: s.shuffleQuestions,
    shuffleOptions: s.shuffleOptions,
    showResultToCandidate: s.showResultToCandidate,
    tabSwitchLimit: String(s.tabSwitchLimit),
  };
}

export default function SettingsPage() {
  const toast = useToast();
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    apiFetch<AppSettings>("/api/v1/admin/settings")
      .then((s) => setForm(toForm(s)))
      .catch((e) => setLoadError(humanizeError(e, "Parametrlər yüklənmədi")))
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const orgNameError = (() => {
    if (!form) return undefined;
    const trimmed = form.orgName.trim();
    if (trimmed.length === 0) return "Təşkilat adını daxil edin";
    if (!/[\p{L}\p{N}]/u.test(trimmed)) return "Etibarlı təşkilat adı daxil edin";
    return undefined;
  })();

  const supportEmailError = (() => {
    if (!form) return undefined;
    const trimmed = form.supportEmail.trim();
    if (trimmed.length === 0) return undefined;
    if (!EMAIL_RE.test(trimmed)) return "Dəstək e-poçtu düzgün deyil";
    return undefined;
  })();

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (orgNameError || supportEmailError) {
      toast.error(orgNameError || supportEmailError!);
      return;
    }
    setSaving(true);
    try {
      const body = {
        orgName: form.orgName.trim(),
        supportEmail: form.supportEmail.trim(),
        defaultPassMark: Number(form.defaultPassMark),
        defaultDurationMinutes: Number(form.defaultDurationMinutes),
        defaultLinkValidityDays: Number(form.defaultLinkValidityDays),
        proctoringEnabled: form.proctoringEnabled,
        shuffleQuestions: form.shuffleQuestions,
        shuffleOptions: form.shuffleOptions,
        showResultToCandidate: form.showResultToCandidate,
        tabSwitchLimit: Number(form.tabSwitchLimit) || 0,
      };
      const updated = await apiFetch<AppSettings>("/api/v1/admin/settings", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      setForm(toForm(updated));
      toast.success("Parametrlər yadda saxlandı");
    } catch (err) {
      toast.error(humanizeError(err, "Yadda saxlanmadı"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (!form)
    return <Alert tone="danger" title="Xəta">{loadError || "Parametrlər tapılmadı"}</Alert>;

  return (
    <form onSubmit={save} className="mx-auto flex max-w-[760px] flex-col gap-6">
      <div>
        <h2 className="text-[22px] font-bold tracking-[-0.4px] text-fg">Parametrlər</h2>
        <p className="mt-0.5 text-[13.5px] text-fg-muted">Platforma brendinqi və imtahan defoltları</p>
      </div>

      {/* Branding */}
      <Section icon={<Building2 size={17} />} title="Brendinq" desc="Adınız e-poçtlarda və namizəd səhifələrində görünür.">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup label="Təşkilat adı" htmlFor="orgName" error={orgNameError}>
            <Input
              id="orgName"
              value={form.orgName}
              onChange={(e) => set("orgName", e.target.value)}
              maxLength={120}
              invalid={!!orgNameError}
              required
            />
          </FieldGroup>
          <FieldGroup
            label="Dəstək e-poçtu"
            htmlFor="supportEmail"
            hint="Namizəd e-poçtlarının altında göstərilir."
            error={supportEmailError}
          >
            <div className="relative">
              <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="supportEmail"
                type="email"
                className="pl-[36px]"
                value={form.supportEmail}
                onChange={(e) => set("supportEmail", e.target.value)}
                placeholder="dəstək@şirkət.az"
                invalid={!!supportEmailError}
              />
            </div>
          </FieldGroup>
        </div>
      </Section>

      {/* Exam defaults */}
      <Section icon={<GraduationCap size={17} />} title="İmtahan defoltları" desc="Yeni imtahan və link yaradılanda ilkin dəyərlər kimi istifadə olunur.">
        <div className="grid gap-4 sm:grid-cols-3">
          <FieldGroup label="Keçid balı (%)" htmlFor="passMark">
            <Input id="passMark" type="number" min={0} max={100} value={form.defaultPassMark} onChange={(e) => set("defaultPassMark", e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Müddət (dəq)" htmlFor="duration">
            <div className="relative">
              <Clock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input id="duration" type="number" min={1} max={1440} className="pl-[36px]" value={form.defaultDurationMinutes} onChange={(e) => set("defaultDurationMinutes", e.target.value)} />
            </div>
          </FieldGroup>
          <FieldGroup label="Link etibarlılığı (gün)" htmlFor="validity">
            <div className="relative">
              <CalendarClock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input id="validity" type="number" min={1} max={365} className="pl-[36px]" value={form.defaultLinkValidityDays} onChange={(e) => set("defaultLinkValidityDays", e.target.value)} />
            </div>
          </FieldGroup>
        </div>
      </Section>

      {/* Security & monitoring */}
      <Section icon={<ShieldCheck size={17} />} title="Təhlükəsizlik və nəzarət" desc="İmtahan zamanı namizədlərə tətbiq olunan nəzarət qaydaları.">
        <div className="flex flex-col gap-3">
          <ToggleRow
            title="Anti-cheat izləməsi"
            desc="Tab dəyişmə və fokus itkisi qeydə alınır; namizədə qaydalarda bildirilir."
            on={form.proctoringEnabled}
            onChange={(v) => set("proctoringEnabled", v)}
          />
          {form.proctoringEnabled && (
            <div className="flex items-center justify-between gap-4 rounded-[11px] border border-line bg-surface-2 px-4 py-3.5">
              <div className="min-w-0">
                <div className="text-[13.5px] font-semibold text-fg">Tab dəyişmə limiti</div>
                <div className="text-[12.5px] text-fg-muted">Bu qədər dəfə tab/fokus itkisindən sonra imtahan avtomatik sonlanır. <b>0 = limitsiz.</b></div>
              </div>
              <Input type="number" min={0} max={20} className="w-[84px] shrink-0 text-center" value={form.tabSwitchLimit} onChange={(e) => set("tabSwitchLimit", e.target.value)} />
            </div>
          )}
        </div>
      </Section>

      {/* Exam behaviour */}
      <Section icon={<Shuffle size={17} />} title="İmtahan davranışı" desc="Sualların təqdimatı və namizədə nəticə görünüşü.">
        <div className="flex flex-col gap-3">
          <ToggleRow
            title="Sualların qarışdırılması"
            desc="Hər namizəd üçün suallar təsadüfi sıra ilə göstərilir."
            on={form.shuffleQuestions}
            onChange={(v) => set("shuffleQuestions", v)}
          />
          <ToggleRow
            title="Variantların qarışdırılması"
            desc="Cavab variantlarının sırası da hər namizəd üçün təsadüfi olur."
            on={form.shuffleOptions}
            onChange={(v) => set("shuffleOptions", v)}
          />
          <ToggleRow
            icon={<Eye size={15} />}
            title="Namizədə nəticə göstərilsin"
            desc="İmtahan bitincə namizəd öz balını görür. Söndürülsə, yalnız «tamamlandı» mesajı çıxır, nəticə yalnız admində qalır."
            on={form.showResultToCandidate}
            onChange={(v) => set("showResultToCandidate", v)}
          />
        </div>
      </Section>

      <div className="flex justify-end">
        <Button type="submit" icon={<Save size={15} />} loading={saving} disabled={!!orgNameError || !!supportEmailError}>Yadda saxla</Button>
      </div>
    </form>
  );
}

function Section({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-blue-50 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400">
          {icon}
        </span>
        <div>
          <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
          <p className="text-[12.5px] text-fg-muted">{desc}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

function ToggleRow({
  title,
  desc,
  on,
  onChange,
  icon,
}: {
  title: string;
  desc: string;
  on: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[11px] border border-line bg-surface-2 px-4 py-3.5">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-fg">
          {icon && <span className="text-fg-muted">{icon}</span>}
          {title}
        </div>
        <div className="mt-0.5 text-[12.5px] text-fg-muted">{desc}</div>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        "inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full px-0.5 transition-colors",
        on ? "bg-blue-600" : "bg-slate-300 dark:bg-surface-2",
      )}
    >
      <span
        className={cn(
          "h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
          on ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}
