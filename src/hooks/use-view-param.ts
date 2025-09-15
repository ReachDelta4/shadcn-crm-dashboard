"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

export type ViewMode = "table" | "kanban" | "calendar" | "gantt";

export function useViewParam(defaultView: ViewMode = "table") {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const view = (params.get("view") as ViewMode) || defaultView;

  const setView = useCallback(
    (next: ViewMode) => {
      const sp = new URLSearchParams(params.toString());
      if (next === defaultView) sp.delete("view");
      else sp.set("view", next);
      router.replace(`${pathname}?${sp.toString()}`);
    },
    [params, router, pathname, defaultView],
  );

  return { view, setView } as const;
}
