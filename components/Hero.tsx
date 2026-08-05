import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, TrendingUp } from 'lucide-react';
import MagneticButton from './MagneticButton';
import TextShimmer from './TextShimmer';
import { useBooking } from '../contexts/BookingContext';

// Floating particles data
const PARTICLES = [
  { size: 3, x: '10%', y: '20%', color: 'rgba(220,38,38,0.3)', duration: '14s', delay: '0s' },
  { size: 2, x: '80%', y: '15%', color: 'rgba(255,255,255,0.15)', duration: '18s', delay: '2s' },
  { size: 4, x: '25%', y: '70%', color: 'rgba(220,38,38,0.2)', duration: '16s', delay: '4s' },
  { size: 2, x: '70%', y: '60%', color: 'rgba(255,255,255,0.1)', duration: '20s', delay: '1s' },
  { size: 3, x: '50%', y: '40%', color: 'rgba(220,38,38,0.25)', duration: '15s', delay: '3s' },
  { size: 2, x: '90%', y: '80%', color: 'rgba(255,255,255,0.12)', duration: '17s', delay: '5s' },
];

const Hero: React.FC = () => {
  const { openBooking } = useBooking();
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start start', 'end start'],
  });

  const textOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.3], [0, 100]);

  return (
    <section ref={targetRef} className="relative min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 lg:py-32">
      {/* Floating Particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="floating-particle z-10"
          style={{
            width: p.size,
            height: p.size,
            left: p.x,
            top: p.y,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            '--duration': p.duration,
            '--delay': p.delay,
          } as React.CSSProperties}
        />
      ))}

      <div className="container mx-auto">
        <motion.div
          style={{ opacity: textOpacity, y }}
          className="w-full"
        >
          {/* Eyebrow label */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/10 rounded-full">
              <TrendingUp className="w-3 h-3 text-red-500" />
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/50">AI Business Growth Partner</span>
            </div>
          </motion.div>

          <h1 className="text-[clamp(2rem,6vw,4.5rem)] xl:text-[clamp(2.5rem,7vw,5.5rem)] font-heading font-bold leading-[1.05] tracking-[-0.04em] mb-6 sm:mb-8 hero-title text-center">
            <TextShimmer>GROW</TextShimmer>{' '}
            <span className="text-white/20 italic mr-2">YOUR</span>
            REVENUE.
          </h1>

          <div className="space-y-6 text-center">
            <div className="space-y-4 md:space-y-5 max-w-[90%] md:max-w-[620px] mx-auto">
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white leading-relaxed font-medium tracking-tight">
                We build AI-powered business growth systems that generate qualified customers, automate your operations, and scale your revenue — predictably.
              </p>
              <p className="text-sm sm:text-base md:text-lg text-white/40 leading-relaxed font-light">
                Not a website company. Not an agency. A long-term growth partner that embeds into your business and drives measurable results every month.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center">
              <MagneticButton>
                <button
                  onClick={() => openBooking()}
                  className="w-full sm:w-auto px-7 sm:px-9 py-3 sm:py-4 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all duration-500 flex items-center justify-center gap-2 shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
                >
                  Book a Free Growth Audit <ArrowUpRight className="w-4 h-4" />
                </button>
              </MagneticButton>
              <a
                href="#growth-systems"
                className="w-full sm:w-auto px-7 sm:px-9 py-3 sm:py-4 bg-transparent border border-white/10 text-white rounded-full font-bold text-xs uppercase tracking-widest hover:border-white/40 hover:bg-white/5 transition-all text-center"
              >
                Explore Our Growth Systems
              </a>
            </div>

            {/* Trust signals */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="flex flex-wrap items-center justify-center gap-6 pt-4"
            >
              {[
                '40+ Businesses Served',
                '3× Revenue Growth',
                '60%+ Lead Increase',
              ].map((signal, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-red-600" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">{signal}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
