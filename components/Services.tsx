import React from 'react';
import { motion } from 'framer-motion';
import { Users, Settings, BarChart3, Check, ArrowUpRight, Star } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';
import TiltCard from './TiltCard';

interface SystemCard {
  id: string;
  badge: string;
  title: string;
  tagline: string;
  icon: React.ReactNode;
  problem: string;
  solution: string;
  benefits: string[];
  deliverables: string[];
  result: string;
  popular?: boolean;
}

const SYSTEMS: SystemCard[] = [
  {
    id: 'acquisition',
    badge: 'System 01',
    title: 'AI Customer Acquisition System',
    tagline: 'Generate qualified customers — consistently.',
    icon: <Users className="w-7 h-7" />,
    problem: 'Your business relies on referrals and inconsistent outreach. You have no predictable way to generate qualified leads month after month.',
    solution: 'We deploy an automated customer acquisition engine that attracts, captures, and converts your ideal clients — while you focus on running your business.',
    benefits: [
      'More qualified leads every month',
      'Faster customer response times',
      'Higher conversion rates',
      'Reduced manual prospecting',
      'Better customer experience from first touch',
    ],
    deliverables: [
      'Business Audit & ICP Definition',
      'High-Converting Landing Page',
      'Lead Capture & CRM Setup',
      'WhatsApp / Email Automation',
      'Conversion Tracking & Analytics',
      'Launch Support',
    ],
    result: 'Clients typically see a 40–60% increase in qualified leads within 60 days of launch.',
  },
  {
    id: 'operations',
    badge: 'System 02',
    title: 'AI Business Operations System',
    tagline: 'Automate operations. Eliminate manual work.',
    icon: <Settings className="w-7 h-7" />,
    problem: 'Your team spends hours on repetitive tasks — follow-ups, data entry, reporting, client onboarding. Manual work slows you down and increases errors.',
    solution: 'We map your business processes and build intelligent automation systems that handle the repetitive work, freeing your team to focus on high-value activities.',
    benefits: [
      'Reduced manual work by 70%+',
      'Faster client onboarding',
      'Fewer errors and missed follow-ups',
      'Real-time operational visibility',
      'Scalable systems that grow with you',
    ],
    deliverables: [
      'Business Process Audit',
      'Workflow Automation Setup',
      'CRM & Pipeline Configuration',
      'Client Onboarding System',
      'KPI Dashboard',
      'Automated Reporting',
    ],
    result: 'Clients reclaim an average of 20+ hours per week previously spent on manual tasks.',
  },
  {
    id: 'growth-partner',
    badge: 'System 03',
    title: 'AI Growth Partner',
    tagline: 'A recurring partnership built for continuous growth.',
    icon: <BarChart3 className="w-7 h-7" />,
    problem: 'One-off projects don\'t drive sustained growth. You need a partner who understands your business deeply and drives measurable improvement every single month.',
    solution: 'We embed into your business as your dedicated AI Growth Partner — running both acquisition and operations systems, reporting results, and continuously optimizing for revenue growth.',
    benefits: [
      'Predictable revenue growth month-over-month',
      'Full-stack AI business systems',
      'Weekly performance reviews',
      'Proactive strategy, not reactive fixes',
      'One partner for everything growth',
    ],
    deliverables: [
      'Everything in Systems 01 & 02',
      'Monthly Executive Growth Report',
      'Weekly KPI Reviews',
      'Revenue & Lead Tracking',
      'Continuous Optimization',
      'Priority Support & Consulting',
    ],
    result: 'Our Growth Partners see consistent improvement across revenue, leads, and operational efficiency over 6–12 months.',
    popular: true,
  },
];

