import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';
import { useBooking } from '../contexts/BookingContext';
import { getToken } from '../utils/apiClient';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const ChatWidget: React.FC = () => {
  const { user } = useAuth();
  const { chatForceOpen, clearChatForceOpen } = useBooking();

  const [clientStatus, setClientStatus] = useState<'none' | 'follow_up' | 'onboarded' | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // Check client status on mount when user is logged in
  useEffect(() => {
    if (!user) { setClientStatus('none'); return; }
    const token = getToken();
    fetch(`${BASE_URL}/api/user/client-status`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(d => setClientStatus(d.clientStatus ?? 'none'))
      .catch(() => setClientStatus('none'));
  }, [user]);

  // Respond to chatForceOpen from BookingContext
  useEffect(() => {
    if (chatForceOpen) {
      setPanelOpen(true);
      clearChatForceOpen();
    }
  }, [chatForceOpen, clearChatForceOpen]);

  // Only render for follow_up or onboarded users
  if (!user || clientStatus === null || clientStatus === 'none') return null;

  return (
    <>
      {/* Floating bubble */}
      <div className="fixed bottom-6 right-6 z-[9980]">
        <AnimatePresence>
          {!panelOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPanelOpen(true)}
              className="relative w-14 h-14 rounded-full bg-red-600 shadow-lg shadow-red-600/40 flex items-center justify-center"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-[9980] w-80 sm:w-96 h-[500px] flex flex-col rounded-[1.5rem] bg-[#0a0a0a]/98 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-[0_0_16px_rgba(220,38,38,0.4)]">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Chat with Dizi</p>
                  <p className="text-[10px] text-amber-400/80 font-mono">✦ AI Assistant · Coming Soon</p>
                </div>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>

            {/* Coming Soon Body */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-5">
              {/* Animated glow orb */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/20 border border-red-500/20 flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.2)]">
                  <Sparkles className="w-8 h-8 text-red-400" />
                </div>
                <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping" />
              </div>

              <div className="text-center space-y-2">
                <p className="text-white font-heading font-bold text-lg">Dizi is coming</p>
                <p className="text-white/40 text-sm leading-relaxed max-w-[220px]">
                  Your personal AI assistant from Dizitup is being built.
                </p>
              </div>

              <div className="w-full px-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/10 border border-red-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-[11px] text-red-400/80 font-mono">Training in progress…</span>
                </div>
              </div>

              <p className="text-[10px] text-white/20 text-center">
                Need help now?{' '}
                <span className="text-white/40 underline underline-offset-2">Chat with admin in your Dashboard →</span>
              </p>
            </div>

            {/* Disabled Input — Coming Soon */}
            <div className="px-4 py-4 border-t border-white/5 bg-white/[0.02]">
              <div className="flex items-end gap-2">
                <div className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3 text-sm text-white/20 cursor-not-allowed select-none">
                  Dizi AI coming soon…
                </div>
                <div className="w-10 h-10 flex-shrink-0 rounded-full bg-red-600/30 border border-red-500/20 flex items-center justify-center cursor-not-allowed">
                  <Sparkles className="w-4 h-4 text-red-400/50" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
