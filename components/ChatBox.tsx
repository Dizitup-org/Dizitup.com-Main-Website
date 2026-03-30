import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, MessageCircle, X, Paperclip, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { getToken } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthProvider';

interface TeamMessage {
  id: string;
  sender_name: string;
  sender_id?: string;
  message?: string;
  media_url?: string;
  media_type?: 'image' | 'pdf';
  file_name?: string;
  created_at: string;
}

interface ChatBoxProps {
  channel: string;
  senderName: string;
  apiBase?: string;
  label?: string;
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const ChatBox: React.FC<ChatBoxProps> = ({
  channel,
  senderName,
  apiBase = '/api/staff/chat',
  label = 'Team Chat',
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);

  const authHeaders = () => {
    const t = getToken();
    return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
  };

  const fetchMessages = useCallback(async () => {
    try {
      const res  = await fetch(`${BASE_URL}${apiBase}/${channel}`, { headers: authHeaders() });
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

  // ── Send text ──────────────────────────────────────────────
  const send = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const t   = getToken();
      const res = await fetch(`${BASE_URL}${apiBase}/${channel}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
        body:    JSON.stringify({ message: input.trim(), sender_name: senderName, sender_id: user?.id }),
      });
      const data = await res.json();
      if (data.success) { setInput(''); await fetchMessages(); }
    } catch { /* silent */ } finally { setSending(false); }
  };

  // ── Upload file ────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset so same file can be re-uploaded

    const MAX = file.type === 'application/pdf' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > MAX) {
      alert(`File too large. Max ${file.type === 'application/pdf' ? '10MB' : '5MB'}.`);
      return;
    }

    setUploading(true);
    try {
      const t   = getToken();
      const form = new FormData();
      form.append('file', file);
      form.append('sender_name', senderName);
      if (user?.id) form.append('sender_id', user.id);

      const res  = await fetch(`${BASE_URL}${apiBase}/${channel}/upload`, {
        method:  'POST',
        headers: t ? { Authorization: `Bearer ${t}` } : {},
        body:    form,
      });
      const data = await res.json();
      if (data.success) await fetchMessages();
    } catch { /* silent */ } finally { setUploading(false); }
  };

  // ── Delete message ─────────────────────────────────────────
  const deleteMessage = async (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    try {
      const t = getToken();
      await fetch(`${BASE_URL}${apiBase}/${channel}/messages/${msgId}`, {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
      });
    } catch { /* silent */ }
  };

  // ── Render a single message bubble ────────────────────────
  const renderBubble = (msg: TeamMessage) => {
    const isOwn    = msg.sender_name === senderName;
    const canDelete = isOwn && msg.sender_id === user?.id;

    let content: React.ReactNode;

    if (msg.media_type === 'image' && msg.media_url) {
      content = (
        <a href={msg.media_url} target="_blank" rel="noopener noreferrer">
          <img
            src={msg.media_url}
            alt={msg.file_name || 'Image'}
            className="max-w-full rounded-lg max-h-48 object-cover border border-white/10"
          />
        </a>
      );
    } else if (msg.media_type === 'pdf' && msg.media_url) {
      content = (
        <a
          href={msg.media_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 px-1 py-0.5 rounded-lg group/pdf ${isOwn ? 'text-white' : 'text-white/80'}`}
        >
          <FileText size={16} className="flex-shrink-0 opacity-80" />
          <span className="text-xs font-medium truncate max-w-[160px]">{msg.file_name || 'Document.pdf'}</span>
          <ExternalLink size={10} className="flex-shrink-0 opacity-60 group-hover/pdf:opacity-100" />
        </a>
      );
    } else {
      content = <p className="text-sm leading-relaxed">{msg.message}</p>;
    }

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
            className={`px-3 py-2 rounded-xl ${
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
            {content}
            <p className={`text-[9px] mt-1 ${isOwn ? 'text-white/50' : 'text-white/30'}`}>
              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden" style={{ height: '420px' }}>
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
            <p className="text-xs text-white/20 text-center">No messages yet.<br />Start the conversation!</p>
          </div>
        )}
        {messages.map(msg => renderBubble(msg))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/[0.06] bg-white/[0.02] flex gap-2 flex-shrink-0 items-center">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Paperclip */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Attach image or PDF"
          className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all disabled:opacity-40"
        >
          {uploading
            ? <Loader2 size={13} className="animate-spin text-white/50" />
            : <Paperclip size={13} className="text-white/50" />}
        </button>

        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }}}
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
