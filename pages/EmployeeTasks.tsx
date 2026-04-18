import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Loader2, RefreshCw, CalendarDays, Check,
  ChevronDown, ChevronRight, Circle,
  CircleDot, CircleCheck, CircleX, CircleDashed, CheckCircle2,
} from 'lucide-react';
import { getToken } from '../utils/apiClient';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const authHeaders = () => {
  const t = getToken();
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};

interface Task {
  id: string;
  project_id: string;
  project_title: string;
  company_name?: string;
  title: string;
  description: string;
  status: string;
  deadline: string | null;
  manager_notes?: string | null;
  priority?: string | null;
}

const daysLeft = (deadline: string) =>
  Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);

// ─── Priority config ───────────────────────────────────────────────────────────
const PRIORITY_CONFIG: Record<string, { label: string; emoji: string; chipCls: string }> = {
  no_priority: { label: 'None',   emoji: '—',  chipCls: 'text-white/30 bg-white/[0.04] border-white/[0.08]' },
  low:         { label: 'Low',    emoji: '↓',  chipCls: 'text-blue-300 bg-blue-400/10 border-blue-400/20' },
  medium:      { label: 'Medium', emoji: '→',  chipCls: 'text-yellow-300 bg-yellow-400/10 border-yellow-400/20' },
  high:        { label: 'High',   emoji: '↑',  chipCls: 'text-orange-300 bg-orange-400/10 border-orange-400/20' },
  urgent:      { label: 'Urgent', emoji: '⚡', chipCls: 'text-red-300 bg-red-400/10 border-red-400/20' },
};

// ─── Status sections ───────────────────────────────────────────────────────────
const STATUS_SECTIONS = [
  {
    key: 'pending',
    label: 'Pending',
    icon: <CircleDashed size={14} className="text-yellow-400/80" />,
    headerColor: 'text-yellow-400',
    accentBar: 'bg-yellow-400',
  },
  {
    key: 'in_progress',
    label: 'In Progress',
    icon: <CircleDot size={14} className="text-blue-400/80" />,
    headerColor: 'text-blue-400',
    accentBar: 'bg-blue-400',
  },
  {
    key: 'blocked',
    label: 'Blocked',
    icon: <CircleX size={14} className="text-red-400/80" />,
    headerColor: 'text-red-400',
    accentBar: 'bg-red-400',
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: <CircleCheck size={14} className="text-green-400/80" />,
    headerColor: 'text-green-400',
    accentBar: 'bg-green-400',
  },
];

