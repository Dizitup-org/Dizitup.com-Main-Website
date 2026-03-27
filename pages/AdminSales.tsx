
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Calendar, Plus, X, Trash2, Edit2, Loader2, RefreshCw } from 'lucide-react';
import { getAdminSales, addAdminSale, updateAdminSale, deleteAdminSale, getAdminProjects, getSalesOverview, getSalesChart, getSalesServiceMix, type AdminSaleEntry, type ProjectOption, type SalesOverview, type SalesChartPoint } from '../utils/clientsApi';
import { broadcastSalesUpdate } from '../utils/salesEvents';
import toast from 'react-hot-toast';

// ============ STAT CARD ============
const StatCard = ({ label, value, change, icon: Icon, delay, trend = 'up' }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="p-6 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden group hover:border-red-600/30 transition-all duration-300"
  >
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
      <Icon className="w-16 h-16" />
    </div>
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 rounded-xl bg-red-600/10 text-red-600">
        <Icon className="w-5 h-5" />
      </div>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trend === 'up' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
        {change}
      </span>
    </div>
    <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">{label}</h3>
    <p className="text-3xl font-heading font-bold text-white">{value}</p>
  </motion.div>
);

// ============ ADD/EDIT SALE MODAL ============
interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sale: Omit<AdminSaleEntry, 'id' | 'created_at'>) => Promise<void>;
  editSale?: AdminSaleEntry | null;
}

