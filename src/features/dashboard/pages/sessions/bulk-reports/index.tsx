"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function BulkReportsPage() {
  const jobs = [
    { id: "BR-1", title: "Last 30 days", status: "Processing", pct: 42 },
    { id: "BR-2", title: "Q3 Sales", status: "Queued", pct: 0 },
    { id: "BR-3", title: "This Week", status: "Ready", pct: 100 },
  ];
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader><CardTitle>Create bulk report</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline">Last 7 days</Button>
          <Button variant="outline">Last 30 days</Button>
          <Button variant="outline">Quarter</Button>
          <Button className="ml-auto">Generate</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>History</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {jobs.map(j => (
            <div key={j.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{j.title}</div>
                <div className="text-xs text-muted-foreground">{j.status}</div>
              </div>
              <div className="mt-2">
                <Progress value={j.pct} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

