import React from 'react';
import { motion } from 'framer-motion';
import { Users, LayoutGrid, TrendingUp, Mail } from 'lucide-react';

const CRMDashboard = () => (
    <div className="w-[500px] lg:w-[650px] h-[550px] bg-[#0A0A0A] rounded-2xl border border-white/10 flex shadow-2xl shadow-pink-500/10 overflow-hidden relative">
        {/* Sidebar */}
        <div className="w-48 bg-white/[0.02] border-r border-white/10 flex flex-col py-6 px-4 gap-6 relative z-10 shrink-0">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-pink-500/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-pink-400" />
                </div>
                <span className="text-white font-bold text-sm tracking-widest uppercase">CRM Dashboard</span>
            </div>
            <div className="flex flex-col gap-1">
                <div className="text-white/30 text-[10px] uppercase tracking-widest font-bold mb-2 pl-2">Workspace</div>
                {['Dashboard', 'Contacts', 'Pipeline', 'Campaigns'].map((item, i) => (
                    <div key={i} className={`text-xs px-3 py-2.5 rounded-lg cursor-pointer flex items-center gap-2 font-medium transition-all ${i === 2 ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
                        {i === 0 && <LayoutGrid className="w-3.5 h-3.5" />}
                        {i === 1 && <Users className="w-3.5 h-3.5" />}
                        {i === 2 && <TrendingUp className="w-3.5 h-3.5" />}
                        {i === 3 && <Mail className="w-3.5 h-3.5" />}
                        {item}
                    </div>
                ))}
            </div>
        </div>
        {/* Main Content */}
        <div className="flex-1 p-6 flex flex-col gap-4 relative z-10 overflow-hidden">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-white font-bold tracking-wide">Sales Pipeline</h3>
                <div className="px-4 py-1.5 bg-pink-500 border border-pink-400 text-black font-bold text-[10px] uppercase tracking-widest rounded-full cursor-pointer hover:bg-pink-400 transition-colors shadow-[0_0_10px_rgba(236,72,153,0.3)]">
                    New Deal
                </div>
            </div>
            {/* Kanban Columns */}
            <div className="flex gap-4 h-full">
                {[
                    { name: 'Lead', color: 'bg-white/10', items: [ {c: 'Acme Corp', v: '$12k'}, {c: 'Stark Ind.', v: '$45k'} ] },
                    { name: 'Qualified', color: 'bg-pink-500/20 text-pink-400', items: [ {c: 'Wayne Ent.', v: '$150k'}, {c: 'Cyberdyne', v: '$85k'} ] },
                    { name: 'Negotiation', color: 'bg-yellow-500/20 text-yellow-500', items: [ {c: 'Globex', v: '$32k'} ] }
                ].map((col, cIdx) => (
                    <div key={cIdx} className="flex-1 flex flex-col gap-3">
                        <div className="flex items-center justify-between pointer-events-none">
                            <span className="text-white/60 text-[10px] uppercase tracking-widest font-bold">{col.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-mono ${col.color}`}>{col.items.length}</span>
                        </div>
                        <div className="flex-1 bg-white/[0.01] border border-white/5 rounded-xl p-2 flex flex-col gap-2">
                            {col.items.map((deal, i) => (
                                <motion.div 
                                    key={i} 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + cIdx * 0.15 + i * 0.1 }}
                                    className="bg-white/5 border border-white/10 p-3 rounded-lg hover:border-pink-500/40 transition-colors shadow-sm cursor-grab"
                                >
                                    <div className="text-white text-xs font-bold mb-2">{deal.c}</div>
                                    <div className="flex justify-between items-end">
                                        <div className="flex -space-x-1">
                                            <div className="w-4 h-4 rounded-full bg-gray-600 border border-gray-800" />
                                            <div className="w-4 h-4 rounded-full bg-gray-500 border border-gray-800" />
                                        </div>
                                        <div className="text-pink-400 font-mono text-[10px]">{deal.v}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default CRMDashboard;
