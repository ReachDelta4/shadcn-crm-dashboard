"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "../overview/hooks/use-sessions";
import { useSessionTranscripts } from "./hooks/use-transcripts";
import { useSummaryReport } from "@/features/dashboard/components/report/hooks/use-summary-report";
import { useChanceOfSaleReport } from "@/features/dashboard/components/report/hooks/use-chance-of-sale-report";
import dynamic from "next/dynamic";
const MarkdownViewer = dynamic(() => import("@/features/dashboard/components/report/MarkdownViewer"), { loading: () => null });
import { UpcomingAppointments } from "./components/UpcomingAppointments";
import { CoSHistoryPanel } from "./components/CoSHistoryPanel";
import { CoSStatusChip } from "./components/CoSStatusChip";

interface SessionDetailPageProps {
	sessionId: string;
}

export function SessionDetailPage({ sessionId }: SessionDetailPageProps) {
	const [active, setActive] = useState("transcript");
	const [aiOpen, setAiOpen] = useState(false);
    
	
	const { session, loading: sessionLoading, error: sessionError } = useSession(sessionId);
    const { transcripts, loading: transcriptsLoading, addTranscriptSegment } = useSessionTranscripts(sessionId, true);
    const [subjectSummary, setSubjectSummary] = useState<{ stage_label?: string | null; calls_count?: number } | null>(null)
    useEffect(() => {
        const load = async () => {
            try {
                const sid = session?.subject_id
                if (!sid) { setSubjectSummary(null); return }
                const res = await fetch(`/api/subjects/${sid}`)
                if (!res.ok) { setSubjectSummary(null); return }
                const json = await res.json()
                setSubjectSummary({ stage_label: json?.stage_label || null, calls_count: json?.calls_count || 0 })
            } catch { setSubjectSummary(null) }
        }
        load()
    }, [session?.subject_id])
    const { markdown: summaryMd, loading: summaryLoading, error: summaryError, status: summaryStatus, retry: retrySummary } = useSummaryReport(sessionId)
    const { markdown: chanceMd, loading: chanceLoading, error: chanceError, status: chanceStatus, retry: retryChance } = useChanceOfSaleReport(sessionId)
    const [reportMeta, setReportMeta] = useState<{ probability?: number; score10?: number; stage?: string } | null>(null)

    // Fetch lightweight report metadata for badges (probability/score)
    useEffect(() => {
        let active = true
        const load = async () => {
            try {
                const res = await fetch(`/api/sessions/${sessionId}/tabs/metadata`)
                if (!res.ok) return
                const j = await res.json()
                const probability = typeof j?.scores?.probability_100 === 'number' ? Math.round(j.scores.probability_100) : undefined
                const score10 = typeof j?.scores?.deal_score_10 === 'number' ? j.scores.deal_score_10 : undefined
                const stage = j?.meta?.stage || undefined
                if (active) setReportMeta({ probability, score10, stage })
            } catch {}
        }
        load()
        return () => { active = false }
    }, [])

    const renderMarkdownBlock = (rawMd?: string | null) => {
        if (typeof rawMd === 'string' && rawMd.trim().length > 0) {
            // Normalize minor spacing issues to reduce stray bullets/headings, then render
            const normalized = normalizeMarkdownForRender(rawMd)
            return <MarkdownViewer content={normalized} className="prose prose-lg max-w-none dark:prose-invert" />
        }
        return <div className="text-muted-foreground">No Contents</div>
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
            // Only insert spacing before true blockquote lines; never touch HTML comments
            section = section.replace(/(^|\n)(>\s+)/g, '\n$2')
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
								<div className="flex items-center gap-2">
									<div className="text-xl font-semibold">{session?.title || 'Untitled Session'}</div>
									{subjectSummary?.stage_label && (
										<Badge variant="outline" className="text-[10px] uppercase tracking-wide">{subjectSummary.stage_label}</Badge>
									)}
								</div>
								<div className="text-xs text-muted-foreground">
									{session?.created_at && new Date(session.created_at).toLocaleDateString()} · 
									{transcripts.length} segments · 
									{[...new Set(transcripts.map(t => t.speaker).filter(Boolean))].length} speakers
								</div>
								{(reportMeta?.probability != null || reportMeta?.score10 != null) && (
									<div className="mt-1 flex items-center gap-2">
										{reportMeta?.probability != null && (
											<Badge variant="secondary">Prob {reportMeta.probability}%</Badge>
										)}
										{reportMeta?.score10 != null && (
											<Badge variant="outline">Score {reportMeta.score10}/10</Badge>
										)}
									</div>
								)}
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
						{typeof subjectSummary?.calls_count === 'number' && (
							<Badge variant="outline">{subjectSummary.calls_count} calls</Badge>
						)}
						<Button variant="outline">Share</Button>
						<Button onClick={() => setAiOpen(true)}>Chat with AI</Button>
					</div>
				</div>

				<UpcomingAppointments subjectId={session?.subject_id || null} />

				<Tabs value={active} onValueChange={setActive}>
                <TabsList>
                    <TabsTrigger value="executive">Executive Summary</TabsTrigger>
                    <TabsTrigger value="chance">Chance of Sale</TabsTrigger>
                    {/* Legacy V3 report removed */}
                    <TabsTrigger value="cos-history">CoS History</TabsTrigger>
                    <TabsTrigger value="transcript">Transcript</TabsTrigger>
                </TabsList>

                <TabsContent value="executive">
                    {summaryError && (
                        <Card className="border-red-300 bg-red-50 text-red-700 mb-4">
                            <CardContent className="pt-4 flex items-start justify-between gap-2">
                                <div>
                                    <div className="text-sm font-medium">Executive Summary generation failed</div>
                                    <div className="text-xs">{summaryError}</div>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => retrySummary()}>Retry</Button>
                            </CardContent>
                        </Card>
                    )}
                    {summaryLoading || !summaryMd ? (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                                    <span>{summaryStatus === 'running' || summaryStatus === 'queued' ? 'Generating Executive Summary…' : 'Loading report…'}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="pt-6 text-sm">
                                {renderMarkdownBlock(summaryMd)}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="chance">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-muted-foreground">Chance of Sale</div>
                      <CoSStatusChip sessionId={sessionId} />
                    </div>
                    {chanceError && (
                        <Card className="border-red-300 bg-red-50 text-red-700 mb-4">
                            <CardContent className="pt-4 flex items-start justify-between gap-2">
                                <div>
                                    <div className="text-sm font-medium">Chance of Sale generation failed</div>
                                    <div className="text-xs">{chanceError}</div>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => retryChance()}>Retry</Button>
                            </CardContent>
                        </Card>
                    )}
                    {chanceLoading || !chanceMd ? (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                                    <span>{chanceStatus === 'running' || chanceStatus === 'queued' ? 'Analyzing Deal Probability…' : 'Loading report…'}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="pt-6 text-sm">
                                {renderMarkdownBlock(chanceMd)}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="cos-history">
                    <CoSHistoryPanel sessionId={sessionId} />
                </TabsContent>

                {/*
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
								<ReportTabV3 data={reportV3 || undefined} deckMode={deckMode} />
							</div>
						)}
                					</TabsContent>
                */}

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


