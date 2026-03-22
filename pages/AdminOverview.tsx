
import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import AdminScanner from '../components/AdminScanner';
import {
  TrendingUp, Users, FolderOpen, DollarSign,
  ArrowRight, Calendar, ShoppingBag, UserCheck,
  Briefcase, RefreshCw,
} from 'lucide-react';
import { getSalesOverview, type SalesOverview } from '../utils/clientsApi';
import { api } from '../utils/apiClient';

const fmt = (n: number) =>
  n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : n >= 1000
    ? `₹${(n / 1000).toFixed(0)}K`
    : `₹${n.toFixed(0)}`;

const num = (v: any) => parseFloat(v) || 0;

interface ActivityEntry {
  id: string;
  type: 'booking' | 'client' | 'project' | 'sale';
  title: string;
  subtitle: string;
  created_at: string;
}

const typeConfig = {
  booking:  { icon: Calendar,     label: 'Booking',  color: 'text-blue-400',  bg: 'bg-blue-500/10'  },
  client:   { icon: UserCheck,    label: 'Client',   color: 'text-green-400', bg: 'bg-green-500/10' },
  project:  { icon: Briefcase,    label: 'Project',  color: 'text-purple-400',bg: 'bg-purple-500/10'},
  sale:     { icon: ShoppingBag,  label: 'Sale',     color: 'text-red-400',   bg: 'bg-red-500/10'   },
};

