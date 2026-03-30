import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getToken } from '../utils/apiClient';
import { FileText, Upload, Send, Loader2, Trash2, Users, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const authH = (): Record<string, string> => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const jsonH = (): Record<string, string> => {
  const t = getToken();
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};

interface Manager { admin_id: string; user_id: string; first_name: string; last_name: string; username: string; }
interface Doc { id: string; title: string; description?: string; file_url: string; file_name?: string; file_size?: number; sent_to_name?: string; created_at: string; }

const fmt = (bytes?: number) => !bytes ? '' : bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

const AdminDocs: React.FC = () => {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [docs, setDocs]         = useState<Doc[]>([]);
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);

  // form
  const [title, setTitle]       = useState('');
  const [desc, setDesc]         = useState('');
  const [selectedMgr, setSelectedMgr] = useState('');
  const [file, setFile]         = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchManagers = useCallback(async () => {
    try {
      const res  = await fetch(`${BASE_URL}/api/manager/employees`, { headers: authH() });
      const data = await res.json();
      if (data.success) {
        setManagers((data.employees as any[])
          .filter(e => e.role === 'manager')
          .map(m => ({ admin_id: m.admin_id || m.id, user_id: m.user_id || m.id, first_name: m.first_name, last_name: m.last_name, username: m.username }))
        );
      }
    } catch { /* silent */ }
  }, []);

  const fetchDocs = useCallback(async () => {
    try {
      const res  = await fetch(`${BASE_URL}/api/admin/docs`, { headers: authH() });
      const data = await res.json();
      if (data.success) setDocs(data.docs);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchManagers(); fetchDocs(); }, [fetchManagers, fetchDocs]);

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') { toast.error('Only PDF files allowed'); return; }
    if (f.size > 20 * 1024 * 1024) { toast.error('Max 20MB per PDF'); return; }
    setFile(f);
  };

  const handleSend = async () => {
    if (!file) { toast.error('Please select a PDF'); return; }
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!selectedMgr) { toast.error('Select a manager'); return; }

    const mgr = managers.find(m => m.admin_id === selectedMgr);
    setSending(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('title', title.trim());
      if (desc.trim()) form.append('description', desc.trim());
      form.append('manager_id', mgr!.admin_id);
      form.append('manager_name', `${mgr!.first_name} ${mgr!.last_name}`);

      const res  = await fetch(`${BASE_URL}/api/admin/docs`, { method: 'POST', headers: authH(), body: form });
      const data = await res.json();
      if (data.success) {
        toast.success('Document sent to manager!');
        setTitle(''); setDesc(''); setFile(null); setSelectedMgr('');
        fetchDocs();
      } else {
        toast.error(data.message || 'Failed to send');
      }
    } catch { toast.error('Network error'); } finally { setSending(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      const res  = await fetch(`${BASE_URL}/api/admin/docs/${id}`, { method: 'DELETE', headers: jsonH() });
      const data = await res.json();
      if (data.success) { toast.success('Deleted'); setDocs(d => d.filter(x => x.id !== id)); }
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <AdminLayout title="Admin — Docs">
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Official Documents</h1>
          <p className="text-[12px] text-white/35 mt-0.5">Send contracts &amp; official PDFs to managers</p>
        </div>

        {/* Upload form */}
        <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Send New Document</p>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => fileRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
              dragOver ? 'border-red-500/60 bg-red-500/5' : file ? 'border-green-500/40 bg-green-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
            }`}
          >
            <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
            {file ? (
              <>
                <CheckCircle size={22} className="text-green-400" />
                <p className="text-sm text-green-400 font-medium">{file.name}</p>
                <p className="text-[10px] text-white/30">{fmt(file.size)} · Click to replace</p>
                <button onClick={e => { e.stopPropagation(); setFile(null); }} className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-500/30 transition-colors">
                  <X size={10} />
                </button>
              </>
            ) : (
              <>
                <Upload size={20} className="text-white/25" />
                <p className="text-sm text-white/40">Drag &amp; drop PDF or <span className="text-red-400">browse</span></p>
                <p className="text-[10px] text-white/20">PDF only · Max 20MB</p>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Document title *"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/50 transition-all"
            />
            <select
              value={selectedMgr}
              onChange={e => setSelectedMgr(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/50 transition-all"
            >
              <option value="">Select Manager *</option>
              {managers.map(m => <option key={m.admin_id} value={m.admin_id}>{m.first_name} {m.last_name} (@{m.username})</option>)}
            </select>
          </div>

          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Description or notes (optional)"
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/50 transition-all resize-none"
          />

          <button
            onClick={handleSend}
            disabled={sending || !file || !title.trim() || !selectedMgr}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold transition-all shadow-[0_0_14px_rgba(220,38,38,0.2)]"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Send to Manager
          </button>
        </div>

        {/* Sent docs history */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Sent Documents ({docs.length})</p>

          {loading && <div className="flex items-center gap-2 text-white/30 text-sm"><Loader2 size={14} className="animate-spin" /> Loading…</div>}

          {!loading && docs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 rounded-xl border border-white/[0.06] bg-white/[0.01]">
              <FileText size={24} className="text-white/15 mb-2" />
              <p className="text-xs text-white/25">No documents sent yet</p>
            </div>
          )}

          {docs.map(doc => (
            <div key={doc.id} className="flex items-center gap-4 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center">
                <FileText size={16} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{doc.title}</p>
                <p className="text-[11px] text-white/35 mt-0.5">
                  Sent to: <span className="text-white/50">{doc.sent_to_name}</span>
                  {doc.file_name && <> · {doc.file_name}</>}
                  {doc.file_size && <> · {fmt(doc.file_size)}</>}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/60 hover:text-white transition-all">
                  View
                </a>
                <button onClick={() => handleDelete(doc.id)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 flex items-center justify-center transition-all">
                  <Trash2 size={11} className="text-white/40 hover:text-red-400" />
                </button>
              </div>
              <div className="text-[10px] text-white/25 flex-shrink-0">{new Date(doc.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDocs;
