import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminWelcomeProps {
  onComplete: () => void;
}

const AdminWelcome: React.FC<AdminWelcomeProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    // Phase 1: "Welcome Roy Brothers" - 2s
    const timer1 = setTimeout(() => setPhase(2), 2000);
    // Phase 2: "To a path to crores" - 2s more
    const timer2 = setTimeout(() => setPhase(3), 4000);
    // Phase 3: Fade out and complete - 0.5s more
    const timer3 = setTimeout(() => onComplete(), 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center overflow-hidden"
    >
      {/* Subtle animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-transparent to-transparent" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600 rounded-full blur-[200px]"
        />
      </div>

      {/* Progress bar at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 4.5, ease: 'linear' }}
          className="h-full bg-gradient-to-r from-red-600 to-red-400"
        />
      </div>

      <AnimatePresence mode="wait">
        {/* Phase 1: Welcome Roy Brothers */}
        {phase === 1 && (
          <motion.div
            key="phase1"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="text-center relative z-10"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 100 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-px bg-red-600 mx-auto mb-8"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[10px] font-mono uppercase tracking-[0.5em] text-red-600 mb-4"
            >
              System Access Granted
            </motion.p>
            <h1 className="text-5xl md:text-7xl font-heading font-bold tracking-tighter text-white">
              Welcome,{' '}
              <motion.span
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-red-500"
              >
                Roy Brothers
              </motion.span>
            </h1>
          </motion.div>
        )}

        {/* Phase 2: To a path to crores */}
        {phase === 2 && (
          <motion.div
            key="phase2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="text-center relative z-10"
          >
            <h2 className="text-4xl md:text-6xl font-heading font-light tracking-tight text-white/80 italic">
              To a path to{' '}
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="font-bold text-red-500 not-italic"
              >
                Crores
              </motion.span>
            </h2>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 150 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-px bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto mt-8"
            />
          </motion.div>
        )}

        {/* Phase 3: Loading indicator */}
        {phase === 3 && (
          <motion.div
            key="phase3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center relative z-10"
          >
            <div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/30">
              Loading Command Center...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminWelcome;
