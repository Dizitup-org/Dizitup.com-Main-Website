
import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Palette, Cpu, Workflow, ArrowRight } from 'lucide-react';
import type { Country } from './PersonalizationFlow';
import { getPricingRegion, type PricingRegion } from './PersonalizationFlow';

interface CustomProject {
  name: string;
  icon: React.ReactNode;
  description: string;
  startingPrice: Record<PricingRegion, string>;
}

const PROJECTS: CustomProject[] = [
  {
    name: 'Conversion Website Development',
    icon: <Globe className="w-6 h-6" />,
    description: 'High-converting websites engineered for lead capture, speed, and authority positioning.',
    startingPrice: {
      'India': '₹35,000',
      'United States': '$1,200',
      'Europe': '€1,100',
      'Other': '$1,200',
    },
  },
  {
    name: 'AI Content System Setup',
    icon: <Palette className="w-6 h-6" />,
    description: 'Automated content pipelines — ideation, generation, scheduling, and analytics in one system.',
    startingPrice: {
      'India': '₹20,000',
      'United States': '$750',
      'Europe': '€700',
      'Other': '$750',
    },
  },
  {
    name: 'Custom AI Platform / App',
    icon: <Cpu className="w-6 h-6" />,
    description: 'Bespoke AI-powered platforms tailored to your unique business logic and workflows.',
    startingPrice: {
      'India': '₹80,000',
      'United States': '$3,000',
      'Europe': '€2,800',
      'Other': '$3,000',
    },
  },
  {
    name: 'Advanced Workflow Automation',
    icon: <Workflow className="w-6 h-6" />,
    description: 'End-to-end process automation connecting your tools, teams, and data into one intelligent flow.',
    startingPrice: {
      'India': '₹30,000',
      'United States': '$1,000',
      'Europe': '€950',
      'Other': '$1,000',
    },
  },
];

interface Props {
  country: Country;
  onBookCall: (packageName: string) => void;
}

const CustomProjects: React.FC<Props> = ({ country, onBookCall }) => {
  const pricingKey = getPricingRegion(country);
  return (
    <section className="py-16 sm:py-32 md:py-40 bg-[#050505] relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-red-600/[0.03] blur-[120px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/10 rounded-full mb-8">
              <Cpu className="w-3 h-3 text-red-500" />
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/50">Custom Builds & One-Time Projects</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-heading font-bold tracking-tighter mb-4 sm:mb-6">
              Tailored <span className="text-white/20 italic font-light">Solutions.</span>
            </h2>
            <p className="text-lg text-white/40 font-light">
              One-time builds designed to fit your exact requirements.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {PROJECTS.map((proj, i) => (
            <motion.div
              key={proj.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-5 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] bg-white/[0.02] border border-white/[0.08] hover:border-white/20 group transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(220,38,38,0.15)] flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-white/5 text-red-500 group-hover:bg-red-600/10 transition-colors">
                  {proj.icon}
                </div>
                <h3 className="text-base font-bold tracking-tight text-white">{proj.name}</h3>
              </div>
              <p className="text-sm text-white/40 font-light leading-relaxed mb-6 flex-grow">{proj.description}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">Starting From</p>
                  <p className="text-xl font-heading font-bold text-white">{proj.startingPrice[pricingKey]}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onBookCall(proj.name)}
                  className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-red-600/20 hover:border-red-600/30 transition-all group/btn"
                >
                  <ArrowRight className="w-4 h-4 text-white/40 group-hover/btn:text-red-400 transition-colors" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomProjects;
