import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getToken } from '../utils/apiClient';
import { FileText, Loader2, Download, ExternalLink } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const authH = (): Record<string, string> => { const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {}; };

interface Doc { id: string; title: string; description?: string; file_url: string; file_name?: string; file_size?: number; uploaded_by_name?: string; forward_note?: string; created_at: string; }

const fmt = (bytes?: number) => !bytes ? '' : bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

const EmployeeDocs: React.FC = () => {
  const [docs, setDocs]       = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = useCallback(async () => {
    try {
      const res  = await fetch(`${BASE_URL}/api/employee/docs`, { headers: authH() });
      const data = await res.json();
      if (data.success) setDocs(data.docs);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  return (
    <AdminLayout title="Employee — Docs">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">My Documents</h1>
          <p className="text-[12px] text-white/35 mt-0.5">Official documents shared with you by your manager</p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-white/30 text-sm">
            <Loader2 size={14} className="animate-spin" /> Loading documents…
          </div>
        )}

        {!loading && docs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-52 rounded-2xl border border-white/[0.06] bg-white/[0.01]">
            <FileText size={32} className="text-white/15 mb-3" />
            <p className="text-sm text-white/30">No documents yet</p>
            <p className="text-xs text-white/20 mt-1">Your manager will share official documents here</p>
          </div>
        )}

        <div className="space-y-3">
          {docs.map(doc => (
            <div key={doc.id} className="flex items-start gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center">
                <FileText size={18} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{doc.title}</p>
                {doc.description && <p className="text-[12px] text-white/45 mt-0.5 leading-relaxed">{doc.description}</p>}
                {doc.forward_note && (
                  <div className="mt-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/[0.06] border border-amber-400/15 inline-block">
                    <p className="text-[11px] text-amber-300/70 italic">"{doc.forward_note}"</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-white/25">
                  {doc.uploaded_by_name && <span>From: <span className="text-white/40">{doc.uploaded_by_name}</span></span>}
                  {doc.file_name && <span>{doc.file_name}</span>}
                  {doc.file_size && <span>{fmt(doc.file_size)}</span>}
                  <span>{new Date(doc.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/60 group-hover:text-white transition-all"
                >
                  <ExternalLink size={11} /> View
                </a>
                <a
                  href={doc.file_url}
                  download={doc.file_name}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-[11px] text-red-400 transition-all"
                >
                  <Download size={11} /> Download
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default EmployeeDocs;
