"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import * as React from "react";
import { useAppointments } from "@/features/calendar/hooks/use-appointments";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, format, parseISO, isSameDay, startOfWeek, endOfWeek, addDays } from "date-fns";
import type { CalendarEvent } from "@/features/calendar/lib/normalize";
import { SpeedDialNewSession } from "./components/SpeedDialNewSession";
import { Input } from "@/components/ui/input";
import { CalendarShell } from "@/features/calendar/components/CalendarShell";

const ENABLE_EXPERIMENTAL_VIEWS = false;

export function SessionsCalendarPage() {
  const [view, setView] = React.useState<"month" | "week" | "day">("month");
  const [altView, setAltView] = React.useState<"calendar" | "kanban" | "gantt">("calendar");
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [customFrom, setCustomFrom] = React.useState<string>("");
  const [customTo, setCustomTo] = React.useState<string>("");
  const [combinedEvents, setCombinedEvents] = React.useState<CalendarEvent[]>([]);
  const debounceRef = React.useRef<number | null>(null);
  
  // Calculate date range based on current view
  const dateRange = React.useMemo(() => {
    if (customFrom && customTo) {
      return { from: new Date(customFrom).toISOString(), to: new Date(customTo).toISOString() };
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
  }, [selectedDate, view, customFrom, customTo]);

  const { events: apptEvents, loading, error } = useAppointments({
    from: dateRange.from,
    to: dateRange.to,
  });

  // Phase 2: consolidated events with fallback to appointments
  React.useEffect(() => {
    const controller = new AbortController();
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (dateRange.from) params.set('from', dateRange.from);
        if (dateRange.to) params.set('to', dateRange.to);
        const res = await fetch(`/api/calendar/events?${params.toString()}`, { signal: controller.signal });
        if (!res.ok) { setCombinedEvents(apptEvents || []); return; }
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data?.events) ? data.events : [];
        setCombinedEvents(list.length > 0 ? list : (apptEvents || []));
      } catch {
        setCombinedEvents(apptEvents || []);
      }
    }, 200);
    return () => { controller.abort(); if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [dateRange.from, dateRange.to, apptEvents]);

  // Get events for selected date
  const eventsForDate = React.useMemo(() => {
    return combinedEvents.filter(event => 
      isSameDay(parseISO(event.start_at_utc), selectedDate)
    );
  }, [combinedEvents, selectedDate]);

  // Helper to render event badge
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
          <Button 
            size="sm" 
            variant={altView === "calendar" ? "default" : "outline"} 
            onClick={() => setAltView("calendar")}
          >
            Calendar
          </Button>
          {ENABLE_EXPERIMENTAL_VIEWS && (
            <>
              <Button 
                size="sm" 
                variant={altView === "kanban" ? "default" : "outline"} 
                onClick={() => setAltView("kanban")}
              >
                Kanban
              </Button>
              <Button 
                size="sm" 
                variant={altView === "gantt" ? "default" : "outline"} 
                onClick={() => setAltView("gantt")}
              >
                Gantt
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground">Custom From</label>
          <Input type="datetime-local" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground">Custom To</label>
          <Input type="datetime-local" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
        </div>
      </div>

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
            <CalendarShell 
              view={view} 
              events={combinedEvents}
              onRangeChange={(from, to) => {
                // Optional: manually update dateRange if needed for controlled mode
              }}
            />
          )}
        </CardContent>
      </Card>
      <SpeedDialNewSession />
    </div>
  );
}
