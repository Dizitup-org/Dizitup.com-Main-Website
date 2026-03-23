import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Zap, Sparkles, X, MessageCircle } from 'lucide-react';

const DiziAIChat: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ scale: 1.05 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed bottom-8 right-8 z-40 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-red-600 to-red-800 shadow-2xl shadow-red-600/50 flex items-center justify-center cursor-pointer group hover:shadow-red-600/70 transition-all duration-300 border border-red-500/30"
      >
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isExpanded ? (
            <X className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          ) : (
            <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          )}
        </motion.div>

        {/* Pulsing ring indicator */}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full border-2 border-red-400/30"
        />
      </motion.button>

      {/* Expanded Chat Window */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 sm:bottom-32 right-8 z-40 w-80 sm:w-96 rounded-2xl overflow-hidden backdrop-blur-xl border border-white/10 shadow-2xl"
          >
            <div className="relative bg-gradient-to-b from-black/80 to-black/60 overflow-hidden">
              {/* Background gradient decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-[80px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-600/5 blur-[80px] pointer-events-none" />

              {/* Header */}
              <div className="relative p-4 sm:p-5 border-b border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 via-red-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-600/40"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    >
                      <MessageCircle className="w-4 h-4 text-white" />
                    </motion.div>
                  </motion.div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">Chat with Dizi</h3>
                    <p className="text-[10px] sm:text-xs text-white/50 font-mono">AI Growth Partner</p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="text-[9px] font-semibold text-yellow-500 uppercase tracking-wider">Under Training</span>
                </div>
              </div>

              {/* Content */}
              <div className="relative p-4 sm:p-5 space-y-4 max-h-[420px] overflow-y-auto">
                {/* Main Message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                    Hey! I'm <span className="text-red-400 font-semibold">Dizi AI</span>, your intelligent growth companion powered by a custom LLM.
                  </p>
                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                    I'm learning your business patterns to become your perfect AI strategist.
                  </p>
                </motion.div>

                {/*Training Progress */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-white/60 font-semibold uppercase tracking-wider">Current Status</span>
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
                  <p className="text-[10px] text-white/40 italic">
                    Model training in progress • Coming Soon
                  </p>
                </motion.div>

                {/* Features Preview */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-1.5 pt-3 border-t border-white/5"
                >
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">What's Coming</p>
                  {[
                    'AI Strategy Consultation',
                    'Business Growth Roadmaps',
                    '24/7 Growth Assistant',
                    'Decision Support',
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.08 }}
                      className="flex items-center gap-2 text-xs text-white/70"
                    >
                      <Zap className="w-3 h-3 text-red-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Help Section */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                  className="space-y-2 pt-3 border-t border-white/5"
                >
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-white/40">Need Help?</p>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    Let us help you fit your business perfectly with our proven structure and strategy.
                  </p>
                  <a
                    href="https://wa.me/919007407620?text=Hi%20Dizitup%2C%20I%20need%20help%20with%20my%20business%20structure."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold text-[10px] sm:text-xs tracking-wider transition-all duration-300 shadow-lg shadow-green-600/30 hover:shadow-green-600/50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-3.055 2.047-4.827 5.523-4.827 9.585 0 1.071.134 2.11.424 3.129.693 2.208 2.188 4.25 4.124 5.884.789.663 1.666 1.245 2.61 1.7a8.826 8.826 0 007.065.767c3.233-.637 6.084-2.575 7.815-5.294 1.731-2.719 2.116-6.058 1.085-9.054-.51-1.41-1.267-2.709-2.226-3.825 1.108 1.058 2.03 2.336 2.722 3.78.968 2.099 1.316 4.425.873 6.596-.442 2.171-1.533 4.148-3.151 5.71-1.618 1.562-3.668 2.68-5.86 3.251-2.192.571-4.548.45-6.72-.36-2.171-.81-4.092-2.252-5.523-4.167-1.431-1.916-2.33-4.263-2.651-6.758-.32-2.495.009-5.132 1.042-7.526.506-1.139 1.183-2.214 2.016-3.166.834-.952 1.8-1.704 2.86-2.22 1.06-.516 2.186-.816 3.333-.881s2.31.104 3.409.48zm-5.21 5.636c.15.149.321.304.51.468.19.164.395.332.612.502.218.17.445.338.677.503a7.83 7.83 0 001.004.558c.176.068.356.128.54.18.184.052.37.094.558.129.188.035.377.06.568.07.191.01.38 0 .568-.03.188-.03.373-.08.552-.14.179-.06.354-.132.523-.215.169-.083.333-.178.49-.286.157-.108.309-.228.456-.361.147-.133.288-.28.421-.44.133-.16.259-.33.375-.509.116-.179.224-.367.321-.562.097-.195.184-.396.258-.602.074-.206.135-.416.183-.629.048-.213.083-.428.104-.646.021-.218.028-.437.02-.657-.008-.22-.032-.44-.072-.658-.04-.218-.097-.433-.168-.644z"/>
                    </svg>
                    Contact Admin via WhatsApp
                  </a>
                </motion.div>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75 }}
                  className="pt-3 border-t border-white/5 space-y-2"
                >
                  <button className="w-full py-2.5 sm:py-3 px-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold uppercase text-[10px] sm:text-xs tracking-wider transition-all duration-300 shadow-lg shadow-red-600/30 hover:shadow-red-600/50">
                    Notify Me When Ready
                  </button>
                  <p className="text-center text-[9px] text-white/30 uppercase tracking-widest font-mono">
                    Coming Soon • 2026
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DiziAIChat;
