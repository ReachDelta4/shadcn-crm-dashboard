"use client";
"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

import { CommandPaletteProvider } from "@/components/command-palette";
import { PerfMarksProvider } from "@/components/perf/perf-marks-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/providers/query-provider";

const CommandPalette = dynamic(
  () => import("@/components/command-palette").then((m) => m.CommandPalette),
  { ssr: false },
);

type Props = {
  children: ReactNode;
};

export function DashboardProviders({ children }: Props) {
  return (
    <QueryProvider>
      <CommandPaletteProvider>
        <TooltipProvider>
          {children}
          <CommandPalette />
          <PerfMarksProvider />
        </TooltipProvider>
      </CommandPaletteProvider>
    </QueryProvider>
  );
}
