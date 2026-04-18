import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, X, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';
import { useNavigate } from 'react-router-dom';

const DiziAIChat: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const isLoggedIn = !!user;

  const [isVisible, setIsVisible] = useState(true);

  // Scroll listener to hide when footer is in view
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.innerHeight + window.scrollY;
      const totalHeight = document.documentElement.scrollHeight;
      // Hide if within 100px of bottom (footer area)
      if (scrollPos > totalHeight - 150) {
        setIsVisible(false);
        setIsExpanded(false); // Close if open
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button

        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ 
          opacity: isVisible ? 0.92 : 0, 
          scale: isVisible ? 1 : 0, 
          y: isVisible ? 0 : 20 
        }}
        transition={{ 
          delay: isVisible ? 1.5 : 0, 
          type: 'spring', 
          damping: 20,
          stiffness: 260
        }}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[9990] w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-br from-red-600 to-red-800 shadow-2xl shadow-red-600/50 flex items-center justify-center cursor-pointer hover:shadow-red-600/70 transition-shadow duration-300 border border-red-500/30"
      >
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
          {isExpanded
            ? <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            : <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          }
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 2.2, repeat: Infinity }}
          className="absolute inset-0 rounded-full border-2 border-red-400/30"
        />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed bottom-20 sm:bottom-24 right-5 sm:right-8 z-[9999] w-[340px] sm:w-[420px] rounded-[1.8rem] overflow-hidden backdrop-blur-3xl bg-black/40 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(220,38,38,0.05)] max-h-[480px] sm:max-h-[520px] flex flex-col"
          >
            <div className="flex flex-col h-full bg-gradient-to-br from-red-600/5 to-transparent">
              {/* Glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-red-600/8 blur-[80px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-600/5 blur-[80px] pointer-events-none" />

              {/* Header */}
              <div className="relative p-4 sm:p-5 border-b border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <motion.div
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 via-red-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-600/40"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">Chat with Dizi</h3>
                    <p className="text-[10px] sm:text-xs text-white/40 font-mono">✦ AI Assistant · Coming Soon</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-[9px] font-bold text-yellow-400 uppercase tracking-wider">Training in progress</span>
                </div>
              </div>

                  {/* ── LOGGED-OUT TEASER ── */}
                  {!isLoggedIn ? (
                    <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 flex flex-col items-center custom-scrollbar">
                  {/* Animated Dizi avatar */}
                  <div className="flex flex-col items-center text-center space-y-3 py-2">
                    <motion.div
                      animate={{ scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-xl shadow-red-600/40 border border-red-500/30"
                    >
                      <Sparkles className="w-7 h-7 text-white" />
                    </motion.div>

                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-base font-bold text-white leading-snug"
                    >
                      Psst… I'm right here. 👀
                    </motion.p>

                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.28 }}
                      className="text-sm text-white/60 leading-relaxed max-w-[260px]"
                    >
                      You're literally <span className="text-red-400 font-semibold">one step away</span> from unlocking your personal AI growth partner.
                    </motion.p>

                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.42 }}
                      className="text-xs text-white/40 italic leading-relaxed"
                    >
                      Just log in — and get ready to <span className="text-red-400 not-italic font-semibold">Dizitise</span> your brand. I'll be waiting. ⚡
                    </motion.p>
                  </div>

                  {/* CTA */}
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { navigate('/login'); setIsExpanded(false); }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs tracking-wide transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Log in & Meet Dizi
                  </motion.button>

                  <p className="text-center text-[9px] text-white/20 uppercase tracking-widest font-mono">
                    No spam. Just growth.
                  </p>
                </div>
                ) : (
                    /* ── LOGGED-IN CONTENT ── */
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-2">
                        <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                          Hey! I'm <span className="text-red-400 font-semibold">Dizi AI</span>, your intelligent growth companion powered by a custom LLM.
                        </p>
                        <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                          I'm learning your business patterns to become your perfect AI strategist.
                        </p>
                      </motion.div>

                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-white/50 font-semibold uppercase tracking-wider">Training Status</span>
                          <span className="text-red-400 font-bold">85%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                          <motion.div
                            initial={{ width: '0%' }}
                            animate={{ width: '85%' }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-red-600 to-red-400"
                          />
                        </div>
                        <p className="text-[10px] text-white/30 italic">Model training in progress · Coming Soon</p>
                      </motion.div>

                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-1.5 pt-3 border-t border-white/5">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">What's Coming</p>
                        {['AI Strategy Consultation', 'Business Growth Roadmaps', '24/7 Growth Assistant', 'Decision Support'].map((feature, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.07 }} className="flex items-center gap-2 text-xs text-white/60">
                            <Zap className="w-3 h-3 text-red-500 flex-shrink-0" />
                            {feature}
                          </motion.div>
                        ))}
                      </motion.div>

                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="pt-3 border-t border-white/5">
                        <a
                          href="https://wa.me/919007407620?text=Hi%20Dizitup%2C%20I%20need%20help%20with%20my%20business%20structure."
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold text-xs tracking-wide transition-all shadow-lg shadow-green-600/20"
                        >
                          Contact Admin via WhatsApp
                        </a>
                      </motion.div>
                    </div>
                  )}

                  {/* Input bar (fixed teaser at bottom) */}
                  <div className="relative px-5 py-4 border-t border-white/5 bg-black/20 flex items-center gap-3 mt-auto">
                    <div className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/20 text-[11px] select-none">
                      {isLoggedIn ? 'Dizi AI launching soon...' : 'Log in to chat with Dizi...'}
                    </div>
                    <div className="w-9 h-9 rounded-full bg-red-600/30 flex items-center justify-center flex-shrink-0 border border-red-500/20">
                      <Sparkles className="w-4 h-4 text-red-400" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
      </AnimatePresence>
    </>
  );
};

export default DiziAIChat;
