"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { CalendarEvent } from "@/features/calendar/lib/normalize";

// FullCalendar needs to be imported dynamically to avoid SSR issues
const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false }) as any;
const dayGridPlugin = dynamic(() => import("@fullcalendar/daygrid"), { ssr: false }) as any;
const timeGridPlugin = dynamic(() => import("@fullcalendar/timegrid"), { ssr: false }) as any;
const interactionPlugin = dynamic(() => import("@fullcalendar/interaction"), { ssr: false }) as any;

interface CalendarShellProps {
	view: "month" | "week" | "day";
	events: CalendarEvent[];
	onRangeChange?: (fromIso: string, toIso: string) => void;
}

/**
 * CalendarShell wraps FullCalendar with our defaults and a simple API.
 */
export function CalendarShell({ view, events, onRangeChange }: CalendarShellProps) {
	const ref = React.useRef<any>(null);

	// Map our events to FullCalendar event objects
	const fcEvents = React.useMemo(() => {
		return (events || []).map(ev => ({
			id: ev.id,
			title: ev.title,
			start: ev.start_at_utc,
			end: ev.end_at_utc,
			allDay: false,
			classNames: [classForSource(ev.source_type)],
			extendedProps: { ...ev },
		}));
	}, [events]);

	// Translate our view prop to FullCalendar view id
	const fcView = view === "month" ? "dayGridMonth" : view === "week" ? "timeGridWeek" : "timeGridDay";

	// Maintain view when prop changes
	React.useEffect(() => {
		const api = ref.current?.getApi?.();
		if (api && api.view?.type !== fcView) api.changeView(fcView);
	}, [fcView]);

	return (
		<div className="rounded-lg border bg-card p-2">
			{/* FullCalendar internal CSS (scoped via classes) comes from the package */}
			<FullCalendar
				ref={ref}
				plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
				initialView={fcView}
				height="auto"
				timeZone="local"
				headerToolbar={false}
				weekends={true}
				nowIndicator={true}
				events={fcEvents}
				eventTimeFormat={{ hour: '2-digit', minute: '2-digit', meridiem: false }}
				eventClassNames={(arg: any) => (arg.event.extendedProps?.source_type ? [classForSource(arg.event.extendedProps.source_type)] : [])}
				stickyHeaderDates={true}
				datesSet={(arg: any) => {
					const start = arg.start?.toISOString?.();
					const end = arg.end?.toISOString?.();
					if (start && end) onRangeChange?.(start, end);
				}}
			/>
		</div>
	);
}

function classForSource(source: string): string {
	switch (source) {
		case 'appointment': return 'fc-ev-appointment';
		case 'payment_schedule': return 'fc-ev-payment';
		case 'recurring_revenue': return 'fc-ev-recurring';
		default: return 'fc-ev-default';
	}
}
