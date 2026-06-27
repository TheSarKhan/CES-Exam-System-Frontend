"use client";

import React from "react";
import { ChevronDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export function Label({
  children,
  htmlFor,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("text-[13px] font-semibold text-fg-soft", className)}>
      {children}
    </label>
  );
}

export function FieldGroup({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label?: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error ? (
        <span className="flex items-center gap-1 text-[12px] text-danger">
          <AlertCircle size={13} /> {error}
        </span>
      ) : (
        hint && <span className="text-[12px] text-fg-faint">{hint}</span>
      )}
    </div>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function Input({ className, invalid, ...props }, ref) {
  return (
    <input ref={ref} className={cn("field", invalid && "field-error", className)} {...props} />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn("field", invalid && "field-error", className)}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(function Select({ className, invalid, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn("field appearance-none pr-9", invalid && "field-error", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
});

/** Input with a leading icon (e.g. search). */
export function IconInput({
  icon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </span>
      <input className={cn("field pl-[38px]", className)} {...props} />
    </div>
  );
}
