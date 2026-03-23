import React, { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import ChatBox from '../components/ChatBox';
import { MessageCircle, Send, Loader2, Users, Circle } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface Conversation {
  id: string;
  status: string;
  last_message_at: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  unread_count: number;
  last_message: string | null;
}

interface ChatMessage {
  id: string;
  sender_type: 'user' | 'admin';
  message: string;
  is_read: boolean;
  created_at: string;
}

const AdminChat: React.FC = () => {
  const { user } = useAuth();
  const senderName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Admin';
  const [tab, setTab] = useState<'clients' | 'team'>('clients');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch conversations list
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/chat/conversations`);
      const data = await res.json();
      if (data.success) setConversations(data.conversations);
    } catch { /* silent */ } finally {
      setLoadingConvs(false);
    }
  }, []);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/chat/messages/${convId}`);
      const data = await res.json();
      if (data.success) setMessages(data.messages);
    } catch { /* silent */ }
  }, []);

  // Initial load + poll conversations
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Poll messages when a conversation is selected
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (selectedConv) {
      fetchMessages(selectedConv.id);
      pollRef.current = setInterval(() => fetchMessages(selectedConv.id), 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedConv, fetchMessages]);

  const sendMessage = async () => {
    if (!input.trim() || sending || !selectedConv) return;
    setSending(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selectedConv.id, message: input.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setInput('');
        await fetchMessages(selectedConv.id);
        // Update unread count in list
        setConversations(prev => prev.map(c =>
          c.id === selectedConv.id ? { ...c, unread_count: 0, last_message: input.trim() } : c
        ));
      }
    } catch { /* silent */ } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    setMessages([]);
    // Optimistically clear unread badge
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <AdminLayout title="Chat">
      <div className="flex flex-col h-full gap-4">
        {/* Tab bar */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('clients')}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === 'clients' ? 'bg-red-600 text-white' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
            }`}
          >
            Client Chats
          </button>
          <button
            onClick={() => setTab('team')}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === 'team' ? 'bg-red-600 text-white' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
            }`}
          >
            Manager Channel
          </button>
        </div>

        {/* Tab 2: Manager channel chat */}
        {tab === 'team' && (
          <div className="flex-1 overflow-hidden">
            <ChatBox
              channel="admin_manager"
              senderName={senderName}
              label="Admin ↔ Manager"
            />
          </div>
        )}

        {/* Tab 1: Client conversations */}
        {tab === 'clients' && (
          <div className="flex flex-1 rounded-2xl overflow-hidden border border-white/5">

        {/* Left: Conversations list */}
        <div className="w-80 flex-shrink-0 border-r border-white/5 flex flex-col bg-white/[0.01]">
          <div className="p-5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-red-500" />
              <h2 className="font-bold text-sm">Conversations</h2>
              <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-white/60">
                {conversations.length}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConvs && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-red-500" />
              </div>
            )}
            {!loadingConvs && conversations.length === 0 && (
              <div className="text-center py-12 px-4">
                <MessageCircle className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm">No conversations yet</p>
              </div>
            )}
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full text-left px-4 py-4 border-b border-white/[0.03] transition-all hover:bg-white/[0.04] ${
                  selectedConv?.id === conv.id ? 'bg-red-600/10 border-l-2 border-l-red-600' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 flex-shrink-0 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-sm font-bold text-white">
                    {(conv.username || conv.email)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold text-white truncate">@{conv.username}</span>
                      <span className="text-[9px] text-white/30 flex-shrink-0 ml-2">{timeAgo(conv.last_message_at)}</span>
                    </div>
                    <p className="text-xs text-white/40 truncate">
                      {conv.last_message || 'No messages yet'}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Message thread */}
        <div className="flex-1 flex flex-col">
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-white/5 mx-auto mb-4" />
                <p className="text-white/30 text-sm">Select a conversation to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-white/[0.01]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center font-bold text-sm">
                  {selectedConv.username[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">@{selectedConv.username}</p>
                  <p className="text-xs text-white/40">{selectedConv.email}</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <Circle className="w-2 h-2 text-green-500 fill-green-500" />
                  <span className="text-xs text-white/40 font-mono">Chat open</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-white/30 text-sm">No messages yet</p>
                  </div>
                )}
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[65%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.sender_type === 'admin'
                          ? 'bg-red-600 text-white rounded-br-sm'
                          : 'bg-white/[0.06] border border-white/10 text-white/80 rounded-bl-sm'
                      }`}
                    >
                      {msg.sender_type === 'user' && (
                        <p className="text-[9px] font-bold uppercase tracking-wider text-white/40 mb-1">
                          @{selectedConv.username}
                        </p>
                      )}
                      {msg.message}
                      <p className={`text-[9px] mt-1 ${msg.sender_type === 'admin' ? 'text-white/50' : 'text-white/30'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply input */}
              <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01]">
                <div className="flex items-end gap-3">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Reply to @${selectedConv.username}...`}
                    rows={1}
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/50 resize-none transition-all"
                    style={{ maxHeight: '120px', overflowY: 'auto' }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className="w-11 h-11 flex-shrink-0 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-white" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminChat;
