"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OutlineTree } from "./OutlineTree";
import { REPORT_OUTLINE } from "./structure";
import type { ReportMode } from "./types";

export function ReportShell({ mode, onModeChange, children }: { mode: ReportMode; onModeChange: (m: ReportMode) => void; children: React.ReactNode }) {
  const [activeId, setActiveId] = React.useState<string | undefined>(undefined);

  const handleSelect = (id: string) => {
    const el = document.querySelector(`[data-section-id="${id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <aside className="lg:col-span-3 h-fit sticky top-2">
        <OutlineTree nodes={REPORT_OUTLINE} activeId={activeId} onSelect={handleSelect} />
      </aside>
      <section className="lg:col-span-9 space-y-3">
        <div className="flex items-center justify-between">
          <Tabs value={mode} onValueChange={(v) => onModeChange(v as ReportMode)}>
            <TabsList>
              <TabsTrigger value="cards">Cards</TabsTrigger>
              <TabsTrigger value="scroll">Scroll</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.print()}>Export</Button>
            <Button>Share</Button>
          </div>
        </div>
        {children}
      </section>
    </div>
  );
}

