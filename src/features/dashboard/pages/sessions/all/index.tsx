"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function SessionsListPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const rows = Array.from({ length: 8 }, (_, i) => ({ id: `S-${i+1}`, title: `Discovery Call ${i+1}`, date: "2025-09-14", tags: [i % 2 ? "Sales" : "CS", "North"] }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline">Tag</Button>
        <Button variant="outline">Generate Reports</Button>
        <div className="ml-auto flex items-center gap-2">
          <Input placeholder="Search sessions…" className="w-64" />
          <Button variant="outline">Filters</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>All Sessions</CardTitle></CardHeader>
        <CardContent className="divide-y">
          {rows.map(r => (
            <div key={r.id} className="flex items-center justify-between py-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{r.title}</div>
                <div className="text-xs text-muted-foreground">{r.date}</div>
              </div>
              <div className="flex items-center gap-2">
                {r.tags.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
                <Button size="sm" variant="ghost">Peek</Button>
                <Button size="sm" onClick={() => location.assign(`/dashboard/sessions/${r.id}`)}>Open</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

