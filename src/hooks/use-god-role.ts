"use client";

import { useEffect, useState } from "react";

/**
 * Lightweight client hook to detect god access by probing a protected endpoint.
 * Returns `true` when the user can call /api/god/probe successfully and it reports isGod=true.
 */
export function useGodRole(): boolean {
  const [isGod, setIsGod] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const probe = async () => {
      try {
        const res = await fetch("/api/god/probe", { method: "GET", cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setIsGod(false);
          return;
        }
        const data = await res.json().catch(() => null);
        if (!cancelled) setIsGod(Boolean(data?.isGod));
      } catch {
        if (!cancelled) setIsGod(false);
      }
    };
    probe();
    return () => {
      cancelled = true;
    };
  }, []);

  return isGod;
}
