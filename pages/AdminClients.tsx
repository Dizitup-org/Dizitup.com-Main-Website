import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { getQueryClients, getOnboardClients } from '../utils/clientsApi';
import { subscribeToTable } from '../utils/realtime';
import { Loader2, PhoneCall, CheckCircle, Trash2, Users, Search, RefreshCw, ChevronLeft, ChevronRight, Calendar, Clock, UserCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { QueryClientRow, OnboardClientRow } from '../types';
import { api } from '../utils/apiClient';

type TabKey = 'query_clients' | 'onboarded';

const ITEMS_PER_PAGE = 10;

const AdminClients: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabKey | null;
  const [tab, setTab] = useState<TabKey>(
    tabParam === 'onboarded' ? 'onboarded' : 'query_clients'
  );

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

  // ============ FETCH FUNCTIONS ============

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

  const handleDeleteOnboardedClient = useCallback(async (clientId: string, clientName: string) => {
    if (!confirm(`Delete client "${clientName}"? This cannot be undone.`)) return;
    setActionLoading(clientId);
    try {
      await api.delete(`/api/admin/clients/${clientId}`);
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
      fetchQueryClients(), 
      fetchOnboardClients()
    ]);
    setIsRefreshingAll(false);
  }, [fetchQueryClients, fetchOnboardClients]);

  useEffect(() => {
    refreshAll();
    
    // Realtime subscriptions for auto-syncing
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
      unsubQueryClients();
      unsubOnboardClients();
    };
  }, [refreshAll]);

  // Update URL when tab changes
  useEffect(() => {
    setSearchParams({ tab });
    setCurrentPage(1);
  }, [tab, setSearchParams]);

  const handleOnboardQueryClient = async (client: QueryClientRow) => {
    setActionLoading(client.id);
    
    try {
      console.log(`🎉 Onboarding query client ${client.id}...`);
      
      // Use booking_id if available, otherwise use client id
      const bookingId = client.booking_id || client.id;
      const data = await api.post<any>(`/api/admin/bookings/${bookingId}/onboard`, {
        contact_name: client.name || 'Unknown',
        email: client.email || '',
        phone: client.phone || '',
        company_name: client.agency || ''
      });
      console.log('✅ Onboard query client API response:', data);
      
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

  // Update client status
  const handleUpdateClientStatus = async (clientId: string, newStatus: string) => {
    setActionLoading(clientId);
    
    try {
      console.log(`🔄 Updating client ${clientId} status to ${newStatus}...`);
      
      await api.patch(`/api/admin/clients/${clientId}/status`, { status: newStatus });
      
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
    if (tab === 'query_clients') return filteredQueryClients;
    return filteredClients;
  };

  const paginatedData = useMemo(() => {
    const data = getCurrentData();
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return data.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQueryClients, filteredClients, currentPage, tab]);

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
      meeting_done: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', label: 'Meeting Done' },
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
