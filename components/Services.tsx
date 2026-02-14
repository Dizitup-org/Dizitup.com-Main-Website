
import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Zap, Eye, Box, MousePointer2, Layers } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';

const BentoCard = ({ title, desc, icon: Icon, span, delay, onBook }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
    className={`${span} p-8 lg:p-12 rounded-[2.5rem] bg-[#0c0c0c] border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden flex flex-col justify-between min-h-[300px]`}
  >
    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
      <Icon className="w-32 h-32" />
    </div>
    
    <div className="relative z-10">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 mb-8 group-hover:text-red-500 transition-colors">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-3xl font-heading font-bold mb-4 tracking-tight">{title}</h3>
      <p className="text-white/30 font-light leading-relaxed max-w-xs text-sm">
        {desc}
      </p>
    </div>

    <div className="relative z-10 pt-8 mt-auto flex justify-between items-center">
      <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/20 group-hover:text-red-500/50 transition-colors">Phase_0{delay * 10 + 1}</span>
      <button
        onClick={() => onBook?.(title)}
        aria-label={`Proceed to booking for ${title}`}
        className="p-3 rounded-full bg-white/5 border border-white/10 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 focus:outline-none focus:ring-2 focus:ring-red-600/40"
      >
        <MousePointer2 className="w-4 h-4" />
      </button>
    </div>
  </motion.div>
);

const Services: React.FC = () => {
  const { openBooking } = useBooking();
  const cards = [
    {
      span: 'lg:col-span-2',
      title: 'AI Growth Retainer',
      desc: '₹10,000/month. 8–12 posts + 4 reels, captions/hashtags, basic WhatsApp/DM follow‑up automation, monthly growth suggestion.',
      icon: Cpu,
    },
    {
      span: 'lg:col-span-1',
      title: 'AI Business Kickstart',
      desc: '₹7,000–₹12,000 (7 days). Choose ONE: AI landing page, social starter pack (10 posts + 5 reels), or brand visual refresh.',
      icon: Box,
    },
    {
      span: 'lg:col-span-1',
      title: 'AI Automation Setup',
      desc: '₹5,000–₹8,000 (one-time). WhatsApp auto-replies, lead capture → Google Sheet, follow-up flow, simple CRM logic.',
      icon: Zap,
    },
    {
      span: 'lg:col-span-1',
      title: 'AI-Enhanced Website Development',
      desc: 'Starting from ₹10,000. Conversion-first, AI-assisted copy + structure, clean responsive build.',
      icon: Layers,
    },
    {
      span: 'lg:col-span-1',
      title: 'AI-Enhanced App Development',
      desc: 'Starting from ₹30,000. AI-assisted UX + development for fast launches and iteration.',
      icon: Cpu,
    },
    {
      span: 'lg:col-span-1',
      title: 'AI-Enhanced Content System',
      desc: 'Starting from ₹25,000. Video edits, graphic design, thumbnails, and a systematic content workflow.',
      icon: Eye,
    },
    {
      span: 'lg:col-span-1',
      title: 'AI Workflow Automations',
      desc: 'Custom (based on your needs). Connect tools, reduce manual work, and keep leads moving automatically.',
      icon: Zap,
    },
    {
      span: 'lg:col-span-1',
      title: 'AI Branding & Strategy',
      desc: 'Custom (based on your needs). Brand direction, positioning, and growth strategy with AI speed + human taste.',
      icon: Layers,
    },
  ];

  return (
    <section id="capabilities" className="py-40 px-6 lg:px-20 bg-black">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-20">
          <div>
            <span className="text-red-600 font-mono text-[10px] uppercase tracking-[0.5em] mb-4 block">Services</span>
            <h2 className="text-5xl lg:text-7xl font-heading font-bold tracking-tighter">What We Sell.</h2>
          </div>
          <p className="text-white/30 max-w-sm text-sm font-light">
            Clear packages, clear outcomes — built with AI speed and human polish.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <BentoCard
              key={card.title}
              span={card.span}
              title={card.title}
              desc={card.desc}
              icon={card.icon}
              delay={(i + 1) * 0.1}
              onBook={openBooking}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
