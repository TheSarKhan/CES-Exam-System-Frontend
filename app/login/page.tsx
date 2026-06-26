"use client";

import React, { useState } from "react";
import { CheckSquare, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input } from "@/components/ui/Field";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş alınmadı");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-app px-4">
      {/* Subtle brand glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(circle, #2563EB 0%, transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-[15px] bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_8px_20px_rgba(37,99,235,0.4)]">
            <CheckSquare size={27} strokeWidth={2.2} className="text-white" />
          </span>
          <h1 className="text-[24px] font-bold tracking-[-0.5px] text-fg">
            Corporate Assessment
          </h1>
          <p className="mt-1 text-[14px] text-fg-muted">
            Davam etmək üçün hesabınıza daxil olun
          </p>
        </div>

        <div className="card p-7 shadow-pop">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="flex items-start gap-2 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">
                <AlertCircle size={17} className="mt-px shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <FieldGroup label="E-poçt ünvanı" htmlFor="email">
              <Input
                id="email"
                type="email"
                placeholder="ad@sirket.az"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </FieldGroup>

            <FieldGroup label="Şifrə" htmlFor="password">
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </FieldGroup>

            <Button type="submit" size="lg" loading={submitting} className="mt-1 w-full">
              {submitting ? "Daxil olunur…" : "Daxil ol"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-[12.5px] text-fg-faint">
          Corporate Assessment Platform · Daxili istifadə üçün
        </p>
      </div>
    </main>
  );
}
