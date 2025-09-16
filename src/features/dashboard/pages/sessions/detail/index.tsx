"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportTabV3 } from "@/features/dashboard/components/report/ReportTabV3";
import { useSession } from "../overview/hooks/use-sessions";
import { useSessionTranscripts } from "./hooks/use-transcripts";

interface SessionDetailPageProps {
	sessionId: string;
}

export function SessionDetailPage({ sessionId }: SessionDetailPageProps) {
	const [active, setActive] = useState("transcript");
	const [aiOpen, setAiOpen] = useState(false);
	const [deckMode, setDeckMode] = useState(false);
	
	const { session, loading: sessionLoading, error: sessionError } = useSession(sessionId);
	const { transcripts, loading: transcriptsLoading, addTranscriptSegment } = useSessionTranscripts(sessionId, true);

	return (
		<div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
			{/* Main */}
			<div className="lg:col-span-12 space-y-4">
				<div className="flex items-center justify-between">
					<div>
						{sessionLoading ? (
							<>
								<Skeleton className="h-7 w-64 mb-1" />
								<Skeleton className="h-4 w-32" />
							</>
						) : sessionError ? (
							<>
								<div className="text-xl font-semibold text-red-500">Error loading session</div>
								<div className="text-xs text-muted-foreground">{sessionError}</div>
							</>
						) : (
							<>
								<div className="text-xl font-semibold">{session?.title || 'Untitled Session'}</div>
								<div className="text-xs text-muted-foreground">
									{session?.created_at && new Date(session.created_at).toLocaleDateString()} · 
									{transcripts.length} segments · 
									{[...new Set(transcripts.map(t => t.speaker).filter(Boolean))].length} speakers
								</div>
							</>
						)}
					</div>
					<div className="flex items-center gap-2">
						{session?.status && (
							<Badge variant={session.status === 'active' ? 'default' : session.status === 'completed' ? 'secondary' : 'destructive'}>
								{session.status}
							</Badge>
						)}
						{session?.type && (
							<Badge variant="outline">{session.type}</Badge>
						)}
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
						<TranscriptViewer 
							transcripts={transcripts} 
							loading={transcriptsLoading}
							onAddSegment={addTranscriptSegment}
							sessionStatus={session?.status}
						/>
					</TabsContent>

					<TabsContent value="report">
						<div id="report-controls" className="flex items-center justify-between gap-2 mb-2 print:hidden">
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

interface TranscriptViewerProps {
	transcripts: any[];
	loading: boolean;
	onAddSegment: (content: string, speaker?: string) => Promise<any>;
	sessionStatus?: string;
}

function TranscriptViewer({ transcripts, loading, onAddSegment, sessionStatus }: TranscriptViewerProps) {
	const [newSegment, setNewSegment] = useState("");
	const [speaker, setSpeaker] = useState("");
	const [adding, setAdding] = useState(false);

	const handleAddSegment = async () => {
		if (!newSegment.trim()) return;
		
		try {
			setAdding(true);
			await onAddSegment(newSegment, speaker || undefined);
			setNewSegment("");
			setSpeaker("");
		} catch (error) {
			console.error('Failed to add segment:', error);
		} finally {
			setAdding(false);
		}
	};

	const formatTimestamp = (timestamp: string) => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString([], { hour12: false, timeStyle: 'medium' });
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	return (
		<div className="space-y-4">
			<Card>
				<CardContent className="pt-6">
					{loading ? (
						<div className="space-y-4">
							{Array.from({ length: 3 }).map((_, i) => (
								<div key={i} className="space-y-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-16 w-full" />
								</div>
							))}
						</div>
					) : transcripts.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							No transcript segments yet. 
							{sessionStatus === 'active' && ' Start speaking to begin transcription.'}
						</div>
					) : (
						<div className="space-y-4 max-h-[600px] overflow-y-auto">
							{transcripts.map((transcript, index) => (
								<div key={transcript.id} className="group border-b border-gray-100 pb-4 last:border-b-0">
									<div className="text-xs text-muted-foreground mb-1">
										{formatTimestamp(transcript.timestamp)} · 
										{transcript.speaker ? ` ${transcript.speaker}` : ' Unknown Speaker'}
										{transcript.confidence && (
											<span className="ml-2 text-green-600">
												{Math.round(transcript.confidence * 100)}% confidence
											</span>
										)}
									</div>
									<div className="flex items-start justify-between">
										<p className="text-sm max-w-3xl leading-relaxed">
											{transcript.content_enc || 'No content'}
										</p>
										<Button 
											size="sm" 
											variant="ghost"
											onClick={() => copyToClipboard(transcript.content_enc || '')}
											className="opacity-0 group-hover:opacity-100 transition-opacity"
										>
											Copy
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{sessionStatus === 'active' && (
				<Card>
					<CardContent className="pt-6">
						<div className="space-y-3">
							<div className="text-sm font-medium">Add Transcript Segment</div>
							<div className="flex gap-2">
								<input
									className="flex-1 rounded-md border px-3 py-2 text-sm bg-background"
									placeholder="Speaker name (optional)"
									value={speaker}
									onChange={(e) => setSpeaker(e.target.value)}
								/>
							</div>
							<div className="flex gap-2">
								<textarea
									className="flex-1 rounded-md border px-3 py-2 text-sm bg-background min-h-[100px]"
									placeholder="Enter transcript content..."
									value={newSegment}
									onChange={(e) => setNewSegment(e.target.value)}
								/>
							</div>
							<Button 
								onClick={handleAddSegment} 
								disabled={!newSegment.trim() || adding}
								className="w-full"
							>
								{adding ? 'Adding...' : 'Add Segment'}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}


