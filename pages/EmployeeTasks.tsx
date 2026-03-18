import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '../components/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import ChatBox from '../components/ChatBox';
import {
  CheckSquare, Clock, AlertTriangle, Loader2,
  RefreshCw, Send, ChevronDown, ChevronUp, ArrowRight, FileText,
} from 'lucide-react';
import { getToken } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthProvider';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const authHeaders = () => {
  const t = getToken();
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};

interface Task {
  id: string; project_id: string; project_title: string; company_name?: string;
  title: string; description: string; status: string; deadline: string | null;
}

interface TaskNote { id: string; employee_name: string; note: string; created_at: string; }

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending:     { label: 'Pending',     color: 'border-yellow-500/20 bg-yellow-500/5',  dot: 'bg-yellow-400' },
  in_progress: { label: 'In Progress', color: 'border-blue-500/20 bg-blue-500/5',      dot: 'bg-blue-400' },
  completed:   { label: 'Completed',   color: 'border-green-500/20 bg-green-500/5',    dot: 'bg-green-400' },
  blocked:     { label: 'Blocked',     color: 'border-red-500/20 bg-red-500/5',        dot: 'bg-red-400' },
};

const STATUS_ORDER = ['in_progress', 'pending', 'blocked', 'completed'];

const daysLeft = (deadline: string) => {
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  return diff;
};