const SaleModal: React.FC<SaleModalProps> = ({ isOpen, onClose, onSubmit, editSale }) => {
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [formData, setFormData] = useState({
    project_id: '',
    client_name: '',
    service: '',
    amount: '',
    type: 'Retainer' as 'Retainer' | 'One-time' | 'Consulting',
    status: 'Paid' as 'Paid' | 'Pending',
    sale_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Fetch projects when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    const { data, error } = await getAdminProjects();
    if (error) {
      toast.error(`Failed to load projects: ${error}`);
    } else {
      setProjects(data || []);
    }
    setLoadingProjects(false);
  };

  useEffect(() => {
    if (editSale) {
      setFormData({
        project_id: editSale.project_id,
        client_name: editSale.client_name,
        service: editSale.service,
        amount: String(editSale.amount),
        type: editSale.type,
        status: editSale.status,
        sale_date: editSale.sale_date,
        notes: editSale.notes || ''
      });
    } else {
      setFormData({
        project_id: '',
        client_name: '',
        service: '',
        amount: '',
        type: 'Retainer',
        status: 'Paid',
        sale_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
  }, [editSale, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id || !formData.service || !formData.amount) {
      toast.error('Please fill all required fields');
      return;
    }
    
    if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const selectedProject = projects.find(p => p.id === formData.project_id);
    if (!selectedProject) {
      toast.error('Please select a valid project');
      return;
    }
    
    setSubmitting(true);
    try {
      await onSubmit({
        project_id: formData.project_id,
        client_name: selectedProject.client_name || selectedProject.title || 'Unknown',
        service: formData.service.trim(),
        amount: parseFloat(formData.amount),
        type: formData.type,
        status: formData.status,
        sale_date: formData.sale_date,
        notes: formData.notes.trim()
      });
      // Note: Modal will be closed by the parent component's handleAddSale function
    } catch (error) {
      console.error('Error submitting sale:', error);
      // Modal stays open so user can retry
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-red-600 transition-all";
  const labelClass = "block text-xs font-bold uppercase tracking-widest text-white/40 mb-2";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editSale ? 'Edit Sale' : 'Add New Sale'}</h2>
              <button onClick={onClose} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Project *</label>
                  {loadingProjects ? (
                    <div className={inputClass + ' flex items-center justify-center text-white/40'}>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading projects...
                    </div>
                  ) : (
                    <select
                      value={formData.project_id}
                      onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                      className={inputClass + ' [&>option]:bg-[#1a1a1a] [&>option]:text-white'}
                      required
                    >
                      <option value="">Select Project...</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.display_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Service *</label>
                  <input
                    type="text"
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className={inputClass}
                    placeholder="e.g., Growth Retainer"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Amount (₹) *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className={inputClass}
                    placeholder="150000"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Sale Date</label>
                  <input
                    type="date"
                    value={formData.sale_date}
                    onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className={inputClass + ' [&>option]:bg-[#1a1a1a] [&>option]:text-white'}
                  >
                    <option value="Retainer">Retainer</option>
                    <option value="One-time">One-time</option>
                    <option value="Consulting">Consulting</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className={inputClass + ' [&>option]:bg-[#1a1a1a] [&>option]:text-white'}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={inputClass + ' resize-none'}
                  rows={2}
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-xl bg-white/5 text-white/60 font-bold hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editSale ? 'Update Sale' : 'Add Sale'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============ SERVICE MIX COLOR MAP ============
const SERVICE_MIX_COLORS: Record<string, string> = {
  Retainers: 'bg-red-600',
  Retainer: 'bg-red-600',
  'One-time': 'bg-white',
  Consulting: 'bg-white/20',
};

// ============ MAIN COMPONENT ============
const AdminSales: React.FC = () => {
  const [sales, setSales] = useState<AdminSaleEntry[]>([]);
  const [overview, setOverview] = useState<SalesOverview | null>(null);
  const [chartData, setChartData] = useState<SalesChartPoint[]>([]);
  const [serviceMix, setServiceMix] = useState<Array<{ label: string; value: number; color: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<AdminSaleEntry | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'Weekly' | 'Monthly'>('Weekly');

  const loadSales = useCallback(async () => {
    const { data, error } = await getAdminSales();
    if (error) toast.error(error);
    else setSales(data || []);
  }, []);

  const loadOverview = useCallback(async () => {
    const { data } = await getSalesOverview();
    if (data) setOverview(data);
  }, []);

  const loadChart = useCallback(async (period: 'Weekly' | 'Monthly') => {
    const { data } = await getSalesChart(period);
    if (data) setChartData(data);
  }, []);

  const loadServiceMix = useCallback(async () => {
    const { data } = await getSalesServiceMix();
    if (data) setServiceMix(data.map(item => ({ ...item, color: SERVICE_MIX_COLORS[item.label] ?? 'bg-white/20' })));
  }, []);

  const refreshAll = useCallback(async () => {
    return Promise.all([loadSales(), loadOverview(), loadChart(chartPeriod), loadServiceMix()]);
  }, [loadSales, loadOverview, loadChart, loadServiceMix, chartPeriod]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    refreshAll().finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch chart when period toggles
  useEffect(() => {
    loadChart(chartPeriod);
  }, [chartPeriod, loadChart]);

  // ============ HANDLERS ============
  const handleAddSale = async (saleData: Omit<AdminSaleEntry, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await addAdminSale(saleData);
      if (error) {
        toast.error(`Failed to add sale: ${error}`);
        throw new Error(error);
      }
      if (data) {
        setModalOpen(false);
        setEditingSale(null);
        toast.success('Sale added successfully!', { icon: '💰', duration: 3000 });
        broadcastSalesUpdate({ type: 'add', sale: data });
        await refreshAll();
      }
    } catch (error) {
      console.error('Error adding sale:', error);
    }
  };

  const handleUpdateSale = async (saleData: Omit<AdminSaleEntry, 'id' | 'created_at'>) => {
    if (!editingSale) return;
    const { error } = await updateAdminSale(editingSale.id!, saleData);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Sale updated successfully!');
      setEditingSale(null);
      setModalOpen(false);
      broadcastSalesUpdate({ type: 'update', saleId: editingSale.id });
      await refreshAll();
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (!confirm('Delete this sale entry?')) return;
    const { error } = await deleteAdminSale(id);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Sale deleted');
      broadcastSalesUpdate({ type: 'delete', saleId: id });
      await refreshAll();
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <AdminLayout title="Sales Dashboard">
      <div className="space-y-10">
        {/* Header with Add Button */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white/40 text-sm">Manage and track all sales manually</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setLoading(true);
                refreshAll().finally(() => setLoading(false));
              }}
              className="px-4 py-2 rounded-xl bg-white/5 text-white/60 font-bold hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button
              onClick={() => { setEditingSale(null); setModalOpen(true); }}
              className="px-6 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Sale
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Revenue"
            value={formatCurrency(overview?.total_revenue ?? 0)}
            change={overview ? `${overview.total_sales_count} sales` : '0 sales'}
            icon={DollarSign}
            delay={0.1}
          />
          <StatCard
            label="Monthly Rev"
            value={formatCurrency(overview?.monthly_revenue ?? 0)}
            change="This month"
            icon={TrendingUp}
            delay={0.2}
          />
          <StatCard
            label="Active Retainers"
            value={String(overview?.active_retainers ?? 0)}
            change={serviceMix[0] ? `${serviceMix[0].value}%` : '0%'}
            icon={Users}
            delay={0.3}
          />
          <StatCard
            label="Avg. Sale"
            value={formatCurrency(overview?.avg_sale ?? 0)}
            change="Per sale"
            icon={Calendar}
            delay={0.4}
          />
        </div>

        {/* Chart Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-8 rounded-[40px] bg-white/5 border border-white/10">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xl font-bold font-heading">Revenue Performance</h2>
              <div className="flex gap-2">
                {(['Weekly', 'Monthly'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setChartPeriod(t)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      t === chartPeriod ? 'bg-red-600 text-white' : 'bg-white/5 text-white/40 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[300px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#b91c1c" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#b91c1c" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} dx={-10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number | undefined) => value ? [`₹${value.toLocaleString()}`, 'Revenue'] : ['-', 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#b91c1c" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-white/30">
                  No sales data yet. Add your first sale!
                </div>
              )}
            </div>
          </div>

          <div className="p-8 rounded-[40px] bg-white/5 border border-white/10">
            <h2 className="text-xl font-bold font-heading mb-6">Service Mix</h2>
            <div className="space-y-6">
              {serviceMix.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-widest text-white/60">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                      className={`h-full ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="p-8 rounded-[40px] bg-white/5 border border-white/10 overflow-hidden">
          <h2 className="text-xl font-bold font-heading mb-8">Recent Sales</h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No sales recorded yet</p>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-4 px-6 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
              >
                Add First Sale
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-white/30 text-[10px] uppercase tracking-widest font-bold border-b border-white/5">
                    <th className="pb-4 font-bold">Client Name</th>
                    <th className="pb-4 font-bold">Service</th>
                    <th className="pb-4 font-bold">Amount</th>
                    <th className="pb-4 font-bold">Type</th>
                    <th className="pb-4 font-bold">Status</th>
                    <th className="pb-4 font-bold">Date</th>
                    <th className="pb-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="group hover:bg-white/5 transition-colors">
                      <td className="py-4">
                        <p className="font-bold text-sm">{sale.client_name}</p>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-white/60">{sale.service}</p>
                      </td>
                      <td className="py-4">
                        <p className="font-bold text-sm">₹{sale.amount.toLocaleString()}</p>
                      </td>
                      <td className="py-4">
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                          sale.type === 'Retainer' ? 'bg-red-600/10 text-red-500' :
                          sale.type === 'Consulting' ? 'bg-blue-600/10 text-blue-500' :
                          'bg-white/10 text-white'
                        }`}>
                          {sale.type}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`flex items-center gap-1.5 text-xs font-medium ${sale.status === 'Paid' ? 'text-green-500' : 'text-amber-500'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${sale.status === 'Paid' ? 'bg-green-500' : 'bg-amber-500'}`} />
                          {sale.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <p className="text-xs text-white/30 font-medium">{sale.sale_date}</p>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingSale(sale); setModalOpen(true); }}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSale(sale.id!)}
                            className="p-2 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <SaleModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingSale(null); }}
        onSubmit={editingSale ? handleUpdateSale : handleAddSale}
        editSale={editingSale}
      />
    </AdminLayout>
  );
};

export default AdminSales;
