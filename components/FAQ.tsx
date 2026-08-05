import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const FAQS = [
  {
    question: 'How long before I see results?',
    answer: 'Most clients begin seeing measurable improvements within 30–60 days of system launch. Lead volume and operational efficiency typically improve first. Revenue growth compounds over 3–6 months as systems are optimized and refined. We set clear expectations and milestones during your Business Audit.',
  },
  {
    question: 'Do I need a new website to get started?',
    answer: 'Not necessarily. We assess your current digital presence during the Business Audit and recommend only what will drive growth. Many clients start with a targeted landing page or automation improvements — not a full website rebuild. If a new site is needed, it\'s included in the relevant system.',
  },
  {
    question: 'Can you improve my existing systems?',
    answer: 'Absolutely. We audit what you already have and build on top of it where possible. Our goal is to maximize ROI — which means improving and integrating your existing tools, not replacing everything unnecessarily.',
  },
  {
    question: 'Which industries do you work with?',
    answer: 'We work with growth-focused businesses across professional services, e-commerce, real estate, healthcare, education, retail, and more. Our AI Business Growth Systems are industry-agnostic — they are built around your specific customer journey and business model, not a generic template.',
  },
  {
    question: 'What is included in the AI Growth Partner plan?',
    answer: 'The AI Growth Partner plan includes everything in both the AI Customer Acquisition System and AI Business Operations System — plus ongoing management, weekly KPI reviews, monthly executive reports, continuous optimization, and dedicated strategic support. It is a full-service monthly partnership, not a subscription.',
  },
  {
    question: 'How is Dizitup different from a regular agency?',
    answer: 'Most agencies bill for deliverables. We are accountable for outcomes. We don\'t deliver websites — we build growth systems. We don\'t run campaigns — we create predictable customer pipelines. Every engagement is measured by business results: revenue, leads, conversions, and efficiency gains.',
  },
  {
    question: 'What does the onboarding process look like?',
    answer: 'After signing, we schedule your Business Audit (typically 1–2 hours). We then create your Growth Strategy, share the implementation plan, and begin building within the first week. Launch typically happens within 3–5 weeks depending on the system scope.',
  },
  {
    question: 'Is there a long-term contract requirement?',
    answer: 'Growth systems take time to compound. We typically recommend a minimum 3-month commitment to see meaningful results, with monthly rolling terms thereafter on the Growth Partner plan. One-time system builds have no ongoing commitment.',
  },
];

const FAQItem: React.FC<{ faq: typeof FAQS[0]; index: number }> = ({ faq, index }) => {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className={`border-b border-white/[0.06] transition-colors duration-300 ${open ? 'border-white/10' : ''}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-6 text-left group"
        aria-expanded={open}
      >
        <span className={`text-sm sm:text-base font-medium leading-snug transition-colors duration-300 ${open ? 'text-white' : 'text-white/60 group-hover:text-white/90'}`}>
          {faq.question}
        </span>
        <div className={`flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-300 ${open ? 'bg-red-600 border-red-600 text-white' : 'border-white/10 text-white/30 group-hover:border-white/25'}`}>
          {open ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <p className="text-sm sm:text-base text-white/40 font-light leading-relaxed pb-6 max-w-2xl">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FAQ: React.FC = () => {
  return (
    <section className="py-16 sm:py-28 lg:py-40 bg-transparent relative overflow-hidden">
      <div className="absolute top-1/2 left-1/4 w-[600px] h-[500px] bg-red-600/[0.02] blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">

          {/* Left — Header */}
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-red-600 font-black tracking-[0.4em] text-[10px] uppercase mb-6 block">Got Questions?</span>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-heading font-bold mb-6 leading-tight tracking-tight">
                Common <br /> Questions.
              </h2>
              <p className="text-white/40 text-base font-light leading-relaxed mb-8">
                Straight answers to the questions we hear most from business owners before partnering with Dizitup.
              </p>
              <p className="text-white/25 text-sm font-light">
                Don't see your question?{' '}
                <a
                  href="https://wa.me/917559999271"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-white underline underline-offset-2 transition-colors"
                >
                  Chat with us on WhatsApp.
                </a>
              </p>
            </motion.div>
          </div>

          {/* Right — FAQ Items */}
          <div className="lg:col-span-8">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} faq={faq} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
