
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { SALES_DATA, REVENUE_CHART_DATA } from '../constants';
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';

const StatCard = ({ label, value, change, icon: Icon, delay }: any) => (
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
      <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">{change}</span>
    </div>
    <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">{label}</h3>
    <p className="text-3xl font-heading font-bold text-white">{value}</p>
  </motion.div>
);

const AdminSales: React.FC = () => {
  const totalRevenue = useMemo(() => {
    return SALES_DATA.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  }, []);

  return (
    <AdminLayout title="Sales Dashboard">
      <div className="space-y-10">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Total Revenue" value={totalRevenue} change="+12%" icon={DollarSign} delay={0.1} />
          <StatCard label="Monthly Rev" value="₹7.15L" change="+18%" icon={TrendingUp} delay={0.2} />
          <StatCard label="Active Retainers" value="12" change="+2" icon={Users} delay={0.3} />
          <StatCard label="Avg. Sale" value="₹1.2L" change="+5%" icon={Calendar} delay={0.4} />
        </div>

        {/* Chart Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-8 rounded-[40px] bg-white/5 border border-white/10">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xl font-bold font-heading">Revenue Performance</h2>
              <div className="flex gap-2">
                {['Weekly', 'Monthly'].map((t) => (
                  <button key={t} className={`px-4 py-1.5 rounded-full text-xs font-bold ${t === 'Weekly' ? 'bg-red-600 text-white' : 'bg-white/5 text-white/40 hover:text-white transition-colors'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_CHART_DATA}>
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
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#b91c1c" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-8 rounded-[40px] bg-white/5 border border-white/10">
            <h2 className="text-xl font-bold font-heading mb-6">Service Mix</h2>
            <div className="space-y-6">
              {[
                { label: 'Retainers', value: 65, color: 'bg-red-600' },
                { label: 'Starter Setups', value: 20, color: 'bg-white' },
                { label: 'Consulting', value: 15, color: 'bg-white/20' },
              ].map((item, i) => (
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
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {SALES_DATA.map((sale) => (
                  <tr key={sale.id} className="group hover:bg-white/5 transition-colors">
                    <td className="py-4">
                      <p className="font-bold text-sm">{sale.clientName}</p>
                    </td>
                    <td className="py-4">
                      <p className="text-sm text-white/60">{sale.service}</p>
                    </td>
                    <td className="py-4">
                      <p className="font-bold text-sm">₹{sale.amount.toLocaleString()}</p>
                    </td>
                    <td className="py-4">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${sale.type === 'Retainer' ? 'bg-red-600/10 text-red-500' : 'bg-white/10 text-white'}`}>
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
                      <p className="text-xs text-white/30 font-medium">{sale.date}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSales;
