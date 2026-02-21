import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { getBookings, updateBookingStatus, deleteBooking, getQueryClients, getOnboardClients } from '../utils/clientsApi';
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

  // ============ FETCH FUNCTIONS ============

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    setBookingsError(null);
    const { data, error } = await getBookings();
    if (error) {
      setBookingsError(error);
      setBookings([]);
    } else {
      setBookings(data || []);
    }
    setBookingsLoading(false);
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

  const refreshAll = useCallback(() => {
    fetchBookings();
    fetchQueryClients();
    fetchOnboardClients();
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
    const { error } = await updateBookingStatus(booking.id, 'accepted');
    if (error) {
      toast.error(error);
    } else {
      toast.success('Booking Accepted');
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: 'accepted' } : b)));
    }
    setActionLoading(null);
  };

  const handleFollowUpBooking = async (booking: BookingRow) => {
    setActionLoading(booking.id);
    const { error } = await updateBookingStatus(booking.id, 'follow_up');
    if (error) {
      toast.error(error);
    } else {
      toast.success('Marked as Follow-up');
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: 'follow_up' } : b)));
    }
    setActionLoading(null);
  };

  const handleDeleteBooking = async (booking: BookingRow) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    setActionLoading(booking.id);
    const { error } = await deleteBooking(booking.id);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Booking Deleted');
      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
    }
    setActionLoading(null);
  };

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
    const statusMap: Record<string, { bg: string; border: string; text: string }> = {
      pending: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
      follow_up: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' },
      accepted: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
      cancelled: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
      Active: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
      Paused: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' },
      Completed: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
    };
    const s = statusMap[status || ''] || { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/60' };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.border} ${s.text}`}>
        {status || 'Unknown'}
      </span>
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
              className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/5 transition-all"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-white/60" />
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
                        className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl hover:bg-white/[0.04] transition-all group"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-bold text-sm shadow-lg shadow-red-600/20">
                              {(booking.name || 'U')[0].toUpperCase()}
                            </div>
                            <div className="space-y-1">
                              <h3 className="font-semibold text-white">{booking.name || 'Unknown'}</h3>
                              <p className="text-sm text-white/50">{booking.email || 'No email'}</p>
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
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold hover:bg-green-500/20 transition-all disabled:opacity-50"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Accept
                              </button>
                              <button
                                onClick={() => handleFollowUpBooking(booking)}
                                disabled={actionLoading === booking.id}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold hover:bg-yellow-500/20 transition-all disabled:opacity-50"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                                Follow-up
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
                          <th className="px-6 py-4 font-semibold">Next Follow-up</th>
                          <th className="px-6 py-4 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(paginatedData as QueryClientRow[]).map((client) => (
                          <tr key={client.id} className="hover:bg-white/[0.03] transition-all">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-600 to-orange-700 flex items-center justify-center font-bold text-xs">
                                  {(client.name || 'Q')[0].toUpperCase()}
                                </div>
                                <span className="font-medium text-white">{client.name || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-white/70">{client.email || '—'}</td>
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
                                  {(client.company_name || 'C')[0].toUpperCase()}
                                </div>
                                <span className="font-medium text-white group-hover:text-red-400 transition-colors">
                                  {client.company_name || 'Unknown'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-white/70">{client.contact_name || '—'}</td>
                            <td className="px-6 py-4 text-white/70">{client.email || '—'}</td>
                            <td className="px-6 py-4 text-white/70">{client.phone || '—'}</td>
                            <td className="px-6 py-4 text-white/70">
                              {client.onboarded_at ? new Date(client.onboarded_at).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-6 py-4">{getStatusBadge(client.status)}</td>
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
