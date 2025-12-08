"use client";

import { ReactNode } from "react";

export interface EntityTableShellProps {
  title: string;
  description?: string;
  headerActions?: ReactNode;
  table: ReactNode;
}

export function EntityTableShell({
  title,
  description,
  headerActions,
  table,
}: EntityTableShellProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {headerActions ? (
          <div className="flex items-center gap-2">{headerActions}</div>
        ) : null}
      </div>
      <div className="rounded-md border bg-card">{table}</div>
    </section>
  );
}

