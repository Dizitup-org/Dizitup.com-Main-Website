import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Mail, Phone, Briefcase,
  Trash2, Edit3, X, Loader2, RefreshCw, Shield,
} from 'lucide-react';
import { getToken } from '../utils/apiClient';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const authHeaders = () => {
  const t = getToken();
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};

interface StaffMember {
  admin_id: string; user_id: string; role: string;
  username: string; email: string; first_name: string; last_name: string; phone: string | null; created_at: string;
}

const ROLE_COLORS: Record<string, string> = {
  manager: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  employee: 'text-green-400 bg-green-500/10 border-green-500/20',
};

const defaultForm = { username: '', email: '', password: '', first_name: '', last_name: '', phone: '', role: 'employee' };

const ManagerTeam: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/staff`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setStaff(data.staff);
    } catch { toast.error('Failed to load team'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const createStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password || !form.first_name) {
      toast.error('Please fill all required fields'); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/staff`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${form.role.charAt(0).toUpperCase() + form.role.slice(1)} created`);
        setShowModal(false);
        setForm(defaultForm);
        fetchStaff();
      } else {
        toast.error(data.message || 'Failed to create staff');
      }
    } catch { toast.error('Network error'); } finally { setSubmitting(false); }
  };

  const changeRole = async (adminId: string, newRole: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/staff/${adminId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) { toast.success('Role updated'); setEditingId(null); fetchStaff(); }
      else toast.error(data.message || 'Failed');
    } catch { toast.error('Network error'); }
  };

  const removeAccess = async (adminId: string, name: string) => {
    if (!window.confirm(`Remove ${name}'s staff access? Their user account will remain.`)) return;
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/staff/${adminId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) { toast.success('Staff access removed'); fetchStaff(); }
      else toast.error(data.message || 'Failed');
    } catch { toast.error('Network error'); }
  };

  const managers = staff.filter(s => s.role === 'manager');
  const employees = staff.filter(s => s.role === 'employee');

  return (
    <AdminLayout title="Manager — Team">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Team</h1>
            <p className="text-sm text-white/40 mt-1">Manage staff access and roles</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setLoading(true); fetchStaff(); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-all">
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-bold transition-all shadow-[0_0_16px_rgba(220,38,38,0.25)]"
            >
              <UserPlus size={15} /> Add Staff
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 p-8 rounded-2xl bg-white/[0.03] border border-white/5 text-white/40">
            <Loader2 size={18} className="animate-spin" /> Loading team…
          </div>
        ) : (
          <div className="space-y-8">
            {[{ label: 'Managers', data: managers, role: 'manager' }, { label: 'Employees', data: employees, role: 'employee' }].map(({ label, data }) => (
              <div key={label}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <Shield size={13} className="text-white/40" />
                  </div>
                  <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-white/70">{label}</h2>
                  <span className="text-xs text-white/30 font-mono">{data.length}</span>
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
                </div>

                {data.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                    <Users size={24} className="text-white/15 mx-auto mb-2" />
                    <p className="text-sm text-white/30">No {label.toLowerCase()} yet</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.map(s => (
                      <div key={s.admin_id} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-all space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center font-bold text-sm">
                            {(s.first_name?.[0] ?? s.username?.[0] ?? '?').toUpperCase()}
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${ROLE_COLORS[s.role] ?? 'text-white/40 bg-white/5 border-white/10'}`}>
                            {s.role}
                          </span>
                        </div>
                        <div>
                          <p className="font-heading font-bold text-sm">{s.first_name} {s.last_name}</p>
                          <p className="text-xs text-white/30 font-mono">@{s.username}</p>
                        </div>
                        <div className="space-y-1.5 text-xs text-white/40">
                          <p className="flex items-center gap-2"><Mail size={11} />{s.email}</p>
                          {s.phone && <p className="flex items-center gap-2"><Phone size={11} />{s.phone}</p>}
                          <p className="flex items-center gap-2"><Briefcase size={11} />Joined {new Date(s.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                          {editingId === s.admin_id ? (
                            <>
                              <select
                                value={editRole}
                                onChange={e => setEditRole(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                              >
                                <option value="manager">Manager</option>
                                <option value="employee">Employee</option>
                              </select>
                              <button onClick={() => changeRole(s.admin_id, editRole)} className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold transition-all">Save</button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all"><X size={12} className="text-white/40" /></button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => { setEditingId(s.admin_id); setEditRole(s.role); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/50 hover:text-white transition-all"
                              >
                                <Edit3 size={11} /> Change Role
                              </button>
                              <button
                                onClick={() => removeAccess(s.admin_id, `${s.first_name} ${s.last_name}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-500/10 text-xs text-white/30 hover:text-red-400 transition-all"
                              >
                                <Trash2 size={11} /> Remove
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-8 rounded-[2rem] bg-[#0f0f0f] border border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-heading font-bold">Add Staff Member</h2>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                  <X size={16} className="text-white/40" />
                </button>
              </div>
              <form onSubmit={createStaff} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="First name *" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/50" />
                  <input placeholder="Last name" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/50" />
                </div>
                <input required placeholder="Username *" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/50" />
                <input required type="email" placeholder="Email *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/50" />
                <input required type="password" placeholder="Password *" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/50" />
                <input placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/50" />
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-600/50">
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
                <button type="submit" disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  {submitting ? 'Creating…' : 'Create Staff Member'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default ManagerTeam;
