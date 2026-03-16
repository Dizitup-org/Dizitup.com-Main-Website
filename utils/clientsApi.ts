// utils/adminApi.ts — replaces all Supabase calls
import { api } from './apiClient';
import type { BookingRow, QueryClientRow, OnboardClientRow, ProjectRow } from '../types';

const cache: Record<string, { data: any; ts: number }> = {};
const TTL = 30000;
function getCache(k: string) { const c = cache[k]; return (c && Date.now()-c.ts < TTL) ? c.data : null; }
function setCache(k: string, d: any) { cache[k] = { data: d, ts: Date.now() }; }
function clearCache(p: string) { Object.keys(cache).forEach(k => { if (k.startsWith(p)) delete cache[k]; }); }

// ============ BOOKINGS ============
export async function getBookings() {
  const cached = getCache('bookings_all');
  if (cached) return { data: cached, error: null };
  try {
    const res = await api.get('/api/admin/bookings') as any;
    setCache('bookings_all', res.bookings);
    return { data: res.bookings, error: null };
  } catch (err: any) { return { data: null, error: err.message }; }
}

export async function updateBookingStatus(id: string, status: string) {
  try {
    await api.patch(`/api/admin/bookings/${id}/status`, { status });
    clearCache('bookings'); 
    clearCache('query_clients');
    clearCache('onboard_clients');
    return { error: null };
  } catch (err: any) { return { error: err.message }; }
}

export async function deleteBooking(id: string) {
  try {
    await api.delete(`/api/admin/bookings/${id}`);
    clearCache('bookings');
    return { error: null };
  } catch (err: any) { return { error: err.message }; }
}

export async function onboardFromBooking(bookingId: string, data: { company_name?: string; contact_name: string; email: string; phone?: string }) {
  try {
    await api.post(`/api/admin/bookings/${bookingId}/onboard`, data);
    clearCache('bookings'); clearCache('onboard');
    return { error: null };
  } catch (err: any) { return { error: err.message }; }
}

// ============ QUERY CLIENTS ============
export async function getQueryClients() {
  const cached = getCache('query_clients_all');
  if (cached) return { data: cached, error: null };
  try {
    const res = await api.get('/api/admin/clients/query') as any;
    setCache('query_clients_all', res.query_clients || res.clients || res.data || []);
    return { data: res.query_clients || res.clients || res.data || [], error: null };
  } catch (err: any) { return { data: null, error: err.message }; }
}

// ============ ONBOARD CLIENTS ============
export async function getOnboardClients() {
  const cached = getCache('onboard_clients_all');
  if (cached) return { data: cached, error: null };
  try {
    const res = await api.get('/api/admin/clients/onboarded') as any;
    setCache('onboard_clients_all', res.clients || res.data || []);
    return { data: res.clients || res.data || [], error: null };
  } catch (err: any) { return { data: null, error: err.message }; }
}

export async function getOnboardClientById(clientId: string) {
  try {
    const res = await api.get(`/api/admin/clients/${clientId}`) as any;
    // Backend returns { success, client, projects, totals } — unwrap into a flat object
    const data = { ...res.client, projects: res.projects ?? [], totals: res.totals ?? {} };
    return { data, error: null };
  } catch (err: any) { return { data: null, error: err.message }; }
}

// ============ PROJECTS ============
export async function addProject(clientId: string, project: { title: string; description?: string; status?: string; start_date?: string; end_date?: string; deadline?: string; total_amount: number; expenses?: number }) {
  try {
    await api.post(`/api/admin/clients/${clientId}/projects`, project);
    clearCache('onboard');
    return { error: null };
  } catch (err: any) { return { error: err.message }; }
}

// ============ PAYMENTS ============
export async function addPayment(clientId: string, projectId: string, payment: { paid_amount: number; sale_date?: string; notes?: string; pending_amount?: number; expenses?: number }) {
  try {
    await api.post(`/api/admin/clients/${clientId}/projects/${projectId}/payments`, payment);
    clearCache('onboard');
    return { error: null };
  } catch (err: any) { return { error: err.message }; }
}

export async function editPayment(clientId: string, projectId: string, paymentId: string, payment: { paid_amount?: number; sale_date?: string; notes?: string | null; pending_amount?: number; expenses?: number }) {
  try {
    await api.patch(`/api/admin/clients/${clientId}/projects/${projectId}/payments/${paymentId}`, payment);
    clearCache('onboard');
    return { error: null };
  } catch (err: any) { return { error: err.message }; }
}

// ============ OVERVIEW ============
export async function getAdminOverview() {
  try {
    const res = await api.get('/api/admin/overview') as any;
    return { data: res.data, error: null };
  } catch (err: any) { return { data: null, error: err.message }; }
}

