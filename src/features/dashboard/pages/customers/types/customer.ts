export type CustomerStatus = 'active' | 'inactive' | 'pending';

export interface Customer {
  id: string;
  customerNumber: string;
  fullName: string;
  email: string;
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