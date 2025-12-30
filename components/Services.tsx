
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Cpu, Zap, Eye, Box, MousePointer2, Layers } from 'lucide-react';

const BentoCard = ({ title, desc, icon: Icon, span, delay }: any) => (
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
      <Link to="/book" className="p-3 rounded-full bg-white/5 border border-white/10 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
        <MousePointer2 className="w-4 h-4" />
      </Link>
    </div>
  </motion.div>
);

const Services: React.FC = () => {
  return (
    <section id="capabilities" className="py-40 px-6 lg:px-20 bg-black">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-20">
          <div>
            <span className="text-red-600 font-mono text-[10px] uppercase tracking-[0.5em] mb-4 block">System Capabilities</span>
            <h2 className="text-5xl lg:text-7xl font-heading font-bold tracking-tighter">Bento Intelligence.</h2>
          </div>
          <p className="text-white/30 max-w-sm text-sm font-light">
            We don't offer services. We deploy modular growth components that integrate directly into your business logic.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <BentoCard 
            span="lg:col-span-2" 
            title="Strategic AI Logic" 
            desc="The brain of your operation. We map and automate complex decision-making processes." 
            icon={Cpu} 
            delay={0.1}
          />
          <BentoCard 
            span="lg:col-span-1" 
            title="Visual Identity" 
            desc="Branding that scales with machine speed but keeps human soul." 
            icon={Eye} 
            delay={0.2}
          />
          <BentoCard 
            span="lg:col-span-1" 
            title="Workflow Sync" 
            desc="Deep integration between your CRM, ads, and lead intake." 
            icon={Zap} 
            delay={0.3}
          />
          <BentoCard 
            span="lg:col-span-1" 
            title="Asset Pipeline" 
            desc="Continuous delivery of high-end video and social assets." 
            icon={Layers} 
            delay={0.4}
          />
          <BentoCard 
            span="lg:col-span-1" 
            title="Revenue Hub" 
            desc="Conversion-first web experiences designed for ROI." 
            icon={Box} 
            delay={0.5}
          />
        </div>
      </div>
    </section>
  );
};

export default Services;
