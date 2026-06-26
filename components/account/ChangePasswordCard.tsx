"use client";

import React, { useState } from "react";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { humanizeError } from "@/lib/errors";
import { FieldGroup, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

/** Self-service "change my password" card — current → new → confirm (POST /account/password). */
export function ChangePasswordCard() {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const mismatch = confirm.length > 0 && next !== confirm;
  const valid = current.length > 0 && next.length >= 6 && next === confirm;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      await apiFetch<void>("/api/v1/account/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      toast.success("Parol uğurla dəyişdirildi");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      toast.error(humanizeError(err, "Parol dəyişdirilmədi"));
    } finally {
      setSaving(false);
    }
  };

  const type = show ? "text" : "password";

  return (
    <form onSubmit={submit} className="card flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
            <KeyRound size={17} />
          </span>
          <h3 className="text-[15px] font-semibold text-fg">Parolu dəyiş</h3>
        </div>
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="flex items-center gap-1.5 text-[12px] text-fg-muted transition-colors hover:text-fg"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
          {show ? "Gizlət" : "Göstər"}
        </button>
      </div>

      <FieldGroup label="Cari parol" htmlFor="current">
        <Input id="current" type={type} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </FieldGroup>
      <FieldGroup label="Yeni parol" htmlFor="next" hint="Ən azı 6 simvol.">
        <Input id="next" type={type} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
      </FieldGroup>
      <FieldGroup label="Yeni parolu təsdiqlə" htmlFor="confirm" error={mismatch ? "Parollar uyğun gəlmir" : undefined}>
        <Input id="confirm" type={type} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} invalid={mismatch} />
      </FieldGroup>

      <div className="flex justify-end">
        <Button type="submit" variant="secondary" icon={<KeyRound size={15} />} loading={saving} disabled={!valid}>
          Parolu yenilə
        </Button>
      </div>
    </form>
  );
}
