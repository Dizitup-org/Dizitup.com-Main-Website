import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Wallet, Boxes, LineChart, MessageSquare, HeadphonesIcon, PieChart, FileText, Lock, MoreHorizontal } from 'lucide-react';

const ERPDashboard = () => (
    <div className="w-[500px] lg:w-[650px] h-[520px] bg-[#0A0A0A] rounded-2xl border border-white/10 flex shadow-2xl shadow-blue-500/10 overflow-hidden relative font-sans">

        {/* Sidebar */}
        <div className="group w-14 hover:w-52 bg-white/[0.02] border-r border-white/10 flex flex-col py-6 z-50 transition-all duration-300 overflow-hidden shrink-0">
            <div className="px-4 mb-8 flex items-center w-52">
                <h2 className="font-bold tracking-tight text-sm flex items-center gap-3 w-52">
                    <Boxes className="w-5 h-5 text-blue-400 shrink-0" />
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white whitespace-nowrap">ERP Dashboard</span>
                </h2>
            </div>

            <div className="flex flex-col gap-1 px-2 flex-1 overflow-y-auto scrollbar-hide">
                {[
                    { i: LayoutDashboard, l: "Dashboard" },
                    { i: Wallet, l: "Finance" },
                    { i: Boxes, l: "Inventory", active: true },
                    { i: LineChart, l: "Sales" },
                    { i: MessageSquare, l: "Communications" },
                    { i: HeadphonesIcon, l: "Support" },
                    { i: PieChart, l: "Analytics" },
                    { i: FileText, l: "Reports" },
                ].map((item, i) => (
                    <div key={i} className={`text-xs px-3 py-2.5 rounded-xl cursor-pointer flex items-center gap-3 font-medium transition-all ${item.active ? 'bg-blue-500/15 text-blue-400' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
                        <item.i className={`w-4 h-4 shrink-0 ${item.active ? 'text-blue-400' : 'text-white/30'}`} />
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">{item.l}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Main Dashboard Area */}
        <div className="flex-1 p-4 grid grid-cols-3 grid-rows-3 gap-3 overflow-auto bg-[#0A0A0A]">

            {/* 1. Financial */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/[0.04] rounded-xl border border-white/10 p-4 hover:border-blue-500/30 transition-colors flex flex-col relative group">
                <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2 text-white/80 font-semibold text-xs">
                        <Lock className="w-3.5 h-3.5 text-white/30" /> Financial
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[9px] font-bold">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" /> Saved
                    </div>
                </div>
                <div className="text-white/30 text-[10px] font-medium mb-1">Revenue</div>
                <div className="text-xl font-bold text-white mb-3">$8.84K</div>
                <div className="flex-1 flex items-end gap-[2px] w-full h-10">
                    {[30, 20, 40, 30, 60, 45, 80, 55, 90, 75, 100, 85, 40, 60, 30, 50, 20].map((h, i) => (
                        <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} transition={{ duration: 0.5, delay: 0.2 + i * 0.02 }} className="flex-1 bg-blue-500/25 rounded-t-[2px] group-hover:bg-blue-500/40 transition-colors" />
                    ))}
                </div>
            </motion.div>

            {/* 2. Inventory Management */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/[0.04] rounded-xl border border-white/10 p-4 hover:border-white/20 transition-colors">
                <div className="flex justify-between items-center mb-3">
                    <div className="text-white/80 font-semibold text-xs">Inventory</div>
                    <MoreHorizontal className="w-4 h-4 text-white/20" />
                </div>
                <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                    <div>
                        <div className="text-white/30 text-[10px] font-medium mb-0.5">Expenses</div>
                        <div className="text-sm font-bold text-white">594.45K</div>
                        <div className="text-green-400 text-[9px] font-semibold mt-0.5">+12.5%</div>
                    </div>
                    <div>
                        <div className="text-white/30 text-[10px] font-medium mb-0.5">Supplier</div>
                        <div className="text-sm font-bold text-white">67.253K</div>
                        <div className="text-red-400 text-[9px] font-semibold mt-0.5">-3.2%</div>
                    </div>
                </div>
            </motion.div>

            {/* 3. Revenue */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/[0.04] rounded-xl border border-white/10 p-4 hover:border-white/20 transition-colors flex flex-col relative group">
                <div className="flex justify-between items-center mb-1">
                    <div className="text-white/80 font-semibold text-xs">Revenue</div>
                    <MoreHorizontal className="w-4 h-4 text-white/20" />
                </div>
                <div className="text-xl font-bold text-white mb-3">$68.00K</div>
                <div className="flex-1 flex items-end gap-[3px] w-full h-10">
                    {[30, 60, 45, 80, 100, 75, 40, 60, 30, 90, 50].map((h, i) => (
                        <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} transition={{ duration: 0.5, delay: 0.3 + i * 0.03 }} className={`flex-1 rounded-t-[3px] ${i === 4 || i === 9 ? 'bg-blue-500' : 'bg-blue-500/20 group-hover:bg-blue-500/35'} transition-colors duration-300`} />
                    ))}
                </div>
            </motion.div>

            {/* 4. Profit Margins */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/[0.04] rounded-xl border border-white/10 p-4 hover:border-white/20 transition-colors flex flex-col relative group">
                <div className="flex justify-between items-center mb-3">
                    <div className="text-white/80 font-semibold text-xs">Profit Margins</div>
                    <MoreHorizontal className="w-4 h-4 text-white/20" />
                </div>
                <div className="flex-1 relative h-20">
                    <div className="absolute left-0 top-0 bottom-2 flex flex-col justify-between text-[8px] text-white/20 font-mono">
                        <span>200</span><span>100</span><span>0</span>
                    </div>
                    <div className="absolute left-5 right-0 top-1 bottom-3 border-b border-white/10 overflow-hidden">
                        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} d="M0,80 C20,80 30,40 50,70 C70,100 80,20 100,50" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="50" cy="70" r="2" fill="#EF4444" />
                            <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }} d="M0,60 C20,60 30,20 50,50 C70,80 80,10 100,30" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="50" cy="50" r="2" fill="#3B82F6" />
                            <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }} d="M0,90 C20,90 30,70 50,85 C70,100 80,60 100,75" fill="none" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.8 }} className="absolute top-0 right-1 bg-white/10 text-white text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm border border-white/10 pointer-events-none">
                        +14.2%
                    </motion.div>
                </div>
            </motion.div>

            {/* 5. Sales Volume */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white/[0.04] rounded-xl border border-white/10 p-4 hover:border-white/20 transition-colors flex flex-col relative group">
                <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2 text-white/80 font-semibold text-xs">
                        <LineChart className="w-3.5 h-3.5 text-white/30" /> Sales
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-white/20" />
                </div>
                <div className="text-xl font-bold text-white mb-3 mt-1">123.00K</div>
                <div className="flex-1 flex items-end gap-[2px] w-full h-10">
                    {[10, 15, 10, 12, 18, 30, 20, 25, 40, 35, 60, 80, 75, 90, 100].map((h, i) => (
                        <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} transition={{ duration: 0.5, delay: 0.5 + i * 0.02 }} className={`flex-1 rounded-t-[2px] ${i > 10 ? 'bg-blue-500' : 'bg-blue-500/20 group-hover:bg-blue-500/35'} transition-colors duration-300`} />
                    ))}
                </div>
            </motion.div>

            {/* 6. Supplier Target */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white/[0.04] rounded-xl border border-white/10 p-4 hover:border-white/20 transition-colors flex flex-col relative group">
                <div className="flex justify-between items-center mb-2">
                    <div className="text-white/80 font-semibold text-xs">Supplier Target</div>
                    <MoreHorizontal className="w-4 h-4 text-white/20" />
                </div>
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <div className="text-white/30 text-[10px] font-medium">Sourcing</div>
                        <div className="text-base font-bold text-white">$62.20K</div>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-semibold text-white/40 bg-white/5 px-2 py-1 rounded-md">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" /> Missed
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 ml-1" /> Reached
                    </div>
                </div>
                <div className="flex items-end gap-[2px] h-8">
                    {[30, 20, 40, 30, 60, 45, 80, 55, 90, -10, 100, 85, 40, 60, 30].map((h, i) => {
                        if (h < 0) return <div key={i} className="flex-1 opacity-0 h-full" />;
                        return <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} transition={{ duration: 0.5, delay: 0.6 + i * 0.02 }} className={`flex-1 rounded-t-[2px] ${i === 8 || i === 10 ? 'bg-white/30' : 'bg-white/10 group-hover:bg-white/20'} transition-colors`} />;
                    })}
                </div>
            </motion.div>

            {/* 7. Sales Targets */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-white/[0.04] rounded-xl border border-white/10 p-4 hover:border-white/20 transition-colors flex flex-col relative group">
                <div className="flex justify-between items-center mb-1">
                    <div className="text-white/80 font-semibold text-xs">Sales Targets</div>
                    <MoreHorizontal className="w-4 h-4 text-white/20" />
                </div>
                <div className="text-xl font-bold text-white mb-1">89.224</div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="px-2 py-0.5 rounded border border-green-500/30 bg-green-500/10 text-green-400 text-[9px] font-bold flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-green-400" /> Reached</div>
                    <div className="px-2 py-0.5 rounded border border-white/10 bg-white/5 text-white/40 text-[9px] font-bold flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-white/30" /> Pending</div>
                </div>
                <div className="flex-1 flex items-end gap-1 h-10">
                    {[20, 30, 10, 40, 20, 50, 60, 40, 90, 50, 100, 70, 80, 40, 50].map((h, i) => (
                        <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} transition={{ duration: 0.5, delay: 0.7 + i * 0.02 }} className={`flex-1 rounded-t-[2px] ${i === 8 || i === 10 || i === 12 ? 'bg-blue-500' : 'bg-blue-500/20 group-hover:bg-blue-500/35'} transition-colors duration-300`} />
                    ))}
                </div>
            </motion.div>

            {/* 8. Conversion */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="bg-white/[0.04] rounded-xl border border-white/10 p-4 hover:border-white/20 transition-colors flex flex-col justify-between">
                <div className="flex items-center gap-2 text-white/80 font-semibold text-xs mb-2">
                    <PieChart className="w-3.5 h-3.5 text-white/30" /> Conversion
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {[['Pipelines', '76.20K'], ['Customers', '479.0K'], ['Leads', '974K'], ['Cost', '12.00K']].map(([label, val]) => (
                        <div key={label}>
                            <div className="text-white/30 text-[9px] font-bold uppercase tracking-wider mb-0.5">{label}</div>
                            <div className="text-xs font-bold text-white">{val}</div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* 9. Operational Efficiency */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="bg-white/[0.04] rounded-xl border border-white/10 p-4 hover:border-white/20 transition-colors relative">
                <div className="flex justify-between items-center mb-2">
                    <div className="text-white/80 font-semibold text-xs">Efficiency</div>
                    <MoreHorizontal className="w-4 h-4 text-white/20" />
                </div>
                <div className="flex items-center justify-around h-20">
                    {/* Donut 1 */}
                    <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                            <motion.circle initial={{ strokeDasharray: "0 239" }} whileInView={{ strokeDasharray: "76 239" }} transition={{ duration: 1, ease: "easeOut" }} cx="50" cy="50" r="38" fill="none" stroke="#10B981" strokeWidth="12" strokeLinecap="round" />
                            <motion.circle initial={{ strokeDasharray: "0 239" }} whileInView={{ strokeDasharray: "48 239" }} transition={{ duration: 1, ease: "easeOut", delay: 0.5 }} cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="12" strokeLinecap="round" strokeDashoffset="-85" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-sm font-bold text-white">225%</span>
                        </div>
                    </div>
                    {/* Donut 2 */}
                    <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                            <motion.circle initial={{ strokeDasharray: "0 239" }} whileInView={{ strokeDasharray: "143 239" }} transition={{ duration: 1.5, ease: "easeOut" }} cx="50" cy="50" r="38" fill="none" stroke="#3B82F6" strokeWidth="12" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-sm font-bold text-white">184%</span>
                        </div>
                    </div>
                </div>
            </motion.div>

        </div>
    </div>
);

export default ERPDashboard;
