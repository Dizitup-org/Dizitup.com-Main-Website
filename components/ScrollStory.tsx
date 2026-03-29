
import React from 'react';
import { motion } from 'framer-motion';

const ProblemCard = ({ text, delay }: { text: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="p-4 sm:p-6 rounded-[1rem] sm:rounded-[1.5rem] bg-white/[0.02] border border-white/5 mb-3 group hover:border-white/10 transition-all text-sm sm:text-base"
  >
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-red-600 transition-colors flex-shrink-0" />
      <p className="text-white/40 group-hover:text-white transition-colors font-light">{text}</p>
    </div>
  </motion.div>
);

// Staggered word reveal for the heading
const WordReveal = ({ text, className = '' }: { text: string; className?: string }) => {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

const ScrollStory: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-transparent overflow-hidden border-y border-white/5 relative">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          <div>
            <span className="text-red-600 font-mono text-[10px] uppercase tracking-[0.5em] mb-4 block">The Bottleneck</span>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-heading font-bold mb-8 sm:mb-10 tracking-tighter">
              <WordReveal text="Boring Work" /> <br />
              <WordReveal text="Kills Growth." className="text-white/30 italic" />
            </h2>

            <div className="space-y-4">
              <ProblemCard text="Manually managing chaotic lead pipelines." delay={0.1} />
              <ProblemCard text="Spending hours on content that doesn't convert." delay={0.2} />
              <ProblemCard text="Traditional agencies charging for 'hours' not 'results'." delay={0.3} />
              <ProblemCard text="Zero clarity on how to bridge the AI gap." delay={0.4} />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative p-6 sm:p-10 lg:p-14 rounded-[1.5rem] sm:rounded-[2.5rem] bg-[#0c0c0c] border border-white/5 overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 blur-[120px] pointer-events-none"></div>

            <h3 className="text-xl sm:text-3xl font-heading font-bold mb-4 sm:mb-6 text-white tracking-tight">The Dizitup Intelligence</h3>
            <p className="text-sm sm:text-lg text-white/40 leading-relaxed mb-6 sm:mb-8 font-light">
              We replace the "boring" with one <span className="text-white font-bold">architected system</span>.
              We don't just add AI; we rebuild your operational logic from the ground up.
            </p>

            <ul className="space-y-4">
              {[
                { label: 'Automated Lead Intake', desc: 'Zero manual entry. High response speed.' },
                { label: 'AI Content Pipeline', desc: 'Predictive assets that actually sell.' },
                { label: 'Revenue Dashboard', desc: 'Real-time ROI, not vanity metrics.' },
                { label: 'Founder Autonomy', desc: 'Reclaim 20+ hours per week.' }
              ].map((item, i) => (
                <li key={i} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-white font-bold tracking-tight text-sm sm:text-base">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    {item.label}
                  </div>
                  <p className="pl-4 text-xs sm:text-sm text-white/30">{item.desc}</p>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ScrollStory;
