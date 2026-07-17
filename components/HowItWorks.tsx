import React, { useRef } from 'react';
import { motion, useScroll } from 'framer-motion';

const steps = [
  {
    number: '01',
    title: 'Lead',
    desc: 'You discover Dizitup through our content, referral, or outreach. Our systems capture your enquiry immediately and respond within minutes.',
  },
  {
    number: '02',
    title: 'Discovery Call',
    desc: 'We schedule a 30-minute call to understand your business, current challenges, revenue goals, and which growth system is the right fit.',
  },
  {
    number: '03',
    title: 'Business Audit',
    desc: 'We audit your current customer journey, operations, and digital presence. This gives us a clear picture of your gaps and growth opportunities.',
  },
  {
    number: '04',
    title: 'Growth Strategy',
    desc: 'Based on the audit, we craft a bespoke growth strategy tailored to your business — specific systems, timelines, and expected outcomes.',
  },
  {
    number: '05',
    title: 'Proposal',
    desc: 'You receive a clear, detailed proposal outlining exactly what we\'ll build, what results to expect, investment required, and timeline.',
  },
  {
    number: '06',
    title: 'Implementation',
    desc: 'Our team deploys your AI business growth systems — from landing pages and automations to dashboards and integrations. Fast, precise, and built to perform.',
  },
  {
    number: '07',
    title: 'Optimization',
    desc: 'We review data from the first weeks, identify what\'s working and what can improve, and optimize systems for better conversion and efficiency.',
  },
  {
    number: '08',
    title: 'Continuous Growth',
    desc: 'On the Growth Partner plan, we stay embedded in your business — running weekly reviews, monthly strategy sessions, and continuously compounding your growth.',
  },
];

const HowItWorks: React.FC = () => {
  const containerRef = useRef(null);
  useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  return (
    <section ref={containerRef} id="process" className="py-20 sm:py-40 lg:py-60 bg-transparent relative">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-10 sm:gap-16 lg:gap-20">

          {/* Sticky left column */}
          <div className="lg:col-span-4 lg:sticky lg:top-40 h-fit">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-red-600 font-black tracking-[0.4em] text-[10px] uppercase mb-6 block">The Client Process</span>
              <h2 className="text-3xl sm:text-5xl md:text-7xl font-heading font-bold mb-6 sm:mb-8 leading-tight">
                Your Growth <br /> Journey.
              </h2>
              <p className="text-white/40 text-base sm:text-xl font-light leading-relaxed">
                From first contact to continuous growth — this is exactly what working with Dizitup looks like. No surprises, no ambiguity, just a clear path to results.
              </p>
            </motion.div>
          </div>

          {/* Steps */}
          <div className="lg:col-span-7 lg:col-start-6 space-y-14 sm:space-y-24 lg:space-y-32">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: '-20%' }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="relative pl-14 sm:pl-20 group"
              >
                <div className="absolute left-0 top-0 text-6xl sm:text-8xl font-heading font-black text-white/[0.03] group-hover:text-red-900/20 transition-colors duration-700">
                  {step.number}
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-5 tracking-tight group-hover:text-red-500 transition-colors duration-500">
                    {step.title}
                  </h3>
                  <p className="text-white/50 text-base sm:text-lg font-light leading-relaxed max-w-xl">
                    {step.desc}
                  </p>
                </div>
                {/* Connector Line */}
                {i < steps.length - 1 && (
                  <div className="absolute left-[38px] top-10 w-[2px] h-full bg-gradient-to-b from-red-600/50 to-transparent opacity-20" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
