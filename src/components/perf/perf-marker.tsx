"use client";

import { useEffect } from "react";
import { markPerfPoint } from "@/lib/perf";

type PerfMarkerProps = {
  name: string;
  phase?: "mark" | "ready" | "start";
  when?: boolean;
  meta?: Record<string, unknown>;
  /**
   * Optional stable key to keep `meta` changes from retriggering the mark.
   * Provide when `meta` is dynamic to avoid duplicate marks on re-render.
   */
  metaKey?: string | number;
};

/**
 * Minimal client-side marker for instrumentation.
 * Emits a single perf event when `when` is true and the component has mounted.
 */
export function PerfMarker({
  name,
  phase = "ready",
  when = true,
  meta,
  metaKey,
}: PerfMarkerProps) {
  useEffect(() => {
    if (!when) return;
    markPerfPoint(name, meta, phase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, phase, when, metaKey]);

  return null;
}
