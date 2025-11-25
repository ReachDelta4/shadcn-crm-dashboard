"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessions } from "../overview/hooks/use-sessions";

export function SessionsListPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useState<'list'|'subject'>('list');
  const [subjects, setSubjects] = useState<any[] | null>(null);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<'all'|'lead'|'customer'>("all");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [virtualize, setVirtualize] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(30);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  
  const filters = useMemo(() => ({
    search: searchTerm || undefined
  }), [searchTerm]);
  
  const { sessions, loading, error, total, totalPages } = useSessions(filters, currentPage, 10);

  useEffect(() => {
    if (view !== 'subject') return;
    let active = true;
    const ac = new AbortController()
    const load = async () => {
      setSubjectsLoading(true)
      try {
        // Single optimized endpoint with aggregation and ordering by latest call
        const subjectCap = virtualize ? 200 : 24
        const res = await fetch(`/api/subjects/overview?subjects=${subjectCap}&sessions=5`, { signal: ac.signal })
        if (!res.ok) { if (active) setSubjects([]); return }
        const json = await res.json()
        const items = Array.isArray(json?.subjects) ? json.subjects : []
        if (active) {
          setSubjects(items)
          setVisibleCount(virtualize ? 30 : items.length)
        }
      } catch (err: any) {
        // Ignore aborts; default to safe empty state on other failures
        if (err?.name !== 'AbortError') {
          console.error('Subject overview load error:', err)
          if (active) setSubjects([])
        }
      } finally {
        if (active) setSubjectsLoading(false)
      }
    }
    load()
    return () => { active = false; ac.abort() }
  }, [view, virtualize])

  // IntersectionObserver to progressively reveal more subjects when virtualize is enabled
  useEffect(() => {
    if (!virtualize) return
    const el = loadMoreRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        setVisibleCount(c => c + 30)
      }
    }, { root: null, rootMargin: '800px 0px', threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [virtualize])

  const filteredSubjects = useMemo(() => {
    if (!subjects) return [] as any[];
    const q = (subjectFilter || '').trim().toLowerCase();
    let base = subjects
    if (typeFilter !== 'all') base = base.filter(s => (s.type || '').toLowerCase() === typeFilter)
    if (statusFilter.trim()) base = base.filter(s => (s.status || '').toLowerCase().includes(statusFilter.trim().toLowerCase()))
    if (!q) return base;
    return base.filter(s => (
      (s.name || '').toLowerCase().includes(q) ||
      (s.company || '').toLowerCase().includes(q) ||
      (s.stage_label || '').toLowerCase().includes(q)
    ));
  }, [subjects, subjectFilter, typeFilter, statusFilter]);

  const renderSubjects = useMemo(() => {
    return virtualize ? filteredSubjects.slice(0, visibleCount) : filteredSubjects
  }, [filteredSubjects, virtualize, visibleCount])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative">
          <ViewSwitcher view={view} onChange={setView} />
        </div>
        <Button variant="outline">Tag</Button>
        <Button variant="outline">Generate Reports</Button>
        <div className="ml-auto flex items-center gap-2">
          <Input 
            placeholder="Search sessions…" 
            className="w-64" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant="outline">Filters</Button>
        </div>
      </div>

      {view === 'list' && (
      <Card>
        <CardHeader>
          <CardTitle>
            All Sessions 
            {!loading && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({total} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-5 w-48 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))
          ) : error ? (
            <div className="py-8 text-center text-red-500">
              Error loading sessions: {error}
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchTerm ? 'No sessions found matching your search.' : 'No sessions yet. Start your first session!'}
            </div>
          ) : (
            sessions.map(session => (
              <div key={session.id} className="flex items-center justify-between py-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{session.title || 'Untitled Session'}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(session.created_at).toLocaleDateString()} • {session.type || 'General'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={session.status === 'active' ? 'default' : session.status === 'completed' ? 'secondary' : 'destructive'}
                  >
                    {session.status}
                  </Badge>
                  {session.type && (
                    <Badge variant="outline">{session.type}</Badge>
                  )}
                  <Button size="sm" variant="ghost">Peek</Button>
                  <Button size="sm" onClick={() => location.assign(`/dashboard/sessions/${session.id}`)}>
                    Open
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      )}

      {view === 'subject' && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Subjects</span>
            <div className="flex items-center gap-2">
              <input 
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                placeholder="Filter name/company/stage"
                className="text-sm px-2 py-1 border rounded-md bg-background w-64"
              />
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="text-sm px-2 py-1 border rounded-md bg-background"
                aria-label="Subject type filter"
              >
                <option value="all">All types</option>
                <option value="lead">Lead</option>
                <option value="customer">Customer</option>
              </select>
              <input 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                placeholder="Status"
                className="text-sm px-2 py-1 border rounded-md bg-background w-36"
                aria-label="Status filter"
              />
              <label className="flex items-center gap-1 text-sm text-muted-foreground">
                <input type="checkbox" checked={virtualize} onChange={(e) => setVirtualize(e.target.checked)} />
                Virtualize
              </label>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subjectsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start justify-between gap-3 border rounded-md p-3">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-5 w-48 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))
          ) : !renderSubjects || renderSubjects.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No subjects found.</div>
          ) : (
            renderSubjects.map(sub => (
              <div key={sub.subject_id} className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{sub.name || 'Unnamed'} {sub.company ? `— ${sub.company}` : ''}</div>
                    <div className="text-xs text-muted-foreground">{sub.last_call_at ? new Date(sub.last_call_at).toLocaleString() : ''} · {sub.calls_count || 0} calls</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">{`${(sub.type||'').toString().charAt(0).toUpperCase()+ (sub.type||'').toString().slice(1)}${sub.status? ' - '+sub.status: ''}`}</Badge>
                    <Button size="sm" variant="outline" onClick={() => location.assign(`/dashboard/sessions/new?subject_id=${sub.subject_id}`)}>New Call</Button>
                  </div>
                </div>
                <SubjectSessionsList sessions={sub.sessions||[]} />
              </div>
            ))
          )}
          {virtualize && (
            <div ref={loadMoreRef} className="h-6" />
          )}
        </CardContent>
      </Card>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button 
            variant="outline" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button 
            variant="outline" 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function ViewSwitcher({ view, onChange }: { view: 'list'|'subject'; onChange: (v: 'list'|'subject') => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="inline-block">
      <button 
        className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted/50"
        onClick={() => setOpen(v => !v)}
      >
        View: {view === 'list' ? 'All Sessions' : 'Subject View'}
        <span className="text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-44 rounded-md border bg-background shadow">
          <button className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50" onClick={() => { onChange('list'); setOpen(false) }}>All Sessions</button>
          <button className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50" onClick={() => { onChange('subject'); setOpen(false) }}>Subject View</button>
        </div>
      )}
    </div>
  )
}

