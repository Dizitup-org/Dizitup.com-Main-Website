import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '../components/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import ChatBox from '../components/ChatBox';
import {
  CheckSquare, Clock, AlertTriangle, Loader2, RefreshCw,
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
  manager_notes?: string | null; priority?: string | null;
}

const PRIORITY_COLORS: Record<string, string> = {
  low:    'text-white/30 border-white/10 bg-white/5',
  medium: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5',
  high:   'text-red-400 border-red-500/20 bg-red-500/5',
};

const CYCLE_ORDER = ['pending', 'accepted', 'in_progress', 'completed'];

const CheckCircle: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'completed') return (
    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_6px_rgba(34,197,94,0.35)]">
      <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  );
  if (status === 'in_progress') return (
    <div className="w-5 h-5 rounded-full border-2 border-blue-400 bg-blue-400/15 flex items-center justify-center flex-shrink-0">
      <div className="w-2 h-2 rounded-full bg-blue-400" />
    </div>
  );
  if (status === 'accepted') return (
    <div className="w-5 h-5 rounded-full border-2 border-teal-400 bg-teal-400/10 flex items-center justify-center flex-shrink-0">
      <div className="w-1.5 h-1.5 rounded-full bg-teal-400/60" />
    </div>
  );
  if (status === 'blocked') return (
    <div className="w-5 h-5 rounded-full border-2 border-red-400 bg-red-400/10 flex items-center justify-center flex-shrink-0">
      <div className="w-2 h-0.5 rounded-full bg-red-400" />
    </div>
  );
  return <div className="w-5 h-5 rounded-full border-2 border-white/20 flex-shrink-0" />;
};

const TodoRow: React.FC<{
  task: Task;
  onStatusChange: (id: string, status: string) => void;
}> = ({ task, onStatusChange }) => {
  const isCompleted = task.status === 'completed';
  const days = task.deadline ? daysLeft(task.deadline) : null;
  const cycleStatus = () => {
    const idx = CYCLE_ORDER.indexOf(task.status);
    const next = CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length];
    onStatusChange(task.id, next);
  };
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl border transition-all ${isCompleted ? 'border-green-500/10 bg-green-500/[0.03] opacity-60' : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15'}`}>
      <button
        onClick={cycleStatus}
        title={`Mark ${CYCLE_ORDER[(CYCLE_ORDER.indexOf(task.status) + 1) % CYCLE_ORDER.length]}`}
        className="mt-0.5 hover:scale-110 transition-transform flex-shrink-0"
      >
        <CheckCircle status={task.status} />
      </button>
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className={`text-sm font-medium leading-snug ${isCompleted ? 'line-through text-white/30' : 'text-white'}`}>{task.title}</p>
        <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono text-white/30">
          <span>{task.project_title}</span>
          {task.company_name && <span>· {task.company_name}</span>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {task.priority && (
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.medium}`}>
              {task.priority}
            </span>
          )}
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_CONFIG[task.status]?.color ?? 'border-white/10 bg-white/5 text-white/40'}`}>
            {STATUS_CONFIG[task.status]?.label ?? task.status}
          </span>
          {days !== null && (
            <span className={`flex items-center gap-1 text-[10px] font-mono ${days < 0 ? 'text-red-400' : days <= 3 ? 'text-yellow-400' : 'text-white/30'}`}>
              {days <= 3 && !isCompleted && <AlertTriangle size={9} />}
              <Clock size={9} />
              {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
            </span>
          )}
        </div>
        {task.manager_notes && (
          <p className="text-[11px] text-orange-300/70 bg-orange-500/5 border border-orange-500/15 rounded-xl px-3 py-1.5 leading-relaxed">
            <span className="font-bold text-orange-400/80">Manager: </span>{task.manager_notes}
          </p>
        )}
      </div>
    </div>
  );
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending:     { label: 'Pending',     color: 'border-yellow-500/20 bg-yellow-500/5',  dot: 'bg-yellow-400' },
  accepted:    { label: 'Accepted',    color: 'border-teal-500/20 bg-teal-500/5',      dot: 'bg-teal-400' },
  in_progress: { label: 'In Progress', color: 'border-blue-500/20 bg-blue-500/5',      dot: 'bg-blue-400' },
  completed:   { label: 'Completed',   color: 'border-green-500/20 bg-green-500/5',    dot: 'bg-green-400' },
  blocked:     { label: 'Blocked',     color: 'border-red-500/20 bg-red-500/5',        dot: 'bg-red-400' },
};

const STATUS_ORDER = ['in_progress', 'accepted', 'pending', 'blocked', 'completed'];

const daysLeft = (deadline: string) => {
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  return diff;
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
          <div className="space-y-2">
            {[...tasks]
              .sort((a, b) => {
                if (a.status === 'completed' && b.status !== 'completed') return 1;
                if (a.status !== 'completed' && b.status === 'completed') return -1;
                return 0;
              })
              .map(task => (
                <TodoRow key={task.id} task={task} onStatusChange={handleStatusChange} />
              ))
            }
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
