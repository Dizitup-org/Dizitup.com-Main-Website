import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, MessageCircle, X } from 'lucide-react';
import { getToken } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthProvider';

interface TeamMessage {
  id: string;
  sender_name: string;
  sender_id?: string;
  message: string;
  created_at: string;
}

interface ChatBoxProps {
  /** Channel key, e.g. 'admin_manager' or 'manager_employee_uuid' */
  channel: string;
  /** Display name used to identify own messages (right-aligned) */
  senderName: string;
  /** API base path, e.g. '/api/staff/chat' */
  apiBase?: string;
  /** Optional label shown in header */
  label?: string;
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const ChatBox: React.FC<ChatBoxProps> = ({
  channel,
  senderName,
  apiBase = '/api/chat/channel',
  label = 'Team Chat',
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const authHeaders = () => {
    const t = getToken();
    return {
      'Content-Type': 'application/json',
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    };
  };

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}${apiBase}/${channel}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) setMessages(data.messages);
    } catch { /* silent */ }
  }, [channel, apiBase]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${BASE_URL}${apiBase}/${channel}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ message: input.trim(), sender_name: senderName }),
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

  const deleteMessage = async (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    try {
      await fetch(`${BASE_URL}${apiBase}/${channel}/messages/${msgId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
    } catch { /* silent */ }
  };

  return (
    <div
      className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden"
      style={{ height: '400px' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02] flex-shrink-0">
        <MessageCircle size={14} className="text-red-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-white/50">{label}</span>
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-white/20 text-center">
              No messages yet.
              <br />Start the conversation!
            </p>
          </div>
        )}
        {messages.map(msg => {
          const isOwn = msg.sender_name === senderName;
          const canDelete = isOwn && msg.sender_id === user?.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              onMouseEnter={() => setHoveredId(msg.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="relative max-w-[72%]">
                {canDelete && hoveredId === msg.id && (
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center z-10 shadow-md transition-all"
                  >
                    <X size={8} />
                  </button>
                )}
                <div
                  className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    isOwn
                      ? 'bg-red-600 text-white rounded-br-sm shadow-[0_2px_8px_rgba(220,38,38,0.25)]'
                      : 'bg-white/[0.06] border border-white/10 text-white/80 rounded-bl-sm'
                  }`}
                >
                  {!isOwn && (
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/40 mb-1">
                      {msg.sender_name}
                    </p>
                  )}
                  <p>{msg.message}</p>
                  <p className={`text-[9px] mt-1 ${isOwn ? 'text-white/50' : 'text-white/30'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/[0.06] bg-white/[0.02] flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
          }}
          placeholder="Type a message…"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/50 transition-all"
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="w-9 h-9 flex-shrink-0 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all"
        >
          {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
