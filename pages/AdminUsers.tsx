import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';
import { Search, Users, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../utils/apiClient';
import toast from 'react-hot-toast';

interface Lead {
  id: string;
  name: string;
  agency_size: string;
  country: string;
  created_at: string;
}

const AdminUsers: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; users: Lead[] }>('/api/admin/users');
      setLeads(res.users || []);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

    const filtered = search.trim()
    ? leads.filter(
        (l) =>
          l.name?.toLowerCase().includes(search.toLowerCase()) ||
          l.country?.toLowerCase().includes(search.toLowerCase())
      )
    : leads;

  return (
    <AdminLayout title="Users">
      <div className="p-10 space-y-8">

        {/* Header row */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-heading font-bold text-white">Visitor Leads</h2>
            <p className="text-white/40 text-sm mt-1">
              {loading ? '…' : `${leads.length} visitor lead${leads.length !== 1 ? 's' : ''} captured`}
            </p>
          </div>
          <button
            onClick={fetchLeads}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stat card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center gap-5 max-w-xs"
        >
          <div className="p-3 rounded-2xl bg-red-600/10 text-red-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Visitor Leads</p>
            <p className="text-3xl font-heading font-bold text-white">{leads.length}</p>
          </div>
        </motion.div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            type="text"
            placeholder="Search by name or country…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-red-600/50 transition-colors"
          />
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-24 text-white/30">
              <Loader2 className="w-6 h-6 animate-spin mr-3" />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 text-white/30 text-sm">
              {search ? 'No results match your search.' : 'No visitor leads yet.'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-widest">
                  <th className="text-left px-6 py-4 font-semibold">Name</th>
                  <th className="text-left px-6 py-4 font-semibold">Agency Size</th>
                  <th className="text-left px-6 py-4 font-semibold">Country</th>
                  <th className="text-left px-6 py-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, i) => (
                  <tr
                    key={lead.id}
                    className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${
                      i === filtered.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-white">{lead.name || '—'}</td>
                    <td className="px-6 py-4 text-white/60">{lead.agency_size || '—'}</td>
                    <td className="px-6 py-4 text-white/60">{lead.country || '—'}</td>
                    <td className="px-6 py-4 text-white/40">
                      {lead.created_at
                        ? new Date(lead.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>

      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