const TaskCard: React.FC<{
  task: Task;
  senderName: string;
  onStatusChange: (id: string, status: string) => void;
}> = ({ task, senderName, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState<TaskNote[]>([]);
  const [noteText, setNoteText] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [sendingNote, setSendingNote] = useState(false);
  const days = task.deadline ? daysLeft(task.deadline) : null;

  const fetchNotes = async () => {
    setLoadingNotes(true);
    try {
      const res = await fetch(`${BASE_URL}/api/employee/tasks/${task.id}/notes`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setNotes(data.notes);
    } catch { /* silent */ } finally { setLoadingNotes(false); }
  };

  const toggleNotes = () => {
    if (!expanded) fetchNotes();
    setExpanded(v => !v);
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    setSendingNote(true);
    try {
      const res = await fetch(`${BASE_URL}/api/employee/tasks/${task.id}/notes`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ note: noteText.trim(), employee_name: senderName }),
      });
      const data = await res.json();
      if (data.success) { setNotes(prev => [...prev, data.note]); setNoteText(''); }
      else toast.error('Failed to post note');
    } catch { toast.error('Network error'); } finally { setSendingNote(false); }
  };

  return (
    <div className={`rounded-2xl border transition-all overflow-hidden ${STATUS_CONFIG[task.status]?.color ?? 'border-white/10 bg-white/[0.02]'}`}>
      <div className="p-4 space-y-3">
        {/* Project + client labels */}
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30">{task.project_title}</p>
          {task.company_name && <span className="text-[9px] text-white/20">· {task.company_name}</span>}
        </div>

        {/* Title */}
        <p className="font-heading font-bold text-sm">{task.title}</p>

        {/* Description */}
        {task.description && <p className="text-xs text-white/40 leading-relaxed">{task.description}</p>}

        {/* Deadline */}
        {days !== null && (
          <div className={`flex items-center gap-1.5 text-[10px] font-mono ${days < 0 ? 'text-red-400' : days <= 3 ? 'text-yellow-400' : 'text-white/30'}`}>
            {days <= 3 && <AlertTriangle size={10} />}
            <Clock size={9} />
            {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
            {' · '}{new Date(task.deadline!).toLocaleDateString()}
          </div>
        )}

        {/* Status cycle button */}
        <button
          onClick={() => {
            const order = ['pending', 'in_progress', 'completed'];
            const next = order[(order.indexOf(task.status) + 1) % order.length];
            onStatusChange(task.id, next);
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all hover:opacity-80 ${
            STATUS_CONFIG[task.status]?.color ?? 'border-white/10 bg-white/5 text-white/40'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[task.status]?.dot}`} />
            {STATUS_CONFIG[task.status]?.label ?? task.status}
          </span>
          <ArrowRight size={11} className="text-white/30" />
        </button>

        {/* Notes toggle */}
        <button
          onClick={toggleNotes}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] text-xs text-white/40 hover:text-white/60 transition-all"
        >
          <span className="flex items-center gap-1.5"><FileText size={11} /> Progress Notes</span>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/[0.06] overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {loadingNotes ? (
                <div className="flex items-center gap-2 text-xs text-white/30"><Loader2 size={12} className="animate-spin" /> Loading…</div>
              ) : notes.length === 0 ? (
                <p className="text-xs text-white/20 italic">No notes yet. Add one below.</p>
              ) : (
                <div className="space-y-2">
                  {notes.map(n => (
                    <div key={n.id} className="px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-white/50">{n.employee_name}</p>
                        <p className="text-[9px] text-white/25 font-mono">{new Date(n.created_at).toLocaleDateString()}</p>
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed">{n.note}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Add a progress note…"
                  rows={2}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/50 resize-none"
                />
                <button
                  onClick={addNote}
                  disabled={!noteText.trim() || sendingNote}
                  className="w-10 h-10 self-end flex-shrink-0 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 flex items-center justify-center transition-all"
                >
                  {sendingNote ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EmployeeTasks: React.FC = () => {
  const { user } = useAuth();
  const senderName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Employee';
  const chatChannel = `manager_employee_${user?.id || 'general'}`;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/employee/tasks`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setTasks(data.tasks);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleStatusChange = async (taskId: string, status: string) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    try {
      const res = await fetch(`${BASE_URL}/api/employee/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) { toast.error('Failed to update status'); fetchTasks(); }
    } catch { toast.error('Network error'); fetchTasks(); }
  };

  const handlePostUpdate = async (projectId: string, text: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/employee/updates`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ project_id: projectId, update_text: text }),
      });
      const data = await res.json();
      if (data.success) toast.success('Update posted');
      else toast.error(data.message || 'Failed to post update');
    } catch { toast.error('Network error'); }
  };

  const grouped = STATUS_ORDER.reduce<Record<string, Task[]>>((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s);
    return acc;
  }, {});

  const totalByStatus = Object.fromEntries(
    STATUS_ORDER.map(s => [s, tasks.filter(t => t.status === s).length])
  );

  return (
    <AdminLayout title="Employee — Tasks">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">My Tasks</h1>
            <p className="text-sm text-white/40 mt-1">{tasks.length} total · {totalByStatus.in_progress} in progress</p>
          </div>
          <button onClick={() => { setLoading(true); fetchTasks(); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-all">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Summary pills */}
        <div className="flex flex-wrap gap-3">
          {STATUS_ORDER.map(s => (
            <div key={s} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${STATUS_CONFIG[s].color}`}>
              <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
              <span className="text-xs font-mono">{STATUS_CONFIG[s].label}</span>
              <span className="text-xs font-bold text-white/60">{totalByStatus[s]}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-3 p-8 rounded-2xl bg-white/[0.03] border border-white/5 text-white/40">
            <Loader2 size={18} className="animate-spin" /> Loading tasks…
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
            <CheckSquare size={32} className="text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No tasks assigned yet</p>
            <p className="text-xs text-white/20 mt-1">Your manager will assign tasks here</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
            {STATUS_ORDER.map(status => (
              <div key={status} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[status].dot}`} />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-white/40">{STATUS_CONFIG[status].label}</h3>
                  <span className="text-xs text-white/20 font-mono ml-auto">{grouped[status].length}</span>
                </div>
                <div className="space-y-3">
                  {grouped[status].map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      senderName={senderName}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                  {grouped[status].length === 0 && (
                    <div className="p-4 rounded-2xl border border-white/[0.05] bg-white/[0.01] text-center">
                      <p className="text-xs text-white/15">Empty</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Team Chat */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30">Chat with Manager</span>
          <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-white/10" />
        </div>
        <ChatBox
          channel={chatChannel}
          senderName={senderName}
          label="Manager Channel"
        />
      </div>
    </AdminLayout>
  );
};

export default EmployeeTasks;
