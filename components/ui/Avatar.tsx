import React from "react";

const palette = ["#1D4ED8", "#7E22CE", "#15803D", "#B45309", "#0E7490", "#BE123C"];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export function Avatar({
  name,
  size = 34,
  bg,
}: {
  name: string;
  size?: number;
  bg?: string;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        background: bg ?? colorFor(name),
        fontSize: size * 0.4,
      }}
    >
      {initials(name)}
    </span>
  );
}
