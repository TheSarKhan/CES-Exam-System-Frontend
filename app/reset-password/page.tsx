"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { publicFetch } from "@/lib/publicApi";
import { useToast } from "@/lib/toast";
import { humanizeError } from "@/lib/errors";
import { passwordError, PASSWORD_HINT } from "@/lib/validate";
import { AuthShell, AUTH_GOLD as GOLD } from "@/components/app/AuthShell";

export default function ResetPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    setToken(t);
    setReady(true);
  }, []);

  const mismatch = confirm.length > 0 && password !== confirm;
  const pwErr = password.length > 0 ? passwordError(password) : null;
  const valid = !pwErr && password === confirm;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || !token) return;
    setSubmitting(true);
    try {
      await publicFetch<void>("/api/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: password }),
      });
      setDone(true);
    } catch (err) {
      toast.error(humanizeError(err, "Parol yenilənmədi"));
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full rounded-[12px] border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-[14px] text-white placeholder-white/30 outline-none transition-colors focus:border-[#C9A24B]/60 focus:bg-white/[0.06]";

  if (!ready) return <AuthShell><div className="py-6 text-center text-[14px] text-white/50">Yüklənir…</div></AuthShell>;

  // No token in the URL → invalid link.
  if (!token) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg text-danger-fg">
            <AlertTriangle size={28} />
          </span>
          <h1 className="text-[20px] font-bold text-white">Etibarsız link</h1>
          <p className="mt-2 text-[14px] text-white/55">Bərpa linki natamamdır. Zəhmət olmasa yenidən sorğu göndərin.</p>
          <Link href="/forgot-password" className="mt-5 inline-flex items-center gap-1.5 rounded-[10px] bg-[#ECEAE3] px-4 py-2.5 text-[14px] font-semibold text-[#171612] hover:bg-white">
            Yeni link al
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      {done ? (
        <div className="flex flex-col items-center text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success-fg">
            <CheckCircle2 size={30} />
          </span>
          <h1 className="text-[20px] font-bold text-white">Parol yeniləndi</h1>
          <p className="mt-2 text-[14px] text-white/55">Artıq yeni parolunuzla daxil ola bilərsiniz.</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-5 inline-flex items-center gap-2 rounded-[10px] bg-[#ECEAE3] px-5 py-2.5 text-[14px] font-semibold text-[#171612] hover:bg-white"
          >
            Daxil ol <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <>
          <h1 className="text-[24px] font-bold tracking-[-0.5px] text-white">Yeni parol təyin et</h1>
          <p className="mt-2 text-[14px] text-white/55">Hesabınız üçün yeni parol seçin.</p>

          <form onSubmit={submit} className="mt-7 flex flex-col gap-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="pw" className="text-[12px] font-semibold uppercase tracking-wide text-white/55">
                  Yeni parol <span style={{ color: GOLD }}>*</span>
                </label>
                <button type="button" onClick={() => setShow((s) => !s)} className="flex items-center gap-1 text-[12px] text-white/45 hover:text-white">
                  {show ? <EyeOff size={13} /> : <Eye size={13} />} {show ? "Gizlət" : "Göstər"}
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
                <input id="pw" type={show ? "text" : "password"} required autoFocus placeholder="Yeni parol" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
              </div>
              <p className="mt-1.5 text-[11.5px] text-white/45">{pwErr ?? PASSWORD_HINT}</p>
            </div>

            <div>
              <label htmlFor="confirm" className="mb-2 block text-[12px] font-semibold uppercase tracking-wide text-white/55">
                Təsdiqlə <span style={{ color: GOLD }}>*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  id="confirm"
                  type={show ? "text" : "password"}
                  required
                  placeholder="Parolu təkrar yazın"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputCls + (mismatch ? " !border-danger/70" : "")}
                />
              </div>
              {mismatch && <p className="mt-1.5 text-[12px] text-danger-fg">Parollar uyğun gəlmir</p>}
            </div>

            <button
              type="submit"
              disabled={submitting || !valid}
              className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#ECEAE3] py-3.5 text-[15px] font-semibold text-[#171612] transition-all hover:bg-white disabled:opacity-60"
            >
              {submitting ? "Yenilənir…" : "Parolu yenilə"}
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