const SystemCard: React.FC<{ system: SystemCard; index: number; onBook: (name: string) => void }> = ({ system, index, onBook }) => (
  <TiltCard className="flex flex-col h-full">
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      className={`relative flex flex-col h-full rounded-[2rem] border transition-all duration-500 overflow-hidden ${
        system.popular
          ? 'bg-gradient-to-b from-white/[0.06] to-white/[0.02] border-red-600/40 shadow-[0_0_80px_-20px_rgba(220,38,38,0.3)]'
          : 'bg-white/[0.02] border-white/8 hover:border-white/20'
      }`}
    >
      {/* Popular badge */}
      {system.popular && (
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />
      )}
      {system.popular && (
        <div className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 border border-red-500/30 rounded-full">
          <Star className="w-2.5 h-2.5 text-red-400 fill-red-400" />
          <span className="text-[9px] font-black uppercase tracking-widest text-red-400">Premium Partner</span>
        </div>
      )}

      <div className="p-7 sm:p-10 flex flex-col flex-grow">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className={`p-3 rounded-2xl ${system.popular ? 'bg-red-600/20 text-red-400' : 'bg-white/5 text-white/50'}`}>
              {system.icon}
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/25">{system.badge}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-white mb-2">{system.title}</h3>
          <p className={`text-sm font-medium ${system.popular ? 'text-red-400' : 'text-white/40'}`}>{system.tagline}</p>
        </div>

        {/* Problem */}
        <div className="mb-6 p-4 rounded-xl bg-white/[0.025] border border-white/5">
          <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/25 block mb-2">The Problem</span>
          <p className="text-sm text-white/50 leading-relaxed font-light">{system.problem}</p>
        </div>

        {/* Solution */}
        <div className="mb-6">
          <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/25 block mb-2">Our Solution</span>
          <p className="text-sm text-white/70 leading-relaxed">{system.solution}</p>
        </div>

        {/* Business Benefits */}
        <div className="mb-6">
          <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/25 block mb-3">Business Benefits</span>
          <div className="space-y-2">
            {system.benefits.map((benefit, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${system.popular ? 'bg-red-600 text-white' : 'bg-white/8 text-red-500'}`}>
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span className="text-xs text-white/60 leading-snug">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Deliverables */}
        <div className="mb-6">
          <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/25 block mb-3">What You Receive</span>
          <div className="flex flex-wrap gap-2">
            {system.deliverables.map((item, i) => (
              <span
                key={i}
                className={`text-[10px] px-2.5 py-1 rounded-full border font-medium ${
                  system.popular
                    ? 'bg-red-600/10 border-red-500/20 text-red-400/80'
                    : 'bg-white/[0.03] border-white/8 text-white/40'
                }`}
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Expected Result */}
        <div className={`mb-8 p-4 rounded-xl border ${system.popular ? 'bg-red-600/[0.06] border-red-500/15' : 'bg-white/[0.02] border-white/5'}`}>
          <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/25 block mb-1.5">Expected Results</span>
          <p className={`text-xs leading-relaxed font-medium ${system.popular ? 'text-red-400/80' : 'text-white/40'}`}>{system.result}</p>
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onBook(system.title)}
          className={`mt-auto w-full py-4 rounded-full font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            system.popular
              ? 'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_30px_-5px_rgba(220,38,38,0.4)]'
              : 'bg-white/[0.05] border border-white/10 text-white hover:bg-white/10 hover:border-white/20'
          }`}
        >
          Book Free Growth Audit
          <ArrowUpRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  </TiltCard>
);

const Services: React.FC = () => {
  const { openBooking } = useBooking();

  return (
    <section id="growth-systems" className="py-16 sm:py-28 lg:py-40 px-4 sm:px-6 lg:px-8 bg-transparent relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-red-600/[0.03] blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/10 rounded-full mb-8">
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/50">Three Flagship Systems</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-heading font-bold tracking-tighter mb-6">
              Growth <span className="text-white/20 italic font-light">Systems.</span>
            </h2>
            <p className="text-base sm:text-lg text-white/40 font-light leading-relaxed max-w-xl mx-auto">
              We don't sell services. We deploy structured AI business growth systems — each engineered to solve a specific business challenge and deliver measurable outcomes.
            </p>
          </motion.div>
        </div>

        {/* System Cards */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-7xl mx-auto">
          {SYSTEMS.map((system, i) => (
            <SystemCard
              key={system.id}
              system={system}
              index={i}
              onBook={openBooking}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
