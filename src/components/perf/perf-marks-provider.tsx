"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { endPerfSpan, isPerfEnabled, markPerfPoint, startPerfSpan } from "@/lib/perf";

/**
 * PerfMarksProvider enables route-level instrumentation when the perf flag is on.
 * - It records a start and ready event per route (`route:{pathname}`).
 * - It also drops a lightweight navigation mark for downstream correlation.
 *
 * Enable by setting NEXT_PUBLIC_PERF_MARKS=1 or injecting `window.__PERF_ENABLE__ = true`
 * via Playwright `addInitScript`.
 */
export function PerfMarksProvider() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || !isPerfEnabled()) return;

    const spanName = `route:${pathname}`;
    startPerfSpan(spanName, { path: pathname });
    markPerfPoint("navigation", { path: pathname });

    const idleId = window.requestIdleCallback
      ? window.requestIdleCallback(() => endPerfSpan(spanName, { path: pathname, idle: true }))
      : window.setTimeout(() => endPerfSpan(spanName, { path: pathname, idle: true }), 0);

    return () => {
      if (typeof idleId === "number") {
        if (window.cancelIdleCallback) {
          window.cancelIdleCallback(idleId);
        } else {
          clearTimeout(idleId);
        }
      }
    };
  }, [pathname]);

  return null;
}
