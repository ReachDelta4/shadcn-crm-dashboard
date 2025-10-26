"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import * as React from "react";
import { useAppointments } from "@/features/calendar/hooks/use-appointments";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, format, parseISO, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import type { CalendarEvent } from "@/features/calendar/lib/normalize";
import { SpeedDialNewSession } from "./components/SpeedDialNewSession";
import { EventDetailsDrawer } from "@/features/calendar/components/EventDetailsDrawer";
import { toast } from "sonner";
import { CalendarShell } from "@/features/calendar/components/CalendarShell";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";

const ENABLE_EXPERIMENTAL_VIEWS = false;

export function SessionsCalendarPage() {
  const [view, setView] = React.useState<"month" | "week" | "day">("month");
  const [altView, setAltView] = React.useState<"calendar" | "kanban" | "gantt">("calendar");
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [combinedEvents, setCombinedEvents] = React.useState<CalendarEvent[]>([]);
  const debounceRef = React.useRef<number | null>(null);
  const [range, setRange] = React.useState<DateRange | undefined>(undefined);
  const [visibleRange, setVisibleRange] = React.useState<{ start: string; end: string } | undefined>(undefined);
  const calendarApiRef = React.useRef<any>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [activeEvent, setActiveEvent] = React.useState<CalendarEvent | null>(null);
  const [showAppointments, setShowAppointments] = React.useState(true);
  const [showFinancials, setShowFinancials] = React.useState(true);
  
  // Calculate date range based on current view
  const dateRange = React.useMemo(() => {
    // Priority 1: explicit visibleRange chosen via DateRangePicker
    if (visibleRange?.start && visibleRange?.end) {
      return { from: visibleRange.start, to: visibleRange.end };
    }
    if (view === "week") {
      const fromWeek = startOfWeek(selectedDate);
      const toWeek = endOfWeek(selectedDate);
      return { from: fromWeek.toISOString(), to: toWeek.toISOString() };
    }
    if (view === "day") {
      const fromDay = startOfDay(selectedDate);
      const toDay = endOfDay(selectedDate);
      return { from: fromDay.toISOString(), to: toDay.toISOString() };
    }
    const fromMonth = startOfMonth(selectedDate);
    const toMonth = endOfMonth(selectedDate);
    return { from: fromMonth.toISOString(), to: toMonth.toISOString() };
  }, [selectedDate, view, visibleRange?.start, visibleRange?.end]);

  const { events: apptEvents, loading, error } = useAppointments({
    from: dateRange.from,
    to: dateRange.to,
  });

  // Consolidated events with fallback to appointments
  React.useEffect(() => {
    const controller = new AbortController();
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (dateRange.from) params.set('from', dateRange.from);
        if (dateRange.to) params.set('to', dateRange.to);
        params.set('_t', String(Date.now()));
        const res = await fetch(`/api/calendar/events?${params.toString()}`, { signal: controller.signal, cache: 'no-store' });
        if (!res.ok) { setCombinedEvents(apptEvents || []); return; }
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data?.events) ? data.events : [];
        setCombinedEvents(list.length > 0 ? list : (apptEvents || []));
      } catch {
        toast.error('Failed to refresh calendar events; showing appointments only');
        setCombinedEvents(apptEvents || []);
      }
    }, 200);
    return () => { controller.abort(); if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [dateRange.from, dateRange.to, apptEvents]);

  // Live refresh on calendar:changed (no-store + cache-buster)
  React.useEffect(() => {
    const handler = () => {
      const params = new URLSearchParams();
      if (dateRange.from) params.set('from', dateRange.from);
      if (dateRange.to) params.set('to', dateRange.to);
      params.set('_t', String(Date.now()));
      fetch(`/api/calendar/events?${params.toString()}`, { cache: 'no-store' })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => {
          const list = Array.isArray(data?.events) ? data.events : [];
          setCombinedEvents(list.length > 0 ? list : (apptEvents || []));
        })
        .catch(() => setCombinedEvents(apptEvents || []));
    }
    window.addEventListener('calendar:changed', handler);
    return () => window.removeEventListener('calendar:changed', handler);
  }, [dateRange.from, dateRange.to, apptEvents]);

  // Get events for selected date (used in potential side panels)
  const eventsForDate = React.useMemo(() => {
    return combinedEvents
      .filter(ev => (showAppointments ? true : ev.source_type !== 'appointment'))
      .filter(ev => (showFinancials ? true : (ev.source_type !== 'payment_schedule' && ev.source_type !== 'recurring_revenue')))
      .filter(event => isSameDay(parseISO(event.start_at_utc), selectedDate));
  }, [combinedEvents, selectedDate, showAppointments, showFinancials]);

  // Toolbar handlers

  function handleRangeChange(newRange: DateRange | undefined) {
    setRange(newRange);
    if (newRange?.from && newRange?.to) {
      setVisibleRange({ start: newRange.from.toISOString(), end: newRange.to.toISOString() });
      // Keep month label coherent with picked range
      setSelectedDate(newRange.from);
    } else {
      setVisibleRange(undefined);
    }
  }

  // Helper to render event badge (kept for future use)
  const renderEventBadge = (event: CalendarEvent) => (
    <Badge key={event.id} variant="secondary" className="text-xs truncate">
      {format(parseISO(event.start_at_utc), 'HH:mm')} {event.title}
    </Badge>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant={view === "month" ? "default" : "outline"} onClick={() => setView("month")}>
            Month
          </Button>
          <Button variant={view === "week" ? "default" : "outline"} onClick={() => setView("week")}>
            Week
          </Button>
          <Button variant={view === "day" ? "default" : "outline"} onClick={() => setView("day")}>
            Day
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={showAppointments?"default":"outline"} onClick={()=>setShowAppointments(s=>!s)}>Meetings</Button>
          <Button variant={showFinancials?"default":"outline"} onClick={()=>setShowFinancials(s=>!s)}>Financials</Button>
        </div>
        <DateRangePicker value={range} onChange={handleRangeChange} />
      </div>
      {/* Custom datetime inputs removed in favor of single DateRangePicker */}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Appointments — {format(selectedDate, 'MMMM yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <>
              <CalendarShell 
                view={view}
                events={combinedEvents
                  .filter(ev => (showAppointments ? true : ev.source_type !== 'appointment'))
                  .filter(ev => (showFinancials ? true : (ev.source_type !== 'payment_schedule' && ev.source_type !== 'recurring_revenue')))
                }
                visibleRange={visibleRange}
                onReady={(api) => { calendarApiRef.current = api; }}
                onRangeChange={(from, to) => {
                  // range changes handled via datesSet; fetch effect already watches dateRange
                }}
                onEventClick={(ev) => { setActiveEvent(ev); setDrawerOpen(true); }}
              />
              <EventDetailsDrawer open={drawerOpen} onOpenChange={setDrawerOpen} event={activeEvent} />
            </>
          )}
        </CardContent>
      </Card>
      <SpeedDialNewSession />
    </div>
  );
}
