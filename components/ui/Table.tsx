import React from "react";
import { cn } from "@/lib/cn";

export function Table({
  headers,
  children,
  className,
}: {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card overflow-hidden p-0", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line bg-surface-2">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="whitespace-nowrap px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wider text-fg-faint"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function Tr({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "border-b border-line last:border-0 hover:bg-surface-2",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  className,
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={cn("px-5 py-3.5 text-[13.5px] text-fg-soft", className)}>
      {children}
    </td>
  );
}
