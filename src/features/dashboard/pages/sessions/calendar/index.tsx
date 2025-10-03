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

const ENABLE_EXPERIMENTAL_VIEWS = false;

export function SessionsCalendarPage() {
  const [view, setView] = React.useState<"month" | "week" | "day">("month");
  const [altView, setAltView] = React.useState<"calendar" | "kanban" | "gantt">("calendar");
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [customFrom, setCustomFrom] = React.useState<string>("");
  const [customTo, setCustomTo] = React.useState<string>("");
  
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

  const { events, loading, error } = useAppointments({
    from: dateRange.from,
    to: dateRange.to,
  });

  // Get events for selected date
  const eventsForDate = React.useMemo(() => {
    return events.filter(event => 
      isSameDay(parseISO(event.start_at_utc), selectedDate)
    );
  }, [events, selectedDate]);

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
          ) : altView === "calendar" ? (
            <div className="space-y-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
                modifiers={{
                  hasEvent: events.map(e => parseISO(e.start_at_utc))
                }}
                modifiersClassNames={{
                  hasEvent: "bg-primary/10 font-bold"
                }}
              />

              {view === "week" && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">
                    Week of {format(startOfWeek(selectedDate), 'MMM d, yyyy')}
                  </h3>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const day = startOfDay(addDays(startOfWeek(selectedDate), i))
                      const dayEvents = events.filter(e => isSameDay(parseISO(e.start_at_utc), day))
                      return (
                        <Card key={i}>
                          <CardHeader className="py-2">
                            <CardTitle className="text-sm">
                              {format(day, 'EEE, MMM d')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {dayEvents.length === 0 ? (
                              <p className="text-xs text-muted-foreground">No events</p>
                            ) : (
                              dayEvents.map(ev => (
                                <div key={ev.id} className="flex items-center justify-between gap-2 text-sm">
                                  <span className="truncate">{format(parseISO(ev.start_at_utc), 'HH:mm')} {ev.title}</span>
                                  {ev.links.meeting_link && (
                                    <Button size="sm" variant="outline" asChild>
                                      <a href={ev.links.meeting_link} target="_blank" rel="noopener noreferrer">Join</a>
                                    </Button>
                                  )}
                                </div>
                              ))
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Events list for selected date */}
              {eventsForDate.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">
                    Events on {format(selectedDate, 'MMM d, yyyy')}
                  </h3>
                  <div className="space-y-2">
                    {eventsForDate.map(event => (
                      <Card key={event.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{event.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(parseISO(event.start_at_utc), 'h:mm a')} - {format(parseISO(event.end_at_utc), 'h:mm a')}
                              </p>
                            </div>
                            {event.links.meeting_link && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={event.links.meeting_link} target="_blank" rel="noopener noreferrer">
                                  Join
                                </a>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No appointments on this date
                </p>
              )}
            </div>
          ) : altView === "kanban" ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Kanban view coming soon</p>
              <p className="text-xs mt-1">{events.length} appointments loaded</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Gantt view coming soon</p>
              <p className="text-xs mt-1">{events.length} appointments loaded</p>
            </div>
          )}
        </CardContent>
      </Card>
      <SpeedDialNewSession />
    </div>
  );
}
