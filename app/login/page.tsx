"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { humanizeError } from "@/lib/errors";
import { emailError } from "@/lib/validate";

const GOLD = "#C9A24B";

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ee = emailError(email);
    if (ee) return toast.error(ee, "Giriş uğursuz oldu");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      toast.error(humanizeError(err, "Giriş alınmadı"), "Giriş uğursuz oldu");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full rounded-[12px] border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-11 text-[14px] text-white placeholder-white/30 outline-none transition-colors focus:border-[#C9A24B]/60 focus:bg-white/[0.06]";

  return (
    <main className="grid min-h-screen lg:grid-cols-2" style={{ background: "#0b0b09" }}>
      {/* ---------- LEFT: form ---------- */}
      <div className="relative flex flex-col px-6 py-8 sm:px-12 lg:px-16">
        {/* brand */}
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-[12px] border border-white/10 bg-white/[0.03]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="CES" className="h-7 w-auto object-contain" />
          </span>
          <div className="leading-tight">
            <div className="text-[14px] font-bold tracking-[-0.2px] text-white">
              Construction <span style={{ color: GOLD }}>Equipment</span> Services
            </div>
            <div className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[1.6px] text-white/40">
              Qiymətləndirmə Platforması · Bakı, AZ
            </div>
          </div>
        </div>

        {/* form (vertically centered) */}
        <div className="flex flex-1 items-center py-10">
          <div className="w-full max-w-[420px]">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[3px]" style={{ color: GOLD }}>
              Daxil ol
            </p>
            <h1 className="text-[38px] font-bold leading-[1.05] tracking-[-1px] text-white sm:text-[42px]">
              Yenidən xoş <span style={{ color: GOLD }}>gəldin.</span>
            </h1>
            <p className="mt-3 text-[14px] text-white/50">Hesabınıza daxil olun və işinizi davam etdirin.</p>

            <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-5">
              {/* email */}
              <div>
                <label htmlFor="email" className="mb-2 block text-[12px] font-semibold uppercase tracking-wide text-white/55">
                  Email <span style={{ color: GOLD }}>*</span>
                </label>
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
                  <input
                    id="email"
                    type="email"
                    placeholder="ad@ces.az"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="password" className="text-[12px] font-semibold uppercase tracking-wide text-white/55">
                    Şifrə <span style={{ color: GOLD }}>*</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[12px] text-white/45 transition-colors hover:text-white"
                  >
                    Unutmuşam?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    aria-label={showPw ? "Şifrəni gizlət" : "Şifrəni göstər"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 transition-colors hover:text-white/70"
                  >
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#ECEAE3] py-3.5 text-[15px] font-semibold text-[#171612] transition-all hover:bg-white disabled:opacity-70"
              >
                {submitting ? "Daxil olunur…" : "Daxil ol"}
                {!submitting && <ArrowRight size={17} />}
              </button>
            </form>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-2 text-[13px]">
              <span className="text-white/40">Sistemə dəstək lazımdırsa?</span>
              <a href="mailto:support@ces.az" className="font-medium text-white/80 transition-colors hover:text-[#C9A24B]">
                support@ces.az →
              </a>
            </div>
          </div>
        </div>

        {/* footer */}
        <p className="text-[12px] text-white/30">
          © 2026 Construction Equipment Services · Bütün hüquqlar qorunur
        </p>
      </div>

      {/* ---------- RIGHT: image panel ---------- */}
      <div className="relative hidden overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/login.png" alt="" className="absolute inset-0 h-full w-full object-cover" />

        {/* darkening + bottom gradient for legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(11,11,9,0.55) 0%, rgba(11,11,9,0.10) 30%, rgba(11,11,9,0.20) 55%, rgba(11,11,9,0.92) 100%), linear-gradient(90deg, rgba(11,11,9,0.55) 0%, transparent 22%)",
          }}
        />
        {/* faint grid texture */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* status (top-left) */}
        <div className="absolute left-12 top-10 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[2px] text-white/70">
          <span className="h-2 w-2 rounded-full" style={{ background: GOLD, boxShadow: `0 0 10px ${GOLD}` }} />
          Sistem aktiv · V1.0
        </div>

        {/* content (bottom) */}
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[3px]" style={{ color: GOLD }}>
            CES · Qiymətləndirmə — 2026
          </p>
          <h2 className="max-w-[600px] text-[42px] font-bold leading-[1.08] tracking-[-1px] text-white xl:text-[50px]">
            Bilik, qiymətləndirmə və <span style={{ color: GOLD }}>nəticə</span> bir platformada.
          </h2>
          <p className="mt-5 max-w-[540px] text-[15px] leading-relaxed text-white/55">
            Dağınıq cədvəllər və əl ilə yoxlama deyil — imtahan, qiymətləndirmə və analitika bir interfeysdə birləşir.
          </p>

          <div className="mt-9 h-px w-full bg-white/10" />

          <div className="mt-7 grid max-w-[640px] grid-cols-3 gap-4">
            <Stat big="Anlıq" small="Nəticə" />
            <Stat big="Təhlükəsiz" small="İmtahan" gold />
            <Stat big="Sadə" small="İnterfeys" />
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({ big, small, gold }: { big: string; small: string; gold?: boolean }) {
  return (
    <div>
      <div className="text-[26px] font-bold tracking-[-0.5px]" style={{ color: gold ? GOLD : "#ffffff" }}>
        {big}
      </div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-[2px] text-white/45">{small}</div>
    </div>
  );
}
