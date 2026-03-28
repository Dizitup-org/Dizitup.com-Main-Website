import React from 'react';
import { motion } from 'framer-motion';
import { Bell, TrendingUp, ArrowRight, Plus, Activity, LayoutGrid, Server, Search, LineChart, Settings } from 'lucide-react';

const MobileMockup = () => (
    <div className="w-[300px] h-[600px] bg-black rounded-[3rem] border-4 border-[#1a1a1a] shadow-2xl shadow-teal-500/10 p-5 relative overflow-hidden flex flex-col">
        {/* Hardware details */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#1a1a1a] rounded-b-2xl z-20 flex justify-center items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-black/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500/30" />
        </div>
        <div className="absolute top-2 w-full left-0 px-6 flex justify-between items-center z-10 pointer-events-none">
            <span className="text-white/60 text-[10px] font-medium">9:41</span>
            <div className="flex items-center gap-1">
                <div className="w-3 h-2.5 bg-white/60 rounded-[2px]" />
                <div className="w-3.5 h-2.5 bg-white/60 rounded-[2px]" />
            </div>
        </div>
        
        {/* App Content */}
        <div className="pt-10 pb-4 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center overflow-hidden">
                    <img src="https://i.pravatar.cc/100?img=3" alt="avatar" className="w-full h-full object-cover opacity-80" />
                </div>
                <div>
                    <div className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Welcome back</div>
                    <div className="text-white text-sm font-semibold">Alex Rivera</div>
                </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10 relative">
                <Bell className="w-4 h-4 text-white/80" />
                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-teal-400 rounded-full" />
            </div>
        </div>
        
        {/* Balance Card */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/20 rounded-3xl p-5 mb-6 relative overflow-hidden mt-2">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-teal-500/20 blur-2xl rounded-full" />
            <div className="text-white/60 text-xs font-medium mb-1 relative z-10">Total Portfolio</div>
            <div className="text-white text-3xl font-mono font-bold tracking-tight relative z-10">$142,850.00</div>
            <div className="flex items-center gap-1 mt-3 relative z-10">
                <div className="bg-teal-500/20 text-teal-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +12.5%
                </div>
                <span className="text-white/40 text-[10px]">this month</span>
            </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="flex gap-4 mb-6 px-1">
            {[
                { i: ArrowRight, l: "Send" },
                { i: Plus, l: "Add" },
                { i: Activity, l: "Trade" },
                { i: LayoutGrid, l: "More" }
            ].map((action, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                        <action.i className="w-5 h-5 text-teal-400" />
                    </div>
                    <span className="text-white/60 text-[10px] font-medium">{action.l}</span>
                </div>
            ))}
        </div>

        {/* Transactions */}
        <div className="flex-1 flex flex-col bg-white/[0.02] border border-white/5 rounded-t-3xl p-5 mx--5 -mb-5 relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-white text-sm font-semibold">Recent Activity</h4>
                <span className="text-teal-400 text-[10px] font-bold">See All</span>
            </div>
            <div className="flex flex-col gap-4 overflow-y-auto">
                {[
                    { n: "Stripe Payout", c: "Business", v: "+$4,250", p: true },
                    { n: "AWS Services", c: "Infrastructure", v: "-$840", p: false },
                    { n: "Notion Team", c: "Software", v: "-$120", p: false }
                ].map((item, i) => (
                    <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 + i * 0.1 }} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50">
                                {item.p ? <TrendingUp className="w-4 h-4 text-teal-400" /> : <Server className="w-4 h-4 text-white/50" />}
                            </div>
                            <div>
                                <div className="text-white text-sm font-medium">{item.n}</div>
                                <div className="text-white/40 text-[10px]">{item.c}</div>
                            </div>
                        </div>
                        <div className={`font-mono text-xs font-bold ${item.p ? 'text-teal-400' : 'text-white'}`}>{item.v}</div>
                    </motion.div>
                ))}
            </div>
        </div>
        
        {/* Floating Bottom Nav */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-16 bg-[#111]/90 backdrop-blur-md rounded-full border border-white/10 flex justify-between items-center px-6 z-20 shadow-2xl">
            <LayoutGrid className="w-5 h-5 text-teal-400" />
            <Search className="w-5 h-5 text-white/40" />
            <LineChart className="w-5 h-5 text-white/40" />
            <Settings className="w-5 h-5 text-white/40" />
        </div>
    </div>
);

export default MobileMockup;
