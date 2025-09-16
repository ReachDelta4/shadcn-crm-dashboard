"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ReportTabV3 } from "@/features/dashboard/components/report/ReportTabV3";

export function SessionDetailPage() {
	const [active, setActive] = useState("transcript");
	const [aiOpen, setAiOpen] = useState(false);
	const [deckMode, setDeckMode] = useState(false);

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
						<div className="flex items-center justify-between gap-2 mb-2 print:hidden">
							<div className="text-sm text-muted-foreground">UI only · Export/Print/Deck controls</div>
							<div className="flex items-center gap-2">
								<Button size="sm" variant="outline" onClick={() => window.print()}>Print</Button>
								<Button size="sm" variant="outline" onClick={() => alert("Export stub — wire backend later")}>Export</Button>
								<Button size="sm" variant={deckMode ? "default" : "outline"} onClick={() => setDeckMode(v => !v)}>{deckMode ? "Deck" : "Scroll"}</Button>
							</div>
						</div>
						<ReportTabV3 />
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


