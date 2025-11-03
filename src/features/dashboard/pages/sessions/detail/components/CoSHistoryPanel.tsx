"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
const MarkdownViewer = dynamic(() => import("@/features/dashboard/components/report/MarkdownViewer"), { ssr: false, loading: () => null });

interface VersionRow {
  version: number;
  created_at: string;
  source?: string;
  reason?: string;
  session_id?: string;
}

export function CoSHistoryPanel({ sessionId }: { sessionId: string }) {
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromV, setFromV] = useState<string>("");
  const [toV, setToV] = useState<string>("");
  const [diffLoading, setDiffLoading] = useState(false);
  const [left, setLeft] = useState<string | null>(null);
  const [right, setRight] = useState<string | null>(null);
  const [diffError, setDiffError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetch(`/api/sessions/${sessionId}/chance-of-sale/versions`)
      .then(r => r.json())
      .then(json => {
        if (!active) return;
        const arr = Array.isArray(json?.versions) ? json.versions as VersionRow[] : [];
        setVersions(arr);
        if (arr.length >= 2) {
          setFromV(String(arr[arr.length - 1].version)); // oldest
          setToV(String(arr[0].version)); // newest
        } else if (arr.length === 1) {
          setFromV(String(arr[0].version));
          setToV(String(arr[0].version));
        }
      })
      .catch(e => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
    return () => { active = false };
  }, [sessionId]);

  const canDiff = useMemo(() => {
    const fv = Number(fromV), tv = Number(toV);
    return Number.isFinite(fv) && Number.isFinite(tv) && fv > 0 && tv > 0;
  }, [fromV, toV]);

  const runDiff = () => {
    if (!canDiff) return;
    setDiffLoading(true);
    setDiffError(null);
    setLeft(null); setRight(null);
    fetch(`/api/sessions/${sessionId}/chance-of-sale/versions/diff?from=${fromV}&to=${toV}`)
      .then(r => r.json())
      .then(json => {
        if (!json || json.error) {
          setDiffError(json?.error || 'Failed to fetch diff');
          return;
        }
        setLeft(json.from?.markdown || null);
        setRight(json.to?.markdown || null);
      })
      .catch(e => setDiffError(e instanceof Error ? e.message : String(e)))
      .finally(() => setDiffLoading(false));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-5 w-52" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-300 bg-red-50 text-red-700">
        <CardContent className="pt-4 text-sm">{error}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="pt-6">
          {versions.length === 0 ? (
            <div className="text-sm text-muted-foreground">No Chance of Sale history yet.</div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="text-sm">From:</div>
              <Select value={fromV} onValueChange={setFromV}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Version" /></SelectTrigger>
                <SelectContent>
                  {versions.slice().reverse().map(v => (
                    <SelectItem key={`from-${v.version}`} value={String(v.version)}>
                      v{v.version} · {new Date(v.created_at).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm">To:</div>
              <Select value={toV} onValueChange={setToV}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Version" /></SelectTrigger>
                <SelectContent>
                  {versions.map(v => (
                    <SelectItem key={`to-${v.version}`} value={String(v.version)}>
                      v{v.version} · {new Date(v.created_at).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={runDiff} disabled={!canDiff || diffLoading}>Show Diff</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {diffError && (
        <Card className="border-red-300 bg-red-50 text-red-700">
          <CardContent className="pt-4 text-sm">{diffError}</CardContent>
        </Card>
      )}

      {diffLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              <span>Loading…</span>
            </div>
          </CardContent>
        </Card>
      )}

      {left && right && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-6 text-sm">
              <div className="text-xs text-muted-foreground mb-2">From v{fromV}</div>
              <MarkdownViewer content={left} className="prose prose-sm max-w-none dark:prose-invert" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-sm">
              <div className="text-xs text-muted-foreground mb-2">To v{toV}</div>
              <MarkdownViewer content={right} className="prose prose-sm max-w-none dark:prose-invert" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

