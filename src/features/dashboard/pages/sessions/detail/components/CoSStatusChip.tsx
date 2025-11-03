"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface VersionRow {
  version: number;
  created_at: string;
  source?: string; // 'full' | 'patch'
  reason?: string;
  session_id?: string;
}

export function CoSStatusChip({ sessionId }: { sessionId: string }) {
  const [v, setV] = useState<VersionRow | null>(null);
  useEffect(() => {
    let active = true;
    fetch(`/api/sessions/${sessionId}/chance-of-sale/versions`)
      .then(r => r.json())
      .then(json => {
        if (!active) return;
        const arr = Array.isArray(json?.versions) ? json.versions as VersionRow[] : [];
        setV(arr?.[0] || null);
      })
      .catch(() => {})
    return () => { active = false };
  }, [sessionId]);

  if (!v) return null;
  const dt = new Date(v.created_at);
  const label = v.source === 'patch' ? 'Auto patch' : v.source === 'full' ? 'Full regen' : 'Updated';
  const title = `${label} at ${dt.toLocaleString()}${v.reason ? ` — ${v.reason}` : ''}`;

  return (
    <Badge variant="outline" title={title} className="text-xs">
      {`v${v.version} · ${label}`}
    </Badge>
  );
}

