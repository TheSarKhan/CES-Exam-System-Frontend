import React from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-[22px] font-bold tracking-[-0.4px] text-fg">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[13.5px] text-fg-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
