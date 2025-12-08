export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'disqualified' | 'converted';

export interface Lead {
  id: string;
  leadNumber: string;
  /**
   * Subject link used for cross-entity notes and lifecycle.
   * When null, the lead is not yet attached to a subject.
   */
  subjectId: string | null;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  value: number;
  status: LeadStatus;
  date: string;
  /**
   * Last updated timestamp from the backend (leads.updated_at).
   * Falls back to `date` when the API does not project updated_at.
   */
  updatedAt: string;
  source: string;
}

export interface LeadFilters {
  status: LeadStatus | 'all';
  search: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
} 
