
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const steps = [
  {
    number: "01",
    title: "AI Analysis",
    desc: "We deploy proprietary diagnostic agents to map every inefficiency in your current funnel."
  },
  {
    number: "02",
    title: "Strategic Logic",
    desc: "Our human directors filter AI insights to define the 20% of actions that drive 80% of growth."
  },
  {
    number: "03",
    title: "Hybrid Build",
    desc: "Production at the speed of light. Video, design, and code executed by AI, finished by experts."
  },
  {
    number: "04",
    title: "Systemic Scale",
    desc: "Continuous loop of optimization, ensuring your growth engine never sleeps or slows down."
  }
];

const HowItWorks: React.FC = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  return (
    <section ref={containerRef} id="how-it-works" className="py-60 bg-black relative">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-20">
          <div className="lg:col-span-4 sticky top-40 h-fit">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-red-600 font-black tracking-[0.4em] text-[10px] uppercase mb-6 block">Our Methodology</span>
              <h2 className="text-5xl md:text-7xl font-heading font-bold mb-8 leading-tight">The Growth <br /> Engine.</h2>
              <p className="text-white/40 text-xl font-light leading-relaxed">
                We've moved beyond services. We build integrated growth systems that leverage the full stack of modern intelligence.
              </p>
            </motion.div>
          </div>

          <div className="lg:col-span-7 lg:col-start-6 space-y-40">
            {steps.map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "-20%" }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="relative pl-20 group"
              >
                <div className="absolute left-0 top-0 text-8xl font-heading font-black text-white/[0.03] group-hover:text-red-900/20 transition-colors duration-700">
                  {step.number}
                </div>
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold mb-6 tracking-tight group-hover:text-red-500 transition-colors duration-500">{step.title}</h3>
                  <p className="text-white/50 text-xl font-light leading-relaxed max-w-xl">
                    {step.desc}
                  </p>
                </div>
                {/* Connector Line */}
                <div className="absolute left-[38px] top-10 w-[2px] h-full bg-gradient-to-b from-red-600/50 to-transparent opacity-20" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
