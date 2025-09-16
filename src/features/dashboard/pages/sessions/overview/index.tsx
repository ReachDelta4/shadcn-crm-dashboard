"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useSessionStats } from "./hooks/use-sessions";
import { Skeleton } from "@/components/ui/skeleton";

export function SessionsOverviewPage() {
  const [showHello, setShowHello] = useState(false);
  const { stats, loading: statsLoading, error: statsError } = useSessionStats();
  
  useEffect(() => {
    const k = "sessions_hello_seen";
    if (!localStorage.getItem(k)) {
      setShowHello(true);
      localStorage.setItem(k, "1");
    }
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {showHello && (
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-black tracking-tight">Welcome to Sessions</div>
            <p className="text-sm text-muted-foreground mt-1">Capture meetings, view transcripts, and generate world‑class reports.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Total Sessions</CardTitle></CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : statsError ? (
              <div className="text-2xl font-bold text-red-500">-</div>
            ) : (
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Active Sessions</CardTitle></CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : statsError ? (
              <div className="text-2xl font-bold text-red-500">-</div>
            ) : (
              <div className="text-2xl font-bold">{stats?.active || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Completed</CardTitle></CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : statsError ? (
              <div className="text-2xl font-bold text-red-500">-</div>
            ) : (
              <div className="text-2xl font-bold">{stats?.completed || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Cancelled</CardTitle></CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : statsError ? (
              <div className="text-2xl font-bold text-red-500">-</div>
            ) : (
              <div className="text-2xl font-bold">{stats?.cancelled || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Start fast</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={() => location.assign("/dashboard/sessions/all")}>All Sessions</Button>
          <Button variant="outline" onClick={() => location.assign("/dashboard/sessions/calendar")}>Calendar</Button>
          <Button variant="outline" onClick={() => location.assign("/dashboard/sessions/reports")}>Reports</Button>
        </CardContent>
      </Card>
    </div>
  );
}

