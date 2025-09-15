"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { TodoData } from "../types";
import { Checkbox } from "@/components/ui/checkbox";

export function P1TodoSection({ data }: { data?: TodoData }) {
  const items = data?.todos || [];
  return (
    <section data-section-id="p1_actions">
      <Card>
        <CardHeader>
          <CardTitle>Top 3 immediate actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 ? <div className="text-sm text-muted-foreground">No tasks</div> : null}
          {items.map((t) => (
            <div key={t.id} className="flex items-start gap-2 text-sm">
              <Checkbox checked={!!t.done} aria-label="complete" />
              <div>
                <div>{t.text}</div>
                <div className="text-xs text-muted-foreground">Owner: {t.owner || "—"} · Due: {t.due || "—"}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

