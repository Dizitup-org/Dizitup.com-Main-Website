import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getToken } from '../utils/apiClient';
import { FileText, Loader2, Send, Inbox, CornerDownRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const authH = (): Record<string, string> => { const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {}; };
const jsonH = (): Record<string, string> => { const t = getToken(); return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }; };

interface Doc { id: string; title: string; description?: string; file_url: string; file_name?: string; file_size?: number; uploaded_by_name?: string; sent_to_name?: string; forward_note?: string; created_at: string; }
interface Employee { admin_id: string; user_id: string; first_name: string; last_name: string; username: string; }

const fmt = (bytes?: number) => !bytes ? '' : bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

const ManagerDocs: React.FC = () => {
  const [tab, setTab]           = useState<'inbox' | 'sent'>('inbox');
  const [inbox, setInbox]       = useState<Doc[]>([]);
  const [sent, setSent]         = useState<Doc[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading]   = useState(true);
  const [forwardingId, setForwardingId] = useState<string | null>(null);
  const [fwdEmp, setFwdEmp]     = useState('');
  const [fwdNote, setFwdNote]   = useState('');
  const [fwdSending, setFwdSending] = useState(false);

  // Direct upload states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc]  = useState('');
  const [uploadEmp, setUploadEmp]    = useState('');
  const [uploading, setUploading]    = useState(false);

  const fetchInbox = useCallback(async () => {
    try {
      const res  = await fetch(`${BASE_URL}/api/manager/docs/inbox`, { headers: authH() });
      const data = await res.json();
      if (data.success) setInbox(data.docs);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  const fetchSent = useCallback(async () => {
    try {
      const res  = await fetch(`${BASE_URL}/api/manager/docs/sent`, { headers: authH() });
      const data = await res.json();
      if (data.success) setSent(data.docs);
    } catch { /* silent */ }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res  = await fetch(`${BASE_URL}/api/manager/employees`, { headers: authH() });
      const data = await res.json();
      if (data.success) {
        setEmployees((data.employees as any[])
          .filter(e => e.role === 'employee')
          .map(e => ({ admin_id: e.admin_id || e.id, user_id: e.user_id || e.id, first_name: e.first_name, last_name: e.last_name, username: e.username }))
        );
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchInbox(); fetchSent(); fetchEmployees(); }, [fetchInbox, fetchSent, fetchEmployees]);

  const handleForward = async (docId: string) => {
    if (!fwdEmp) { toast.error('Select an employee'); return; }
    const emp = employees.find(e => e.admin_id === fwdEmp);
    setFwdSending(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/manager/docs/forward/${docId}`, {
        method:  'POST',
        headers: jsonH(),
        body:    JSON.stringify({ employee_id: emp!.admin_id, employee_name: `${emp!.first_name} ${emp!.last_name}`, note: fwdNote }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Document forwarded to employee!');
        setForwardingId(null); setFwdEmp(''); setFwdNote('');
        fetchSent();
      } else {
        toast.error(data.message || 'Failed to forward');
      }
    } catch { toast.error('Network error'); } finally { setFwdSending(false); }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return toast.error('Please select a file');
    if (!uploadTitle.trim()) return toast.error('Title is required');
    if (!uploadEmp) return toast.error('Please select an employee');
    
    const emp = employees.find(e => e.admin_id === uploadEmp);
    setUploading(true);
    
    try {
      const form = new FormData();
      form.append('file', uploadFile);
      form.append('title', uploadTitle);
      form.append('description', uploadDesc);
      form.append('employee_id', uploadEmp);
      form.append('employee_name', `${emp?.first_name} ${emp?.last_name}`);
      
      const t = getToken();
      const res = await fetch(`${BASE_URL}/api/manager/docs/upload`, {
        method: 'POST',
        headers: t ? { Authorization: `Bearer ${t}` } : {},
        body: form
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Document uploaded to employee!');
        setUploadFile(null);
        setUploadTitle('');
        setUploadDesc('');
        setUploadEmp('');
        fetchSent();
      } else {
        toast.error(data.message || 'Failed to upload');
      }
    } catch { toast.error('Network error'); } finally { setUploading(false); }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetch(`${BASE_URL}/api/manager/docs/${docId}`, {
        method: 'DELETE',
        headers: authH(),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Document deleted');
        fetchSent();
      } else {
        toast.error(data.message || 'Failed to delete');
      }
    } catch { toast.error('Network error'); }
  };

  const DocCard = ({ doc, showForward }: { doc: Doc; showForward?: boolean }) => (
    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center mt-0.5">
          <FileText size={16} className="text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{doc.title}</p>
          {doc.description && <p className="text-[11px] text-white/40 mt-0.5">{doc.description}</p>}
          <div className="flex flex-wrap gap-3 mt-1 text-[10px] text-white/30">
            {doc.uploaded_by_name && <span>From: <span className="text-white/50">{doc.uploaded_by_name}</span></span>}
            {doc.sent_to_name && !showForward && <span>To: <span className="text-white/50">{doc.sent_to_name}</span></span>}
            {doc.forward_note && <span>Note: <span className="text-white/50 italic">{doc.forward_note}</span></span>}
            {doc.file_size && <span>{fmt(doc.file_size)}</span>}
            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/60 hover:text-white transition-all">
            View PDF
          </a>
          {showForward && (
            <button
              onClick={() => { setForwardingId(forwardingId === doc.id ? null : doc.id); setFwdEmp(''); setFwdNote(''); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-[11px] text-red-400 transition-all"
            >
              <CornerDownRight size={11} /> Forward
            </button>
          )}
          {!showForward && (
            <button
              onClick={() => handleDelete(doc.id)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-white/40 hover:text-red-400 transition-all"
              title="Delete Document"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Forward form */}
      {showForward && forwardingId === doc.id && (
        <div className="pt-3 border-t border-white/[0.06] space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Forward to Employee</p>
          <div className="flex gap-2">
            <select
              value={fwdEmp}
              onChange={e => setFwdEmp(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600/50"
            >
              <option value="">Select Employee</option>
              {employees.map(e => <option key={e.admin_id} value={e.admin_id}>{e.first_name} {e.last_name} (@{e.username})</option>)}
            </select>
            <input
              value={fwdNote}
              onChange={e => setFwdNote(e.target.value)}
              placeholder="Add a note (optional)"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-red-600/50"
            />
            <button
              onClick={() => handleForward(doc.id)}
              disabled={!fwdEmp || fwdSending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-xs font-bold transition-all"
            >
              {fwdSending ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />} Send
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AdminLayout title="Manager — Docs">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Documents</h1>
          <p className="text-[12px] text-white/35 mt-0.5">Receive from admin · Forward to employees</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2">
          <button onClick={() => setTab('inbox')} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'inbox' ? 'bg-red-600 text-white' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}>
            <Inbox size={14} /> Inbox {inbox.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">{inbox.length}</span>}
          </button>
          <button onClick={() => setTab('sent')} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'sent' ? 'bg-red-600 text-white' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}>
            <Send size={14} /> Sent to Employees
          </button>
        </div>

        {loading && <div className="flex items-center gap-2 text-white/30 text-sm"><Loader2 size={14} className="animate-spin" /> Loading…</div>}

        {/* Inbox */}
        {tab === 'inbox' && !loading && (
          <div className="space-y-3">
            {inbox.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-white/[0.06]">
                <Inbox size={24} className="text-white/15 mb-2" />
                <p className="text-xs text-white/25">No documents received yet</p>
              </div>
            ) : (
              inbox.map(doc => <DocCard key={doc.id} doc={doc} showForward />)
            )}
          </div>
        )}

        {/* Sent */}
        {tab === 'sent' && !loading && (
          <div className="space-y-4">
            {/* Direct Upload Form */}
            <form onSubmit={handleUpload} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Direct Upload</p>
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Document Title *"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600/50"
                  required
                />
                <select
                  value={uploadEmp}
                  onChange={e => setUploadEmp(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600/50"
                  required
                >
                  <option value="">Select Employee *</option>
                  {employees.map(e => <option key={e.admin_id} value={e.admin_id}>{e.first_name} {e.last_name} (@{e.username})</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Optional description"
                  value={uploadDesc}
                  onChange={e => setUploadDesc(e.target.value)}
                  className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600/50"
                />
                <div className="md:col-span-2 flex gap-3">
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onChange={e => e.target.files && setUploadFile(e.target.files[0])}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white/70 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-600/20 file:text-red-400 hover:file:bg-red-600/30 transition-all cursor-pointer focus:outline-none focus:border-red-600/50"
                    required
                  />
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-shrink-0 flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-sm font-bold transition-all"
                  >
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Upload
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-3">
            {sent.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-white/[0.06]">
                <FileText size={24} className="text-white/15 mb-2" />
                <p className="text-xs text-white/25">Nothing forwarded yet</p>
              </div>
            ) : (
              sent.map(doc => <DocCard key={doc.id} doc={doc} />)
            )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ManagerDocs;
