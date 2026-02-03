import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../utils/supabaseClient';
import { Loader2 } from 'lucide-react';

interface SaleRow {
  paid_amount?: number | null;
  pending_amount?: number | null;
  expenses?: number | null;
}

interface ProjectRow {
  id: string;
  title?: string | null;
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  total_amount?: number | null;
  sales?: SaleRow[] | null;
}

interface ClientDetailRow {
  id: string;
  company_name?: string | null;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  onboarded_at?: string | null;
  status?: string | null;
  projects?: ProjectRow[] | null;
}

type TabKey = 'overview' | 'projects' | 'finance';

const AdminClientDetail: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<ClientDetailRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('overview');

  useEffect(() => {
    let isMounted = true;
    const fetchClient = async () => {
      if (!clientId) return;
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('onboard_clients')
        .select(`
          *,
          projects:projects_client_id_fkey (
            id,
            title,
            status,
            start_date,
            end_date,
            total_amount,
            sales:sales_project_id_fkey (
              paid_amount,
              pending_amount,
              expenses
            )
          )
        `)
        .eq('id', clientId)
        .single();

      if (!isMounted) return;
      if (error) {
        console.error('[ClientDetail] Fetch error', error)
        setError(error.message);
        setClient(null);
      } else {
        setClient(data as ClientDetailRow);
      }
      setLoading(false);
    };
    fetchClient();
    return () => { isMounted = false; };
  }, [clientId]);

  const date = client?.onboarded_at ? new Date(client.onboarded_at) : null;

  return (
    <AdminLayout title="Client Details">
      {loading && (
        <div className="flex items-center gap-2 text-white/60"><Loader2 className="w-4 h-4 animate-spin" /> Loading client…</div>
      )}
      {error && (
        <div className="text-red-400 text-sm">{error}</div>
      )}

      {!loading && !error && client && (
        <div className="space-y-8">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-white/10">
            {([
              { k: 'overview', label: 'Overview' },
              { k: 'projects', label: 'Projects' },
              { k: 'finance', label: 'Finance' },
            ] as { k: TabKey; label: string }[]).map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === t.k ? 'border-red-600 text-white' : 'border-transparent text-white/60 hover:text-white'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Overview */}
          {tab === 'overview' && (
            <section>
              <h2 className="text-lg font-bold mb-4 font-heading">Client Info</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-white/40">Company Name</p>
                  <p className="text-base font-medium">{client.company_name || '—'}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-white/40">Contact Name</p>
                  <p className="text-base font-medium">{client.contact_name || '—'}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-white/40">Email</p>
                  <p className="text-base font-medium">{client.email || '—'}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-white/40">Phone</p>
                  <p className="text-base font-medium">{client.phone || '—'}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-white/40">Onboarded Date</p>
                  <p className="text-base font-medium">{date ? date.toLocaleDateString() : '—'}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-white/40">Status</p>
                  <p className="text-base font-medium">{client.status || '—'}</p>
                </div>
              </div>
            </section>
          )}

          {/* Projects */}
          {tab === 'projects' && (
            <section>
              <h2 className="text-lg font-bold mb-4 font-heading">Projects</h2>
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/5">
                    <tr className="text-left">
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Start</th>
                      <th className="px-4 py-3">End</th>
                      <th className="px-4 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(client.projects || []).map((p) => {
                      const start = p.start_date ? new Date(p.start_date) : null;
                      const end = p.end_date ? new Date(p.end_date) : null;
                      return (
                        <tr key={p.id} className="border-t border-white/10">
                          <td className="px-4 py-3">{p.title || '—'}</td>
                          <td className="px-4 py-3">{p.status || '—'}</td>
                          <td className="px-4 py-3">{start ? start.toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3">{end ? end.toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3">{typeof p.total_amount === 'number' ? p.total_amount.toLocaleString() : '—'}</td>
                        </tr>
                      );
                    })}
                    {(!client.projects || client.projects.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-white/50">No projects yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Finance */}
          {tab === 'finance' && (
            <section>
              <h2 className="text-lg font-bold mb-4 font-heading">Payments & Profit</h2>
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/5">
                    <tr className="text-left">
                      <th className="px-4 py-3">Project</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Paid</th>
                      <th className="px-4 py-3">Pending</th>
                      <th className="px-4 py-3">Expenses</th>
                      <th className="px-4 py-3">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(client.projects || []).map((p) => {
                      const total = p.total_amount || 0;
                      const paid = (p.sales?.reduce((acc, s) => acc + (s.paid_amount || 0), 0)) || 0;
                      const pending = (p.sales?.reduce((acc, s) => acc + (s.pending_amount || 0), 0)) || 0;
                      const expenses = (p.sales?.reduce((acc, s) => acc + (s.expenses || 0), 0)) || 0;
                      const profit = total - expenses;
                      return (
                        <tr key={p.id} className="border-t border-white/10">
                          <td className="px-4 py-3">{p.title || p.id}</td>
                          <td className="px-4 py-3">{total.toLocaleString()}</td>
                          <td className="px-4 py-3">{paid.toLocaleString()}</td>
                          <td className="px-4 py-3">{pending.toLocaleString()}</td>
                          <td className="px-4 py-3">{expenses.toLocaleString()}</td>
                          <td className="px-4 py-3">{profit.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                    {(!client.projects || client.projects.length === 0) && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-white/50">No finance data yet — no projects.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}

      {!loading && !error && !client && (
        <p className="text-sm text-white/40">Client not found or access denied.</p>
      )}
    </AdminLayout>
  );
};

export default AdminClientDetail;
