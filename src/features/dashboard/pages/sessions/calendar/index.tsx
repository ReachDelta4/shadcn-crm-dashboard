"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as React from "react";

export function SessionsCalendarPage() {
  const [view, setView] = React.useState<"month" | "week" | "day">("month");
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
        <CardHeader><CardTitle>Sessions — {view.charAt(0).toUpperCase() + view.slice(1)}</CardTitle></CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
