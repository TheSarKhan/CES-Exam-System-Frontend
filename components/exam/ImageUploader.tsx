"use client";

import React, { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadImage, imageSrc } from "@/lib/api";

/** Reusable image upload control with preview + remove. Returns the stored public URL. */
export function ImageUploader({
  value,
  onChange,
  label,
}: {
  value?: string | null;
  onChange: (url: string | null) => void;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const src = imageSrc(value);

  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const { url } = await uploadImage(file);
      onChange(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Yüklənmədi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {src ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={label} className="max-h-[160px] rounded-[10px] border border-line object-contain" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white shadow"
            title="Şəkli sil"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex items-center gap-2 rounded-[10px] border border-dashed border-line-strong px-4 py-3 text-[13px] font-medium text-fg-muted hover:border-blue-400 hover:text-blue-600"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          {busy ? "Yüklənir…" : label}
        </button>
      )}
      {err && <p className="mt-1.5 text-[12px] text-danger-fg">{err}</p>}
    </div>
  );
}
