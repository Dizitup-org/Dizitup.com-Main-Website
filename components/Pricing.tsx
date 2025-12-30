
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const tiers = [
  {
    name: "Starter Engine",
    price: "₹85k",
    period: "Setup",
    desc: "A surgical AI overhaul of your core growth foundations.",
    features: ["System-wide AI Audit", "3 Priority Automations", "Landing Page UX-Lift", "Founder Strategy Call"]
  },
  {
    name: "Growth Retainer",
    price: "₹150k",
    period: "Monthly",
    recommended: true,
    desc: "The full-stack AI execution machine. Zero friction.",
    features: ["Unlimited Design Assets", "Daily AI Video Output", "Lead Flow Management", "Real-time Slack Channel", "Predictive Analytics Dashboard"]
  },
  {
    name: "Legacy Scale",
    price: "Custom",
    period: "Enterprise",
    desc: "Bespoke AI infrastructure for market-leading dominance.",
    features: ["Proprietary LLM Training", "Full Team Integration", "Global Content Scaling", "Strategic Partner Access"]
  }
];

const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="py-40 bg-black">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-heading font-bold mb-8"
          >
            Predictable Investment
          </motion.h2>
          <p className="text-white/40 text-xl font-light">Transparency is the bedrock of premium partnerships. Choose your speed.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-12 rounded-[3rem] border flex flex-col group transition-all duration-700 ${tier.recommended ? 'bg-white text-black border-transparent shadow-[0_40px_100px_-20px_rgba(255,255,255,0.1)]' : 'bg-white/[0.02] border-white/10 text-white hover:border-white/30'}`}
            >
              {tier.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-5 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg z-20">
                  Most Preferred
                </div>
              )}
              
              <div className="mb-10">
                <h3 className={`text-lg font-bold tracking-tight mb-2 opacity-50 uppercase`}>{tier.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-heading font-bold">{tier.price}</span>
                  <span className="text-xs opacity-40 uppercase tracking-widest">{tier.period}</span>
                </div>
              </div>
              
              <p className="text-sm mb-12 opacity-60 leading-relaxed font-light">{tier.desc}</p>
              
              <div className="space-y-5 mb-14 flex-grow">
                {tier.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className={`mt-1 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${tier.recommended ? 'bg-red-600 text-white' : 'bg-white/10 text-red-500'}`}>
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-sm font-medium tracking-tight opacity-80">{feature}</span>
                  </div>
                ))}
              </div>

              <Link 
                to="/book" 
                className={`group relative w-full py-5 rounded-full font-bold text-center transition-all overflow-hidden ${tier.recommended ? 'bg-black text-white hover:bg-red-700' : 'bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black'}`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                Initiate Partnership
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
