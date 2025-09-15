"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChartContainer } from "@/components/ui/chart";

export function SessionDetailPage() {
  const [active, setActive] = useState("transcript");
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Main */}
      <div className="lg:col-span-12 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold">Discovery Call with Acme</div>
            <div className="text-xs text-muted-foreground">42 min · 3 speakers</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Sales</Badge>
            <Button variant="outline">Share</Button>
            <Button onClick={() => setAiOpen(true)}>Chat with AI</Button>
          </div>
        </div>

        <Tabs value={active} onValueChange={setActive}>
          <TabsList>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="report">Report</TabsTrigger>
            <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
            <TabsTrigger value="qa">QA</TabsTrigger>
          </TabsList>

          <TabsContent value="transcript">
            <TranscriptMock />
          </TabsContent>

          <TabsContent value="report">
            <ReportViewer onOpenAI={() => setAiOpen(true)} />
          </TabsContent>

          <TabsContent value="artifacts">
            <Card><CardContent className="pt-6">Files / Attachments (UI only)</CardContent></Card>
          </TabsContent>

          <TabsContent value="qa">
            <Card><CardContent className="pt-6">Ask anything about this session (UI only)</CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={aiOpen} onOpenChange={setAiOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>AI Assistant</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full gap-3 p-2">
            <div className="flex-1 overflow-auto rounded-md border p-3 text-sm space-y-3">
              <div className="text-muted-foreground">No messages yet. Select text in the transcript or click a heading to discuss.</div>
            </div>
            <div className="flex items-center gap-2">
              <input className="flex-1 rounded-md border px-3 py-2 text-sm bg-background" placeholder="Ask about this session…" />
              <Button>Send</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function TranscriptMock() {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="group" id={i === 1 ? "intro" : i === 2 ? "discovery" : "pricing"}>
            <div className="text-xs text-muted-foreground">00:{10*i}s · Speaker {i}</div>
            <div className="flex items-start justify-between">
              <p className="text-sm max-w-3xl">Transcript sentence {i}…</p>
              <Button size="sm" variant="ghost">Copy</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ReportViewer({ onOpenAI }: { onOpenAI: () => void }) {
  const pages = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 1), []);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-3">
        <Card className="sticky top-2">
          <CardHeader><CardTitle className="text-sm">Report Outline</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { id: "exec", label: "Executive Summary" },
              { id: "chart", label: "KPIs (Chart)" },
              { id: "risks", label: "Risks & Objections" },
              { id: "next", label: "Next Steps" },
            ].map(s => (
              <a key={s.id} href={`#${s.id}`} className="text-sm hover:underline block">{s.label}</a>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-9 space-y-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Report</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => window.print()}>Export</Button>
              <Button onClick={onOpenAI}>Chat with AI</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {pages.map(p => (
              <ReportPage key={p} page={p} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReportPage({ page }: { page: number }) {
  if (page === 2) {
    return (
      <section id="chart" className="border rounded-md p-4">
        <div className="uppercase tracking-wide text-xs text-muted-foreground">Page {page}</div>
        <h2 className="text-lg font-semibold mt-1">KPIs (Chart)</h2>
        <div className="mt-3">
          <ChartContainer id={`demo-${page}`} config={{ a: { label: "A", color: "#10b981" }, b: { label: "B", color: "#6366f1" } }}>
            {/* Placeholder content area for chart library wrapper */}
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">Chart here (UI only)</div>
          </ChartContainer>
        </div>
      </section>
    );
  }
  const id = page === 1 ? "exec" : page === 3 ? "risks" : page === 4 ? "next" : `p${page}`;
  return (
    <section id={id} className="border rounded-md p-4">
      <div className="uppercase tracking-wide text-xs text-muted-foreground">Page {page}</div>
      <h2 className="text-lg font-semibold mt-1">Section {page}</h2>
      <p className="text-sm mt-2">Lorem ipsum dolor sit amet, consectetur adipiscing elit. UI only.</p>
    </section>
  );
}

