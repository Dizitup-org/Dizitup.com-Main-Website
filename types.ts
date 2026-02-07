
export interface SaleRecord {
  id: string;
  date: string;
  clientName: string;
  service: string;
  amount: number;
  status: 'Paid' | 'Pending';
  type: 'Retainer' | 'One-time';
}

export interface MetricCard {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
}

export interface ServiceCapability {
  title: string;
  description: string;
  icon: string;
}

// ============ CLIENTS MANAGEMENT SYSTEM ============

// Bookings table (Queries/Upcoming Meetings)
export interface BookingRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  project_type: string | null;
  notes: string | null;
  meeting_date: string | null;
  meeting_time: string | null;
  status: 'pending' | 'accepted' | 'follow_up' | 'cancelled' | string | null;
  created_at?: string | null;
}

// Query Clients table (Follow-ups)
export interface QueryClientRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  follow_up_date: string | null;
  status?: string | null;
  created_at?: string | null;
}

// Onboard Clients table (Active Clients)
export interface OnboardClientRow {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  onboarded_at: string | null;
  status: 'Active' | 'Paused' | 'Completed' | string | null;
  // Additional fields for client detail page
  username?: string | null;
  avatar_url?: string | null;
  start_date?: string | null;
  admin_notes?: string | null;
  feedback?: string | null;
  created_at?: string | null;
}

// Projects table (linked to onboard_clients via client_id)
export interface ProjectRow {
  id: string;
  client_id: string;
  title: string | null;
  description: string | null;
  status: 'active' | 'completed' | 'paused' | 'cancelled' | string | null;
  start_date: string | null;
  end_date: string | null;
  deadline?: string | null;
  total_amount?: number | null;
  sales?: SaleRow[] | null;
}

// Sales table (linked to projects via project_id)
export interface SaleRow {
  id: string;
  project_id: string;
  amount: number | null;
  paid_amount: number | null;
  pending_amount: number | null;
  expenses: number | null;
  payment_date: string | null;
  payment_method: string | null;
  notes: string | null;
}

// Extended client with computed fields
export interface OnboardClientDisplayRow extends OnboardClientRow {
  projects?: ProjectRow[] | null;
  total_amount?: number;
  paid_amount?: number;
  pending_amount?: number;
}
