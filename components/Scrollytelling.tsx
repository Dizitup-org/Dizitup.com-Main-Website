import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Settings, BarChart3, ArrowRight } from 'lucide-react';

const SYSTEMS = [
  {
    id: 'acquisition',
    label: 'System 01',
    title: 'AI Customer Acquisition',
    subtitle: 'Turn strangers into paying clients — automatically.',
    description:
      'Most businesses struggle with unpredictable lead flow. We build an end-to-end customer acquisition engine that attracts, captures, and converts your ideal clients on autopilot — so you have a consistent pipeline every month.',
    benefits: [
      { label: 'More Qualified Leads', value: '+60%' },
      { label: 'Faster Response Time', value: '< 5 min' },
      { label: 'Higher Conversion Rate', value: '+35%' },
      { label: 'Cost Per Lead Reduction', value: '−40%' },
    ],
    icon: Users,
    accentColor: 'rgba(220,38,38,0.12)',
    position: 'left',
  },
  {
    id: 'operations',
    label: 'System 02',
    title: 'AI Business Operations',
    subtitle: 'Eliminate manual work. Scale without adding headcount.',
    description:
      'Manual processes are the silent growth killer. We audit your business, map every workflow, and deploy intelligent automation that handles repetitive tasks — giving your team back the time to focus on revenue-generating work.',
    benefits: [
      { label: 'Hours Saved Weekly', value: '20+' },
      { label: 'Manual Tasks Automated', value: '80%' },
      { label: 'Faster Client Onboarding', value: '3×' },
      { label: 'Operational Errors', value: '−90%' },
    ],
    icon: Settings,
    accentColor: 'rgba(220,38,38,0.08)',
    position: 'right',
  },
  {
    id: 'growth-partner',
    label: 'System 03',
    title: 'AI Growth Partner',
    subtitle: 'A strategic partner, not a one-off vendor.',
    description:
      'Sustainable growth requires ongoing strategy, optimization, and data. As your dedicated AI Growth Partner, we manage your acquisition and operations systems, report results monthly, and continuously refine for maximum revenue impact.',
    benefits: [
      { label: 'Revenue Growth (Monthly)', value: 'Tracked' },
      { label: 'Weekly KPI Reviews', value: 'Included' },
      { label: 'Strategy Sessions', value: 'Monthly' },
      { label: 'Dedicated Partner', value: 'Always On' },
    ],
    icon: BarChart3,
    accentColor: 'rgba(220,38,38,0.1)',
    position: 'left',
  },
];

const SystemShowcase: React.FC<{
  system: typeof SYSTEMS[0];
  index: number;
}> = ({ system, index }) => {
  const isRight = system.position === 'right';
  const Icon = system.icon;

  return (
    <div className={`w-full flex flex-col ${isRight ? 'lg:grid lg:grid-cols-2' : 'lg:grid lg:grid-cols-2'} gap-8 lg:gap-16 items-center`}>

      {/* Text Side */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className={`flex flex-col justify-center relative ${isRight ? 'lg:order-2' : ''}`}
      >
        {/* Background accent */}
        <div
          className="absolute -left-20 top-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[120px] -z-10 pointer-events-none"
          style={{ background: system.accentColor }}
        />

        <div className="inline-flex items-center gap-2 mb-5">
          <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-red-500">{system.label}</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-heading font-bold leading-[1.05] tracking-tight text-white mb-4">
          {system.title}.
        </h2>

        <p className="text-white/60 font-medium text-base sm:text-lg mb-5 leading-snug">
          {system.subtitle}
        </p>

        <p className="text-white/35 text-sm sm:text-base leading-relaxed max-w-[480px] mb-8 font-light">
          {system.description}
        </p>

        <a
          href="#growth-systems"
          className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.25em] text-white/40 hover:text-red-400 transition-colors group w-fit"
        >
          View Full System
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </a>
      </motion.div>

      {/* Visual Side — Business Metrics Panel */}
      <motion.div
        initial={{ opacity: 0, x: isRight ? -50 : 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className={`flex items-center justify-center w-full ${isRight ? 'lg:order-1 lg:justify-start' : 'lg:justify-end'}`}
      >
        <div className="w-full max-w-[440px] p-6 sm:p-8 rounded-[2rem] bg-white/[0.03] border border-white/8 backdrop-blur-sm">
          {/* Panel Header */}
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-red-600/15 flex items-center justify-center">
              <Icon className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/25">Business Impact</p>
              <p className="text-sm font-bold text-white">{system.title}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] font-mono text-white/25 uppercase tracking-widest">Active</span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {system.benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/5 group hover:border-red-600/20 transition-all"
              >
                <p className="text-xl sm:text-2xl font-heading font-black text-white mb-1 group-hover:text-red-400 transition-colors">
                  {b.value}
                </p>
                <p className="text-[10px] text-white/30 leading-snug font-light">{b.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mt-6 pt-5 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Avg. Client Results</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-400" />
                <span className="text-[10px] text-green-400/80 font-mono">Upward Trend</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Scrollytelling: React.FC = () => {
  return (
    <section className="bg-transparent w-full border-t border-white/5 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 relative z-20 space-y-24 sm:space-y-32 py-20 sm:py-32">
        {SYSTEMS.map((system, i) => (
          <SystemShowcase key={system.id} system={system} index={i} />
        ))}
      </div>
    </section>
  );
};

export default Scrollytelling;
