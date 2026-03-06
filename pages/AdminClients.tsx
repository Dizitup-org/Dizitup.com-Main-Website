import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { getQueryClients, getOnboardClients } from '../utils/clientsApi';
import { subscribeToTable } from '../utils/realtime';
import { Loader2, PhoneCall, CheckCircle, Trash2, Users, Inbox, Search, RefreshCw, ChevronLeft, ChevronRight, Calendar, Clock, UserCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { BookingRow, QueryClientRow, OnboardClientRow } from '../types';

type TabKey = 'bookings' | 'query_clients' | 'onboarded';

const ITEMS_PER_PAGE = 10;

const AdminClients: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabKey | null;
  const [tab, setTab] = useState<TabKey>(
    tabParam === 'query_clients' ? 'query_clients' : 
    tabParam === 'onboarded' ? 'onboarded' : 'bookings'
  );

  // Bookings state (Queries/Upcoming Meetings)
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  // Query Clients state (Follow-ups)
  const [queryClients, setQueryClients] = useState<QueryClientRow[]>([]);
  const [queryClientsLoading, setQueryClientsLoading] = useState(true);
  const [queryClientsError, setQueryClientsError] = useState<string | null>(null);

  // Onboard Clients state (Active Clients)
  const [clients, setClients] = useState<OnboardClientRow[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);

  // Search & pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Loading states for actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  // Project creation state (per onboarded client)
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});
  const [projectLoading, setProjectLoading] = useState<Record<string, boolean>>({});

  // ============ FETCH FUNCTIONS ============

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    setBookingsError(null);
    
    try {
      console.log('📊 Fetching bookings from backend API...');
      const res = await fetch("http://localhost:4000/api/admin/bookings");
      const data = await res.json();
      
      console.log('✅ Bookings API Response:', data);
      
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      if (data.success && data.bookings) {
        setBookings(data.bookings);
        console.log(`📋 Loaded ${data.bookings.length} bookings successfully`);
      } else {
        throw new Error('Invalid API response format - missing bookings data');
      }
    } catch (error: any) {
      console.error('❌ Error fetching bookings:', error);
      setBookingsError(error.message || 'Failed to fetch bookings');
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  const fetchQueryClients = useCallback(async () => {
    setQueryClientsLoading(true);
    setQueryClientsError(null);
    const { data, error } = await getQueryClients();
    if (error) {
      setQueryClientsError(error);
      setQueryClients([]);
    } else {
      setQueryClients(data || []);
    }
    setQueryClientsLoading(false);
  }, []);

  const handleAddProject = useCallback(async (clientId: string, clientName: string) => {
    const project_name = projectNames[clientId]?.trim();
    if (!project_name) return;

    setProjectLoading(prev => ({ ...prev, [clientId]: true }));
    try {
      const token = localStorage.getItem('dizitup_token');
      const res = await fetch('http://localhost:4000/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ client_id: clientId, client_name: clientName, project_name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setProjectNames(prev => ({ ...prev, [clientId]: '' }));
      toast.success(`Project "${project_name}" created!`, { icon: '📁' });
    } catch (err: any) {
      console.error('Failed to create project:', err);
      toast.error(err.message || 'Failed to create project');
    } finally {
      setProjectLoading(prev => ({ ...prev, [clientId]: false }));
    }
  }, [projectNames]);

  const handleDeleteOnboardedClient = useCallback(async (clientId: string, clientName: string) => {
    if (!confirm(`Delete client "${clientName}"? This cannot be undone.`)) return;
    setActionLoading(clientId);
    try {
      const token = localStorage.getItem('dizitup_token');
      const res = await fetch(`http://localhost:4000/api/admin/clients/${clientId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setClients(prev => prev.filter(c => c.id !== clientId));
      toast.success(`Client "${clientName}" deleted`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete client');
    } finally {
      setActionLoading(null);
    }
  }, []);

  const fetchOnboardClients = useCallback(async () => {
    setClientsLoading(true);
    setClientsError(null);
    const { data, error } = await getOnboardClients();
    if (error) {
      setClientsError(error);
      setClients([]);
    } else {
      setClients(data || []);
    }
    setClientsLoading(false);
  }, []);

  const refreshAll = useCallback(async () => {
    setIsRefreshingAll(true);
    await Promise.all([
      fetchBookings(),
      fetchQueryClients(), 
      fetchOnboardClients()
    ]);
    setIsRefreshingAll(false);
  }, [fetchBookings, fetchQueryClients, fetchOnboardClients]);

  useEffect(() => {
    refreshAll();
    
    // Realtime subscriptions for auto-syncing new bookings
    const unsubBookings = subscribeToTable<BookingRow>(
      'bookings',
      (newBooking) => {
        setBookings((prev) => [newBooking, ...prev]);
        toast.success('New booking received!', { icon: '📥' });
      },
      (updatedBooking) => {
        setBookings((prev) =>
          prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
        );
      }
    );

    const unsubQueryClients = subscribeToTable<QueryClientRow>(
      'query_clients',
      (newClient) => {
        setQueryClients((prev) => [newClient, ...prev]);
        toast.success('New query client added!', { icon: '👤' });
      },
      (updatedClient) => {
        setQueryClients((prev) =>
          prev.map((c) => (c.id === updatedClient.id ? updatedClient : c))
        );
      }
    );

    const unsubOnboardClients = subscribeToTable<OnboardClientRow>(
      'onboard_clients',
      (newClient) => {
        setClients((prev) => [newClient, ...prev]);
        toast.success('New client onboarded!', { icon: '🎉' });
      },
      (updatedClient) => {
        setClients((prev) =>
          prev.map((c) => (c.id === updatedClient.id ? updatedClient : c))
        );
      }
    );

    return () => {
      unsubBookings();
      unsubQueryClients();
      unsubOnboardClients();
    };
  }, [refreshAll]);

  // Update URL when tab changes
  useEffect(() => {
    setSearchParams({ tab });
    setCurrentPage(1);
  }, [tab, setSearchParams]);

  // ============ BOOKING ACTIONS ============

  const handleAcceptBooking = async (booking: BookingRow) => {
    setActionLoading(booking.id);
    
    try {
      console.log(`📄 Accepting booking ${booking.id}...`);
      
      const res = await fetch(`http://localhost:4000/api/admin/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'accepted'
        })
      });
      
      const data = await res.json();
      console.log('✅ Accept booking API response:', data);
      
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      // Success: Update booking status in UI
      setBookings((prev) => prev.map((b) => 
        b.id === booking.id ? { ...b, status: 'accepted' } : b
      ));
      
      toast.success('Booking accepted successfully!', { icon: '✅' });
      
      // Refresh bookings list
      setTimeout(async () => {
        await fetchBookings();
      }, 500);
      
    } catch (error: any) {
      console.error('❌ Accept booking error:', error);
      toast.error(`Failed to accept booking: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFollowUpBooking = async (booking: BookingRow) => {
    setActionLoading(booking.id);
    
    try {
      console.log(`📞 Setting booking ${booking.id} for follow-up...`);
      
      const res = await fetch(`http://localhost:4000/api/admin/bookings/${booking.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'follow_up'
        })
      });
      
      const data = await res.json();
      console.log('✅ Follow-up booking API response:', data);
      
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      // Success: Remove from bookings list (moved to query_clients by backend trigger)
      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
      
      toast.success('Moved to Query Clients for follow-up', { icon: '📞' });
      
      // Immediately refetch Query Clients list
      await fetchQueryClients();
      
    } catch (error: any) {
      console.error('❌ Follow-up booking error:', error);
      toast.error(`Failed to mark for follow-up: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOnboardBooking = async (booking: BookingRow) => {
    setActionLoading(booking.id);
    
    try {
      console.log(`🎉 Onboarding booking ${booking.id}...`);
      
      const res = await fetch('http://localhost:4000/api/admin/clients/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: booking.id,
          user_id: booking.id, // Using booking.id as user_id for now
          contact_name: booking.name || 'Unknown',
          email: booking.email || '',
          phone: booking.phone || '',
          company_name: booking.agency || ''
        })
      });
      
      const data = await res.json();
      console.log('✅ Onboard client API response:', data);
      
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      // Success: Remove from bookings list (moved to onboard_clients)
      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
      
      toast.success('Client onboarded successfully!', { icon: '🎉' });
      
      // Immediately refresh onboarded clients to show the new client
      await fetchOnboardClients();
      
    } catch (error: any) {
      console.error('❌ Onboard booking error:', error);
      toast.error(`Failed to onboard client: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOnboardQueryClient = async (client: QueryClientRow) => {
    setActionLoading(client.id);
    
    try {
      console.log(`🎉 Onboarding query client ${client.id}...`);
      
      // Use booking_id if available, otherwise use client id
      const bookingId = client.booking_id || client.id;
      const res = await fetch(`http://localhost:4000/api/admin/bookings/${bookingId}/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact_name: client.name || 'Unknown',
          email: client.email || '',
          phone: client.phone || '',
          company_name: client.agency || ''
        })
      });
      
      const data = await res.json();
      console.log('✅ Onboard query client API response:', data);
      
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      // Success: Remove from query clients list
      setQueryClients((prev) => prev.filter((c) => c.id !== client.id));
      
      toast.success('Client onboarded successfully!', { icon: '🎉' });
      
      // Immediately refetch Onboarded Clients list
      await fetchOnboardClients();
      
    } catch (error: any) {
      console.error('❌ Onboard query client error:', error);
      toast.error(`Failed to onboard client: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBooking = async (booking: BookingRow) => {
    if (!confirm(`Are you sure you want to delete the booking for ${booking.name || 'this client'}?`)) return;
    
    setActionLoading(booking.id);
    
    try {
      console.log(`🗑 Deleting booking ${booking.id}...`);
      
      const res = await fetch(`http://localhost:4000/api/admin/bookings/${booking.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await res.json();
      console.log('✅ Delete booking API response:', data);
      
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      // Success: Remove from bookings list
      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
      
      toast.success('Booking deleted successfully', { icon: '🗑' });
      
    } catch (error: any) {
      console.error('❌ Delete booking error:', error);
      toast.error(`Failed to delete booking: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Update client status
  const handleUpdateClientStatus = async (clientId: string, newStatus: string) => {
    setActionLoading(clientId);
    
    try {
      console.log(`🔄 Updating client ${clientId} status to ${newStatus}...`);
      
      const res = await fetch(`http://localhost:4000/api/admin/clients/${clientId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        })
      });
      
      const data = await res.json();
      console.log('✅ Update client status API response:', data);
      
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      // Success: Update client status in UI
      setClients((prev) => prev.map((c) => 
        c.id === clientId ? { ...c, status: newStatus } : c
      ));
      
      toast.success(`Client status updated to ${newStatus}`, { icon: '✅' });
      
    } catch (error: any) {
      console.error('❌ Update client status error:', error);
      toast.error(`Failed to update status: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };
  const isClientOnboarded = useCallback((clientEmail: string, bookingId?: string) => {
    return clients.some(client => 
      client.email === clientEmail || 
      (bookingId && client.booking_id === bookingId)
    );
  }, [clients]);

  // ============ FILTERING & PAGINATION ============

  const filteredBookings = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return bookings;
    return bookings.filter(
      (b) =>
        (b.name || '').toLowerCase().includes(term) ||
        (b.email || '').toLowerCase().includes(term) ||
        (b.project_type || '').toLowerCase().includes(term)
    );
  }, [bookings, searchQuery]);

  const filteredQueryClients = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return queryClients;
    return queryClients.filter(
      (q) =>
        (q.name || '').toLowerCase().includes(term) ||
        (q.email || '').toLowerCase().includes(term)
    );
  }, [queryClients, searchQuery]);

  const filteredClients = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter(
      (c) =>
        (c.company_name || '').toLowerCase().includes(term) ||
        (c.contact_name || '').toLowerCase().includes(term) ||
        (c.email || '').toLowerCase().includes(term)
    );
  }, [clients, searchQuery]);

  const getCurrentData = () => {
    if (tab === 'bookings') return filteredBookings;
    if (tab === 'query_clients') return filteredQueryClients;
    return filteredClients;
  };

  const paginatedData = useMemo(() => {
    const data = getCurrentData();
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return data.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBookings, filteredQueryClients, filteredClients, currentPage, tab]);

  const totalPages = Math.ceil(getCurrentData().length / ITEMS_PER_PAGE);

  // ============ STATUS BADGE ============

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { bg: string; border: string; text: string; label: string }> = {
      pending: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', label: 'Pending' },
      follow_up: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', label: 'Follow-up' },
      accepted: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', label: 'Accepted' },
      cancelled: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', label: 'Cancelled' },
      active: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', label: 'Active' },
      'in-progress': { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', label: 'In Progress' },
      paused: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', label: 'Paused' },
      completed: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', label: 'Completed' },
      // Legacy uppercase versions
      Active: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', label: 'Active' },
      Paused: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', label: 'Paused' },
      Completed: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', label: 'Completed' },
    };
    
    const normalizedStatus = status?.toLowerCase();
    const s = statusMap[normalizedStatus || ''] || statusMap[status || ''] || 
              { bg: 'bg-gray-500/10', border: 'border-gray-500/20', text: 'text-gray-400', label: 'Active' };
    
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.border} ${s.text}`}>
        {s.label}
      </span>
    );
  };

  const renderStatusDropdown = (client: OnboardClientRow) => {
    const statusOptions = [
      { value: 'active', label: 'Active' },
      { value: 'in-progress', label: 'In Progress' },
      { value: 'paused', label: 'Paused' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ];
    
    const currentStatus = client.status?.toLowerCase() || 'active';
    
    return (
      <select
        value={currentStatus}
        onChange={(e) => handleUpdateClientStatus(client.id, e.target.value)}
        disabled={actionLoading === client.id}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
        onClick={(e) => e.stopPropagation()} // Prevent row click navigation
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value} className="bg-gray-900 text-white">
            {option.label}
          </option>
        ))}
      </select>
    );
  };

  // ============ ERROR/RETRY COMPONENT ============

  const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
    <div className="py-12 text-center">
      <AlertCircle className="w-12 h-12 text-red-500/50 mx-auto mb-4" />
      <p className="text-red-400 text-sm mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all"
      >
        Retry
      </button>
    </div>
  );

  return (
    <AdminLayout title="Clients Management">
      <div className="space-y-6">
        {/* Header with Tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex gap-1 p-1 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl overflow-x-auto">
            <button
              onClick={() => setTab('bookings')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                tab === 'bookings'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Bookings
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/10">{bookings.length}</span>
            </button>
            <button
              onClick={() => setTab('query_clients')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                tab === 'query_clients'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <PhoneCall className="w-4 h-4" />
              Query Clients
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/10">{queryClients.length}</span>
            </button>
            <button
              onClick={() => setTab('onboarded')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                tab === 'onboarded'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Onboarded
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/10">{clients.length}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search..."
                className="bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-red-600/50 w-64 backdrop-blur-xl transition-all"
              />
            </div>
            <button
              onClick={refreshAll}
              disabled={isRefreshingAll}
              className={`p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/5 transition-all disabled:opacity-50 ${isRefreshingAll ? 'cursor-not-allowed' : ''}`}
              title="Refresh All Data"
            >
              <RefreshCw className={`w-4 h-4 text-white/60 ${isRefreshingAll ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ============ BOOKINGS TAB (Queries/Upcoming Meetings) ============ */}
        {tab === 'bookings' && (
          <div className="space-y-4">
            {bookingsLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                <span className="ml-3 text-white/60">Loading bookings...</span>
              </div>
            )}

            {bookingsError && <ErrorState message={bookingsError} onRetry={fetchBookings} />}

            {!bookingsLoading && !bookingsError && (
              <>
                {(paginatedData as BookingRow[]).length === 0 ? (
                  <div className="py-20 text-center">
                    <Inbox className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-white/40 text-sm">No bookings found</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {(paginatedData as BookingRow[]).map((booking) => (
                      <div
                        key={booking.id}
                        className={`p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl hover:bg-white/[0.04] transition-all group ${actionLoading === booking.id ? 'opacity-60 pointer-events-none' : ''}`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-bold text-sm shadow-lg shadow-red-600/20">
                              {(booking.name || 'U')[0].toUpperCase()}
                            </div>
                            <div className="space-y-1">
                              <h3 className="font-semibold text-white">{booking.name || 'Unknown'}</h3>
                              <p className="text-sm text-white/50">{booking.email || 'No email'}</p>
                              {booking.agency && (
                                <p className="text-xs text-white/40">Agency: {booking.agency}</p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-2">
                                {getStatusBadge(booking.status)}
                                {booking.project_type && (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-white/60">
                                    {booking.project_type}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                            <div className="text-right text-sm text-white/40 lg:mr-4">
                              <p className="flex items-center gap-1 justify-end">
                                <Calendar className="w-3 h-3" />
                                {booking.meeting_date ? new Date(booking.meeting_date).toLocaleDateString() : 'No date'}
                              </p>
                              <p className="flex items-center gap-1 justify-end">
                                <Clock className="w-3 h-3" />
                                {booking.meeting_time || 'No time'}
                              </p>
                              <p>{booking.phone || 'No phone'}</p>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptBooking(booking)}
                                disabled={actionLoading === booking.id}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold hover:bg-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading === booking.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                )}
                                {actionLoading === booking.id ? 'Accepting...' : 'Accept'}
                              </button>
                              <button
                                onClick={() => handleFollowUpBooking(booking)}
                                disabled={actionLoading === booking.id}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold hover:bg-yellow-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading === booking.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <PhoneCall className="w-3.5 h-3.5" />
                                )}
                                {actionLoading === booking.id ? 'Moving...' : 'Follow-up'}
                              </button>
                              <button
                                onClick={() => handleOnboardBooking(booking)}
                                disabled={actionLoading === booking.id}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading === booking.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Users className="w-3.5 h-3.5" />
                                )}
                                {actionLoading === booking.id ? 'Onboarding...' : 'Onboard'}
                              </button>
                              <button
                                onClick={() => handleDeleteBooking(booking)}
                                disabled={actionLoading === booking.id}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-semibold hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {booking.notes && (
                          <p className="mt-4 pt-4 border-t border-white/5 text-sm text-white/50 italic">
                            "{booking.notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ============ QUERY CLIENTS TAB (Follow-ups) ============ */}
        {tab === 'query_clients' && (
          <div className="space-y-4">
            {queryClientsLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                <span className="ml-3 text-white/60">Loading query clients...</span>
              </div>
            )}

            {queryClientsError && <ErrorState message={queryClientsError} onRetry={fetchQueryClients} />}

            {!queryClientsLoading && !queryClientsError && (
              <>
                {(paginatedData as QueryClientRow[]).length === 0 ? (
                  <div className="py-20 text-center">
                    <PhoneCall className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-white/40 text-sm">No query clients found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-white/10 backdrop-blur-xl">
                    <table className="min-w-full text-sm">
                      <thead className="bg-white/[0.03]">
                        <tr className="text-left text-white/40 text-xs uppercase tracking-wider">
                          <th className="px-6 py-4 font-semibold">Client Name</th>
                          <th className="px-6 py-4 font-semibold">Email</th>
                          <th className="px-6 py-4 font-semibold">Phone</th>
                          <th className="px-6 py-4 font-semibold">Follow-up Date</th>
                          <th className="px-6 py-4 font-semibold">Status</th>
                          <th className="px-6 py-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(paginatedData as QueryClientRow[]).map((client) => (
                          <tr key={client.id} className="hover:bg-white/[0.03] transition-all">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-600 to-orange-700 flex items-center justify-center font-bold text-xs">
                                  {(client.name || 'Unknown')[0].toUpperCase()}
                                </div>
                                <span className="font-medium text-white">{client.name || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-white/70">{client.email || 'No email'}</td>
                            <td className="px-6 py-4 text-white/70">{client.phone || '—'}</td>
                            <td className="px-6 py-4">
                              {client.follow_up_date ? (
                                <span className="flex items-center gap-2 text-yellow-400">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(client.follow_up_date).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-white/40">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4">{getStatusBadge(client.status || 'pending')}</td>
                            <td className="px-6 py-4">
                              {isClientOnboarded(client.email || '', client.booking_id || client.id) ? (
                                <span className="flex items-center gap-2 text-green-400 text-xs font-semibold">
                                  <UserCheck className="w-4 h-4" />
                                  Already Onboarded
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleOnboardQueryClient(client)}
                                  disabled={actionLoading === client.id}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {actionLoading === client.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <UserCheck className="w-3.5 h-3.5" />
                                  )}
                                  {actionLoading === client.id ? 'Onboarding...' : 'Onboard'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ============ ONBOARDED CLIENTS TAB (Active Clients) ============ */}
        {tab === 'onboarded' && (
          <div className="space-y-4">
            {clientsLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                <span className="ml-3 text-white/60">Loading clients...</span>
              </div>
            )}

            {clientsError && <ErrorState message={clientsError} onRetry={fetchOnboardClients} />}

            {!clientsLoading && !clientsError && (
              <>
                {(paginatedData as OnboardClientRow[]).length === 0 ? (
                  <div className="py-20 text-center">
                    <Users className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-white/40 text-sm">No onboarded clients yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-white/10 backdrop-blur-xl">
                    <table className="min-w-full text-sm">
                      <thead className="bg-white/[0.03]">
                        <tr className="text-left text-white/40 text-xs uppercase tracking-wider">
                          <th className="px-6 py-4 font-semibold">Company Name</th>
                          <th className="px-6 py-4 font-semibold">Client Name</th>
                          <th className="px-6 py-4 font-semibold">Email</th>
                          <th className="px-6 py-4 font-semibold">Phone</th>
                          <th className="px-6 py-4 font-semibold">Onboarded Date</th>
                          <th className="px-6 py-4 font-semibold">Status</th>
                          <th className="px-6 py-4 font-semibold">Add Project</th>
                          <th className="px-6 py-4 font-semibold"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(paginatedData as OnboardClientRow[]).map((client) => (
                          <tr
                            key={client.id}
                            onClick={() => navigate(`/admin/clients/${client.id}`)}
                            className="hover:bg-white/[0.03] cursor-pointer transition-all group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-bold text-xs">
                                  {(client.company_name || 'Unknown')[0].toUpperCase()}
                                </div>
                                <span className="font-medium text-white group-hover:text-red-400 transition-colors">
                                  {client.company_name || 'Unknown'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-white/70">{client.contact_name || 'Unknown'}</td>
                            <td className="px-6 py-4 text-white/70">{client.email || 'No email'}</td>
                            <td className="px-6 py-4 text-white/70">{client.phone || '—'}</td>
                            <td className="px-6 py-4 text-white/70">
                              {client.onboarded_at ? new Date(client.onboarded_at).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              {renderStatusDropdown(client)}
                            </td>
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Project Name"
                                  value={projectNames[client.id] || ''}
                                  onChange={(e) =>
                                    setProjectNames(prev => ({ ...prev, [client.id]: e.target.value }))
                                  }
                                  onKeyDown={(e) => e.key === 'Enter' && handleAddProject(client.id, client.contact_name || client.company_name || '')}
                                  className="w-40 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder-white/30 focus:outline-none focus:border-red-600 transition-colors"
                                />
                                <button
                                  onClick={() => handleAddProject(client.id, client.contact_name || client.company_name || '')}
                                  disabled={projectLoading[client.id] || !projectNames[client.id]?.trim()}
                                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                  {projectLoading[client.id] ? 'Adding...' : 'Add Project'}
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleDeleteOnboardedClient(client.id, client.contact_name || client.company_name || 'this client')}
                                disabled={actionLoading === client.id}
                                className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                                title="Delete client"
                              >
                                {actionLoading === client.id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <Trash2 className="w-4 h-4" />}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ============ PAGINATION ============ */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/5 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-sm text-white/60">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/5 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminClients;
