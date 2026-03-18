import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { getOnboardClientById, updateClientNotes } from '../utils/clientsApi';
import { Loader2, User, Briefcase, Calendar, DollarSign, FileText, TrendingUp, Mail, Phone, Building, Clock, Target, ArrowLeft, Edit3, Save, X, MessageCircle, KeyRound, Send, Plus, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../utils/apiClient';
import type { OnboardClientRow, ProjectRow, SaleRow } from '../types';

type TabKey = 'identity' | 'projects' | 'payments' | 'notes' | 'summary';

interface ClientDetailData extends OnboardClientRow {
  projects?: (ProjectRow & { sales?: SaleRow[] })[] | null;
}

const AdminClientDetail: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('identity');

  // Notes editing
  const [editingNotes, setEditingNotes] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [feedback, setFeedback] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Create-account modal
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountCredentials, setAccountCredentials] = useState<{ email: string; temp_password: string } | null>(null);

  // Per-project update inputs: { [projectId]: string }
  const [updateInputs, setUpdateInputs] = useState<Record<string, string>>({});
  const [sendingUpdate, setSendingUpdate] = useState<Record<string, boolean>>({});
  const [projectUpdates, setProjectUpdates] = useState<Record<string, any[]>>({});

  // Project creation modal
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', status: 'active', start_date: '', end_date: '', deadline: '', total_amount: '', expenses: '' });
  const [creatingProject, setCreatingProject] = useState(false);

  // Payments CRUD
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [editPaymentDraft, setEditPaymentDraft] = useState<Record<string, any>>({});
  const [addPaymentDraft, setAddPaymentDraft] = useState<Record<string, { paid_amount: string; sale_date: string; notes: string; pending_amount: string; expenses: string }>>({});
  const [savingPayment, setSavingPayment] = useState<string | null>(null);
  const [addingPayment, setAddingPayment] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchClient = async () => {
      if (!clientId) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await getOnboardClientById(clientId);
        if (!isMounted) return;
        if (error) throw new Error(error);
        setClient(data as ClientDetailData);
        setAdminNotes(data?.admin_notes || '');
        setFeedback(data?.feedback || '');
      } catch (err: any) {
        console.error('[ClientDetail] Fetch error', err);
        setError(err.message || 'Failed to load client');
        setClient(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchClient();
    return () => { isMounted = false; };
  }, [clientId]);

  // Load updates for all projects when switching to projects tab
  useEffect(() => {
    if (tab !== 'projects' || !client?.projects?.length) return;
    client.projects.forEach((p) => {
      api.get<{ updates: any[] }>(`/api/admin/projects/${p.id}/updates`)
        .then((data) => setProjectUpdates((prev) => ({ ...prev, [p.id]: data.updates || [] })))
        .catch(() => {});
    });
  }, [tab, client]);

  // ============ COMPUTED VALUES ============

  const financials = useMemo(() => {
    if (!client?.projects) return { totalRevenue: 0, totalPaid: 0, totalPending: 0, totalExpenses: 0, totalProfit: 0 };

    let totalRevenue = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalExpenses = 0;

    client.projects.forEach((p) => {
      totalRevenue += p.total_amount || 0;
      (p.sales || []).forEach((s) => {
        totalPaid += s.paid_amount || 0;
        totalPending += s.pending_amount || 0;
        totalExpenses += s.expenses || 0;
      });
    });

    const totalProfit = totalRevenue - totalExpenses;

    return { totalRevenue, totalPaid, totalPending, totalExpenses, totalProfit };
  }, [client]);

  const liveProject = useMemo(() => {
    if (!client?.projects) return null;
    return client.projects.find((p) => p.status === 'active') || null;
  }, [client]);

  const projectCount = client?.projects?.length || 0;

  // ============ SAVE NOTES ============

  const handleSaveNotes = async () => {
    if (!clientId) return;
    setSavingNotes(true);
    try {
      const { error } = await updateClientNotes(clientId, { admin_notes: adminNotes, feedback });
      if (error) throw new Error(error);
      toast.success('Notes saved');
      setEditingNotes(false);
      if (client) {
        setClient({ ...client, admin_notes: adminNotes, feedback });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  // ============ CREATE CLIENT ACCOUNT ============

  const handleCreateAccount = async () => {
    if (!clientId) return;
    setCreatingAccount(true);
    try {
      const data = await api.post<{ success: boolean; credentials: { email: string; temp_password: string } }>(
        `/api/admin/clients/${clientId}/create-account`,
        {}
      );
      setAccountCredentials(data.credentials);
      toast.success('Credentials generated — share with client');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create account');
    } finally {
      setCreatingAccount(false);
    }
  };

  // ============ SEND PROJECT UPDATE ============

  const handleSendUpdate = async (projectId: string) => {
    const message = (updateInputs[projectId] || '').trim();
    if (!message) return;
    setSendingUpdate((prev) => ({ ...prev, [projectId]: true }));
    try {
      await api.post(`/api/admin/projects/${projectId}/updates`, { message });
      toast.success('Update posted');
      setUpdateInputs((prev) => ({ ...prev, [projectId]: '' }));
      // Refresh updates list for this project
      api.get<{ updates: any[] }>(`/api/admin/projects/${projectId}/updates`)
        .then((data) => setProjectUpdates((prev) => ({ ...prev, [projectId]: data.updates || [] })))
        .catch(() => {});
    } catch (err: any) {
      toast.error(err?.message || 'Failed to post update');
    } finally {
      setSendingUpdate((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  // ============ CREATE PROJECT ============

  const handleCreateProject = async () => {
    if (!clientId || !newProject.title.trim()) { toast.error('Project title is required'); return; }
    if (!newProject.total_amount) { toast.error('Total amount is required'); return; }
    setCreatingProject(true);
    try {
      await api.post(`/api/admin/clients/${clientId}/projects`, {
        title: newProject.title.trim(),
        description: newProject.description || null,
        status: newProject.status,
        start_date: newProject.start_date || null,
        end_date: newProject.end_date || null,
        deadline: newProject.deadline || null,
        total_amount: parseFloat(newProject.total_amount),
        expenses: parseFloat(newProject.expenses) || 0,
      });
      toast.success('Project created');
      setShowProjectModal(false);
      setNewProject({ title: '', description: '', status: 'active', start_date: '', end_date: '', deadline: '', total_amount: '', expenses: '' });
      const { data, error } = await getOnboardClientById(clientId);
      if (error) throw new Error(error);
      setClient(data as ClientDetailData);
      setAdminNotes(data?.admin_notes || '');
      setFeedback(data?.feedback || '');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create project');
    } finally {
      setCreatingProject(false);
    }
  };

  // ============ ADD PAYMENT ============

  const handleAddPayment = async (projectId: string) => {
    if (!clientId) return;
    const draft = addPaymentDraft[projectId];
    if (!draft?.paid_amount) { toast.error('Paid amount is required'); return; }
    setAddingPayment(projectId);
    try {
      await api.post(`/api/admin/clients/${clientId}/projects/${projectId}/payments`, {
        paid_amount: parseFloat(draft.paid_amount),
        sale_date: draft.sale_date || null,
        notes: draft.notes || null,
        pending_amount: parseFloat(draft.pending_amount) || 0,
        expenses: parseFloat(draft.expenses) || 0,
      });
      setAddPaymentDraft(prev => ({ ...prev, [projectId]: { paid_amount: '', sale_date: '', notes: '', pending_amount: '', expenses: '' } }));
      toast.success('Payment added');
      const { data, error } = await getOnboardClientById(clientId);
      if (error) throw new Error(error);
      setClient(data as ClientDetailData);
      setAdminNotes(data?.admin_notes || '');
      setFeedback(data?.feedback || '');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add payment');
    } finally {
      setAddingPayment(null);
    }
  };

  // ============ EDIT PAYMENT ============

  const handleSavePayment = async (projectId: string, paymentId: string) => {
    if (!clientId) return;
    const draft = editPaymentDraft[paymentId] || {};
    setSavingPayment(paymentId);
    try {
      await api.patch(`/api/admin/clients/${clientId}/projects/${projectId}/payments/${paymentId}`, {
        paid_amount: draft.paid_amount !== '' && draft.paid_amount != null ? parseFloat(draft.paid_amount) : undefined,
        sale_date: draft.sale_date || undefined,
        notes: draft.notes !== undefined ? draft.notes : undefined,
        pending_amount: draft.pending_amount !== '' && draft.pending_amount != null ? parseFloat(draft.pending_amount) : undefined,
        expenses: draft.expenses !== '' && draft.expenses != null ? parseFloat(draft.expenses) : undefined,
      });
      setEditingPayment(null);
      toast.success('Payment updated');
      const { data, error } = await getOnboardClientById(clientId);
      if (error) throw new Error(error);
      setClient(data as ClientDetailData);
      setAdminNotes(data?.admin_notes || '');
      setFeedback(data?.feedback || '');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update payment');
    } finally {
      setSavingPayment(null);
    }
  };

  // ============ STATUS BADGE ============

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { bg: string; border: string; text: string }> = {
      active: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
      completed: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
      paused: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' },
      cancelled: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
    };
    const s = statusMap[status || ''] || { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/60' };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.border} ${s.text}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  // ============ TABS ============

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'identity', label: 'Identity', icon: User },
    { key: 'projects', label: 'Projects', icon: Briefcase },
    { key: 'payments', label: 'Payments', icon: DollarSign },
    { key: 'notes', label: 'Notes', icon: FileText },
    { key: 'summary', label: 'Summary', icon: TrendingUp },
  ];

  return (
    <AdminLayout title="Client Profile">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/clients?tab=onboarded')}
        className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to Clients</span>
      </button>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-red-500" />
          <span className="ml-3 text-white/60">Loading client profile...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && client && (
        <div className="space-y-8">
          {/* Client Header */}
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {client.avatar_url ? (
                <img
                  src={client.avatar_url}
                  alt=""
                  className="w-24 h-24 rounded-2xl object-cover shadow-2xl"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-bold text-3xl shadow-2xl shadow-red-600/30">
                  {(client.contact_name || 'C')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold font-heading text-white mb-2">{client.contact_name || 'Unknown Client'}</h1>
                <p className="text-white/60 text-lg mb-3">{client.company_name || 'No company name'}</p>
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(client.status)}
                  {client.username && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-white/60">
                      @{client.username}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="text-2xl font-bold text-white">₹{financials.totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-white/40">Total Revenue</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  tab === t.key
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* ============ IDENTITY TAB ============ */}
          {tab === 'identity' && (
            <div className="space-y-4">
              {/* Create Client Login */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5">Client Portal Login</p>
                  <p className="text-xs text-white/40">Generate or reset login credentials for this client</p>
                </div>
                <button
                  onClick={handleCreateAccount}
                  disabled={creatingAccount}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {creatingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  {client.user_id ? 'Reset Login' : 'Create Login'}
                </button>
              </div>

              {/* Credentials modal */}
              {accountCredentials && (
                <div className="p-5 rounded-2xl bg-green-500/5 border border-green-500/20 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-green-400">Credentials — share with client</p>
                    <button onClick={() => setAccountCredentials(null)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                  <p className="text-sm text-white/70 mb-1">Email: <span className="font-mono text-white">{accountCredentials.email}</span></p>
                  <p className="text-sm text-white/70">Temp Password: <span className="font-mono text-white">{accountCredentials.temp_password}</span></p>
                </div>
              )}

              {/* Info cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-3">
                  <User className="w-5 h-5 text-red-500" />
                  <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Full Name</span>
                </div>
                <p className="text-lg font-medium text-white">{client.contact_name || '—'}</p>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Building className="w-5 h-5 text-red-500" />
                  <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Company</span>
                </div>
                <p className="text-lg font-medium text-white">{client.company_name || '—'}</p>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Mail className="w-5 h-5 text-red-500" />
                  <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Email</span>
                </div>
                <p className="text-lg font-medium text-white">{client.email || '—'}</p>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Phone className="w-5 h-5 text-red-500" />
                  <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Phone</span>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-medium text-white">{client.phone || '—'}</p>
                  {client.phone && (
                    <a
                      href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold hover:bg-green-500/20 transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-3">
                  <User className="w-5 h-5 text-red-500" />
                  <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Username</span>
                </div>
                <p className="text-lg font-medium text-white">{client.username ? `@${client.username}` : '—'}</p>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-red-500" />
                  <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Start Date</span>
                </div>
                <p className="text-lg font-medium text-white">
                  {client.start_date ? new Date(client.start_date).toLocaleDateString() : '—'}
                </p>
              </div>
              </div>
            </div>
          )}

          {/* ============ PROJECTS TAB ============ */}
          {tab === 'projects' && (
            <div className="space-y-6">
              {/* Action bar */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
              </div>

              {/* Live Project Card */}
              {liveProject && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-red-600/10 to-red-800/10 border border-red-500/20 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-white/60 uppercase tracking-wider font-semibold">Live Project</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{liveProject.title || 'Untitled Project'}</h3>
                  <p className="text-white/60 text-sm mb-4">{liveProject.description || 'No description'}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-white/60">
                      <Clock className="w-4 h-4" />
                      <span>Deadline: {liveProject.deadline ? new Date(liveProject.deadline).toLocaleDateString() : '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/60">
                      <Target className="w-4 h-4" />
                      <span>Value: ₹{(liveProject.total_amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  {/* Add update input for live project */}
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      placeholder="Post an update to client…"
                      value={updateInputs[liveProject.id] || ''}
                      onChange={(e) => setUpdateInputs((prev) => ({ ...prev, [liveProject.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendUpdate(liveProject.id)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/50"
                    />
                    <button
                      onClick={() => handleSendUpdate(liveProject.id)}
                      disabled={sendingUpdate[liveProject.id] || !updateInputs[liveProject.id]?.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all disabled:opacity-40"
                    >
                      {sendingUpdate[liveProject.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Updates feed */}
                  {(projectUpdates[liveProject.id] || []).length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30">Posted Updates</p>
                      {(projectUpdates[liveProject.id] || []).map((u: any) => (
                        <div key={u.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                          <p className="text-sm text-white/75">{u.message}</p>
                          <p className="text-[10px] text-white/30 mt-1.5">{new Date(u.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* All Projects */}
              <div className="overflow-x-auto rounded-2xl border border-white/10 backdrop-blur-xl">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/[0.03]">
                    <tr className="text-left text-white/40 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">Project</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Start</th>
                      <th className="px-6 py-4 font-semibold">End</th>
                      <th className="px-6 py-4 font-semibold">Deadline</th>
                      <th className="px-6 py-4 font-semibold">Value</th>
                      <th className="px-6 py-4 font-semibold">Post Update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(client.projects || []).map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.03] transition-all">
                        <td className="px-6 py-4 font-medium text-white">{p.title || 'Untitled'}</td>
                        <td className="px-6 py-4">{getStatusBadge(p.status)}</td>
                        <td className="px-6 py-4 text-white/70">{p.start_date ? new Date(p.start_date).toLocaleDateString() : '—'}</td>
                        <td className="px-6 py-4 text-white/70">{p.end_date ? new Date(p.end_date).toLocaleDateString() : '—'}</td>
                        <td className="px-6 py-4 text-white/70">{p.deadline ? new Date(p.deadline).toLocaleDateString() : '—'}</td>
                        <td className="px-6 py-4 font-medium text-white">₹{(p.total_amount || 0).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Update…"
                              value={updateInputs[p.id] || ''}
                              onChange={(e) => setUpdateInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && handleSendUpdate(p.id)}
                              className="w-40 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-red-500/50"
                            />
                            <button
                              onClick={() => handleSendUpdate(p.id)}
                              disabled={sendingUpdate[p.id] || !updateInputs[p.id]?.trim()}
                              className="p-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all disabled:opacity-40"
                            >
                              {sendingUpdate[p.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!client.projects || client.projects.length === 0) && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-white/40">No projects yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ---- Create Project Modal ---- */}
              {showProjectModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowProjectModal(false)}>
                  <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold font-heading">New Project</h3>
                      <button onClick={() => setShowProjectModal(false)} className="text-white/40 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs text-white/40 uppercase tracking-wider font-semibold mb-2">Title *</label>
                        <input value={newProject.title} onChange={e => setNewProject(p => ({...p, title: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50" placeholder="Project title" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-white/40 uppercase tracking-wider font-semibold mb-2">Description</label>
                        <textarea value={newProject.description} onChange={e => setNewProject(p => ({...p, description: e.target.value}))} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50 resize-none" placeholder="Brief description..." />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 uppercase tracking-wider font-semibold mb-2">Status</label>
                        <select value={newProject.status} onChange={e => setNewProject(p => ({...p, status: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50">
                          <option value="active" className="bg-gray-900">Active</option>
                          <option value="paused" className="bg-gray-900">Paused</option>
                          <option value="completed" className="bg-gray-900">Completed</option>
                          <option value="cancelled" className="bg-gray-900">Cancelled</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 uppercase tracking-wider font-semibold mb-2">Total Amount *</label>
                        <input type="number" value={newProject.total_amount} onChange={e => setNewProject(p => ({...p, total_amount: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50" placeholder="0" min="0" />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 uppercase tracking-wider font-semibold mb-2">Expenses</label>
                        <input type="number" value={newProject.expenses} onChange={e => setNewProject(p => ({...p, expenses: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50" placeholder="0" min="0" />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 uppercase tracking-wider font-semibold mb-2">Start Date</label>
                        <input type="date" value={newProject.start_date} onChange={e => setNewProject(p => ({...p, start_date: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50" />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 uppercase tracking-wider font-semibold mb-2">End Date</label>
                        <input type="date" value={newProject.end_date} onChange={e => setNewProject(p => ({...p, end_date: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50" />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 uppercase tracking-wider font-semibold mb-2">Deadline</label>
                        <input type="date" value={newProject.deadline} onChange={e => setNewProject(p => ({...p, deadline: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <button onClick={() => setShowProjectModal(false)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm font-semibold transition-all">Cancel</button>
                      <button onClick={handleCreateProject} disabled={creatingProject} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all disabled:opacity-50">
                        {creatingProject ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Project'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============ PAYMENTS TAB ============ */}
          {tab === 'payments' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl text-center">
                  <p className="text-2xl font-bold text-white">₹{financials.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-white/40 uppercase tracking-wider mt-1">Total</p>
                </div>
                <div className="p-6 rounded-2xl bg-green-500/5 border border-green-500/20 backdrop-blur-xl text-center">
                  <p className="text-2xl font-bold text-green-400">₹{financials.totalPaid.toLocaleString()}</p>
                  <p className="text-xs text-white/40 uppercase tracking-wider mt-1">Paid</p>
                </div>
                <div className="p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 backdrop-blur-xl text-center">
                  <p className="text-2xl font-bold text-yellow-400">₹{financials.totalPending.toLocaleString()}</p>
                  <p className="text-xs text-white/40 uppercase tracking-wider mt-1">Pending</p>
                </div>
                <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 backdrop-blur-xl text-center">
                  <p className="text-2xl font-bold text-red-400">₹{financials.totalExpenses.toLocaleString()}</p>
                  <p className="text-xs text-white/40 uppercase tracking-wider mt-1">Expenses</p>
                </div>
                <div className="p-6 rounded-2xl bg-purple-500/5 border border-purple-500/20 backdrop-blur-xl text-center">
                  <p className="text-2xl font-bold text-purple-400">₹{financials.totalProfit.toLocaleString()}</p>
                  <p className="text-xs text-white/40 uppercase tracking-wider mt-1">Profit</p>
                </div>
              </div>

              {/* Per-project payment accordion */}
              <div className="space-y-3">
                {(!client.projects || client.projects.length === 0) && (
                  <div className="py-12 text-center text-white/40">No projects — create a project first to track payments</div>
                )}
                {(client.projects || []).map((p) => {
                  const paidTotal = (p.sales || []).reduce((acc, s) => acc + (s.paid_amount || 0), 0);
                  const pendingTotal = (p.sales || []).reduce((acc, s) => acc + (s.pending_amount || 0), 0);
                  const expensesTotal = (p.sales || []).reduce((acc, s) => acc + (s.expenses || 0), 0);
                  const isOpen = expandedProject === p.id;
                  const draft = addPaymentDraft[p.id] || { paid_amount: '', sale_date: '', notes: '', pending_amount: '', expenses: '' };
                  return (
                    <div key={p.id} className="rounded-2xl border border-white/10 backdrop-blur-xl overflow-hidden">
                      {/* Accordion Header */}
                      <button
                        onClick={() => setExpandedProject(isOpen ? null : p.id)}
                        className="w-full flex items-center justify-between px-6 py-4 bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                      >
                        <div className="flex items-center gap-4 text-left">
                          <span className="font-semibold text-white">{p.title || 'Untitled'}</span>
                          {getStatusBadge(p.status)}
                          <span className="text-xs text-white/40 hidden md:block">Value: ₹{(p.total_amount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="hidden md:flex gap-3 text-xs">
                            <span className="text-green-400">+₹{paidTotal.toLocaleString()} paid</span>
                            <span className="text-yellow-400">₹{pendingTotal.toLocaleString()} pending</span>
                            <span className="text-red-400">₹{expensesTotal.toLocaleString()} exp</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {/* Accordion Body */}
                      {isOpen && (
                        <div className="px-6 pb-6">
                          {/* Existing payment rows */}
                          {(p.sales || []).length > 0 && (
                            <div className="overflow-x-auto mb-4">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="text-left text-white/40 text-xs uppercase tracking-wider border-b border-white/5">
                                    <th className="pb-2 pt-4 pr-4 font-semibold">Paid</th>
                                    <th className="pb-2 pt-4 pr-4 font-semibold">Date</th>
                                    <th className="pb-2 pt-4 pr-4 font-semibold">Pending</th>
                                    <th className="pb-2 pt-4 pr-4 font-semibold">Expenses</th>
                                    <th className="pb-2 pt-4 pr-4 font-semibold">Notes</th>
                                    <th className="pb-2 pt-4 font-semibold"></th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {(p.sales || []).map((s) => {
                                    const isEditing = editingPayment === s.id;
                                    const eDraft = editPaymentDraft[s.id] || {};
                                    return (
                                      <tr key={s.id} className="hover:bg-white/[0.02] transition-all">
                                        <td className="py-3 pr-4">
                                          {isEditing ? (
                                            <input type="number" value={eDraft.paid_amount ?? (s.paid_amount ?? '')} onChange={e => setEditPaymentDraft(prev => ({ ...prev, [s.id]: { ...prev[s.id], paid_amount: e.target.value } }))} className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500/50" />
                                          ) : (
                                            <span className="text-green-400 font-medium">₹{(s.paid_amount || 0).toLocaleString()}</span>
                                          )}
                                        </td>
                                        <td className="py-3 pr-4">
                                          {isEditing ? (
                                            <input type="date" value={eDraft.sale_date ?? (s.payment_date ? s.payment_date.split('T')[0] : '')} onChange={e => setEditPaymentDraft(prev => ({ ...prev, [s.id]: { ...prev[s.id], sale_date: e.target.value } }))} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500/50" />
                                          ) : (
                                            <span className="text-white/60">{s.payment_date ? new Date(s.payment_date).toLocaleDateString() : '—'}</span>
                                          )}
                                        </td>
                                        <td className="py-3 pr-4">
                                          {isEditing ? (
                                            <input type="number" value={eDraft.pending_amount ?? (s.pending_amount ?? '')} onChange={e => setEditPaymentDraft(prev => ({ ...prev, [s.id]: { ...prev[s.id], pending_amount: e.target.value } }))} className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500/50" />
                                          ) : (
                                            <span className="text-yellow-400">₹{(s.pending_amount || 0).toLocaleString()}</span>
                                          )}
                                        </td>
                                        <td className="py-3 pr-4">
                                          {isEditing ? (
                                            <input type="number" value={eDraft.expenses ?? (s.expenses ?? '')} onChange={e => setEditPaymentDraft(prev => ({ ...prev, [s.id]: { ...prev[s.id], expenses: e.target.value } }))} className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500/50" />
                                          ) : (
                                            <span className="text-red-400">₹{(s.expenses || 0).toLocaleString()}</span>
                                          )}
                                        </td>
                                        <td className="py-3 pr-4">
                                          {isEditing ? (
                                            <input value={eDraft.notes ?? (s.notes ?? '')} onChange={e => setEditPaymentDraft(prev => ({ ...prev, [s.id]: { ...prev[s.id], notes: e.target.value } }))} className="w-32 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500/50" placeholder="Notes..." />
                                          ) : (
                                            <span className="text-white/50 text-xs">{s.notes || '—'}</span>
                                          )}
                                        </td>
                                        <td className="py-3">
                                          {isEditing ? (
                                            <div className="flex gap-1">
                                              <button onClick={() => handleSavePayment(p.id, s.id)} disabled={savingPayment === s.id} className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs hover:bg-green-500/30 transition-all disabled:opacity-50">
                                                {savingPayment === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                              </button>
                                              <button onClick={() => setEditingPayment(null)} className="px-2 py-1 rounded-lg bg-white/5 text-white/40 text-xs hover:bg-white/10 transition-all"><X className="w-3 h-3" /></button>
                                            </div>
                                          ) : (
                                            <button onClick={() => { setEditingPayment(s.id); setEditPaymentDraft(prev => ({ ...prev, [s.id]: { paid_amount: s.paid_amount ?? '', sale_date: s.payment_date ? s.payment_date.split('T')[0] : '', notes: s.notes ?? '', pending_amount: s.pending_amount ?? '', expenses: s.expenses ?? '' } })); }} className="px-2 py-1 rounded-lg bg-white/5 text-white/40 text-xs hover:text-white hover:bg-white/10 transition-all"><Edit3 className="w-3 h-3" /></button>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Add Payment Form */}
                          <div className="border-t border-white/5 pt-4">
                            <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">Add Payment</p>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                              <div>
                                <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Paid *</label>
                                <input type="number" placeholder="0" value={draft.paid_amount} onChange={e => setAddPaymentDraft(prev => ({ ...prev, [p.id]: { ...draft, paid_amount: e.target.value } }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500/50" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Date</label>
                                <input type="date" value={draft.sale_date} onChange={e => setAddPaymentDraft(prev => ({ ...prev, [p.id]: { ...draft, sale_date: e.target.value } }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500/50" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Pending</label>
                                <input type="number" placeholder="0" value={draft.pending_amount} onChange={e => setAddPaymentDraft(prev => ({ ...prev, [p.id]: { ...draft, pending_amount: e.target.value } }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500/50" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Expenses</label>
                                <input type="number" placeholder="0" value={draft.expenses} onChange={e => setAddPaymentDraft(prev => ({ ...prev, [p.id]: { ...draft, expenses: e.target.value } }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500/50" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Notes</label>
                                <input placeholder="Optional" value={draft.notes} onChange={e => setAddPaymentDraft(prev => ({ ...prev, [p.id]: { ...draft, notes: e.target.value } }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500/50" />
                              </div>
                            </div>
                            <button onClick={() => handleAddPayment(p.id)} disabled={addingPayment === p.id || !draft.paid_amount} className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all disabled:opacity-50">
                              {addingPayment === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                              {addingPayment === p.id ? 'Adding...' : 'Add Payment'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============ NOTES TAB ============ */}
          {tab === 'notes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-heading">Admin Notes & Feedback</h3>
                {!editingNotes ? (
                  <button
                    onClick={() => setEditingNotes(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingNotes(false);
                        setAdminNotes(client?.admin_notes || '');
                        setFeedback(client?.feedback || '');
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all text-sm"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all text-sm disabled:opacity-50"
                    >
                      {savingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                  <label className="block text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">Admin Notes</label>
                  {editingNotes ? (
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full h-40 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600/50 resize-none"
                      placeholder="Add internal notes about this client..."
                    />
                  ) : (
                    <p className="text-white/70 text-sm whitespace-pre-wrap">{client.admin_notes || 'No notes yet'}</p>
                  )}
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                  <label className="block text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">Client Feedback</label>
                  {editingNotes ? (
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full h-40 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600/50 resize-none"
                      placeholder="Record client feedback..."
                    />
                  ) : (
                    <p className="text-white/70 text-sm whitespace-pre-wrap">{client.feedback || 'No feedback recorded'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============ SUMMARY TAB ============ */}
          {tab === 'summary' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-8 rounded-2xl bg-gradient-to-br from-red-600/10 to-red-800/10 border border-red-500/20 backdrop-blur-xl text-center">
                <Briefcase className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <p className="text-4xl font-bold text-white mb-2">{projectCount}</p>
                <p className="text-sm text-white/40 uppercase tracking-wider">Total Projects</p>
              </div>

              <div className="p-8 rounded-2xl bg-gradient-to-br from-green-600/10 to-green-800/10 border border-green-500/20 backdrop-blur-xl text-center">
                <DollarSign className="w-10 h-10 text-green-500 mx-auto mb-4" />
                <p className="text-4xl font-bold text-white mb-2">₹{financials.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-white/40 uppercase tracking-wider">Total Revenue</p>
              </div>

              <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-600/10 to-purple-800/10 border border-purple-500/20 backdrop-blur-xl text-center">
                <TrendingUp className="w-10 h-10 text-purple-500 mx-auto mb-4" />
                <p className="text-4xl font-bold text-white mb-2">₹{financials.totalProfit.toLocaleString()}</p>
                <p className="text-sm text-white/40 uppercase tracking-wider">Total Profit</p>
              </div>

              {/* Timeline */}
              <div className="md:col-span-3 p-8 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                <h3 className="text-lg font-bold font-heading mb-6">Client Journey</h3>
                <div className="flex items-center justify-between text-center">
                  <div>
                    <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center mx-auto mb-3">
                      <Calendar className="w-5 h-5 text-red-400" />
                    </div>
                    <p className="text-sm font-medium text-white">Onboarded</p>
                    <p className="text-xs text-white/40">{client.start_date ? new Date(client.start_date).toLocaleDateString() : '—'}</p>
                  </div>
                  <div className="flex-1 h-px bg-white/10 mx-4" />
                  <div>
                    <div className="w-12 h-12 rounded-full bg-green-600/20 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
                      <Briefcase className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-sm font-medium text-white">Projects</p>
                    <p className="text-xs text-white/40">{projectCount} completed</p>
                  </div>
                  <div className="flex-1 h-px bg-white/10 mx-4" />
                  <div>
                    <div className="w-12 h-12 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                    </div>
                    <p className="text-sm font-medium text-white">Revenue</p>
                    <p className="text-xs text-white/40">₹{financials.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !error && !client && (
        <div className="py-20 text-center">
          <User className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/40 text-sm">Client not found or access denied</p>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminClientDetail;
