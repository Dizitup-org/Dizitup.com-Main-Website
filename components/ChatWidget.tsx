import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';
import { useBooking } from '../contexts/BookingContext';
import { getToken } from '../utils/apiClient';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface ChatMessage {
  id: string;
  sender_type: 'user' | 'admin';
  message: string;
  is_read: boolean;
  created_at: string;
}

const ChatWidget: React.FC = () => {
  const { user } = useAuth();
  const { chatForceOpen, clearChatForceOpen } = useBooking();

  const [clientStatus, setClientStatus] = useState<'none' | 'follow_up' | 'onboarded' | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = useCallback(async () => {
    const token = getToken();
    try {
      const res = await fetch(`${BASE_URL}/api/chat/messages`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages ?? []);
        if (data.conversationId) setConversationId(data.conversationId);
        // Count unread admin messages (not read yet = user hasn't opened panel)
        if (!panelOpen) {
          const unread = (data.messages ?? []).filter(
            (m: ChatMessage) => m.sender_type === 'admin' && !m.is_read
          ).length;
          setUnreadCount(unread);
        }
      }
    } catch { /* silent */ }
  }, [panelOpen]);

  // Poll every 3s while panel is open
  useEffect(() => {
    if (panelOpen && (clientStatus === 'follow_up' || clientStatus === 'onboarded')) {
      fetchMessages();
      pollRef.current = setInterval(fetchMessages, 3000);
      setUnreadCount(0);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [panelOpen, clientStatus, fetchMessages]);

  // Background poll for unread badge (every 15s)
  useEffect(() => {
    if (!panelOpen && (clientStatus === 'follow_up' || clientStatus === 'onboarded')) {
      const bg = setInterval(fetchMessages, 15000);
      return () => clearInterval(bg);
    }
  }, [panelOpen, clientStatus, fetchMessages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const token = getToken();
    try {
      const res = await fetch(`${BASE_URL}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: input.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setInput('');
        await fetchMessages();
      }
    } catch { /* silent */ } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

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
              <MessageCircle className="w-6 h-6 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-red-600 text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
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
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Dizitup Admin</p>
                  <p className="text-[10px] text-green-400 font-mono">● Online</p>
                </div>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-white/30 text-sm">Start a conversation with admin</p>
                </div>
              )}
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.sender_type === 'user'
                        ? 'bg-red-600 text-white rounded-br-sm'
                        : 'bg-white/[0.06] border border-white/10 text-white/80 rounded-bl-sm'
                    }`}
                  >
                    {msg.sender_type === 'admin' && (
                      <p className="text-[9px] font-bold uppercase tracking-wider text-white/40 mb-1">Admin</p>
                    )}
                    {msg.message}
                    <p className={`text-[9px] mt-1 ${msg.sender_type === 'user' ? 'text-white/50' : 'text-white/30'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-4 border-t border-white/5 bg-white/[0.02]">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/50 resize-none transition-all"
                  style={{ maxHeight: '100px', overflowY: 'auto' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="w-10 h-10 flex-shrink-0 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
