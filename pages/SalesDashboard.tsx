import React, { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import ChatBox from '../components/ChatBox';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users, Globe, UserCheck, Calendar, MessageCircle, FileText,
  Plus, Trash2, ExternalLink, RefreshCw,
  CheckCircle, Clock, XCircle, Loader2, ChevronDown,
} from 'lucide-react';
import { getToken } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthProvider';
import { useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const authHeaders = () => {
  const t = getToken();
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};

// ─── Types ───────────────────────────────────────────────
interface Lead {
  id: string;
  added_by: string;
  region: 'india' | 'foreign';
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: 'cold' | 'followup' | 'onboarded' | 'dropped';
  followup_date: string | null;
  notes: string | null;
  converted: boolean;
  created_at: string;
  updated_at: string;
}

interface SalesDoc {
  id: string;
  title: string;
  file_url: string;
  uploaded_by_user_id: string;
  uploaded_by_name: string | null;
  created_at: string;
}

// ─── Status badge styles ──────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  cold:      'bg-zinc-800 text-zinc-400 border-zinc-700',
  followup:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  onboarded: 'bg-green-500/15 text-green-400 border-green-500/30',
  dropped:   'bg-red-500/15 text-red-400 border-red-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  cold: 'Cold', followup: 'Follow Up', onboarded: 'Onboarded', dropped: 'Dropped',
};

const TABS = [
  { id: 'india',    label: 'Indian Clients',   icon: Users },
  { id: 'foreign',  label: 'Foreign Clients',  icon: Globe },
  { id: 'onboarded',label: 'Onboarded',        icon: UserCheck },
  { id: 'followup', label: 'Follow Up',        icon: Calendar },
  { id: 'chat',     label: 'Chat',             icon: MessageCircle },
  { id: 'documents',label: 'Documents',        icon: FileText },
];

// ─── Inline editable cell ────────────────────────────────
const EditableCell: React.FC<{
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  type?: string;
}> = ({ value, onSave, placeholder = '—', type = 'text' }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value || '');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const save = () => { setEditing(false); if (val !== value) onSave(val); };

  if (editing) {
    return (
      <input
        ref={ref}
        type={type}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setVal(value || ''); setEditing(false); } }}
        className="bg-zinc-800 border border-violet-500/50 rounded px-2 py-1 text-sm text-white w-full focus:outline-none"
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className="cursor-text hover:text-violet-300 transition-colors"
      title="Click to edit"
    >
      {value || <span className="text-zinc-600">{placeholder}</span>}
    </span>
  );
};

