import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Wallet, Boxes, LineChart, MessageSquare, HeadphonesIcon, PieChart, FileText, Lock, MoreHorizontal } from 'lucide-react';

const ERPDashboard = () => (
    <section className="py-20 sm:py-32 lg:py-40 px-4 sm:px-6 relative overflow-visible">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/[0.03] blur-[150px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
      
      <div className="container mx-auto relative">

        {/* Dashboard */}
        <div className="w-full min-w-[700px] lg:min-w-[850px] xl:min-w-[950px] bg-[#28282B] rounded-2xl  flex shadow-2xl shadow-black/5 overflow-hidden relative font-sans text-gray-900 scale-90 lg:scale-[0.85] xl:scale-90 origin-right translate-x-4 lg:translate-x-6">
        
        {/* Sidebar */}
        <div className="group absolute top-0 left-0 h-full w-16 hover:w-56 bg-[#28282B] border-r border-gray-100 flex flex-col py-6 z-50 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <div className="px-6 mb-8 flex items-center w-56">
                <h2 className="font-bold text-gray-900 tracking-tight text-lg flex items-center gap-4">
                    <Boxes className="w-6 h-6 text-blue-600 shrink-0" /> <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white">ERP Dashboard</span>
                </h2>
            </div>
            
            <div className="flex flex-col gap-2 px-3 flex-1 overflow-y-auto w-56 scrollbar-hide">
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
                    <div key={i} className={`text-sm px-3.5 py-3 rounded-xl cursor-pointer flex items-center gap-4 font-medium transition-all ${item.active ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                        <item.i className={`w-5 h-5 shrink-0 ${item.active ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">{item.l}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Main Dashboard Area */}
        <div className="flex-1 p-5 grid grid-cols-3 grid-rows-3 gap-3 sm:gap-4 relative z-10 overflow-auto bg-[#28282B] ml-16 min-h-[400px] sm:min-h-[500px]">
            
            {/* 1. Financial */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl border border-gray-100 p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] transition-shadow flex flex-col relative group">
                <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2 text-gray-800 font-semibold text-sm">
                        <Lock className="w-3.5 h-3.5 text-gray-400" /> Financial
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Saved
                    </div>
                </div>
                <div className="text-gray-400 text-[10px] font-medium mb-1">Revenue</div>
                <div className="text-xl font-bold text-gray-900 mb-4">$8.84K</div>
                <div className="flex-1 flex items-end gap-1 w-full mx-auto h-16 max-w-[180px]">
                    {[30, 20, 40, 30, 60, 45, 80, 55, 90, 75, 100, 85, 40, 60, 30, 50, 20].map((h, i) => (
                        <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} transition={{ duration: 0.5, delay: 0.2 + i * 0.02 }} className="flex-1 bg-blue-100 rounded-t-[2px] group-hover:bg-blue-200 transition-colors" />
                    ))}
                </div>
            </motion.div>

            {/* 2. Inventory Management */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl border border-gray-100 p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] transition-shadow col-span-1">
                <div className="flex justify-between items-center mb-4">
                    <div className="text-gray-800 font-semibold text-sm">Inventory Management</div>
                    <MoreHorizontal className="w-4 h-4 text-gray-300" />
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                    <div>
                        <div className="text-gray-400 text-[10px] font-medium mb-0.5">Expenses</div>
                        <div className="text-base font-bold text-gray-900">594.45K</div>
                        <div className="text-green-500 text-[9px] font-semibold mt-0.5">+12.5%</div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-[10px] font-medium mb-0.5">Supplier</div>
                        <div className="text-base font-bold text-gray-900">67.253K</div>
                        <div className="text-red-500 text-[9px] font-semibold mt-0.5">-3.2%</div>
                    </div>
                </div>
            </motion.div>

            {/* 3. Revenue Trend */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl border border-gray-100 p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] transition-shadow flex flex-col relative group">
                <div className="flex justify-between items-center mb-1">
                    <div className="text-gray-800 font-semibold text-sm">Revenue</div>
                    <MoreHorizontal className="w-4 h-4 text-gray-300" />
                </div>
                <div className="text-xl font-bold text-gray-900 mb-4">$68.00K</div>
                <div className="flex-1 flex items-end gap-1.5 w-full mx-auto h-16">
                    {[30, 60, 45, 80, 100, 75, 40, 60, 30, 90, 50].map((h, i) => (
                        <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} transition={{ duration: 0.5, delay: 0.3 + i * 0.03 }} className={`flex-1 rounded-t-[3px] ${i === 4 || i === 9 ? 'bg-blue-500' : 'bg-blue-100 group-hover:bg-blue-200'} transition-colors duration-300`} />
                    ))}
                </div>
            </motion.div>

            {/* 4. Profit Margins */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-xl border border-gray-100 p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] transition-shadow col-span-1 flex flex-col relative group">
                <div className="flex justify-between items-center mb-4">
                    <div className="text-gray-800 font-semibold text-sm">Profit Margins</div>
                    <MoreHorizontal className="w-4 h-4 text-gray-300" />
                </div>
                <div className="flex-1 w-full mx-auto relative flex items-center justify-center h-full">
                    {/* Y Axis labels */}
                    <div className="absolute left-0 top-0 bottom-4 flex flex-col justify-between text-[8px] text-gray-300 font-mono">
                        <span>200</span>
                        <span>100</span>
                        <span>0</span>
                    </div>
                    {/* Chart Container */}
                    <div className="absolute left-6 right-0 top-2 bottom-4 border-b border-gray-100 flex items-end overflow-hidden">
                        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                            {/* Line 1 (Red/Pink) */}
                            <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} d="M0,80 C20,80 30,40 50,70 C70,100 80,20 100,50" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="50" cy="70" r="2" fill="#EF4444" />
                            {/* Line 2 (Blue) */}
                            <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }} d="M0,60 C20,60 30,20 50,50 C70,80 80,10 100,30" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="50" cy="50" r="2" fill="#2563EB" />
                            {/* Line 3 (Light Blue) */}
                            <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }} d="M0,90 C20,90 30,70 50,85 C70,100 80,60 100,75" fill="none" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    {/* Tooltip */}
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.8 }} className="absolute top-2 right-4 bg-gray-800 text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none">
                        +14.2%
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45" />
                    </motion.div>
                </div>
            </motion.div>

            {/* 5. Sales Volume */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-xl border border-gray-100 p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] transition-shadow col-span-1 flex flex-col relative group">
                <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2 text-gray-800 font-semibold text-sm">
                        <LineChart className="w-3.5 h-3.5 text-gray-400" /> Sales
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-gray-300" />
                </div>
                <div className="text-xl font-bold text-gray-900 mb-4 mt-2">123.00K</div>
                <div className="flex-1 flex items-end gap-[3px] w-full mx-auto h-16">
                    {[10, 15, 10, 12, 18, 30, 20, 25, 40, 35, 60, 80, 75, 90, 100].map((h, i) => (
                        <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} transition={{ duration: 0.5, delay: 0.5 + i * 0.02 }} className={`flex-1 rounded-t-[2px] ${i > 10 ? 'bg-blue-500' : 'bg-blue-100 group-hover:bg-blue-200'} transition-colors duration-300`} />
                    ))}
                </div>
            </motion.div>

            {/* 6. Supplier Target */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white rounded-xl border border-gray-100 p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] transition-shadow col-span-1 flex flex-col relative group">
                <div className="flex justify-between items-center mb-3">
                    <div className="text-gray-800 font-semibold text-sm">Supplier Target</div>
                    <MoreHorizontal className="w-4 h-4 text-gray-300" />
                </div>
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <div className="text-gray-400 text-[10px] font-medium">Sourcing</div>
                        <div className="text-xl font-bold text-gray-900">$62.20K</div>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" /> Missed
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 ml-1" /> Reached
                    </div>
                </div>
                <div className="flex-1 flex items-end gap-[2px] w-full mx-auto h-10">
                    {[30, 20, 40, 30, 60, 45, 80, 55, 90, -10, 100, 85, 40, 60, 30].map((h, i) => {
                        if (h < 0) return <div key={i} className="flex-1 opacity-0 h-full" />;
                        return <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} transition={{ duration: 0.5, delay: 0.6 + i * 0.02 }} className={`flex-1 rounded-t-[2px] ${i === 8 || i === 10 ? 'bg-gray-300' : 'bg-gray-100 group-hover:bg-gray-200'} transition-colors`} />;
                    })}
                </div>
            </motion.div>

            {/* 7. Deep Sales Insight */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-white rounded-xl border border-gray-100 p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] transition-shadow col-span-1 flex flex-col relative group">
                <div className="flex justify-between items-center mb-2">
                    <div className="text-gray-800 font-semibold text-sm">Sales Targets</div>
                    <MoreHorizontal className="w-4 h-4 text-gray-300" />
                </div>
                <div className="text-xl font-bold text-gray-900 mb-2">89.224</div>
                <div className="flex items-center gap-2 mb-4">
                    <div className="px-2 py-0.5 rounded border border-green-200 bg-green-50 text-green-600 text-[9px] font-bold flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-green-500" /> Reached</div>
                    <div className="px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-500 text-[9px] font-bold flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-gray-400" /> Pending</div>
                </div>
                <div className="flex-1 flex items-end gap-1 w-full mx-auto h-12">
                    {[20, 30, 10, 40, 20, 50, 60, 40, 90, 50, 100, 70, 80, 40, 50].map((h, i) => (
                        <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} transition={{ duration: 0.5, delay: 0.7 + i * 0.02 }} className={`flex-1 rounded-t-[2px] ${i === 8 || i === 10 || i === 12 ? 'bg-blue-500' : 'bg-blue-100 group-hover:bg-blue-200'} transition-colors duration-300`} />
                    ))}
                </div>
            </motion.div>

            {/* 8. Conversion Rates */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="bg-white rounded-xl border border-gray-100 p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] transition-shadow col-span-1 relative flex flex-col justify-between">
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-gray-800 font-semibold text-sm">
                        <PieChart className="w-3.5 h-3.5 text-gray-400" /> Conversion
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                        <div className="text-gray-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">Pipelines</div>
                        <div className="text-sm font-bold text-gray-900">76.20K</div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">Customers</div>
                        <div className="text-sm font-bold text-gray-900">479.0K</div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">Leads</div>
                        <div className="text-sm font-bold text-gray-900">974K</div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">Cost</div>
                        <div className="text-sm font-bold text-gray-900">12.00K</div>
                    </div>
                </div>
            </motion.div>

            {/* 9. Operational Efficiency (Donuts) */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="bg-white rounded-xl border border-gray-100 p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] transition-shadow col-span-1 relative">
                <div className="flex justify-between items-center mb-2">
                    <div className="text-gray-800 font-semibold text-sm">Operational Efficiency</div>
                    <MoreHorizontal className="w-4 h-4 text-gray-300" />
                </div>
                <div className="flex items-center justify-between h-24 px-4 w-full">
                    
                    {/* Donut 1 */}
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#F3F4F6" strokeWidth="12" />
                            {/* Segment 1 (Green) */}
                            <motion.circle initial={{ strokeDasharray: "0 251" }} whileInView={{ strokeDasharray: "80 251" }} transition={{ duration: 1, ease: "easeOut" }} cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="12" strokeLinecap="round" />
                            {/* Segment 2 (Yellow) */}
                            <motion.circle initial={{ strokeDasharray: "0 251" }} whileInView={{ strokeDasharray: "50 251" }} transition={{ duration: 1, ease: "easeOut", delay: 0.5 }} cx="50" cy="50" r="40" fill="none" stroke="#F59E0B" strokeWidth="12" strokeLinecap="round" strokeDashoffset="-90" />
                            {/* Segment 3 (Red) */}
                            <motion.circle initial={{ strokeDasharray: "0 251" }} whileInView={{ strokeDasharray: "30 251" }} transition={{ duration: 1, ease: "easeOut", delay: 1 }} cx="50" cy="50" r="40" fill="none" stroke="#EF4444" strokeWidth="12" strokeLinecap="round" strokeDashoffset="-150" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold text-gray-900">225%</span>
                            <span className="text-[8px] text-gray-400 font-bold">250% target</span>
                        </div>
                    </div>

                    {/* Donut 2 */}
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#F3F4F6" strokeWidth="12" />
                            <motion.circle initial={{ strokeDasharray: "0 251" }} whileInView={{ strokeDasharray: "150 251" }} transition={{ duration: 1.5, ease: "easeOut" }} cx="50" cy="50" r="40" fill="none" stroke="#3B82F6" strokeWidth="12" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold text-gray-900">184%</span>
                            <span className="text-[8px] text-gray-400 font-bold">22.0%</span>
                        </div>
                    </div>

                </div>
            </motion.div>

        </div>
        </div>
      </div>
    </section>
);

export default ERPDashboard;

