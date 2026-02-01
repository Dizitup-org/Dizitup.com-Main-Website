
import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import AdminScanner from '../components/AdminScanner';
import AdminUsers from '../components/AdminUsers';
import { Activity, Zap, ShieldCheck, Cpu, Terminal, Inbox, RefreshCw } from 'lucide-react';

const AdminOverview: React.FC = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLeads = () => {
    setIsRefreshing(true);
    const stored = JSON.parse(localStorage.getItem('dizitup_leads') || '[]');
    setLeads(stored);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  useEffect(() => {
    fetchLeads();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchLeads, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AdminLayout title="System Overview">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Executive Card */}
          <div className="p-12 premium-card overflow-hidden relative group">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-xl bg-black/30 backdrop-blur-md border border-white/10">
                  <Terminal className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-white/50">Executive Node Alpha</span>
              </div>
              <h2 className="text-5xl font-heading font-bold mb-6 tracking-tighter">System Intelligence</h2>
              <p className="text-white/70 max-w-lg leading-relaxed mb-12 text-lg font-light">
                Monitoring <span className="text-white font-bold">14</span> autonomous growth agents. Global success rate is at <span className="text-white font-bold">99.2%</span>.
              </p>
              <button className="px-10 py-4 bg-black text-white rounded-2xl font-bold hover:scale-105 transition-all text-[10px] uppercase tracking-widest shadow-2xl">
                Execute Performance Audit
              </button>
            </div>
          </div>

          {/* Incoming Audits (Dynamic) */}
          <div className="p-10 premium-card">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-red-600/10 flex items-center justify-center">
                  <Inbox className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-heading">Lead Intake Feed</h3>
                  <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-1">Sourced from Landing Page Audit</p>
                </div>
              </div>
              <button 
                onClick={fetchLeads}
                className={`p-3 rounded-full hover:bg-white/5 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="w-4 h-4 text-white/40" />
              </button>
            </div>
            
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {leads.length > 0 ? leads.map((audit) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={audit.id} 
                    className="flex items-center justify-between p-6 glass-panel transition-all group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-bold text-sm shadow-xl">
                        {audit.name ? audit.name[0] : 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-base tracking-tight">{audit.name || 'Anonymous Lead'}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black mt-1">
                          {audit.niche} • {audit.bottleneck} • <span className="text-red-500/60">{audit.revenue}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-600/10 text-red-500 border border-red-600/20 mb-2">
                        {audit.status}
                      </span>
                      <p className="text-[10px] text-white/20 font-mono tracking-tighter">{audit.email}</p>
                    </div>
                  </motion.div>
                )) : (
                  <div className="py-20 text-center opacity-20">
                     <p className="text-sm font-bold uppercase tracking-widest">No leads captured in current session</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-8">
           {[
             { label: 'Neural Activity', value: '42.8%', icon: Cpu },
             { label: 'System Uptime', value: '99.9%', icon: ShieldCheck },
             { label: 'Throughput', value: '1.2GB/s', icon: Zap },
           ].map((stat, i) => (
             <div key={i} className="p-8 premium-card text-center group transition-all">
                <stat.icon className="w-6 h-6 text-red-600 mx-auto mb-4 group-hover:scale-125 transition-transform" />
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">{stat.label}</p>
                <p className="text-3xl font-heading font-bold">{stat.value}</p>
             </div>
           ))}

             <div className="p-8 premium-card">
              <h4 className="text-sm font-black uppercase tracking-widest text-red-500 mb-6">Security Logs</h4>
              <div className="space-y-4">
                 {[
                   'Terminal node authenticated',
                   'Encryption layer active',
                   'Lead sync completed',
                   'Audit v4.2 patched'
                 ].map((log, i) => (
                   <div key={i} className="flex gap-3 text-[10px] font-mono text-white/20">
                      <span className="text-red-500/40">[{10 + i}:42:0{i}]</span>
                      <span>{log}</span>
                   </div>
                 ))}
              </div>
           </div>

              <AdminScanner />
              <AdminUsers />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOverview;
