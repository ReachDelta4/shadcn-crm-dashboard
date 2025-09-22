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
import { useReportV3 } from "@/features/dashboard/components/report/hooks/use-report-v3";
import { useReportV3Tabs } from "@/features/dashboard/components/report/hooks/use-report-v3-tabs";

interface SessionDetailPageProps {
	sessionId: string;
}

export function SessionDetailPage({ sessionId }: SessionDetailPageProps) {
	const [active, setActive] = useState("transcript");
	const [aiOpen, setAiOpen] = useState(false);
	const [deckMode, setDeckMode] = useState(false);
	
	const { session, loading: sessionLoading, error: sessionError } = useSession(sessionId);
	const { transcripts, loading: transcriptsLoading, addTranscriptSegment } = useSessionTranscripts(sessionId, true);
	const { data: reportV3, loading: reportLoading, error: reportError, status: reportStatus, retry: retryReport } = useReportV3(sessionId)
	const { data: tabsData, loading: tabsLoading, error: tabsError, status: tabsStatus, retry: retryTabs } = useReportV3Tabs(sessionId)

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
						<TabsTrigger value="executive">Executive Summary</TabsTrigger>
						<TabsTrigger value="chance">Chance of Sale</TabsTrigger>
						<TabsTrigger value="rep-performance">Sales Rep Performance</TabsTrigger>
						<TabsTrigger value="detailed">Detailed Report</TabsTrigger>
						<TabsTrigger value="transcript">Transcript</TabsTrigger>
					</TabsList>

					<TabsContent value="executive">
						{tabsError && (
							<Card className="border-red-300 bg-red-50 text-red-700 mb-4">
								<CardContent className="pt-4 flex items-start justify-between gap-2">
									<div>
										<div className="text-sm font-medium">Executive Summary generation failed</div>
										<div className="text-xs">{tabsError}</div>
									</div>
									<Button size="sm" variant="outline" onClick={() => retryTabs()}>Retry</Button>
								</CardContent>
							</Card>
						)}
						{tabsLoading || !tabsData ? (
							<Card>
								<CardContent className="pt-6">
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
										<span>{tabsStatus === 'running' || tabsStatus === 'queued' ? 'Generating Executive Summary…' : 'Loading report…'}</span>
									</div>
								</CardContent>
							</Card>
						) : (
							<Card>
								<CardContent className="pt-6 text-sm text-muted-foreground">
									Executive Summary report ready (placeholder).
									<div className="mt-2 text-xs">
										Schema: {tabsData?.schema_version || 'Unknown'} | 
										Status: Ready | 
										Executive Score: {tabsData?.executive_summary?.deal_snapshot?.priority || 'N/A'}
									</div>
								</CardContent>
							</Card>
						)}
					</TabsContent>

					<TabsContent value="chance">
						{tabsError && (
							<Card className="border-red-300 bg-red-50 text-red-700 mb-4">
								<CardContent className="pt-4 flex items-start justify-between gap-2">
									<div>
										<div className="text-sm font-medium">Chance of Sale generation failed</div>
										<div className="text-xs">{tabsError}</div>
									</div>
									<Button size="sm" variant="outline" onClick={() => retryTabs()}>Retry</Button>
								</CardContent>
							</Card>
						)}
						{tabsLoading || !tabsData ? (
							<Card>
								<CardContent className="pt-6">
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
										<span>{tabsStatus === 'running' || tabsStatus === 'queued' ? 'Analyzing Deal Probability…' : 'Loading report…'}</span>
									</div>
								</CardContent>
							</Card>
						) : (
							<Card>
								<CardContent className="pt-6 text-sm text-muted-foreground">
									Chance of Sale report ready (placeholder).
									<div className="mt-2 text-xs">
										Probability: {tabsData?.chance_of_sale?.overall_score || 'N/A'}% | 
										Confidence: {tabsData?.chance_of_sale?.confidence_level || 'N/A'} | 
										Boosters: {tabsData?.chance_of_sale?.factors?.boosters?.length || 0}
									</div>
								</CardContent>
							</Card>
						)}
					</TabsContent>

					<TabsContent value="rep-performance">
						{tabsError && (
							<Card className="border-red-300 bg-red-50 text-red-700 mb-4">
								<CardContent className="pt-4 flex items-start justify-between gap-2">
									<div>
										<div className="text-sm font-medium">Sales Rep Performance generation failed</div>
										<div className="text-xs">{tabsError}</div>
									</div>
									<Button size="sm" variant="outline" onClick={() => retryTabs()}>Retry</Button>
								</CardContent>
							</Card>
						)}
						{tabsLoading || !tabsData ? (
							<Card>
								<CardContent className="pt-6">
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
										<span>{tabsStatus === 'running' || tabsStatus === 'queued' ? 'Analyzing Rep Performance…' : 'Loading report…'}</span>
									</div>
								</CardContent>
							</Card>
						) : (
							<Card>
								<CardContent className="pt-6 text-sm text-muted-foreground">
									Sales Rep Performance report ready (placeholder).
									<div className="mt-2 text-xs">
										Overall Score: {tabsData?.sales_rep_performance?.overall_score || 'N/A'}/100 | 
										Stages Analyzed: {tabsData?.sales_rep_performance?.stage_performance?.length || 0} | 
										Coaching Areas: {tabsData?.sales_rep_performance?.coaching_areas?.priorities?.length || 0}
									</div>
								</CardContent>
							</Card>
						)}
					</TabsContent>

					<TabsContent value="detailed">
						<div id="report-controls" className="flex items-center justify-between gap-2 mb-2 print:hidden">
							<div className="text-sm text-muted-foreground">Automatically generated report</div>
							<div className="flex items-center gap-2">
								<Button size="sm" variant="outline" onClick={() => window.print()}>Print</Button>
								<Button size="sm" variant="outline" onClick={() => alert("Export stub — wire backend later")}>Export</Button>
								<Button size="sm" variant={deckMode ? "default" : "outline"} onClick={() => setDeckMode(v => !v)}>{deckMode ? "Deck" : "Scroll"}</Button>
							</div>
						</div>
						{reportError && (
							<Card className="border-red-300 bg-red-50 text-red-700">
								<CardContent className="pt-4 flex items-start justify-between gap-2">
									<div>
										<div className="text-sm font-medium">Report generation failed</div>
										<div className="text-xs">{reportError}</div>
									</div>
									<Button size="sm" variant="outline" onClick={() => retryReport()}>Retry</Button>
								</CardContent>
							</Card>
						)}
						{reportLoading || !reportV3 ? (
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
								<span>{reportStatus === 'running' || reportStatus === 'queued' ? 'Analysing your Call…' : 'Loading report…'}</span>
							</div>
						) : (
							<ReportTabV3 data={reportV3 as any} deckMode={deckMode} />
						)}
					</TabsContent>

					<TabsContent value="transcript">
						<TranscriptViewer 
							transcripts={transcripts} 
							loading={transcriptsLoading}
							onAddSegment={addTranscriptSegment}
							sessionStatus={session?.status}
						/>
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