// ─── Status dropdown per row ──────────────────────────────
const StatusDropdown: React.FC<{ status: Lead['status']; onChange: (s: string) => void }> = ({ status, onChange }) => {
  return (
    <div className="relative inline-block">
      <select
        value={status}
        onChange={e => onChange(e.target.value)}
        className={`appearance-none focus:outline-none cursor-pointer flex items-center px-2.5 py-1 pr-6 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all ${STATUS_STYLES[status]}`}
      >
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <option key={k} value={k} className="bg-zinc-900 text-white uppercase text-xs font-bold tracking-widest">
            {v}
          </option>
        ))}
      </select>
      <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-current" />
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const SalesDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('india');
  const [leads,     setLeads]     = useState<Lead[]>([]);
  const [docs,      setDocs]      = useState<SalesDoc[]>([]);
  const [managerDocs, setManagerDocs] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(false);
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const [creatingProfile, setCreatingProfile] = useState<string | null>(null);
  const [profiledLeads, setProfiledLeads] = useState<Set<string>>(new Set());

  // ── Fetch leads ─────────────────────────────────────────
  const fetchLeads = useCallback(async (region?: string) => {
    setLoading(true);
    try {
      const url = region ? `${BASE_URL}/api/sales/leads?region=${region}` : `${BASE_URL}/api/sales/leads`;
      const res  = await fetch(url, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setLeads(data.leads);
      else toast.error(data.message || 'Failed to load leads');
    } catch { toast.error('Network error'); } finally { setLoading(false); }
  }, []);

  // ── Fetch docs ───────────────────────────────────────────
  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/sales/documents`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setDocs(data.documents);
    } catch { toast.error('Failed to load documents'); } finally { setLoading(false); }
  }, []);

  // ── Fetch manager docs ─────────────────────────────────
  const fetchManagerDocs = useCallback(async () => {
    try {
      const res  = await fetch(`${BASE_URL}/api/employee/docs`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setManagerDocs(data.docs);
    } catch { /* silent */ }
  }, []);

  // ── Tab switch ───────────────────────────────────────────
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);

    if (activeTab === 'india')     fetchLeads('india');
    else if (activeTab === 'foreign') fetchLeads('foreign');
    else if (activeTab === 'onboarded') fetchLeads();
    else if (activeTab === 'followup')  fetchLeads();
    else if (activeTab === 'documents') { fetchDocs(); fetchManagerDocs(); }

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeTab, fetchLeads, fetchDocs, fetchManagerDocs]);

  // ── Add lead ─────────────────────────────────────────────
  const addLead = async (region: 'india' | 'foreign') => {
    try {
      const res  = await fetch(`${BASE_URL}/api/sales/leads`, {
        method:  'POST',
        headers: authHeaders(),
        body:    JSON.stringify({ name: 'New Lead', region }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => [...prev, data.lead]);
        toast.success('New lead added — click to edit');
      } else toast.error(data.message || 'Failed');
    } catch { toast.error('Network error'); }
  };

  // ── Delete lead ──────────────────────────────────────────
  const deleteLead = async (id: string) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      const res  = await fetch(`${BASE_URL}/api/sales/leads/${id}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.filter(l => l.id !== id));
        toast.success('Lead deleted');
      } else toast.error(data.message || 'Failed');
    } catch { toast.error('Network error'); }
  };

  // ── Update lead field ────────────────────────────────────
  const updateLead = async (id: string, patch: Partial<Lead>) => {
    try {
      const res  = await fetch(`${BASE_URL}/api/sales/leads/${id}`, {
        method:  'PATCH',
        headers: authHeaders(),
        body:    JSON.stringify(patch),
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.map(l => l.id === id ? data.lead : l));
      } else toast.error(data.message || 'Failed to update');
    } catch { toast.error('Network error'); }
  };

  const [newUserProfileLead, setNewUserProfileLead] = useState<Lead | null>(null);
  const [newProfileForm, setNewProfileForm] = useState({ username: '', password: '', firstName: '', lastName: '', phone: '', company: '', email: '' });

  // ── Create profile (Form open) ───────────────────────────
  const openProfileForm = (lead: Lead) => {
    const nameParts = (lead.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const baseUsername = (lead.name || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    setNewProfileForm({
      username: baseUsername,
      password: '',
      firstName,
      lastName,
      phone: lead.phone || '',
      company: lead.company || '',
      email: lead.email || ''
    });
    setNewUserProfileLead(lead);
  };

  // ── Create profile (Submit) ──────────────────────────────
  const submitCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserProfileLead) return;
    setCreatingProfile(newUserProfileLead.id);
    try {
      const res  = await fetch(`${BASE_URL}/api/sales/leads/${newUserProfileLead.id}/create-profile`, {
        method:  'POST',
        headers: authHeaders(),
        body:    JSON.stringify(newProfileForm),
      });
      const data = await res.json();
      if (data.success) {
        setProfiledLeads(prev => new Set([...prev, newUserProfileLead.id]));
        setLeads(prev => prev.map(l => l.id === newUserProfileLead.id ? { ...l, converted: true, status: 'onboarded' } : l));
        toast.success('Profile created! They can now log in.');
        setNewUserProfileLead(null);
      } else toast.error(data.message || 'Failed to create profile');
    } catch { toast.error('Network error'); } finally { setCreatingProfile(null); }
  };

  // Chat is handled by <ChatBox> component — no local sendMessage needed

  // ═══════════════════════════════════════════════════════
  // SUB-RENDERS
  // ═══════════════════════════════════════════════════════

  // ── Leads table (Tab 1 & 2) ──────────────────────────────
  const renderLeadsTable = (region: 'india' | 'foreign') => {
    const filtered = leads.filter(l => l.region === region);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-400 font-mono">{filtered.length} leads</p>
          <button
            onClick={() => addLead(region)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-bold transition-all shadow-lg shadow-violet-900/40"
          >
            <Plus size={14} /> Add Lead
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                {['Name', 'Email', 'Phone', 'Company', 'Status', 'Follow-up Date', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-600 text-sm">
                    No leads yet — click "Add Lead" to start
                  </td>
                </tr>
              ) : (
                filtered.map(lead => (
                  <tr
                    key={lead.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-white">
                      <EditableCell value={lead.name} onSave={v => updateLead(lead.id, { name: v })} placeholder="Name" />
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      <EditableCell value={lead.email || ''} onSave={v => updateLead(lead.id, { email: v })} placeholder="Email" type="email" />
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      <EditableCell value={lead.phone || ''} onSave={v => updateLead(lead.id, { phone: v })} placeholder="Phone" />
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      <EditableCell value={lead.company || ''} onSave={v => updateLead(lead.id, { company: v })} placeholder="Company" />
                    </td>
                    <td className="px-4 py-3">
                      <StatusDropdown
                        status={lead.status}
                        onChange={s => updateLead(lead.id, { status: s as Lead['status'] })}
                      />
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      <input
                        type="date"
                        value={lead.followup_date ? lead.followup_date.slice(0, 10) : ''}
                        onChange={e => updateLead(lead.id, { followup_date: e.target.value || '' })}
                        style={{ colorScheme: 'dark' }}
                        className="bg-transparent border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-violet-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteLead(lead.id)}
                        className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete lead"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ── Onboarded tab (Tab 3) ────────────────────────────────
  const renderOnboarded = () => {
    const onboardedLeads = leads.filter(l => l.status === 'onboarded');
    return (
      <div className="overflow-x-auto rounded-2xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80">
              {['Name', 'Email', 'Phone', 'Company', 'Region', 'Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {onboardedLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-600 text-sm">
                  No onboarded leads yet
                </td>
              </tr>
            ) : (
              onboardedLeads.map(lead => {
                const profiled = profiledLeads.has(lead.id) || lead.converted;
                return (
                  <tr key={lead.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{lead.name}</td>
                    <td className="px-4 py-3 text-zinc-400">{lead.email || '—'}</td>
                    <td className="px-4 py-3 text-zinc-400">{lead.phone || '—'}</td>
                    <td className="px-4 py-3 text-zinc-400">{lead.company || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${lead.region === 'india' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                        {lead.region === 'india' ? 'India' : 'Foreign'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {profiled ? (
                        <button
                          onClick={() => navigate(`/book?email=${encodeURIComponent(lead.email || '')}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-all"
                        >
                          <CheckCircle size={12} /> Book Meeting
                        </button>
                      ) : (
                        <button
                          onClick={() => openProfileForm(lead)}
                          disabled={creatingProfile === lead.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-violet-900/30"
                        >
                          {creatingProfile === lead.id ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                          {creatingProfile === lead.id ? 'Creating…' : 'Create Profile'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // ── Follow Up tab (Tab 4) ────────────────────────────────
  const renderFollowUp = () => {
    const followupLeads = leads
      .filter(l => l.status === 'followup')
      .sort((a, b) => {
        if (!a.followup_date) return 1;
        if (!b.followup_date) return -1;
        return new Date(a.followup_date).getTime() - new Date(b.followup_date).getTime();
      });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isPastOrToday = (dateStr: string | null) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);
      return d <= today;
    };

    return (
      <div className="overflow-x-auto rounded-2xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80">
              {['Name', 'Email', 'Phone', 'Region', 'Follow-up Date', 'Notes', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {followupLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-zinc-600 text-sm">
                  No follow-up leads yet
                </td>
              </tr>
            ) : (
              followupLeads.map(lead => {
                const overdue = isPastOrToday(lead.followup_date);
                return (
                  <tr
                    key={lead.id}
                    className={`border-b border-zinc-800/50 transition-colors ${overdue ? 'bg-yellow-500/5 hover:bg-yellow-500/10' : 'hover:bg-zinc-800/40'}`}
                  >
                    <td className="px-4 py-3 font-medium text-white">
                      <div className="flex items-center gap-2">
                        {overdue && <Clock size={12} className="text-yellow-400 flex-shrink-0" />}
                        {lead.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{lead.email || '—'}</td>
                    <td className="px-4 py-3 text-zinc-400">{lead.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${lead.region === 'india' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                        {lead.region === 'india' ? 'India' : 'Foreign'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={lead.followup_date ? lead.followup_date.slice(0, 10) : ''}
                        onChange={e => updateLead(lead.id, { followup_date: e.target.value || '' })}
                        style={{ colorScheme: 'dark' }}
                        className={`bg-transparent border rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer transition-colors ${overdue ? 'border-yellow-500/50 text-yellow-400 focus:border-yellow-400' : 'border-zinc-700 text-zinc-300 focus:border-violet-500'}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-zinc-400 max-w-[200px]">
                      <EditableCell
                        value={lead.notes || ''}
                        onSave={v => updateLead(lead.id, { notes: v })}
                        placeholder="Add notes…"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteLead(lead.id)}
                        className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // ── Chat tab (Tab 5) ─────────────────────────────────────
  const renderChat = () => {
    const channel = user?.id ? `manager_employee_${user.id}` : null;
    return (
      <div className="flex flex-col h-[calc(100vh-280px)] min-h-[400px]">
        {channel ? (
          <ChatBox
            channel={channel}
            senderName={`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Sales'}
            label="Chat with Manager"
            variant="purple"
          />
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 gap-3">
            <MessageCircle size={32} className="text-zinc-600 mb-2" />
            <p className="text-sm text-zinc-500">Loading your chat...</p>
          </div>
        )}
      </div>
    );
  };

  // ── Documents tab (Tab 6) ────────────────────────────────
  const renderDocuments = () => {
    return (
      <div className="space-y-8">
        {/* Important Manager Forwarded Docs */}
        {managerDocs.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-white mb-4">From Manager</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {managerDocs.map(doc => (
                <div key={doc.id} className="flex flex-col p-4 rounded-xl border border-violet-500/20 bg-violet-500/[0.02] hover:bg-violet-500/[0.05] transition-all group">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
                      <FileText size={18} className="text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{doc.title}</p>
                      {doc.description && <p className="text-[12px] text-zinc-400 mt-0.5 leading-relaxed">{doc.description}</p>}
                      {doc.forward_note && (
                        <div className="mt-1.5 px-2.5 py-1.5 rounded-lg bg-yellow-500/[0.06] border border-yellow-500/20 inline-block">
                          <p className="text-[11px] text-yellow-500 italic">"{doc.forward_note}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-violet-500/10">
                    <div className="text-[10px] text-zinc-500">
                      {doc.uploaded_by_name && <span>From: {doc.uploaded_by_name} • </span>}
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 transition-all">
                        View
                      </a>
                      <a href={doc.file_url} download={doc.file_name} className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-[11px] text-white transition-all shadow-lg shadow-violet-900/30">
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sales Resources (Uploaded by Admin/Self) */}
        <div>
          <h3 className="text-sm font-bold text-white mb-4">Sales Resources</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-600">
                <FileText size={32} className="mb-3 opacity-30" />
                <p className="text-sm">No documents uploaded yet</p>
                <p className="text-xs mt-1 text-zinc-700">Admin can upload documents for the sales team</p>
              </div>
            ) : (
              docs.map(doc => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-violet-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                      <FileText size={18} className="text-violet-400" />
                    </div>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-white/5 hover:bg-violet-500/10 hover:text-violet-400 text-zinc-500 transition-all"
                      title="Open document"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  <h3 className="font-bold text-sm text-white mb-1 line-clamp-2">{doc.title}</h3>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-[10px] text-zinc-600 font-mono">
                      {new Date(doc.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    {doc.uploaded_by_name && (
                      <p className="text-[10px] text-zinc-600">by {doc.uploaded_by_name}</p>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <AdminLayout title="Sales Dashboard">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">
              Sales <span className="text-violet-400">Command</span> Center
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Manage leads, follow-ups, and client onboarding
            </p>
          </div>
          <button
            onClick={() => {
              if (activeTab === 'india') fetchLeads('india');
              else if (activeTab === 'foreign') fetchLeads('foreign');
              else if (['onboarded', 'followup'].includes(activeTab)) fetchLeads();
              else if (activeTab === 'documents') { fetchDocs(); fetchManagerDocs(); }
              // chat tab: ChatBox component handles its own refresh
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-zinc-800 text-sm transition-all"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40'
                    : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white border border-zinc-800'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6"
          >
            {loading && activeTab !== 'chat' ? (
              <div className="flex items-center justify-center py-20 text-zinc-600">
                <Loader2 size={24} className="animate-spin mr-3" /> Loading…
              </div>
            ) : (
              <>
                {activeTab === 'india'     && renderLeadsTable('india')}
                {activeTab === 'foreign'   && renderLeadsTable('foreign')}
                {activeTab === 'onboarded' && renderOnboarded()}
                {activeTab === 'followup'  && renderFollowUp()}
                {activeTab === 'chat'      && renderChat()}
                {activeTab === 'documents' && renderDocuments()}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* ── Profile Creation Modal ── */}
      <AnimatePresence>
        {newUserProfileLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-heading text-white">Create Client Profile</h2>
                  <p className="text-sm text-zinc-400 mt-1">Onboarding {newUserProfileLead.name}</p>
                </div>
                <button
                  onClick={() => setNewUserProfileLead(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 transition-all"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <form onSubmit={submitCreateProfile} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">First Name</label>
                    <input required type="text" value={newProfileForm.firstName} onChange={e => setNewProfileForm({ ...newProfileForm, firstName: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Last Name</label>
                    <input required type="text" value={newProfileForm.lastName} onChange={e => setNewProfileForm({ ...newProfileForm, lastName: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Email Address</label>
                    <input required type="email" value={newProfileForm.email} onChange={e => setNewProfileForm({ ...newProfileForm, email: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Phone Number</label>
                    <input type="tel" value={newProfileForm.phone} onChange={e => setNewProfileForm({ ...newProfileForm, phone: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Company</label>
                  <input type="text" value={newProfileForm.company} onChange={e => setNewProfileForm({ ...newProfileForm, company: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500" />
                </div>

                <div className="h-px bg-zinc-800 my-4" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-violet-500 mb-1.5">Login Username</label>
                    <input required type="text" value={newProfileForm.username} onChange={e => setNewProfileForm({ ...newProfileForm, username: e.target.value })} className="w-full bg-violet-950/20 border border-violet-500/30 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-violet-500 mb-1.5">Temporary Password</label>
                    <input required type="text" value={newProfileForm.password} onChange={e => setNewProfileForm({ ...newProfileForm, password: e.target.value })} placeholder="Dizitup@123" className="w-full bg-violet-950/20 border border-violet-500/30 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500 placeholder-zinc-500" />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setNewUserProfileLead(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-400 hover:text-white transition-all">Cancel</button>
                  <button type="submit" disabled={creatingProfile === newUserProfileLead.id} className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-violet-900/40 transition-all">
                    {creatingProfile === newUserProfileLead.id ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />} 
                    Create Client
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default SalesDashboard;
