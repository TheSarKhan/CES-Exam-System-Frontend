"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { publicFetch } from "@/lib/publicApi";
import { useToast } from "@/lib/toast";
import { humanizeError } from "@/lib/errors";
import { emailError } from "@/lib/validate";
import { AuthShell, AUTH_GOLD as GOLD } from "@/components/app/AuthShell";

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ee = emailError(email);
    if (ee) return toast.error(ee);
    setSubmitting(true);
    try {
      await publicFetch<void>("/api/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true);
    } catch (err) {
      toast.error(humanizeError(err, "Sorğu göndərilmədi"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      {sent ? (
        <div className="flex flex-col items-center text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#C9A24B]/15" style={{ color: GOLD }}>
            <CheckCircle2 size={30} />
          </span>
          <h1 className="text-[20px] font-bold text-white">Linki yoxlayın</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-white/55">
            Əgər <span className="text-white">{email.trim()}</span> sistemdə qeydiyyatdadırsa, parol bərpası linki göndərildi. Gələnlər qutunuzu (və spam qovluğunu) yoxlayın.
          </p>
        </div>
      ) : (
        <>
          <h1 className="text-[24px] font-bold tracking-[-0.5px] text-white">Parolu unutmusunuz?</h1>
          <p className="mt-2 text-[14px] text-white/55">
            E-poçt ünvanınızı yazın — parolu bərpa etmək üçün link göndərək.
          </p>

          <form onSubmit={submit} noValidate className="mt-7 flex flex-col gap-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-[12px] font-semibold uppercase tracking-wide text-white/55">
                E-poçt <span style={{ color: GOLD }}>*</span>
              </label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  placeholder="ad@ces.az"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-[12px] border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-[14px] text-white placeholder-white/30 outline-none transition-colors focus:border-[#C9A24B]/60 focus:bg-white/[0.06]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#ECEAE3] py-3.5 text-[15px] font-semibold text-[#171612] transition-all hover:bg-white disabled:opacity-70"
            >
              {submitting ? "Göndərilir…" : "Bərpa linki göndər"}
              {!submitting && <ArrowRight size={17} />}
            </button>
          </form>
        </>
      )}

      <p className="mt-7 text-center">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] text-white/45 transition-colors hover:text-white">
          <ArrowLeft size={14} /> Girişə qayıt
        </Link>
      </p>
    </AuthShell>
  );
}
