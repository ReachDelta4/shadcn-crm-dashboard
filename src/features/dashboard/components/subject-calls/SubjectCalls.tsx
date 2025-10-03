"use client";

import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarDays, Clock, PhoneCall, FileText, ExternalLink } from 'lucide-react';
import { useSubjectSessions, type SubjectSessionFilters } from '../../hooks/use-subject-sessions';
import { DatePickerWithRange } from '@/components/shared/date-picker-with-range';

interface SubjectCallsProps {
	subjectId: string;
	subjectName: string;
	subjectType: 'lead' | 'customer';
}

export function SubjectCalls({ subjectId, subjectName, subjectType }: SubjectCallsProps) {
	const router = useRouter();
	const [page, setPage] = useState(1);
	const [filters, setFilters] = useState<SubjectSessionFilters>({});
	const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

	const { sessions, total, loading, error, refetch } = useSubjectSessions(
		subjectId,
		{
			...filters,
			dateFrom: dateRange?.from?.toISOString(),
			dateTo: dateRange?.to?.toISOString()
		},
		page,
		10
	);

	const handleDateRangeChange = (range?: DateRange) => {
		setDateRange(range);
		setPage(1); // Reset to first page when filtering
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	const formatTime = (dateString: string) => {
		return new Date(dateString).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const formatDuration = (seconds: number | undefined | null) => {
		if (!seconds) return 'Unknown';
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}m ${remainingSeconds}s`;
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<PhoneCall className="w-5 h-5" />
						Calls with {subjectName}
					</CardTitle>
					<Badge variant={subjectType === 'lead' ? 'default' : 'secondary'}>
						{total} {total === 1 ? 'call' : 'calls'}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Filters */}
				<div className="flex items-center gap-4">
									<div className="flex items-center gap-2">
					<CalendarDays className="w-4 h-4 text-muted-foreground" />
					<DatePickerWithRange
						value={dateRange}
						onChange={handleDateRangeChange}
					/>
				</div>
										{(dateRange?.from || dateRange?.to) && (
						<Button 
							variant="outline" 
							size="sm"
							onClick={() => {
							setDateRange(undefined);
							setPage(1);
						}}
						>
							Clear
						</Button>
					)}
				</div>

				{/* Sessions Table */}
				{loading && (
					<div className="text-center py-8 text-muted-foreground">
						Loading sessions...
					</div>
				)}

				{error && (
					<div className="text-center py-8">
						<p className="text-destructive mb-2">{error}</p>
						<Button variant="outline" onClick={refetch}>
							Retry
						</Button>
					</div>
				)}

				{!loading && !error && sessions.length === 0 && (
					<div className="text-center py-8 text-muted-foreground">
						<PhoneCall className="w-8 h-8 mx-auto mb-2 opacity-50" />
						<p>No calls found</p>
						{dateRange?.from || dateRange?.to ? (
							<p className="text-sm">Try adjusting the date range</p>
						) : (
							<p className="text-sm">No calls have been made with this {subjectType} yet</p>
						)}
					</div>
				)}

				{!loading && !error && sessions.length > 0 && (
					<>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Date & Time</TableHead>
									<TableHead>Title</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Duration</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="w-24">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{sessions.map((session) => (
									<TableRow key={session.id}>
										<TableCell>
											<div>
												<div className="font-medium">
													{formatDate(session.started_at)}
												</div>
												<div className="text-sm text-muted-foreground">
													{formatTime(session.started_at)}
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className="max-w-[200px] truncate" title={session.title}>
												{session.title}
											</div>
										</TableCell>
										<TableCell>
											<Badge variant="outline">
												{session.type}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-1 text-sm">
												<Clock className="w-3 h-3" />
												{formatDuration(session.duration)}
											</div>
										</TableCell>
										<TableCell>
											<Badge 
												variant={session.status === 'active' ? 'default' : 'secondary'}
											>
												{session.status}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-1">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => router.push(`/dashboard/sessions/${session.id}`)}
													title="View session details"
												>
													<ExternalLink className="w-3 h-3" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>

						{/* Pagination */}
						{total > 10 && (
							<div className="flex items-center justify-between">
								<div className="text-sm text-muted-foreground">
									Showing {((page - 1) * 10) + 1}-{Math.min(page * 10, total)} of {total} calls
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										disabled={page <= 1}
										onClick={() => setPage(page - 1)}
									>
										Previous
									</Button>
									<span className="text-sm">
										Page {page} of {Math.ceil(total / 10)}
									</span>
									<Button
										variant="outline"
										size="sm"
										disabled={page >= Math.ceil(total / 10)}
										onClick={() => setPage(page + 1)}
									>
										Next
									</Button>
								</div>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}
