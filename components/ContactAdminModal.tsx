import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Sparkles } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ContactAdminModal: React.FC<Props> = ({ open, onClose }) => {
  const { openAdminChat } = useBooking();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9990] flex items-center justify-center p-4"
        >
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md rounded-[2rem] bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-8 text-center"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-white/40" />
            </button>

            {/* Icon */}
            <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-lg shadow-red-600/20">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-widest mb-4">
              Active Client
            </span>

            <h3 className="text-2xl font-heading font-bold text-white mb-3 tracking-tight">
              You're already onboard!
            </h3>
            <p className="text-sm text-white/50 leading-relaxed mb-8">
              As an active client, new projects and discussions happen directly with your admin. Use the chat to get started.
            </p>

            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openAdminChat}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm uppercase tracking-widest transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                Open Chat
              </motion.button>
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-all"
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContactAdminModal;
