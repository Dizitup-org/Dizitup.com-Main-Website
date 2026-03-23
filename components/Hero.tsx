
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, Cpu } from 'lucide-react';
import MagneticButton from './MagneticButton';
import TextShimmer from './TextShimmer';
import { useBooking } from '../contexts/BookingContext';
import { useNavigate } from 'react-router-dom';

// Floating particles data — small, subtle dots
const PARTICLES = [
  { size: 3, x: '10%', y: '20%', color: 'rgba(220,38,38,0.3)', duration: '14s', delay: '0s' },
  { size: 2, x: '80%', y: '15%', color: 'rgba(255,255,255,0.15)', duration: '18s', delay: '2s' },
  { size: 4, x: '25%', y: '70%', color: 'rgba(220,38,38,0.2)', duration: '16s', delay: '4s' },
  { size: 2, x: '70%', y: '60%', color: 'rgba(255,255,255,0.1)', duration: '20s', delay: '1s' },
  { size: 3, x: '50%', y: '40%', color: 'rgba(220,38,38,0.25)', duration: '15s', delay: '3s' },
  { size: 2, x: '90%', y: '80%', color: 'rgba(255,255,255,0.12)', duration: '17s', delay: '5s' },
];

const Hero: React.FC = () => {

  const navigate = useNavigate();
  
  const { openBooking } = useBooking();
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  });

  const textOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.3], [0, 100]);

  return (
    <section ref={targetRef} className="relative min-h-screen lg:min-h-[110vh] flex flex-col justify-center px-4 sm:px-6 lg:px-20 pt-20 sm:pt-24">
      {/* Floating Particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="floating-particle"
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
          className="max-w-[1200px]"
        >
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-wrap items-center gap-3 mb-12"
          >
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">Available for Strategic Deployment</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40">
              <Cpu className="w-3 h-3" />
              <span className="text-[10px] font-mono uppercase tracking-widest">Logic Engine v2.4.0</span>
            </div>
          </motion.div>

          <h1 className="text-[11vw] sm:text-[12vw] lg:text-[10rem] font-heading font-bold leading-[0.85] sm:leading-[0.8] tracking-[-0.04em] mb-8 sm:mb-12 hero-title">
            <TextShimmer>POSITION</TextShimmer> <br />
            <span className="text-white/20 italic">WITH</span> LOGIC.
          </h1>

          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-end">
            <div className="space-y-6">
              <p className="text-lg sm:text-xl lg:text-3xl text-white leading-tight font-medium tracking-tight">
                Stop wondering where AI fits.
              </p>
              <p className="text-base sm:text-lg lg:text-xl text-white/40 leading-snug font-light max-w-xl">
                Dizitup architects autonomous systems that automate your friction—reducing overhead so you can focus on building your empire.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:justify-end">
              <MagneticButton>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all duration-500 flex items-center justify-center gap-2 shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
                >
                  Book a Free AI Strategy Call <ArrowUpRight className="w-4 h-4" />
                </button>
              </MagneticButton>
              <a
                href="#works"
                className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-transparent border border-white/10 text-white rounded-full font-bold text-xs uppercase tracking-widest hover:border-white transition-all text-center"
              >
                Our Work
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-10 left-10 hidden lg:flex flex-col gap-4 text-[10px] font-mono text-white/20">
        <span>[ 01 ] AUTOMATE FRICTION</span>
        <span>[ 02 ] REDUCE OVERHEAD</span>
        <span>[ 03 ] SCALE REVENUE</span>
      </div>
    </section>
  );
};

export default Hero;