// ─── Single task row ───────────────────────────────────────────────────────────
const TaskRow: React.FC<{
  task: Task;
  onStatusChange: (id: string, status: string) => void;
}> = ({ task, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = task.status === 'completed';
  const days = task.deadline ? daysLeft(task.deadline) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className={`group relative border rounded-xl transition-all duration-200 overflow-hidden ${
        isCompleted
          ? 'border-white/[0.05] bg-white/[0.01]'
          : 'border-white/[0.08] bg-white/[0.025] hover:border-white/[0.14] hover:bg-white/[0.04]'
      }`}
    >
      {/* Top row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Status icon */}
        <div className="flex-shrink-0">
          {isCompleted ? (
            <CheckCircle2 size={16} className="text-green-400 drop-shadow-[0_0_4px_rgba(74,222,128,0.4)]" />
          ) : task.status === 'in_progress' ? (
            <CircleDot size={16} className="text-blue-400" />
          ) : task.status === 'blocked' ? (
            <CircleX size={16} className="text-red-400" />
          ) : (
            <CircleDashed size={16} className="text-yellow-400/60" />
          )}
        </div>

        {/* Title + project */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug truncate ${
            isCompleted ? 'line-through text-white/25' : 'text-white/90'
          }`}>
            {task.title}
          </p>
          <p className="text-[11px] text-white/35 mt-0.5 truncate">
            {task.project_title}{task.company_name ? ` · ${task.company_name}` : ''}
          </p>
        </div>

        {/* Meta chips */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Priority chip */}
          {task.priority && task.priority !== 'no_priority' && PRIORITY_CONFIG[task.priority] && (
            <span className={`hidden sm:flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_CONFIG[task.priority].chipCls}`}>
              <span className="text-[11px] leading-none">{PRIORITY_CONFIG[task.priority].emoji}</span>
              {PRIORITY_CONFIG[task.priority].label}
            </span>
          )}

          {/* Deadline chip */}
          {days !== null && (
            <span className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              days < 0
                ? 'text-red-400 bg-red-400/5 border-red-400/20'
                : days <= 3 && !isCompleted
                ? 'text-yellow-400 bg-yellow-400/5 border-yellow-400/20'
                : 'text-white/30 bg-white/[0.03] border-white/[0.06]'
            }`}>
              {days <= 3 && !isCompleted && <AlertTriangle size={8} />}
              <CalendarDays size={8} />
              {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
            </span>
          )}
        </div>

        {/* Expand chevron */}
        <div className="flex-shrink-0 text-white/20 group-hover:text-white/40 transition-colors">
          <ChevronDown size={14} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/[0.06] px-4 py-3 space-y-3 bg-white/[0.01]"
          >
            {task.description && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-1.5">Description</p>
                <p className="text-[13px] text-white/55 leading-relaxed">{task.description}</p>
              </div>
            )}

            {task.manager_notes && (
              <div className="flex gap-2.5 p-3 rounded-lg bg-amber-500/[0.06] border border-amber-400/15">
                <AlertTriangle size={12} className="text-amber-400/70 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70 mb-1">Manager notes</p>
                  <p className="text-[12px] text-amber-300/60 leading-relaxed">{task.manager_notes}</p>
                </div>
              </div>
            )}

            {/* Quick action buttons */}
            {!isCompleted && (
              <div className="flex flex-wrap gap-2 pt-1">
                {task.status !== 'in_progress' && (
                  <button
                    onClick={() => onStatusChange(task.id, 'in_progress')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-colors"
                  >
                    <CircleDot size={11} /> Mark In Progress
                  </button>
                )}
                <button
                  onClick={() => onStatusChange(task.id, 'completed')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition-colors"
                >
                  <Check size={11} /> Complete
                </button>
                {task.status !== 'blocked' && (
                  <button
                    onClick={() => onStatusChange(task.id, 'blocked')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                  >
                    <CircleX size={11} /> Block
                  </button>
                )}
              </div>
            )}
            {isCompleted && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onStatusChange(task.id, 'pending')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 text-white/40 border border-white/10 transition-colors"
                >
                  <CircleDashed size={11} /> Reopen
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Collapsible section ───────────────────────────────────────────────────────
const TaskSection: React.FC<{
  section: typeof STATUS_SECTIONS[number];
  tasks: Task[];
  onStatusChange: (id: string, status: string) => void;
  defaultOpen?: boolean;
}> = ({ section, tasks, onStatusChange, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-1 py-2 group"
      >
        <ChevronRight
          size={13}
          className={`text-white/30 group-hover:text-white/50 transition-all duration-200 ${open ? 'rotate-90' : ''}`}
        />
        <div className={`w-2 h-2 rounded-full ${section.accentBar} opacity-80`} />
        <span className={`text-[11px] font-bold uppercase tracking-widest ${section.headerColor}`}>
          {section.label}
        </span>
        <span className="text-[10px] font-mono text-white/25 bg-white/5 border border-white/[0.07] rounded-full px-2 py-0.5 ml-0.5">
          {tasks.length}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-white/[0.06] to-transparent ml-1" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-1.5"
          >
            {tasks.length === 0 ? (
              <div className="flex items-center gap-3 px-4 py-4 rounded-xl border border-white/[0.05] bg-white/[0.01] text-white/20 text-[12px]">
                <Circle size={13} className="opacity-40" />
                No {section.label.toLowerCase()} tasks
              </div>
            ) : (
              <AnimatePresence>
                {tasks.map(task => (
                  <TaskRow key={task.id} task={task} onStatusChange={onStatusChange} />
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Page ──────────────────────────────────────────────────────────────────────
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

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(() => fetchTasks(), 5000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const handleStatusChange = async (taskId: string, status: string) => {
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

  // Group tasks by status
  const tasksByStatus = Object.fromEntries(
    STATUS_SECTIONS.map(s => [s.key, tasks.filter(t => t.status === s.key)])
  );
  const totalActive = tasks.filter(t => t.status !== 'completed').length;

  return (
    <AdminLayout title="Staff — Tasks">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">My Tasks</h1>
            <p className="text-[12px] text-white/35 mt-0.5">
              {tasks.length} total · {totalActive} active
            </p>
          </div>
          <button
            onClick={() => { setLoading(true); fetchTasks(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[12px] text-white/50 hover:text-white/80 transition-all"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {/* Task sections */}
        {loading ? (
          <div className="flex items-center gap-3 p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-white/30 text-sm">
            <Loader2 size={16} className="animate-spin" /> Loading tasks…
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center p-12 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <CircleDashed size={28} className="text-white/15 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No tasks assigned yet</p>
            <p className="text-white/20 text-xs mt-1">Your manager will assign tasks here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {STATUS_SECTIONS.map(section => (
              <TaskSection
                key={section.key}
                section={section}
                tasks={tasksByStatus[section.key] || []}
                onStatusChange={handleStatusChange}
                defaultOpen={section.key !== 'completed'}
              />
            ))}
          </div>
        )}

      </motion.div>
    </AdminLayout>
  );
};

export default EmployeeTasks;
