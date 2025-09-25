"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "../overview/hooks/use-sessions";
import { useSessionTranscripts } from "./hooks/use-transcripts";
import { useReportV3 } from "@/features/dashboard/components/report/hooks/use-report-v3";
import { useReportV3Tabs } from "@/features/dashboard/components/report/hooks/use-report-v3-tabs";
import { MarkdownViewer } from "@/features/dashboard/components/report/MarkdownViewer";

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

	const renderMarkdownIfAny = (payload: any, tab?: 'executive'|'chance'|'rep') => {
		if (!payload) return null
		const rawMd =
			(payload as any)?.raw_markdown ||
			(payload as any)?.report_json?.raw_markdown ||
			(payload as any)?.markdown ||
			(payload as any)?.report_json?.markdown ||
			(payload as any)?.content
		if (typeof rawMd === 'string' && rawMd.trim().length > 0) {
			const normalizedMd = normalizeMarkdownForRender(rawMd)
			if (tab) {
				const sections = extractTabMarkdown(normalizedMd)
				const chosen = sections[tab]
				if (!chosen) {
					return <div className="text-muted-foreground">No Contents</div>
				}
				return <MarkdownViewer content={chosen} className="prose prose-lg max-w-none dark:prose-invert" />
			}
			return <MarkdownViewer content={normalizedMd} className="prose prose-lg max-w-none dark:prose-invert" />
		}
		if (tab) {
			return <div className="text-muted-foreground">No Contents</div>
		}
		return null
	}

	// Markdown normalization to recover well-formed blocks from run-on strings
	function normalizeMarkdownForRender(raw: string): string {
		if (!raw || typeof raw !== 'string') return ''
		const input = raw.replace(/\r\n?/g, '\n').trim()
		const parts = input.split(/(```[\s\S]*?```)/g)
		const normalized: string[] = []
		for (const part of parts) {
			if (part.startsWith('```')) { normalized.push(part); continue }
			let section = part
			section = section.replace(/([^\n])\s*(#{1,6}\s+)/g, '$1\n\n$2')
			section = section.replace(/([^\n])\s*((?:[\*\-\+]\s+|\d+\.\s+))/g, '$1\n\n$2')
			section = section.replace(/([^\n])\s*(>\s+)/g, '$1\n\n$2')
			section = section.replace(/([^\n])\s*(\|.*?\|)/g, '$1\n\n$2')
			section = section.replace(/\n{3,}/g, '\n\n')
			normalized.push(section)
		}
		return normalized.join('')
	}

	function extractTabMarkdown(raw: string): { executive?: string; chance?: string; rep?: string } {
		if (!raw || typeof raw !== 'string') return {}
		const text = raw.replace(/\r\n?/g, '\n')
		// Split out fenced code blocks to avoid matching markers inside code
		const parts = text.split(/(```[\s\S]*?```)/g)
		let exec = ''
		let chance = ''
		let rep = ''
		let cur: 'none' | 'exec' | 'chance' | 'rep' = 'none'

		const mkStart = (name: string) => new RegExp(`<!--\\s*TAB:\\s*${name}\\s*-->`, 'i')
		const mkEnd = (name: string) => new RegExp(`<!--\\s*\\/\\s*TAB:\\s*${name}\\s*-->`, 'i')

		const startExec = mkStart('EXECUTIVE\\s+SUMMARY')
		const endExec = mkEnd('EXECUTIVE\\s+SUMMARY')
		const startChance = mkStart('CHANCE\\s+OF\\s+SALE')
		const endChance = mkEnd('CHANCE\\s+OF\\s+SALE')
		const startRep = mkStart('SALES\\s+REP\\s+PERFORMANCE')
		const endRep = mkEnd('SALES\\s+REP\\s+PERFORMANCE')

		type Marker = { type: 'start' | 'end'; tab: 'exec' | 'chance' | 'rep'; regex: RegExp }

		const markers: Marker[] = [
			{ type: 'start', tab: 'exec', regex: startExec },
			{ type: 'end', tab: 'exec', regex: endExec },
			{ type: 'start', tab: 'chance', regex: startChance },
			{ type: 'end', tab: 'chance', regex: endChance },
			{ type: 'start', tab: 'rep', regex: startRep },
			{ type: 'end', tab: 'rep', regex: endRep },
		]

		for (const part of parts) {
			if (part.startsWith('```')) {
				if (cur === 'exec') exec += part
				else if (cur === 'chance') chance += part
				else if (cur === 'rep') rep += part
				continue
			}

			let s = part
			while (s.length > 0) {
				let bestIdx = -1
				let bestLen = 0
				let bestMarker: Marker | null = null
				for (const m of markers) {
					const match = m.regex.exec(s)
					if (match) {
						const idx = (match as any).index ?? s.indexOf(match[0])
						try { (m.regex as any).lastIndex = 0 } catch {}
						if (bestIdx === -1 || idx < bestIdx) {
							bestIdx = idx
							bestLen = match[0].length
							bestMarker = m
						}
					}
				}
				if (bestMarker == null) {
					if (cur === 'exec') exec += s
					else if (cur === 'chance') chance += s
					else if (cur === 'rep') rep += s
					break
				}
				const before = s.slice(0, bestIdx)
				if (cur === 'exec') exec += before
				else if (cur === 'chance') chance += before
				else if (cur === 'rep') rep += before

				// advance past marker
				s = s.slice(bestIdx + bestLen)

				if (bestMarker.type === 'start') {
					cur = bestMarker.tab
				} else {
					if (cur === bestMarker.tab) cur = 'none'
				}
			}
		}

		const trim = (x: string) => (x || '').replace(/^\n+|\s+$/g, '').trim()
		return { executive: trim(exec) || undefined, chance: trim(chance) || undefined, rep: trim(rep) || undefined }
	}

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
								<CardContent className="pt-6 text-sm">
																	{renderMarkdownIfAny(tabsData, 'executive')}
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
								<CardContent className="pt-6 text-sm">
									{renderMarkdownIfAny(tabsData, 'chance')}
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
								<CardContent className="pt-6 text-sm">
																	{renderMarkdownIfAny(tabsData, 'rep')}
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
							<div className="text-sm">
								{renderMarkdownIfAny(reportV3)}
							</div>
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
						<div className="space-y-3">
							{transcripts.map((t, i) => (
								<div key={i} className="border rounded-md p-3 text-sm">
									<div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
										<div>
											<span className="font-medium">{t.speaker || 'Unknown'}</span>
											<span className="ml-2">{formatTimestamp(t.created_at)}</span>
										</div>
										<button className="underline" onClick={() => copyToClipboard(t.text_enc || t.content_enc || '')}>Copy</button>
									</div>
									<div className="whitespace-pre-wrap">{t.text_enc || t.content_enc || ''}</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center gap-2">
						<input 
							className="flex-1 rounded-md border px-3 py-2 text-sm bg-background" 
							placeholder="Add transcript segment… (dev only)"
							value={newSegment}
							onChange={(e) => setNewSegment(e.target.value)}
						/>
						<input 
							className="w-40 rounded-md border px-3 py-2 text-sm bg-background" 
							placeholder="Speaker"
							value={speaker}
							onChange={(e) => setSpeaker(e.target.value)}
						/>
						<Button size="sm" onClick={handleAddSegment} disabled={adding || !newSegment.trim()}>Add</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}


