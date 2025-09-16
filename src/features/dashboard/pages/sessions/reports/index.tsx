"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function SessionsReportsPage() {
  const reports = Array.from({ length: 6 }, (_, i) => ({ id: `R-${i+1}`, title: `Report ${i+1}`, status: i % 2 ? "Ready" : "Draft" }));
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader><CardTitle>Create report</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline">Last 7 days</Button>
          <Button variant="outline">Last 30 days</Button>
          <Button variant="outline">Quarter</Button>
          <div className="ml-auto flex items-center gap-2">
            <Input placeholder="Custom range (UI only)" className="w-64" />
            <Button>Generate</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Saved reports</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {reports.map(r => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="font-medium">{r.title}</div>
                <div className="text-xs text-muted-foreground mt-1">Updated recently</div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline">{r.status}</Badge>
                  <Button size="sm" variant="ghost">Share</Button>
                  <Button size="sm" onClick={() => location.assign(`/dashboard/sessions/${r.id}/#report`)}>Open</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

