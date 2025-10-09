export type CustomerStatus = 'active' | 'inactive' | 'pending' | 'churned';

export interface Customer {
  id: string;
  customerNumber: string;
  fullName: string;
  email: string;
  phone?: string;
  company: string;
  location: string;
  status: CustomerStatus;
  dateJoined: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFilters {
  status: CustomerStatus | 'all';
  search: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
} 