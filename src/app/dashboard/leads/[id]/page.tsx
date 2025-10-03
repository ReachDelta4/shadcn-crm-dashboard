import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { LeadsRepository } from "@/server/repositories/leads";
import { ActivityLogsRepository } from "@/server/repositories/activity-logs";
import { LeadAppointmentsRepository } from "@/server/repositories/lead-appointments";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const cookieStore = await cookies();
	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() { return cookieStore.getAll(); },
				setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
			},
		}
	);

	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return null;

	const { id } = await params;

	const leadsRepo = new LeadsRepository(supabase);
	const lead = await leadsRepo.getById(id, user.id);
	if (!lead) return <div className="p-4">Lead not found</div> as any;

	const apptRepo = new LeadAppointmentsRepository(supabase);
	const appts = await apptRepo.findByLeadId(id);

	const logsRepo = new ActivityLogsRepository(supabase);
	const logs = await logsRepo.list({ userId: user.id, page: 0, pageSize: 20, sort: 'timestamp', direction: 'desc', filters: { type: 'all' } });

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold tracking-tight">{(lead as any).full_name}</h1>
				<Link href="/dashboard/leads" className="text-sm text-muted-foreground hover:underline">Back to Leads</Link>
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				<Card className="p-4 space-y-2">
					<div className="text-sm">Email: {(lead as any).email}</div>
					<div className="text-sm">Phone: {(lead as any).phone || '—'}</div>
					<div className="text-sm">Company: {(lead as any).company || '—'}</div>
					<div className="text-sm">Potential Value: ${(lead as any).value?.toLocaleString?.() || 0}</div>
					<div className="text-sm">Status: <Badge>{(lead as any).status}</Badge></div>
				</Card>
				<Card className="p-4 space-y-2 lg:col-span-2">
					<div className="text-sm font-medium mb-2">Upcoming Appointments</div>
					{appts.length === 0 ? (
						<div className="text-sm text-muted-foreground">No appointments</div>
					) : (
						<div className="space-y-1 text-sm">
							{appts.map(a => (
								<div key={a.id} className="flex items-center justify-between">
									<span>{new Date(a.start_at_utc).toLocaleString()} — {new Date(a.end_at_utc).toLocaleString()}</span>
									<span className="text-muted-foreground">{a.provider}{a.meeting_link ? ` • ${a.meeting_link}` : ''}</span>
								</div>
							))}
						</div>
					)}
				</Card>
				<Card className="p-4 lg:col-span-3">
					<div className="text-sm font-medium mb-2">Recent Activity</div>
					{(logs.data || []).length === 0 ? (
						<div className="text-sm text-muted-foreground">No activity</div>
					) : (
						<div className="space-y-1 text-sm">
							{(logs.data || []).slice(0, 20).map((l: any) => (
								<div key={l.id} className="flex items-center justify-between">
									<span className="text-muted-foreground">{new Date(l.timestamp).toLocaleString()}</span>
									<span className="truncate max-w-[70%]">{l.description}</span>
								</div>
							))}
						</div>
					)}
				</Card>
			</div>
		</div>
	);
}

