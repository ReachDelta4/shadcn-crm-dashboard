export type CanonicalLeadStatus = 'new' | 'contacted' | 'qualified' | 'demo_appointment' | 'proposal_negotiation' | 'invoice_sent' | 'won' | 'lost';
export type LegacyLeadStatus = 'unqualified' | 'converted';
export type LeadStatus = CanonicalLeadStatus | LegacyLeadStatus;

export interface Lead {
  id: string;
  leadNumber: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  value: number;
  status: LeadStatus;
  date: string;
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