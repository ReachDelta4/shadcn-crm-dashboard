"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { useEventDetails } from "@/features/calendar/hooks/use-event-details";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import type { CalendarEvent } from "@/features/calendar/lib/normalize";
import { Card, CardContent } from "@/components/ui/card";

interface EventDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
}

export function EventDetailsDrawer({ open, onOpenChange, event }: EventDetailsDrawerProps) {
  const leadId = event?.links?.lead_id || null;
  const subjectId = event?.links?.subject_id || null;
  const { lead, transitions, recentSession, loading } = useEventDetails(leadId, subjectId);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{event?.title || "Event"}</SheetTitle>
        </SheetHeader>
        <div className="px-4 py-3 space-y-4">
          {event && (
            <>
              {/* Meeting info */}
              {event.start_at_utc && event.end_at_utc && (
                <div className="text-sm text-muted-foreground">
                  {format(parseISO(event.start_at_utc), 'EEE, MMM d, yyyy • HH:mm')} — {format(parseISO(event.end_at_utc), 'HH:mm')} ({event.timezone || 'UTC'})
                </div>
              )}
              <div className="text-xs flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center rounded-sm px-1.5 py-0.5 border bg-muted">
                  {event.source_type}
                </span>
                {event.links?.lead_id && (
                  <a className="underline" href={`/dashboard/leads/${event.links.lead_id}`}>
                    View Lead
                  </a>
                )}
                {event.links?.invoice_id && (
                  <a className="underline" href={`/dashboard/invoices/${event.links.invoice_id}`}>
                    View Invoice
                  </a>
                )}
              </div>
              {(event.links?.meeting_link || event.links?.ics_url) && (
                <div className="pt-2 flex items-center gap-2">
                  {event.links?.meeting_link && (
                    <Button asChild size="sm" variant="outline">
                      <a href={event.links.meeting_link} target="_blank" rel="noopener noreferrer">Join meeting</a>
                    </Button>
                  )}
                  {event.links?.ics_url && (
                    <Button asChild size="sm" variant="ghost">
                      <a href={event.links.ics_url} target="_blank" rel="noopener noreferrer">Add to calendar</a>
                    </Button>
                  )}
                </div>
              )}

              <Separator />

              {/* Lead basics */}
              <div>
                <div className="text-sm font-medium">Lead</div>
                {lead ? (
                  <div className="text-sm text-muted-foreground">
                    <div>{lead.full_name || '—'}</div>
                    <div className="flex gap-2">
                      <span>{lead.email || '—'}</span>
                      <span>•</span>
                      <span>{lead.phone || '—'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span>{lead.company || '—'}</span>
                      <span>•</span>
                      <span>{lead.status || '—'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">{loading ? 'Loading...' : 'No lead info.'}</div>
                )}
              </div>

              {/* Most recent session (if any) */}
              {recentSession && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm font-medium">Most recent call</div>
                    <div className="text-sm text-muted-foreground">
                      <div>{recentSession.title || 'Session'}</div>
                      <div className="flex gap-2">
                        <span>{recentSession.status}</span>
                        <span>•</span>
                        <span>{recentSession.started_at ? new Date(recentSession.started_at).toLocaleString() : '—'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent activity */}
              <div>
                <div className="text-sm font-medium">Recent activity</div>
                {transitions.length === 0 ? (
                  <div className="text-sm text-muted-foreground">{loading ? 'Loading...' : 'No recent activity.'}</div>
                ) : (
                  <ol className="relative border-s pl-4">
                    {transitions.slice(0,5).map((it, idx) => (
                      <li key={idx} className="mb-4 ms-4">
                        <div className="absolute w-2.5 h-2.5 bg-primary rounded-full mt-1.5 -start-1.5 border border-white" />
                        <time className="mb-1 text-xs font-normal text-muted-foreground">{new Date(it.at).toLocaleString()}</time>
                        <div className="text-sm">{it.from ? `${it.from} → ${it.to}` : it.to}</div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </>
          )}
        </div>
        <Separator />
        <SheetFooter>
          <div className="text-xs text-muted-foreground">Local timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