function SubjectSessionsList({ sessions }: { sessions: any[] }) {
  // Group by calendar date to insert day separators
  const items: Array<{ key: string; type: 'sep'|'row'; date?: string; s?: any }> = []
  let lastDay: string | null = null
  const fmtDay = (d: Date) => d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
  for (const s of sessions) {
    const ts = new Date(s.started_at || s.created_at)
    const dayKey = ts.toISOString().slice(0,10)
    if (dayKey !== lastDay) {
      items.push({ key: `sep-${dayKey}`, type: 'sep', date: fmtDay(ts) })
      lastDay = dayKey
    }
    items.push({ key: s.id, type: 'row', s })
  }
  return (
    <div className="space-y-1">
      {items.map(item => item.type === 'sep' ? (
        <div key={item.key} className="text-[11px] uppercase tracking-wide text-muted-foreground mt-2 mb-1">{item.date}</div>
      ) : (
        <Link 
          key={item.key} 
          href={`/dashboard/sessions/${item.s.id}`} 
          prefetch
          className="group w-full text-left flex items-center justify-between p-2 rounded hover:bg-muted/40 transition"
        >
          <div className="min-w-0 flex-1">
            <div className="text-sm truncate group-hover:underline">{item.s.title}</div>
            <div className="text-xs text-muted-foreground">{new Date(item.s.started_at || item.s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <div className="text-[11px] text-muted-foreground ml-3">Open →</div>
        </Link>
      ))}
    </div>
  )
}