const AdminOverview: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [salesStats, setSalesStats] = useState<SalesOverview | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [queryCount, setQueryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projectPipeline, setProjectPipeline] = useState<Record<string, number>>({});

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const [overviewRes, salesRes, bookingsRes, clientsRes, projectsRes, salesListRes, queryRes] =
        await Promise.all([
          api.get('/api/admin/overview') as any,
          getSalesOverview(),
          api.get('/api/admin/bookings') as any,
          api.get('/api/admin/clients/onboarded') as any,
          api.get('/api/admin/projects') as any,
          api.get('/api/admin/sales') as any,
          api.get('/api/admin/clients/query') as any,
        ]);

      setOverview(overviewRes.data || overviewRes);
      setSalesStats(salesRes.data);
      setQueryCount((queryRes.clients || []).length);

      // Compute project pipeline counts from status
      const allProjects: any[] = projectsRes.projects || [];
      const statusCounts: Record<string, number> = {};
      allProjects.forEach((p: any) => {
        const s = p.status || 'unknown';
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });
      setProjectPipeline(statusCounts);

      const entries: ActivityEntry[] = [
        ...(bookingsRes.bookings || []).map((b: any) => ({
          id: b.id,
          type: 'booking' as const,
          title: b.name || 'Unknown',
          subtitle: b.project_type || b.agency || 'New booking',
          created_at: b.created_at,
        })),
        ...(clientsRes.clients || []).map((c: any) => ({
          id: c.id,
          type: 'client' as const,
          title: c.contact_name || c.company_name || 'Client',
          subtitle: c.company_name || c.email || 'Onboarded',
          created_at: c.onboarded_at || c.created_at,
        })),
        ...(projectsRes.projects || []).map((p: any) => ({
          id: p.id,
          type: 'project' as const,
          title: p.project_name || p.title || 'Project',
          subtitle: p.brand_name || p.client_name || 'New project',
          created_at: p.created_at,
        })),
        ...(salesListRes.sales || []).map((s: any) => ({
          id: s.id,
          type: 'sale' as const,
          title: s.client_name || 'Sale',
          subtitle: `${s.service || ''} · ${fmt(num(s.amount))}`,
          created_at: s.created_at,
        })),
      ];

      entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setActivity(entries.slice(0, 5));
    } catch (err) {
      console.error('Overview load error:', err);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const bk = overview?.bookings ?? {};
  const metrics = [
    {
      label: 'Total Leads',
      value: num(bk.total_bookings),
      display: String(num(bk.total_bookings)),
      icon: Users,
      sub: `${num(bk.pending)} pending`,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Onboarded Clients',
      value: num(overview?.total_clients),
      display: String(num(overview?.total_clients)),
      icon: UserCheck,
      sub: `${num(overview?.active_clients)} active`,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Active Projects',
      value: num(overview?.active_projects),
      display: String(num(overview?.active_projects)),
      icon: FolderOpen,
      sub: `${num(overview?.total_projects)} total`,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Total Revenue',
      value: num(overview?.total_revenue),
      display: fmt(num(overview?.total_revenue)),
      icon: DollarSign,
      sub: `${fmt(num(overview?.total_collected))} collected`,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
  ];

  const pipeline = [
    { label: 'Bookings',         count: num(bk.total_bookings) },
    { label: 'Query Clients',    count: queryCount             },
    { label: 'Onboarded',        count: num(overview?.total_clients) },
    { label: 'Projects',         count: num(overview?.total_projects) },
  ];

  return (
    <AdminLayout title="Command Overview">
      {loading ? (
        <div className="flex items-center justify-center py-40">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-10 h-10 border-2 border-white/10 border-t-red-600 rounded-full"
          />
        </div>
      ) : (
        <div className="space-y-8">

          {/* ── TOP METRICS ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="p-6 premium-card relative overflow-hidden group"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 ${m.bg} blur-3xl opacity-40 pointer-events-none`} />
                <div className={`w-10 h-10 rounded-2xl ${m.bg} flex items-center justify-center mb-4`}>
                  <m.icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">{m.label}</p>
                <p className="text-3xl font-heading font-bold tracking-tighter">{m.display}</p>
                <p className="text-[10px] text-white/20 font-mono mt-1">{m.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* ── LEAD PIPELINE ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-8 premium-card"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold font-heading">Lead Pipeline</h3>
                <p className="text-[9px] text-white/20 font-mono uppercase tracking-widest mt-0.5">Conversion funnel overview</p>
              </div>
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
                {num(overview?.conversion_rate).toFixed(1)}% conversion
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pipeline.map((stage, i) => (
                <React.Fragment key={stage.label}>
                  <div className="flex-1">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center group hover:border-red-600/30 transition-all">
                      <p className="text-2xl font-heading font-bold">{stage.count}</p>
                      <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mt-1">{stage.label}</p>
                    </div>
                  </div>
                  {i < pipeline.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-white/10 flex-shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </motion.div>

          {/* ── PROJECT PIPELINE ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            className="p-8 premium-card"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold font-heading">Project Pipeline</h3>
                <p className="text-[9px] text-white/20 font-mono uppercase tracking-widest mt-0.5">Projects by execution status</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { key: 'sent_to_manager',   label: 'Sent to Manager',   color: 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400' },
                { key: 'assigned_to_staff', label: 'Assigned to Staff', color: 'border-blue-500/20 bg-blue-500/5 text-blue-400' },
                { key: 'under_execution',   label: 'Under Execution',   color: 'border-orange-500/20 bg-orange-500/5 text-orange-400' },
                { key: 'completed',         label: 'Completed',         color: 'border-green-500/20 bg-green-500/5 text-green-400' },
              ].map((stage, i, arr) => (
                <React.Fragment key={stage.key}>
                  <div className={`flex-1 p-4 rounded-2xl border text-center group hover:opacity-90 transition-all ${stage.color}`}>
                    <p className="text-2xl font-heading font-bold">{projectPipeline[stage.key] ?? 0}</p>
                    <p className="text-[9px] font-mono uppercase tracking-widest mt-1 opacity-70">{stage.label}</p>
                  </div>
                  {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-white/10 flex-shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          </motion.div>

          {/* ── MAIN CONTENT ── */}
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Recent Activity */}
            <div className="lg:col-span-2 space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-8 premium-card"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold font-heading">Recent Activity</h3>
                    <p className="text-[9px] text-white/20 font-mono uppercase tracking-widest mt-0.5">Latest system events</p>
                  </div>
                  <button
                    onClick={() => load(true)}
                    className={`p-2.5 rounded-full hover:bg-white/5 transition-all ${refreshing ? 'animate-spin' : ''}`}
                  >
                    <RefreshCw className="w-4 h-4 text-white/30" />
                  </button>
                </div>

                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {activity.length > 0 ? activity.map((entry) => {
                      const cfg = typeConfig[entry.type];
                      return (
                        <motion.div
                          layout
                          key={entry.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-between p-5 glass-panel group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-2xl ${cfg.bg} flex items-center justify-center`}>
                              <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                            </div>
                            <div>
                              <p className="font-bold text-sm tracking-tight">{entry.title}</p>
                              <p className="text-[10px] text-white/30 font-mono mt-0.5">{entry.subtitle}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.color} border border-current/20`}>
                              {cfg.label}
                            </span>
                            <p className="text-[10px] text-white/20 font-mono mt-1">
                              {new Date(entry.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    }) : (
                      <div className="py-16 text-center opacity-20">
                        <p className="text-sm font-bold uppercase tracking-widest">No recent activity</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">

              {/* Sales Snapshot */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="p-8 premium-card"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-red-600/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold font-heading">Sales Snapshot</h4>
                    <p className="text-[9px] text-white/20 font-mono uppercase tracking-widest">Revenue metrics</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Revenue This Month', value: fmt(num(salesStats?.monthly_revenue)) },
                    { label: 'Avg Project Value',  value: fmt(num(salesStats?.avg_sale))        },
                    { label: 'Active Retainers',   value: String(num(salesStats?.active_retainers)) },
                    { label: 'Total Sales',        value: String(num(salesStats?.total_sales_count)) },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-baseline">
                      <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{row.label}</p>
                      <p className="text-lg font-heading font-bold">{row.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Booking Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-8 premium-card"
              >
                <h4 className="text-sm font-bold font-heading mb-4">Booking Breakdown</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Pending',   count: num(bk.pending),   color: 'bg-yellow-500' },
                    { label: 'Accepted',  count: num(bk.accepted),  color: 'bg-green-500'  },
                    { label: 'Follow-up', count: num(bk.follow_up), color: 'bg-blue-500'   },
                    { label: 'Rejected',  count: num(bk.rejected),  color: 'bg-red-500'    },
                  ].map((row) => {
                    const total = num(bk.total_bookings) || 1;
                    const pct = (row.count / total) * 100;
                    return (
                      <div key={row.label}>
                        <div className="flex justify-between mb-1">
                          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{row.label}</p>
                          <p className="text-[10px] font-mono text-white/50">{row.count}</p>
                        </div>
                        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
                            className={`h-full rounded-full ${row.color}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              <AdminScanner />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOverview;
