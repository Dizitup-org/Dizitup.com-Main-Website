
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onComplete: () => void;
}

const WelcomeLoader: React.FC<Props> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),   // Stage 1: The Noise
      setTimeout(() => setPhase(2), 2200),  // Stage 2: The Solution (Longer to read)
      setTimeout(() => setPhase(3), 3800),  // Stage 3: The Brand
      setTimeout(() => onComplete(), 5200)  // Exit
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const strings = [
    "ANALYZING_MARKET_FRICTION...",
    "DETECTING_OPERATIONAL_BORING_TASKS...",
    "CALIBRATING_GROWTH_LOGIC...",
    "DEPLOYING_AI_ARCHITECTURE..."
  ];

  return (
    <motion.div 
      exit={{ y: '-100%' }}
      transition={{ duration: 1.2, ease: [0.85, 0, 0.15, 1] }}
      className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center overflow-hidden mobile-fullscreen"
    >
      <div className="absolute inset-0 bg-grid opacity-10" />
      
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-full">
        <AnimatePresence mode="wait">
          {phase === 0 && (
            <motion.div
              key="p0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, filter: 'blur(10px)' }}
              className="space-y-4"
            >
              <div className="flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ height: [10, 40, 10] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                    className="w-1 bg-red-600/40"
                  />
                ))}
              </div>
              <p className="text-[10px] font-mono text-red-600 tracking-[0.5em] uppercase">Initializing DIZITUP_OS</p>
            </motion.div>
          )}

          {phase === 1 && (
            <motion.div
              key="p1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl"
            >
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-heading font-bold tracking-tighter text-white/40 mb-4 sm:mb-6">
                LOST IN THE <span className="text-white">AI NOISE?</span>
              </h2>
              <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em]">We filter the hype. We install the growth.</p>
            </motion.div>
          )}

          {phase === 2 && (
            <motion.div
              key="p2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
              className="max-w-4xl"
            >
              <h2 className="text-2xl sm:text-4xl md:text-6xl font-heading font-bold tracking-tighter leading-tight">
                WE AUTOMATE THE <span className="text-red-600 uppercase">Friction.</span><br />
                <span className="text-white/40 italic font-light">Focus on your business, not the chores.</span>
              </h2>
            </motion.div>
          )}

          {phase === 3 && (
            <motion.div
              key="p3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100px' }}
                className="h-px bg-red-600 mb-8"
              />
              <h1 className="text-2xl font-bold font-heading tracking-[0.8em] text-white">DIZITUP</h1>
              <p className="text-[9px] font-mono text-white/20 mt-4 uppercase tracking-[0.5em]">Growth Architectural Studio</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-12 left-12 hidden lg:block">
        <div className="space-y-1">
          {strings.slice(0, phase + 1).map((s, i) => (
            <p key={i} className="text-[9px] font-mono text-white/10 tracking-widest">{s}</p>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default WelcomeLoader;
