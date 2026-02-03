import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../utils/supabaseClient';
import { Loader2 } from 'lucide-react';

interface ClientRow {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  onboarded_at: string | null;
  status: string | null;
  projects?: { id: string }[] | null;
}

const AdminClients: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchClients = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('onboard_clients')
        .select(`
          id,
          company_name,
          contact_name,
          email,
          phone,
          onboarded_at,
          status,
          projects:projects_client_id_fkey ( id )
        `)
        .order('onboarded_at', { ascending: false });

      if (!isMounted) return;
      if (error) {
        console.error('[Clients] Fetch error', error)
        setError(error.message);
        setClients([]);
      } else {
        setClients(data as ClientRow[]);
      }
      setLoading(false);
    };
    fetchClients();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((c) =>
      (c.company_name || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term)
    );
  }, [clients, q]);

  return (
    <AdminLayout title="Clients">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold font-heading">Onboarded Clients</h2>
        <div className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by company or email"
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-red-600/50 w-72"
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-white/60"><Loader2 className="w-4 h-4 animate-spin" /> Loading clients…</div>
      )}
      {error && (
        <div className="text-red-400 text-sm mb-4">{error}</div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5">
              <tr className="text-left">
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Onboarded At</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Active Projects</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const activeProjects = c.projects?.length ?? 0;
                const date = c.onboarded_at ? new Date(c.onboarded_at) : null;
                return (
                  <tr
                    key={c.id}
                    className="border-t border-white/10 hover:bg-white/5 cursor-pointer"
                    onClick={() => navigate(`/admin/clients/${c.id}`)}
                  >
                    <td className="px-4 py-3 font-medium">{c.company_name || '—'}</td>
                    <td className="px-4 py-3">{c.contact_name || '—'}</td>
                    <td className="px-4 py-3">{c.email || '—'}</td>
                    <td className="px-4 py-3">{c.phone || '—'}</td>
                    <td className="px-4 py-3">{date ? date.toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      {c.status ? (
                        <span className={`px-2 py-1 rounded-full text-xs border ${c.status === 'Active' ? 'bg-green-500/10 border-green-500/20 text-green-300' : c.status === 'Paused' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300' : 'bg-white/5 border-white/10 text-white/60'}`}>{c.status}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">{activeProjects}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-white/50">No clients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && clients.length === 0 && (
        <p className="text-sm text-white/40 mt-4">No onboarded clients yet. Only paying/active clients appear here.</p>
      )}
    </AdminLayout>
  );
};

export default AdminClients;
