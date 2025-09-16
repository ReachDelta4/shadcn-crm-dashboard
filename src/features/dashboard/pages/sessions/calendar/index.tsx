"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as React from "react";

export function SessionsCalendarPage() {
  const [view, setView] = React.useState<"month" | "week" | "day">("month");
  const [altView, setAltView] = React.useState<"calendar" | "kanban" | "gantt">("calendar");
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant={view === "month" ? "default" : "outline"} onClick={() => setView("month")}>Month</Button>
        <Button variant={view === "week" ? "default" : "outline"} onClick={() => setView("week")}>Week</Button>
        <Button variant={view === "day" ? "default" : "outline"} onClick={() => setView("day")}>Day</Button>
        <div className="ml-auto" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sessions — {view.charAt(0).toUpperCase() + view.slice(1)}</CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant={altView === "calendar" ? "default" : "outline"} onClick={() => setAltView("calendar")}>Calendar</Button>
              <Button size="sm" variant={altView === "kanban" ? "default" : "outline"} onClick={() => setAltView("kanban")}>Kanban</Button>
              <Button size="sm" variant={altView === "gantt" ? "default" : "outline"} onClick={() => setAltView("gantt")}>Gantt</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {altView === "calendar" && (
            <div>
              {view === "month" && (
                <div className="grid grid-cols-7 gap-2">
                  {days.map(d => (
                    <div key={d} className="border rounded-md p-2 min-h-24 text-xs">
                      <div className="font-semibold">{d}</div>
                    </div>
                  ))}
                </div>
              )}
              {view === "week" && (
                <div className="text-sm text-muted-foreground">Weekly view placeholder</div>
              )}
              {view === "day" && (
                <div className="text-sm text-muted-foreground">Daily agenda placeholder</div>
              )}
            </div>
          )}
          {altView === "kanban" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {["Backlog", "Scheduled", "Done"].map(col => (
                <div key={col} className="rounded-md border p-3">
                  <div className="text-sm font-medium mb-2">{col}</div>
                  <div className="space-y-2">
                    {[1,2].map(i => (
                      <div key={i} className="rounded-md border p-2 text-sm">
                        {col} item {i}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {altView === "gantt" && (
            <div className="space-y-2">
              {["Project A", "Project B", "Project C"].map((row, idx) => (
                <div key={row} className="text-sm">
                  <div className="mb-1 font-medium">{row}</div>
                  <div className="h-6 bg-muted rounded relative overflow-hidden">
                    <div className="absolute top-0 h-6 bg-primary/70" style={{ left: `${idx * 10}%`, width: `${30 + idx * 10}%` }} />
                  </div>
                </div>
              ))}
              <div className="text-xs text-muted-foreground">UI-only Gantt bars.</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
