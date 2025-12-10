"use client";

import React from "react";

type PerfPhase = "start" | "ready" | "mark" | "measure";

export type PerfEvent = {
  name: string;
  phase: PerfPhase;
  ts: number;
  duration?: number;
  meta?: Record<string, unknown>;
};

type PerfState = {
  events: PerfEvent[];
  starts: Record<string, number>;
  enabled: boolean;
};

declare global {
  interface Window {
    __PERF_ENABLE__?: boolean;
    __perfState__?: PerfState;
    /**
     * Align with DOM lib definitions to avoid duplicate declaration conflicts.
     */
    requestIdleCallback: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback: (handle: number) => void;
  }
}

const envEnabled = process.env.NEXT_PUBLIC_PERF_MARKS === "1";

function getPerfState(): PerfState | null {
  if (typeof window === "undefined") return null;

  if (!window.__perfState__) {
    window.__perfState__ = {
      events: [],
      starts: {},
      enabled: !!envEnabled,
    };
  }

  const shouldEnable = Boolean(envEnabled || window.__PERF_ENABLE__ || window.__perfState__?.enabled);
  window.__perfState__.enabled = shouldEnable;
  return window.__perfState__;
}

export function isPerfEnabled(): boolean {
  const state = getPerfState();
  return Boolean(state?.enabled);
}

export function setPerfEnabled(enabled: boolean) {
  const state = getPerfState();
  if (state) {
    state.enabled = enabled;
  }
}

function pushEvent(event: PerfEvent) {
  const state = getPerfState();
  if (!state || !state.enabled) return;
  state.events.push(event);
}

export function startPerfSpan(name: string, meta?: Record<string, unknown>) {
  const state = getPerfState();
  if (!state || !state.enabled) return;

  const now = performance.now();
  state.starts[name] = now;
  performance.mark?.(`${name}::start`);
  pushEvent({
    name,
    phase: "start",
    ts: now,
    meta,
  });
}

export function endPerfSpan(name: string, meta?: Record<string, unknown>) {
  const state = getPerfState();
  if (!state || !state.enabled) return;

  const now = performance.now();
  const startedAt = state.starts[name];
  const duration = typeof startedAt === "number" ? now - startedAt : undefined;

  if (typeof startedAt === "number") {
    performance.mark?.(`${name}::end`);
    performance.measure?.(`${name}::duration`, {
      start: `${name}::start`,
      end: `${name}::end`,
    } as PerformanceMeasureOptions);
  }

  pushEvent({
    name,
    phase: "ready",
    ts: now,
    duration,
    meta,
  });
}

export function markPerfPoint(
  name: string,
  meta?: Record<string, unknown>,
  phase: PerfPhase = "mark",
) {
  const state = getPerfState();
  if (!state || !state.enabled) return;

  const now = performance.now();
  performance.mark?.(`${name}::mark`);
  pushEvent({
    name,
    phase,
    ts: now,
    meta,
  });
}

export function getPerfEvents(): PerfEvent[] {
  const state = getPerfState();
  return state?.events ?? [];
}

export function clearPerfEvents() {
  const state = getPerfState();
  if (state) {
    state.events = [];
    state.starts = {};
  }
}

export function usePerfTimer(
  name: string,
  options?: {
    meta?: Record<string, unknown>;
    enabled?: boolean;
    autoStart?: boolean;
    autoReadyTimeoutMs?: number;
  },
) {
  const { meta, enabled = true, autoStart = true, autoReadyTimeoutMs = 2000 } = options || {};
  const shouldEnable = enabled && isPerfEnabled();
  const startRef = React.useRef<number | null>(null);
  const readyRef = React.useRef(false);
  const timeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!shouldEnable || !autoStart || readyRef.current) return;
    startRef.current = performance.now();
    startPerfSpan(name, meta);
    if (autoReadyTimeoutMs > 0) {
      timeoutRef.current = window.setTimeout(() => {
        if (!readyRef.current) {
          endPerfSpan(name, { ...meta, autoTimeout: true });
          readyRef.current = true;
        }
      }, autoReadyTimeoutMs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, shouldEnable, autoStart, autoReadyTimeoutMs]);

  const markReady = React.useCallback(
    (readyMeta?: Record<string, unknown>) => {
      if (!shouldEnable || readyRef.current) return;
      readyRef.current = true;
      endPerfSpan(name, { ...meta, ...readyMeta });
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    },
    [name, meta, shouldEnable],
  );

  React.useEffect(
    () => () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  return {
    enabled: shouldEnable,
    markReady,
    startedAt: startRef.current,
  };
}
