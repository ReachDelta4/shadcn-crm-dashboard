"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, Phone } from "lucide-react";

interface Appointment {
	id: string;
	start_at_utc: string;
	end_at_utc: string;
	timezone: string;
	provider: string;
	meeting_link: string | null;
	lead_id: string;
}

interface UpcomingAppointmentsProps {
	subjectId: string | null;
}

export function UpcomingAppointments({ subjectId }: UpcomingAppointmentsProps) {
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!subjectId) return;
		setLoading(true);
		fetch(`/api/subjects/${subjectId}/appointments/upcoming`)
			.then(res => res.json())
			.then(data => setAppointments(data.appointments || []))
			.catch(err => console.error('Failed to load appointments:', err))
			.finally(() => setLoading(false));
	}, [subjectId]);

	if (!subjectId || loading || appointments.length === 0) return null;

	const next = appointments[0];
	const startDate = new Date(next.start_at_utc);
	const formatTime = (date: Date) => date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

	const handleStartCall = () => {
		if (next.meeting_link) window.open(next.meeting_link, '_blank');
		else alert('Start call: Wire to /api/sessions/listen/start with subject_id');
	};

	const handleDownloadICS = () => window.open(`/api/leads/${next.lead_id}/appointments/${next.id}/ics`, '_blank');

	return (
		<Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
			<CardContent className="py-3 px-4">
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<Calendar className="h-5 w-5 text-blue-600" />
						<div>
							<div className="text-sm font-medium text-blue-900 dark:text-blue-100">Next Appointment</div>
							<div className="text-xs text-blue-700 dark:text-blue-300">{formatTime(startDate)}</div>
						</div>
						<Badge variant="outline" className="ml-2">{next.provider === 'none' ? 'ICS' : next.provider}</Badge>
					</div>
					<div className="flex items-center gap-2">
						{next.meeting_link && (
							<Button size="sm" variant="default" onClick={handleStartCall}>
								<Phone className="h-4 w-4 mr-1" />
								Join
							</Button>
						)}
						<Button size="sm" variant="outline" onClick={handleDownloadICS}>
							<Download className="h-4 w-4 mr-1" />
							ICS
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
