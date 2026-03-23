import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { getOnboardClientById, updateClientNotes } from '../utils/clientsApi';
import { getToken } from '../utils/apiClient';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
import { Loader2, User, Briefcase, Calendar, DollarSign, FileText, TrendingUp, Mail, Phone, Building, Clock, Target, ArrowLeft, Edit3, Save, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
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

  // Add Project form
  const [showAddProject, setShowAddProject] = useState(false);
  const [addProjectForm, setAddProjectForm] = useState({ title: '', description: '', admin_notes: '', total_amount: '', deadline: '', start_date: '' });
  const [addingProject, setAddingProject] = useState(false);

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

    // Auto-refresh project status every 15 seconds (silent)
    const interval = setInterval(async () => {
      if (!clientId) return;
      try {
        const { data } = await getOnboardClientById(clientId);
        if (data && isMounted) {
          setClient(prev => prev ? { ...prev, projects: data.projects } : prev);
        }
      } catch { /* silent */ }
    }, 15000);

    return () => { isMounted = false; clearInterval(interval); };
  }, [clientId]);

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

  // ============ ADD PROJECT ============
  const handleAddProject = async () => {
    if (!addProjectForm.title.trim() || !addProjectForm.total_amount) {
      toast.error('Title and amount are required');
      return;
    }
    setAddingProject(true);
    try {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/api/admin/clients/${clientId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          title: addProjectForm.title,
          description: addProjectForm.description || undefined,
          admin_notes: addProjectForm.admin_notes || undefined,
          total_amount: parseFloat(addProjectForm.total_amount),
          deadline: addProjectForm.deadline || undefined,
          start_date: addProjectForm.start_date || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Project added');
        setClient(prev => prev ? { ...prev, projects: [...(prev.projects || []), { ...data.project, sales: [] }] } : prev);
        setShowAddProject(false);
        setAddProjectForm({ title: '', description: '', admin_notes: '', total_amount: '', deadline: '', start_date: '' });
      } else {
        toast.error(data.message || data.error || 'Failed to add project');
      }
    } catch { toast.error('Network error'); } finally { setAddingProject(false); }
  };

  // ============ STATUS BADGE ============

  const getStatusBadge = (status: string | null, statusNote?: string | null) => {
    const statusMap: Record<string, { bg: string; border: string; text: string; label?: string }> = {
      active:            { bg: 'bg-green-500/10',  border: 'border-green-500/20',  text: 'text-green-400' },
      completed:         { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
      paused:            { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' },
      cancelled:         { bg: 'bg-red-500/10',    border: 'border-red-500/20',    text: 'text-red-400' },
      sent_to_manager:   { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', label: 'Sent to Manager' },
      assigned_to_staff: { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   text: 'text-blue-400',   label: 'Assigned to Staff' },
      under_execution:   { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', label: 'Under Execution' },
    };
    const s = statusMap[status || ''] || { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/60' };
    return (
      <div className="space-y-1">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.border} ${s.text}`}>
          {s.label ?? (status || 'Unknown')}
        </span>
        {statusNote && <p className="text-[10px] text-white/40 italic pl-1">{statusNote}</p>}
      </div>
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
                <p className="text-lg font-medium text-white">{client.phone || '—'}</p>
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
          )}

          {/* ============ PROJECTS TAB ============ */}
          {tab === 'projects' && (
            <div className="space-y-6">
              {/* Header + Add Project */}
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-white/40">
                  {(client.projects || []).length} project{(client.projects || []).length !== 1 ? 's' : ''}
                </h3>
                <button
                  onClick={() => setShowAddProject(v => !v)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-bold transition-all shadow-[0_0_14px_rgba(220,38,38,0.2)]"
                >
                  <Plus className="w-4 h-4" /> Add Project
                </button>
              </div>

              {/* Inline Add Project Form */}
              {showAddProject && (
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30">New Project</p>
                  <input
                    placeholder="Title *"
                    value={addProjectForm.title}
                    onChange={e => setAddProjectForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/50"
                  />
                  <textarea
                    placeholder="Description"
                    value={addProjectForm.description}
                    onChange={e => setAddProjectForm(f => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/50 resize-none"
                  />
                  <textarea
                    placeholder="Admin notes (internal only)"
                    value={addProjectForm.admin_notes}
                    onChange={e => setAddProjectForm(f => ({ ...f, admin_notes: e.target.value }))}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/50 resize-none"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="number"
                      placeholder="Total Amount *"
                      value={addProjectForm.total_amount}
                      onChange={e => setAddProjectForm(f => ({ ...f, total_amount: e.target.value }))}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/50"
                    />
                    <input
                      type="date"
                      title="Start Date"
                      value={addProjectForm.start_date}
                      onChange={e => setAddProjectForm(f => ({ ...f, start_date: e.target.value }))}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/50"
                    />
                    <input
                      type="date"
                      title="Deadline"
                      value={addProjectForm.deadline}
                      onChange={e => setAddProjectForm(f => ({ ...f, deadline: e.target.value }))}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/50"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddProject}
                      disabled={!addProjectForm.title.trim() || !addProjectForm.total_amount || addingProject}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-sm font-bold transition-all"
                    >
                      {addingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Project
                    </button>
                    <button
                      onClick={() => { setShowAddProject(false); setAddProjectForm({ title: '', description: '', admin_notes: '', total_amount: '', deadline: '', start_date: '' }); }}
                      className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(client.projects || []).map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.03] transition-all">
                        <td className="px-6 py-4 font-medium text-white">{p.title || 'Untitled'}</td>
                        <td className="px-6 py-4">{getStatusBadge(p.status, (p as any).status_note)}</td>
                        <td className="px-6 py-4 text-white/70">{p.start_date ? new Date(p.start_date).toLocaleDateString() : '—'}</td>
                        <td className="px-6 py-4 text-white/70">{p.end_date ? new Date(p.end_date).toLocaleDateString() : '—'}</td>
                        <td className="px-6 py-4 text-white/70">{p.deadline ? new Date(p.deadline).toLocaleDateString() : '—'}</td>
                        <td className="px-6 py-4 font-medium text-white">₹{(p.total_amount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    {(!client.projects || client.projects.length === 0) && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-white/40">No projects yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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

              {/* Payment Details Table */}
              <div className="overflow-x-auto rounded-2xl border border-white/10 backdrop-blur-xl">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/[0.03]">
                    <tr className="text-left text-white/40 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">Project</th>
                      <th className="px-6 py-4 font-semibold">Total</th>
                      <th className="px-6 py-4 font-semibold">Paid</th>
                      <th className="px-6 py-4 font-semibold">Pending</th>
                      <th className="px-6 py-4 font-semibold">Expenses</th>
                      <th className="px-6 py-4 font-semibold">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(client.projects || []).map((p) => {
                      const total = p.total_amount || 0;
                      const paid = (p.sales?.reduce((acc, s) => acc + (s.paid_amount || 0), 0)) || 0;
                      const pending = (p.sales?.reduce((acc, s) => acc + (s.pending_amount || 0), 0)) || 0;
                      const expenses = (p.sales?.reduce((acc, s) => acc + (s.expenses || 0), 0)) || 0;
                      const profit = total - expenses;
                      return (
                        <tr key={p.id} className="hover:bg-white/[0.03] transition-all">
                          <td className="px-6 py-4 font-medium text-white">{p.title || p.id}</td>
                          <td className="px-6 py-4 text-white">₹{total.toLocaleString()}</td>
                          <td className="px-6 py-4 text-green-400">₹{paid.toLocaleString()}</td>
                          <td className="px-6 py-4 text-yellow-400">₹{pending.toLocaleString()}</td>
                          <td className="px-6 py-4 text-red-400">₹{expenses.toLocaleString()}</td>
                          <td className="px-6 py-4 text-purple-400">₹{profit.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                    {(!client.projects || client.projects.length === 0) && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-white/40">No payment data</td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
