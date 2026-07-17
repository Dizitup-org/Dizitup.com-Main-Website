import React from 'react';
import { motion } from 'framer-motion';
import {
  Search, Map, Layout, Globe, Database, MessageSquare,
  BarChart2, Target, Zap, FileText, Rocket, HeadphonesIcon
} from 'lucide-react';

const DELIVERABLES = [
  { icon: Search, label: 'Business Audit', desc: 'Deep-dive into your current customer journey, gaps, and growth opportunities.' },
  { icon: Map, label: 'Customer Journey Map', desc: 'Full mapping of how your customers discover, evaluate, and buy from you.' },
  { icon: Layout, label: 'Landing Page', desc: 'High-converting page engineered for lead capture and authority positioning.' },
  { icon: Globe, label: 'Business Website', desc: 'Professional, fast, conversion-optimized online presence for your brand.' },
  { icon: Database, label: 'CRM Setup', desc: 'Your customer pipeline organized, automated, and always up to date.' },
  { icon: MessageSquare, label: 'WhatsApp Integration', desc: 'Instant automated responses, follow-ups, and appointment booking via WhatsApp.' },
  { icon: BarChart2, label: 'Analytics Dashboard', desc: 'Real-time visibility into your traffic, leads, and business performance.' },
  { icon: Target, label: 'Conversion Tracking', desc: 'Know exactly which actions drive revenue — down to every click and form.' },
  { icon: Zap, label: 'Automation Workflows', desc: 'End-to-end automation for your most time-consuming business processes.' },
  { icon: FileText, label: 'Monthly Reporting', desc: 'Executive-level reports on growth, performance, and next steps.' },
  { icon: Rocket, label: 'Launch Support', desc: 'We stay with you through go-live to ensure everything performs from day one.' },
  { icon: HeadphonesIcon, label: 'Ongoing Optimization', desc: 'Continuous refinement based on data to keep your systems compounding results.' },
];

const Deliverables: React.FC = () => {
  return (
    <section className="py-16 sm:py-28 lg:py-40 bg-transparent relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-red-600/[0.03] blur-[140px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/10 rounded-full mb-8">
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/50">What Every Client Receives</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-heading font-bold tracking-tighter mb-6">
              Your <span className="text-white/20 italic font-light">Deliverables.</span>
            </h2>
            <p className="text-base sm:text-lg text-white/40 font-light leading-relaxed max-w-xl mx-auto">
              No ambiguity. No surprises. Here is exactly what you receive when you partner with Dizitup — built, configured, and ready to drive growth.
            </p>
          </motion.div>
        </div>

        {/* Deliverables Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-w-6xl mx-auto">
          {DELIVERABLES.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                className="group p-4 sm:p-6 rounded-[1.25rem] sm:rounded-[1.5rem] bg-white/[0.02] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.04] transition-all duration-400 flex flex-col gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-red-600/10 flex items-center justify-center text-red-500 group-hover:bg-red-600/20 group-hover:scale-110 transition-all duration-300">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1 leading-tight">{item.label}</h4>
                  <p className="text-xs text-white/30 font-light leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Deliverables;
