import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { Loader2, CheckCircle, PhoneCall, Users, Clock, Calendar, Trash2, Search, RefreshCw, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { BookingRow } from '../types';
import { api } from '../utils/apiClient';
import { subscribeToTable } from '../utils/realtime';

const ITEMS_PER_PAGE = 10;

type TabKey = 'pending' | 'accepted' | 'completed';

const AdminBookings: React.FC = () => {
  const navigate = useNavigate();

  // Bookings state
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [meetingDoneChecked, setMeetingDoneChecked] = useState<Set<string>>(new Set());

  // Tab state
  const [tab, setTab] = useState<TabKey>('pending');

  // Search & pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Loading states for actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  // ============ FETCH FUNCTIONS ============

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const response = await api.get<{ success: boolean; bookings: BookingRow[] }>('/api/admin/bookings');
      setBookings(response?.bookings || []);
    } catch (error: any) {
      setBookingsError(error.message || 'Failed to fetch bookings');
      setBookings([]);
    }
    setBookingsLoading(false);
  }, []);

  // ============ BOOKING ACTIONS ============

  const handleAcceptBooking = async (booking: BookingRow) => {
    setActionLoading(booking.id);
    
    try {
      const data = await api.patch<any>(`/api/admin/bookings/${booking.id}`, { status: 'accepted' });
      
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
      const data = await api.patch<any>(`/api/admin/bookings/${booking.id}/status`, { status: 'follow_up' });
      
      // Success: Remove from bookings list (moved to query_clients by backend trigger)
      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
      
      toast.success('Moved to Query Clients for follow-up', { icon: '📞' });
      
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
      const data = await api.post<any>('/api/admin/clients/onboard', {
        booking_id: booking.id,
        user_id: booking.user_id,
        contact_name: booking.name || 'Unknown',
        email: booking.email || '',
        phone: booking.phone || '',
        company_name: booking.agency || ''
      });
      
      // Success: Remove from bookings list (moved to onboard_clients)
      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
      
      toast.success('Client onboarded successfully!', { icon: '🎉' });
      
    } catch (error: any) {
      console.error('❌ Onboard booking error:', error);
      toast.error(`Failed to onboard client: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMeetingDone = async (booking: BookingRow) => {
    setActionLoading(booking.id);
    try {
      await api.patch(`/api/admin/bookings/${booking.id}/status`, { status: 'meeting_done' });
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'meeting_done' } : b));
      // Add booking ID to meetingDoneChecked set
      setMeetingDoneChecked(prev => new Set(prev).add(booking.id));
      toast.success('Marked as meeting done', { icon: '✅' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineBooking = async (booking: BookingRow) => {
    if (!confirm(`Are you sure you want to decline the booking for ${booking.name || 'this client'}?`)) return;
    
    setActionLoading(booking.id);
    
    try {
      const data = await api.patch<any>(`/api/admin/bookings/${booking.id}`, { status: 'declined' });
      
      // Success: Update booking status in UI
      setBookings((prev) => prev.map((b) => 
        b.id === booking.id ? { ...b, status: 'declined' } : b
      ));
      
      toast.success('Booking declined successfully!', { icon: '❌' });
      
      // Refresh bookings list
      setTimeout(async () => {
        await fetchBookings();
      }, 500);
      
    } catch (error: any) {
      console.error('❌ Decline booking error:', error);
      toast.error(`Failed to decline booking: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBooking = async (booking: BookingRow) => {
    if (!confirm(`Are you sure you want to delete the booking for ${booking.name || 'this client'}?`)) return;
    
    setActionLoading(booking.id);
    
    try {
      await api.delete(`/api/admin/bookings/${booking.id}`);
      
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

  // ============ FILTERING & PAGINATION ============

  const filteredBookings = useMemo(() => {
    let result = bookings;

    // Exclude onboarded clients and clients already in follow-up (query_clients)
    result = result.filter(b => !b.is_onboarded && !b.has_follow_up);

    // Filter by tab status
    if (tab === 'pending') {
      result = result.filter(b => b.status === 'pending');
    } else if (tab === 'accepted') {
      result = result.filter(b => b.status === 'accepted');
    } else if (tab === 'completed') {
      result = result.filter(b => b.status === 'meeting_done');
    }

    // Filter by search query
    const term = searchQuery.trim().toLowerCase();
    if (!term) return result;

    return result.filter(
      (b) =>
        (b.name || '').toLowerCase().includes(term) ||
        (b.email || '').toLowerCase().includes(term) ||
        (b.project_type || '').toLowerCase().includes(term)
    );
  }, [bookings, searchQuery, tab]);

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  // ============ STATUS BADGE ============

  const getStatusBadge = (status?: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Pending' },
      accepted: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Accepted' },
      confirmed: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Confirmed' },
      meeting_done: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', label: 'Meeting Done' },
      follow_up: { bg: 'bg-orange-500/10', text: 'text-orange-400', label: 'Follow-up' },
      declined: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Declined' },
      rejected: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Rejected' }
    };

    const config = statusMap[status || 'pending'] || statusMap.pending;
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text} border border-current border-opacity-30`}>
        {config.label}
      </span>
    );
  };

  // ============ ERROR COMPONENT ============

  const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
    <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 backdrop-blur-xl">
      <div className="flex items-start gap-4">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-400 mb-1">Error loading bookings</h3>
          <p className="text-sm text-red-300/80 mb-4">{message}</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  // ============ LIFECYCLE ============

  useEffect(() => {
    fetchBookings();
    
    // Realtime subscriptions for auto-syncing
    const unsubBookings = subscribeToTable<BookingRow>(
      'bookings',
      (newBooking) => {
        setBookings((prev) => [newBooking, ...prev]);
        toast.success('New booking received!', { icon: '📅' });
      },
      (updatedBooking) => {
        setBookings((prev) =>
          prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
        );
      },
      (payload) => {
        setBookings((prev) => prev.filter((b) => b.id !== payload.id));
      }
    );

    return () => {
      unsubBookings?.();
    };
  }, [fetchBookings]);

  useEffect(() => {
    const acceptedCount = bookings.filter(b => b.is_onboarded !== true && b.has_follow_up !== true).length;
    console.log('Accepted Bookings Count:', acceptedCount);
  }, [bookings]);

  return (
    <AdminLayout title="Bookings Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Bookings Management</h1>
          <button
            onClick={fetchBookings}
            disabled={isRefreshingAll}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh Bookings"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshingAll ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 border-b border-white/10">
          <button
            onClick={() => {
              setTab('pending');
              setCurrentPage(1);
            }}
            className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 ${
              tab === 'pending'
                ? 'text-yellow-400 border-b-yellow-400'
                : 'text-white/60 border-b-transparent hover:text-white/80'
            }`}
          >
            Pending ({bookings.filter(b => b.status === 'pending').length})
          </button>
          <button
            onClick={() => {
              setTab('accepted');
              setCurrentPage(1);
            }}
            className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 ${
              tab === 'accepted'
                ? 'text-green-400 border-b-green-400'
                : 'text-white/60 border-b-transparent hover:text-white/80'
            }`}
          >
            Accepted ({bookings.filter(b => b.status === 'accepted' && b.is_onboarded !== true && b.has_follow_up !== true).length})
          </button>
          <button
            onClick={() => {
              setTab('completed');
              setCurrentPage(1);
            }}
            className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 ${
              tab === 'completed'
                ? 'text-cyan-400 border-b-cyan-400'
                : 'text-white/60 border-b-transparent hover:text-white/80'
            }`}
          >
            Completed ({bookings.filter(b => b.status === 'meeting_done' && b.is_onboarded !== true && b.has_follow_up !== true).length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <Search className="w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search by name, email, or project type..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm"
          />
        </div>

        {/* Bookings Content */}
        {bookingsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-red-500" />
            <span className="ml-3 text-white/60">Loading bookings...</span>
          </div>
        ) : bookingsError ? (
          <ErrorState message={bookingsError} onRetry={fetchBookings} />
        ) : paginatedBookings.length === 0 ? (
          <div className="py-20 text-center">
            <Calendar className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40 text-sm">
              {searchQuery ? 'No bookings match your search' : 'No bookings yet'}
            </p>
          </div>
        ) : (
          <div className="max-h-[calc(100vh-350px)] overflow-y-auto space-y-4 pr-2">
            {paginatedBookings.map((booking) => (
              <div
                key={booking.id}
                className={`p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl hover:bg-white/[0.04] transition-all group ${
                  actionLoading === booking.id ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-bold text-sm shadow-lg shadow-red-600/20">
                      {(booking.name || 'U')[0].toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-white">{booking.name || 'Unknown'}</h3>
                      {booking.username && (
                        <p className="text-[10px] font-mono text-red-400/80">@{booking.username}</p>
                      )}
                      <p className="text-sm text-white/50">{booking.email || 'No email'}</p>
                      {booking.agency && (
                        <p className="text-xs text-white/40">Agency: {booking.agency}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {tab === 'accepted' ? getStatusBadge('accepted') : getStatusBadge(booking.status || '')}
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

                    <div className="flex gap-2 flex-wrap">
                      {booking.status === 'pending' ? (
                        <>
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
                            onClick={() => handleDeclineBooking(booking)}
                            disabled={actionLoading === booking.id}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === booking.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            {actionLoading === booking.id ? 'Declining...' : 'Decline'}
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Accepted Tab Actions */}
                          {tab === 'accepted' && (
                            <button
                              onClick={() => handleMeetingDone(booking)}
                              disabled={actionLoading === booking.id}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/20 transition-all disabled:opacity-50"
                            >
                              {actionLoading === booking.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5" />
                              )}
                              Meeting Done
                            </button>
                          )}

                          {/* Completed Tab Actions */}
                          {tab === 'completed' && (
                            <>
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
                            </>
                          )}

                          {/* Delete Action (Shared) */}
                          <button
                            onClick={() => handleDeleteBooking(booking)}
                            disabled={actionLoading === booking.id}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-semibold hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all disabled:opacity-50"
                            title="Delete Booking"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
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

        {/* Pagination */}
        {!bookingsLoading && !bookingsError && filteredBookings.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-white/60">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBookings;
