import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2, FileText, TrendingUp, Users, Globe, Megaphone, Lightbulb, Calendar } from 'lucide-react';

const REPORTS = [
  { icon: BarChart2, title: 'Weekly KPI Reviews', desc: 'A focused review of your core metrics — leads, conversions, revenue, and operational performance — every week.' },
  { icon: FileText, title: 'Monthly Executive Reports', desc: 'Board-ready growth reports summarizing progress, performance, and strategic recommendations for the month.' },
  { icon: TrendingUp, title: 'Revenue Tracking', desc: 'Real-time visibility into how your growth systems are contributing to bottom-line revenue — month over month.' },
  { icon: Users, title: 'Lead Pipeline Tracking', desc: 'Full funnel visibility from first touch to closed deal — so you always know where your leads stand.' },
  { icon: Megaphone, title: 'Marketing Performance', desc: 'Performance data across your content, campaigns, and channels — with clear ROI attribution.' },
  { icon: Globe, title: 'Website Performance', desc: 'Traffic, engagement, and conversion metrics from your digital touchpoints — updated continuously.' },
  { icon: Lightbulb, title: 'Growth Recommendations', desc: 'Data-backed recommendations for what to improve, test, or expand next — delivered with every report.' },
  { icon: Calendar, title: '30-Day Growth Plan', desc: 'A rolling 30-day action plan so you always know exactly what we\'re executing and why.' },
];

const Reporting: React.FC = () => {
  return (
    <section className="py-16 sm:py-28 lg:py-40 bg-transparent relative overflow-hidden">
      <div className="absolute bottom-0 right-1/4 w-[700px] h-[500px] bg-red-600/[0.03] blur-[140px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">

          {/* Left — Header */}
          <div className="lg:col-span-4 lg:sticky lg:top-40 h-fit">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-red-600 font-black tracking-[0.4em] text-[10px] uppercase mb-6 block">Every Growth Partner Client Receives</span>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-heading font-bold mb-6 sm:mb-8 leading-tight tracking-tight">
                Transparent <br /> Reporting.
              </h2>
              <p className="text-white/40 text-base sm:text-lg font-light leading-relaxed mb-8">
                You should always know exactly what's happening in your business. We provide complete reporting — not just activity updates, but real business intelligence that informs decisions.
              </p>

              {/* Indicator */}
              <div className="inline-flex items-center gap-3 px-4 py-3 bg-white/[0.03] border border-white/8 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                <p className="text-[11px] text-white/40 font-mono leading-relaxed">
                  Included with every AI Growth Partner plan — no additional cost.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right — Reporting Items */}
          <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4 sm:gap-5">
            {REPORTS.map((report, i) => {
              const Icon = report.icon;
              return (
                <motion.div
                  key={report.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                  className="group p-5 sm:p-6 rounded-[1.25rem] sm:rounded-[1.75rem] bg-white/[0.02] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.03] transition-all duration-400"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center text-red-400 group-hover:bg-red-600/20 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1.5">{report.title}</h4>
                      <p className="text-xs sm:text-sm text-white/35 font-light leading-relaxed">{report.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Reporting;
