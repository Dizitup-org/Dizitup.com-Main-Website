import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '../components/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare, Clock, AlertTriangle, Loader2,
  RefreshCw, Send, ChevronDown, ChevronUp,
} from 'lucide-react';
import { getToken } from '../utils/apiClient';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const authHeaders = () => {
  const t = getToken();
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};

interface Task {
  id: string; project_id: string; project_title: string;
  title: string; description: string; status: string; deadline: string | null;
}

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
  onStatusChange: (id: string, status: string) => void;
  onPostUpdate: (projectId: string, text: string) => void;
}> = ({ task, onStatusChange, onPostUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [updateText, setUpdateText] = useState('');
  const [sending, setSending] = useState(false);
  const days = task.deadline ? daysLeft(task.deadline) : null;

  const handleSend = async () => {
    if (!updateText.trim()) return;
    setSending(true);
    await onPostUpdate(task.project_id, updateText.trim());
    setUpdateText('');
    setSending(false);
  };

  return (
    <div className={`rounded-2xl border transition-all overflow-hidden ${STATUS_CONFIG[task.status]?.color ?? 'border-white/10 bg-white/[0.02]'}`}>
      <div className="p-4 space-y-3">
        {/* Project label */}
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30">{task.project_title}</p>

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

        {/* Status selector */}
        <select
          value={task.status}
          onChange={e => onStatusChange(task.id, e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider text-white focus:outline-none focus:border-red-600/50 cursor-pointer"
        >
          {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
            <option key={val} value={val} className="bg-[#1a1a1a] text-white normal-case font-normal">{cfg.label}</option>
          ))}
        </select>

        {/* Post update toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] text-xs text-white/40 hover:text-white/60 transition-all"
        >
          <span>Post an update</span>
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
            <div className="p-4 flex gap-2">
              <textarea
                value={updateText}
                onChange={e => setUpdateText(e.target.value)}
                placeholder="Describe progress, blockers, or notes…"
                rows={2}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/50 resize-none"
              />
              <button
                onClick={handleSend}
                disabled={!updateText.trim() || sending}
                className="w-10 h-10 self-end flex-shrink-0 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 flex items-center justify-center transition-all"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EmployeeTasks: React.FC = () => {
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
                      onStatusChange={handleStatusChange}
                      onPostUpdate={handlePostUpdate}
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
    </AdminLayout>
  );
};

export default EmployeeTasks;
