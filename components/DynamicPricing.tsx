
import React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, BarChart3, BrainCircuit } from 'lucide-react';
import type { Country } from './PersonalizationFlow';
import { getPricingRegion, type PricingRegion } from './PersonalizationFlow';
import TiltCard from './TiltCard';

interface PricingTier {
  name: string;
  icon: React.ReactNode;
  description: string;
  pricing: Record<PricingRegion, { setup: string; monthly: string }>;
  features: string[];
  popular?: boolean;
  note?: string;
}

const CORE_TIERS: PricingTier[] = [
  {
    name: 'AI Lead Engine',
    icon: <Zap className="w-6 h-6" />,
    description: 'Automated lead capture, instant response, CRM integration, smart follow-ups, and appointment booking automation.',
    pricing: {
      'India': { setup: '₹25,000', monthly: '₹10,000/mo' },
      'United States': { setup: '$900', monthly: '$350/mo' },
      'Europe': { setup: '€850', monthly: '€300/mo' },
      'Other': { setup: '$900', monthly: '$350/mo' },
    },
    features: [
      'Automated lead capture forms',
      'Instant AI-powered response',
      'CRM integration & sync',
      'Smart follow-up sequences',
      'Appointment booking automation',
    ],
  },
  {
    name: 'AI Operations System',
    icon: <BarChart3 className="w-6 h-6" />,
    description: 'Client onboarding automation, workflow systems, KPI dashboards, and reporting automation.',
    pricing: {
      'India': { setup: '₹45,000', monthly: '₹15,000/mo' },
      'United States': { setup: '$1,600', monthly: '$550/mo' },
      'Europe': { setup: '€1,500', monthly: '€500/mo' },
      'Other': { setup: '$1,600', monthly: '$550/mo' },
    },
    features: [
      'Client onboarding automation',
      'Workflow orchestration',
      'KPI dashboards',
      'Automated reporting',
      'Team collaboration tools',
    ],
  },
  {
    name: 'AI Growth Intelligence Stack',
    icon: <BrainCircuit className="w-6 h-6" />,
    description: 'Complete AI-powered growth stack combining lead engine, operations automation, revenue dashboards, and strategic AI insights.',
    pricing: {
      'India': { setup: '₹60,000', monthly: '₹20,000/mo' },
      'United States': { setup: '$2,400', monthly: '$800/mo' },
      'Europe': { setup: '€2,200', monthly: '€750/mo' },
      'Other': { setup: '$2,400', monthly: '$800/mo' },
    },
    features: [
      'Everything in Lead Engine',
      'Everything in Operations',
      'Revenue intelligence dashboards',
      'Strategic AI insights & forecasting',
      'Priority support & consulting',
    ],
    popular: true,
    note: 'Most agencies recover setup cost with 1–2 new client acquisitions.',
  },
];

interface Props {
  country: Country;
  onBookCall: (packageName: string) => void;
}

const DynamicPricing: React.FC<Props> = ({ country, onBookCall }) => {
  const pricingKey = getPricingRegion(country);
  return (
    <section className="py-16 sm:py-32 md:py-40 bg-transparent relative overflow-hidden">
      {/* bg glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-red-600/[0.04] blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/10 rounded-full mb-8">
              <Sparkles className="w-3 h-3 text-red-500" />
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/50">Core AI Systems</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-7xl font-heading font-bold tracking-tighter mb-4 sm:mb-6">
              Predictable <span className="text-white/20 italic font-light">Investment.</span>
            </h2>
            <p className="text-base sm:text-lg text-white/40 font-light max-w-xl mx-auto">
              Transparency is the bedrock of premium partnerships. Choose your growth speed.
            </p>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-stretch max-w-6xl mx-auto">
          {CORE_TIERS.map((tier, i) => {
            const price = tier.pricing[pricingKey];
            return (
              <TiltCard key={tier.name} className="flex flex-col">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className={`relative p-6 sm:p-8 md:p-10 lg:p-12 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] border flex flex-col group transition-all duration-700 h-full ${tier.popular
                      ? 'bg-gradient-to-b from-white/[0.06] to-white/[0.02] border-red-600/40 shadow-[0_0_60px_-15px_rgba(220,38,38,0.25)]'
                      : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                    }`}
                >
                  {/* Popular badge */}
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-5 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg z-20 whitespace-nowrap">
                      Most Popular
                    </div>
                  )}

                  {/* Icon + Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-xl ${tier.popular ? 'bg-red-600/20 text-red-400' : 'bg-white/5 text-white/50'}`}>
                      {tier.icon}
                    </div>
                    <h3 className="text-lg font-bold tracking-tight uppercase text-white/60">{tier.name}</h3>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-white">{price.setup}</span>
                      <span className="text-xs text-white/30 uppercase tracking-widest">Setup</span>
                    </div>
                    <p className="text-sm text-white/40 mt-1">
                      + <span className="text-white/60 font-semibold">{price.monthly}</span>
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-white/40 leading-relaxed font-light mb-8">{tier.description}</p>

                  {/* Features */}
                  <div className="space-y-4 mb-10 flex-grow">
                    {tier.features.map((f, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${tier.popular ? 'bg-red-600 text-white' : 'bg-white/10 text-red-500'
                          }`}>
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span className="text-sm text-white/60 tracking-tight">{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Note */}
                  {tier.note && (
                    <p className="text-[11px] text-red-400/70 font-mono mb-6 px-4 py-3 rounded-xl bg-red-600/[0.06] border border-red-600/10">
                      {tier.note}
                    </p>
                  )}

                  {/* CTA */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onBookCall(tier.name)}
                    className={`w-full py-4 rounded-full font-bold text-sm uppercase tracking-widest transition-all ${tier.popular
                        ? 'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_30px_-5px_rgba(220,38,38,0.4)]'
                        : 'bg-white/[0.05] border border-white/10 text-white hover:bg-white/10'
                      }`}
                  >
                    Book Strategy Call
                  </motion.button>
                </motion.div>
              </TiltCard>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default DynamicPricing;
