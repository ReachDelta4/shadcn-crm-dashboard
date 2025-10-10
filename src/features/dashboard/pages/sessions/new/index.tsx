"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, User, Building } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Subject {
	subject_id: string;
	type: 'lead' | 'customer';
	name: string;
	company: string;
	status: string;
	email?: string;
	created_at: string;
}

interface CreateLeadData {
    full_name: string;
    company: string;
    email?: string;
    phone?: string;
}

export function NewSessionPage() {
	const router = useRouter();
	const [modalOpen, setModalOpen] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
	const [showCreateLead, setShowCreateLead] = useState(false);
    const [createLeadData, setCreateLeadData] = useState<CreateLeadData>({ full_name: '', company: '', email: '', phone: '' });
	const [loading, setLoading] = useState(false);
	const [searchLoading, setSearchLoading] = useState(false);
	const [error, setError] = useState<string>('');

	const searchSubjects = useCallback(async (query: string) => {
		setSearchLoading(true);
		setError('');
		try {
			const params = new URLSearchParams();
			if (query) params.append('q', query);
			params.append('limit', '10');

			const response = await fetch(`/api/subjects/search?${params}`);
			if (!response.ok) {
				throw new Error('Failed to search subjects');
			}

			const data = await response.json();
			setSubjects(data.subjects || []);
		} catch (err) {
			console.error('Search error:', err);
			setError('Failed to search subjects');
		} finally {
			setSearchLoading(false);
		}
	}, []);

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			searchSubjects(searchQuery);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [searchQuery, searchSubjects]);

	const handleStartSession = async () => {
		if (!selectedSubject && !showCreateLead) {
			setError('Please select a subject or create a new lead');
			return;
		}

		setLoading(true);
		setError('');

		try {
			const payload = selectedSubject 
				? { subject_id: selectedSubject.subject_id }
				: { create_lead: createLeadData };

			const response = await fetch('/api/sessions/listen/start', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to start session');
			}

			const sessionData = await response.json();
			router.push(`/dashboard/sessions/${sessionData.session_id}`);
		} catch (err: any) {
			console.error('Start session error:', err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleSubjectSelect = (subject: Subject) => {
		setSelectedSubject(subject);
		setShowCreateLead(false);
		setError('');
	};

	const handleCreateLeadToggle = () => {
		setShowCreateLead(!showCreateLead);
		setSelectedSubject(null);
		setError('');
	};

	const handleCreateLeadChange = (field: keyof CreateLeadData, value: string) => {
		setCreateLeadData(prev => ({ ...prev, [field]: value }));
	};

	const canStartSession = selectedSubject || (showCreateLead && createLeadData.full_name.trim() && createLeadData.company.trim());

	if (!modalOpen) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<Card className="w-full max-w-md">
					<CardContent className="pt-6 text-center">
						<p className="text-muted-foreground mb-4">You need to select who this call is with</p>
						<Button onClick={() => setModalOpen(true)}>
							Select Subject
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<>
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold">New Listen Session</h1>
					<p className="text-muted-foreground">Choose who this call is with to get started</p>
				</div>
			</div>

			<Dialog open={modalOpen} onOpenChange={(open) => {
				if (!open) {
					setModalOpen(false);
					router.push('/dashboard/sessions');
				}
			}}>
				<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Who is this call with?</DialogTitle>
					</DialogHeader>

					<div className="space-y-4">
						{/* Search */}
						<div className="relative">
							<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search by name, company, or email..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>

						{/* Create New Lead Toggle */}
						<div className="flex justify-between items-center">
							<span className="text-sm text-muted-foreground">
								{subjects.length} subjects found
							</span>
							<Button
								variant={showCreateLead ? "default" : "outline"}
								size="sm"
								onClick={handleCreateLeadToggle}
							>
								<Plus className="w-4 h-4 mr-2" />
								Create New Lead
							</Button>
						</div>

						{/* Create Lead Form */}
						{showCreateLead && (
							<Card className="border-2 border-primary">
								<CardHeader>
									<CardTitle className="text-lg">Create New Lead</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<Label htmlFor="full_name">Full Name *</Label>
										<Input
											id="full_name"
											value={createLeadData.full_name}
											onChange={(e) => handleCreateLeadChange('full_name', e.target.value)}
											placeholder="Enter full name"
										/>
									</div>
                                    <div>
										<Label htmlFor="email">Email (optional)</Label>
										<Input
											id="email"
											value={createLeadData.email || ''}
											onChange={(e) => handleCreateLeadChange('email', e.target.value)}
											placeholder="Enter email (optional)"
										/>
									</div>
                                    <div>
                                        <Label htmlFor="phone">Phone (optional)</Label>
                                        <Input
                                            id="phone"
                                            value={createLeadData.phone || ''}
                                            onChange={(e) => handleCreateLeadChange('phone', e.target.value)}
                                            placeholder="Enter phone (optional)"
                                        />
                                    </div>
									<div>
										<Label htmlFor="company">Company *</Label>
										<Input
											id="company"
											value={createLeadData.company}
											onChange={(e) => handleCreateLeadChange('company', e.target.value)}
											placeholder="Enter company name"
										/>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Subject Results */}
						{!showCreateLead && (
							<div className="space-y-2 max-h-[300px] overflow-y-auto">
								{searchLoading && (
									<div className="text-center py-4 text-muted-foreground">
										Searching...
									</div>
								)}
								
								{!searchLoading && subjects.length === 0 && (
									<div className="text-center py-8 text-muted-foreground">
										<User className="w-8 h-8 mx-auto mb-2 opacity-50" />
										<p>No subjects found</p>
										<p className="text-sm">Try searching or create a new lead</p>
									</div>
								)}

								{!searchLoading && subjects.map((subject) => (
									<div
										key={subject.subject_id}
										onClick={() => handleSubjectSelect(subject)}
										className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted ${
											selectedSubject?.subject_id === subject.subject_id 
												? 'border-primary bg-primary/5' 
												: 'border-border'
										}`}
									>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													<span className="font-medium">{subject.name}</span>
													<Badge variant={subject.type === 'lead' ? 'default' : 'secondary'}>
														{subject.type}
													</Badge>
													<Badge variant="outline" className="text-xs">
														{subject.status}
													</Badge>
												</div>
												<div className="flex items-center gap-1 text-sm text-muted-foreground">
													<Building className="w-3 h-3" />
													<span>{subject.company}</span>
												</div>
												{subject.email && (
													<div className="text-xs text-muted-foreground mt-1">
														{subject.email}
													</div>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						)}

						{/* Error Display */}
						{error && (
							<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
								<p className="text-sm text-destructive">{error}</p>
							</div>
						)}

						{/* Action Buttons */}
						<div className="flex justify-between pt-4">
							<Button 
								variant="outline" 
								onClick={() => {
									setModalOpen(false);
									router.push('/dashboard/sessions');
								}}
							>
								Cancel
							</Button>
							<Button 
								onClick={handleStartSession}
								disabled={!canStartSession || loading}
							>
								{loading ? 'Starting...' : 'Start Listen Session'}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}


