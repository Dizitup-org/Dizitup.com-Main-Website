import { supabase } from './supabaseClient';
import type { BookingRow, QueryClientRow, OnboardClientRow, ProjectRow, SaleRow } from '../types';

// ============ ADMIN SALES (Direct sales entries) ============

export interface AdminSaleEntry {
  id?: string;
  client_name: string;
  service: string;
  amount: number;
  type: 'Retainer' | 'One-time' | 'Consulting';
  status: 'Paid' | 'Pending';
  sale_date: string;
  notes?: string;
  created_at?: string;
}

export async function getAdminSales(): Promise<{ data: AdminSaleEntry[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('admin_sales')
      .select('*')
      .order('sale_date', { ascending: false });

    if (error) throw error;
    return { data: data as AdminSaleEntry[], error: null };
  } catch (err: any) {
    console.error('[getAdminSales] Error:', err);
    return { data: null, error: err.message || 'Failed to fetch sales' };
  }
}

export async function addAdminSale(sale: Omit<AdminSaleEntry, 'id' | 'created_at'>): Promise<{ data: AdminSaleEntry | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('admin_sales')
      .insert(sale)
      .select()
      .single();

    if (error) throw error;
    return { data: data as AdminSaleEntry, error: null };
  } catch (err: any) {
    console.error('[addAdminSale] Error:', err);
    return { data: null, error: err.message || 'Failed to add sale' };
  }
}

export async function updateAdminSale(id: string, updates: Partial<AdminSaleEntry>): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('admin_sales')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('[updateAdminSale] Error:', err);
    return { error: err.message || 'Failed to update sale' };
  }
}

export async function deleteAdminSale(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('admin_sales')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('[deleteAdminSale] Error:', err);
    return { error: err.message || 'Failed to delete sale' };
  }
}

// ============ BOOKINGS (Queries/Upcoming Meetings) ============

export async function getBookings(): Promise<{ data: BookingRow[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, name, email, phone, project_type, notes, meeting_date, meeting_time, status, created_at')
      .order('meeting_date', { ascending: true });

    if (error) throw error;
    return { data: data as BookingRow[], error: null };
  } catch (err: any) {
    console.error('[getBookings] Error:', err);
    return { data: null, error: err.message || 'Failed to fetch bookings' };
  }
}

export async function updateBookingStatus(id: string, status: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('[updateBookingStatus] Error:', err);
    return { error: err.message || 'Failed to update status' };
  }
}

export async function deleteBooking(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('[deleteBooking] Error:', err);
    return { error: err.message || 'Failed to delete booking' };
  }
}

// ============ QUERY CLIENTS (Follow-ups) ============

export async function getQueryClients(): Promise<{ data: QueryClientRow[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('query_clients')
      .select('id, name, email, phone, follow_up_date, status, created_at')
      .order('follow_up_date', { ascending: true });

    if (error) throw error;
    return { data: data as QueryClientRow[], error: null };
  } catch (err: any) {
    console.error('[getQueryClients] Error:', err);
    return { data: null, error: err.message || 'Failed to fetch query clients' };
  }
}

// ============ ONBOARD CLIENTS (Active Clients) ============

export async function getOnboardClients(): Promise<{ data: OnboardClientRow[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('onboard_clients')
      .select('id, company_name, contact_name, email, phone, onboarded_at, status')
      .order('onboarded_at', { ascending: false });

    if (error) throw error;
    return { data: data as OnboardClientRow[], error: null };
  } catch (err: any) {
    console.error('[getOnboardClients] Error:', err);
    return { data: null, error: err.message || 'Failed to fetch onboard clients' };
  }
}

export async function getOnboardClientById(clientId: string): Promise<{ data: OnboardClientRow | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('onboard_clients')
      .select('id, company_name, contact_name, email, phone, onboarded_at, status')
      .eq('id', clientId)
      .single();

    if (error) throw error;
    return { data: data as OnboardClientRow, error: null };
  } catch (err: any) {
    console.error('[getOnboardClientById] Error:', err);
    return { data: null, error: err.message || 'Failed to fetch client' };
  }
}

// ============ PROJECTS (Linked to onboard_clients via client_id) ============

export async function getClientProjects(clientId: string): Promise<{ data: ProjectRow[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, client_id, title, description, status, start_date, end_date, total_amount')
      .eq('client_id', clientId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return { data: data as ProjectRow[], error: null };
  } catch (err: any) {
    console.error('[getClientProjects] Error:', err);
    return { data: null, error: err.message || 'Failed to fetch projects' };
  }
}

// ============ SALES (Linked to projects via project_id) ============

export async function getProjectSales(projectId: string): Promise<{ data: SaleRow[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('id, project_id, amount, paid_amount, pending_amount, expenses, payment_date, payment_method, notes')
      .eq('project_id', projectId);

    if (error) throw error;
    return { data: data as SaleRow[], error: null };
  } catch (err: any) {
    console.error('[getProjectSales] Error:', err);
    return { data: null, error: err.message || 'Failed to fetch sales' };
  }
}

// Get projects with sales for a client (combined fetch)
export async function getClientProjectsWithSales(clientId: string): Promise<{ data: ProjectRow[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        client_id,
        title,
        description,
        status,
        start_date,
        end_date,
        total_amount,
        sales (
          id,
          project_id,
          amount,
          paid_amount,
          pending_amount,
          expenses,
          payment_date,
          payment_method,
          notes
        )
      `)
      .eq('client_id', clientId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return { data: data as ProjectRow[], error: null };
  } catch (err: any) {
    console.error('[getClientProjectsWithSales] Error:', err);
    return { data: null, error: err.message || 'Failed to fetch projects with sales' };
  }
}