export async function getMonthlyRevenue() {
  try {
    const res = await api.get('/api/admin/overview/monthly') as any;
    return { data: res.monthly, error: null };
  } catch (err: any) { return { data: null, error: err.message }; }
}

export async function updateClientNotes(clientId: string, data: { admin_notes?: string; feedback?: string }): Promise<{ error: string | null }> {
  try {
    await api.patch(`/api/admin/clients/${clientId}/notes`, data);
    clearCache('onboard');
    return { error: null };
  } catch (err: any) { return { error: err.message }; }
}

// ============ ADMIN SALES ============
export interface AdminSaleEntry {
  id?: string;
  project_id: string;
  client_name: string;
  service: string;
  amount: number;
  type: 'Retainer' | 'One-time' | 'Consulting';
  status: 'Paid' | 'Pending';
  sale_date: string;
  notes?: string;
  created_at?: string;
}

// Project interface for dropdown
export interface ProjectOption {
  id: string;
  client_name: string;
  title: string;
  display_name: string; // client_name + project_name
}

export async function getAdminProjects(): Promise<{ data: ProjectOption[] | null; error: string | null }> {
  try {
    const res = await api.get('/api/admin/projects') as any;
    const mapped = (res.projects ?? []).map((p: any) => ({
      id: p.id,
      client_name: p.brand_name || p.client_name || '',
      title: p.project_name || p.title || '',
      display_name: `${p.brand_name || p.client_name || 'Unknown'} — ${p.project_name || p.title || 'Unnamed'}`,
    }));
    return { data: mapped, error: null };
  } catch (err: any) { return { data: null, error: err.message }; }
}

export async function getAdminSales(): Promise<{ data: AdminSaleEntry[] | null; error: string | null }> {
  try {
    const res = await api.get('/api/admin/sales') as any;
    return { data: res.sales, error: null };
  } catch (err: any) { return { data: null, error: err.message }; }
}

export async function addAdminSale(sale: Omit<AdminSaleEntry, 'id' | 'created_at'>): Promise<{ data: AdminSaleEntry | null; error: string | null }> {
  try {
    // Backend uses client_name (DB column name)
    const res = await api.post('/api/admin/sales', sale) as any;
    // Clear sales and overview caches to ensure fresh data  
    clearCache('sales');
    clearCache('overview');
    clearCache('monthly');
    return { data: res.sale, error: null };
  } catch (err: any) { return { data: null, error: err.message }; }
}

export async function updateAdminSale(id: string, updates: Partial<AdminSaleEntry>): Promise<{ error: string | null }> {
  try {
    // Backend uses client_name (DB column name)
    await api.patch(`/api/admin/sales/${id}`, updates);
    // Clear sales and overview caches to ensure fresh data
    clearCache('sales');
    clearCache('overview');
    clearCache('monthly');
    return { error: null };
  } catch (err: any) { return { error: err.message }; }
}

export async function deleteAdminSale(id: string): Promise<{ error: string | null }> {
  try {
    await api.delete(`/api/admin/sales/${id}`);
    // Clear sales and overview caches to ensure fresh data
    clearCache('sales');
    clearCache('overview');
    clearCache('monthly');
    return { error: null };
  } catch (err: any) { return { error: err.message }; }
}

// ============ SALES DASHBOARD ENDPOINTS ============
export interface SalesOverview {
  total_revenue: number;
  monthly_revenue: number;
  active_retainers: number;
  avg_sale: number;
  total_sales_count: number;
}

export interface SalesChartPoint {
  name: string;
  revenue: number;
}

export interface SalesServiceMixItem {
  label: string;
  value: number;
}

export async function getSalesOverview(): Promise<{ data: SalesOverview | null; error: string | null }> {
  try {
    const res = await api.get('/api/admin/sales/overview') as any;
    return { data: res.overview ?? res.data ?? res, error: null };
  } catch (err: any) { return { data: null, error: err.message }; }
}

export async function getSalesChart(period: 'Weekly' | 'Monthly'): Promise<{ data: SalesChartPoint[] | null; error: string | null }> {
  try {
    const res = await api.get(`/api/admin/sales/chart?period=${period.toLowerCase()}`) as any;
    return { data: res.chart ?? res.data ?? [], error: null };
  } catch (err: any) { return { data: null, error: err.message }; }
}

export async function getSalesServiceMix(): Promise<{ data: SalesServiceMixItem[] | null; error: string | null }> {
  try {
    const res = await api.get('/api/admin/sales/service-mix') as any;
    return { data: res.service_mix ?? res.serviceMix ?? res.data ?? [], error: null };
  } catch (err: any) { return { data: null, error: err.message }; }
}