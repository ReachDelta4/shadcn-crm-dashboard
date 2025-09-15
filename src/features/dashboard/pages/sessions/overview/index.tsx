"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function SessionsOverviewPage() {
  const [showHello, setShowHello] = useState(false);
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Sessions This Week</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">12</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Hours Transcribed</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">8.4h</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Reports Ready</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">7</div></CardContent>
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

