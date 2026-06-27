"use client";

import React, { useEffect, useState } from "react";
import { Copy, Check, Mail, Share2, ExternalLink, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";

/** Full candidate-facing URL for a one-time access token. */
export function examTokenUrl(token: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/exam/token/${token}`;
}

/** Ready-to-send Azerbaijani invitation message (paste into WhatsApp/Telegram/e-mail). */
export function buildInviteMessage(opts: {
  url: string;
  examTitle: string;
  candidateName?: string | null;
  endDate?: string | null;
}): string {
  const greet = opts.candidateName ? `Salam, ${opts.candidateName}!` : "Salam!";
  const lines = [
    greet,
    "",
    `Sizə "${opts.examTitle}" imtahanı təyin olunub. Aşağıdakı tək-istifadəlik linklə imtahana başlaya bilərsiniz:`,
    "",
    opts.url,
    "",
  ];
  if (opts.endDate) lines.push(`Son tarix: ${formatDateTime(opts.endDate)}`);
  lines.push("Uğurlar!");
  return lines.join("\n");
}

type Layout = "panel" | "row";

interface ShareActionsProps {
  token: string;
  examTitle: string;
  candidateName?: string | null;
  endDate?: string | null;
  layout?: Layout;
  className?: string;
}

export function ShareActions({
  token,
  examTitle,
  candidateName,
  endDate,
  layout = "panel",
  className,
}: ShareActionsProps) {
  const [copied, setCopied] = useState<null | "url" | "msg">(null);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const url = examTokenUrl(token);
  const message = buildInviteMessage({ url, examTitle, candidateName, endDate });
  const subject = `"${examTitle}" imtahanına dəvət`;
  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

  const flash = (what: "url" | "msg") => {
    setCopied(what);
    setTimeout(() => setCopied((c) => (c === what ? null : c)), 1800);
  };
  const copyUrl = async () => {
    try { await navigator.clipboard.writeText(url); flash("url"); } catch { /* clipboard denied */ }
  };
  const copyMsg = async () => {
    try { await navigator.clipboard.writeText(message); flash("msg"); } catch { /* clipboard denied */ }
  };
  const nativeShare = async () => {
    try { await navigator.share({ title: subject, text: message, url }); } catch { /* dismissed */ }
  };

  // ---- compact row (used inside link lists) ----
  if (layout === "row") {
    return (
      <div className={cn("flex shrink-0 items-center gap-1.5", className)}>
        <IconBtn onClick={copyUrl} title="Linki kopyala" active={copied === "url"}>
          {copied === "url" ? <Check size={15} className="text-success-fg" /> : <Copy size={15} />}
        </IconBtn>
        <IconBtn onClick={copyMsg} title="Mesajı kopyala" active={copied === "msg"}>
          {copied === "msg" ? <Check size={15} className="text-success-fg" /> : <MessageSquareText size={15} />}
        </IconBtn>
        <a href={mailto} title="E-poçt ilə göndər" className={iconBtnClass}>
          <Mail size={15} />
        </a>
        {canShare && (
          <IconBtn onClick={nativeShare} title="Paylaş">
            <Share2 size={15} />
          </IconBtn>
        )}
        <a href={url} target="_blank" rel="noopener noreferrer" title="Linki aç" className={iconBtnClass}>
          <ExternalLink size={15} />
        </a>
      </div>
    );
  }

  // ---- full panel (used on the assign-success screen) ----
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2 break-all rounded-[10px] border border-line bg-surface-2 px-3.5 py-3 text-[13px] text-fg-soft">
        <ExternalLink size={15} className="shrink-0 text-fg-faint" /> {url}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={copyUrl} className={cn(actionBtn, "btn-primary text-white")}>
          {copied === "url" ? <Check size={16} /> : <Copy size={16} />}
          {copied === "url" ? "Kopyalandı!" : "Linki kopyala"}
        </button>
        <a href={mailto} className={cn(actionBtn, "btn-secondary")}>
          <Mail size={16} /> E-poçt
        </a>
        {canShare && (
          <button onClick={nativeShare} className={cn(actionBtn, "btn-secondary")}>
            <Share2 size={16} /> Paylaş
          </button>
        )}
        <a href={url} target="_blank" rel="noopener noreferrer" className={cn(actionBtn, "btn-secondary")}>
          <ExternalLink size={16} /> Aç
        </a>
      </div>

      <details className="group rounded-[10px] border border-line">
        <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-2.5 text-[13px] font-medium text-fg-soft">
          <span className="flex items-center gap-2"><MessageSquareText size={15} className="text-fg-faint" /> Hazır dəvət mesajı</span>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); copyMsg(); }}
            className="inline-flex items-center gap-1.5 rounded-[7px] border border-line px-2.5 py-1 text-[12px] text-fg-muted hover:bg-surface-2"
          >
            {copied === "msg" ? <><Check size={13} className="text-success-fg" /> Kopyalandı</> : <><Copy size={13} /> Mesajı kopyala</>}
          </button>
        </summary>
        <pre className="whitespace-pre-wrap border-t border-line px-3.5 py-3 font-sans text-[12.5px] leading-relaxed text-fg-muted">
          {message}
        </pre>
      </details>
    </div>
  );
}

const iconBtnClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-line text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg";

function IconBtn({
  onClick,
  title,
  active,
  children,
}: {
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} title={title} aria-label={title} className={cn(iconBtnClass, active && "bg-surface-2")}>
      {children}
    </button>
  );
}

const actionBtn = "btn focus-ring inline-flex items-center gap-2";
