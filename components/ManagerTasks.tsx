import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, X, Loader2, RefreshCw, Clock, AlertTriangle,
  ChevronDown, ChevronRight, CalendarDays, Check, Circle,
  CircleDot, CircleCheck, CircleX, CircleDashed, CheckCircle2,
} from 'lucide-react';
import { getToken } from '../utils/apiClient';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const authHeaders = (): Record<string, string> => {
  const t = getToken();
  if (!t) return {};
  return { Authorization: `Bearer ${t}` };
};

interface Project {
  id: string;
  title: string;
  description: string;
  company_name?: string;
}

interface Employee {
  id: string;
  admin_id: string;
  user_id: string;
  role: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface Task {
  id: string;
  project_id: string;
  project_title: string;
  company_name?: string;
  title: string;
  description: string;
  status: string;
  priority?: string | null;
  deadline: string | null;
  manager_notes?: string | null;
  employee_id: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  assigned_name: string;
}

const daysLeft = (deadline: string) =>
  Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);

// ─── Priority config ──────────────────────────────────────────────────────────
const PRIORITY_CONFIG: Record<string, { label: string; emoji: string; chipCls: string }> = {
  no_priority: { label: 'None',   emoji: '—',  chipCls: 'text-white/30 bg-white/[0.04] border-white/[0.08]' },
  low:         { label: 'Low',    emoji: '↓',  chipCls: 'text-blue-300 bg-blue-400/10 border-blue-400/20' },
  medium:      { label: 'Medium', emoji: '→',  chipCls: 'text-yellow-300 bg-yellow-400/10 border-yellow-400/20' },
  high:        { label: 'High',   emoji: '↑',  chipCls: 'text-orange-300 bg-orange-400/10 border-orange-400/20' },
  urgent:      { label: 'Urgent', emoji: '⚡', chipCls: 'text-red-300 bg-red-400/10 border-red-400/20' },
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_SECTIONS = [
  {
    key: 'pending',
    label: 'Pending',
    icon: <CircleDashed size={14} className="text-yellow-400/80" />,
    headerColor: 'text-yellow-400',
    accentBar: 'bg-yellow-400',
    badgeClass: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  },
  {
    key: 'in_progress',
    label: 'In Progress',
    icon: <CircleDot size={14} className="text-blue-400/80" />,
    headerColor: 'text-blue-400',
    accentBar: 'bg-blue-400',
    badgeClass: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  },
  {
    key: 'blocked',
    label: 'Blocked',
    icon: <CircleX size={14} className="text-red-400/80" />,
    headerColor: 'text-red-400',
    accentBar: 'bg-red-400',
    badgeClass: 'text-red-400 bg-red-400/10 border-red-400/20',
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: <CircleCheck size={14} className="text-green-400/80" />,
    headerColor: 'text-green-400',
    accentBar: 'bg-green-400',
    badgeClass: 'text-green-400 bg-green-400/10 border-green-400/20',
  },
];

// ─── Status pill ──────────────────────────────────────────────────────────────
const StatusPill = ({ status }: { status: string }) => {
  const sec = STATUS_SECTIONS.find(s => s.key === status);
  if (!sec) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${sec.badgeClass}`}>
      {sec.icon}
      {sec.label}
    </span>
  );
};

// ─── Single task row ──────────────────────────────────────────────────────────
const TaskRow: React.FC<{
  task: Task;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}> = ({ task, onDelete, onStatusChange }) => {
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
        {/* Status dot button */}
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
          <p className="text-[11px] text-white/35 mt-0.5 truncate">{task.project_title}</p>
        </div>

        {/* Meta chips */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Priority / Urgency chip */}
          {task.priority && task.priority !== 'no_priority' && PRIORITY_CONFIG[task.priority] && (
            <span className={`hidden sm:flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_CONFIG[task.priority].chipCls}`}>
              <span className="text-[11px] leading-none">{PRIORITY_CONFIG[task.priority].emoji}</span>
              {PRIORITY_CONFIG[task.priority].label}
            </span>
          )}
          {task.assigned_name?.trim() && (
            <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-white/40 bg-white/5 border border-white/[0.07] rounded-full px-2.5 py-0.5">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[7px] font-bold text-white uppercase flex-shrink-0">
                {task.assigned_name.charAt(0)}
              </div>
              {task.assigned_name}
            </span>
          )}
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

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"
            title="Delete task"
          >
            <Trash2 size={13} />
          </button>
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

            {/* Quick actions */}
            {!isCompleted && (
              <div className="flex gap-2 pt-1">
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

// ─── Collapsible section ──────────────────────────────────────────────────────
const TaskSection: React.FC<{
  section: typeof STATUS_SECTIONS[number];
  tasks: Task[];
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  defaultOpen?: boolean;
}> = ({ section, tasks, onDelete, onStatusChange, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="space-y-1">
      {/* Section header */}
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

      {/* Task rows */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-1.5 pl-0"
          >
            {tasks.length === 0 ? (
              <div className="flex items-center gap-3 px-4 py-4 rounded-xl border border-white/[0.05] bg-white/[0.01] text-white/20 text-[12px]">
                <Circle size={13} className="opacity-40" />
                No {section.label.toLowerCase()} tasks
              </div>
            ) : (
              <AnimatePresence>
                {tasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onDelete={onDelete}
                    onStatusChange={onStatusChange}
                  />
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const ManagerTasks: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    project_id: '',
    employee_ids: [] as string[],
    deadline: '',
    priority: 'medium',
    manager_notes: '',
  });

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/manager/projects`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setProjects(data.projects);
    } catch { /* silent */ }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/manager/employees`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees.filter((emp: Employee) => emp.role === 'employee'));
      }
    } catch { /* silent */ }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/manager/tasks`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setTasks(data.tasks);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    Promise.all([fetchProjects(), fetchEmployees(), fetchTasks()]);
    const interval = setInterval(() => fetchTasks(), 15000);
    return () => clearInterval(interval);
  }, [fetchProjects, fetchEmployees, fetchTasks]);

  useEffect(() => {
    if (!showCreateForm) setShowEmployeeDropdown(false);
  }, [showCreateForm]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.project_id) {
      toast.error('Title and Project are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/api/manager/tasks`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          project_id: newTask.project_id,
          employee_id: newTask.employee_ids[0] || null,
          deadline: newTask.deadline || null,
          status: 'pending',
          priority: newTask.priority,
          manager_notes: newTask.manager_notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (newTask.employee_ids.length > 1) {
          for (let i = 1; i < newTask.employee_ids.length; i++) {
            try {
              await fetch(`${BASE_URL}/api/manager/tasks`, {
                method: 'POST',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: newTask.title,
                  description: newTask.description,
                  project_id: newTask.project_id,
                  employee_id: newTask.employee_ids[i],
                  deadline: newTask.deadline || null,
                  status: 'pending',
                  priority: newTask.priority,
                  manager_notes: newTask.manager_notes,
                }),
              });
            } catch (err) {
              console.error('Error assigning to additional employee:', err);
            }
          }
        }
        toast.success(`Task created and assigned to ${newTask.employee_ids.length || 'no'} employee(s)`);
        setNewTask({ title: '', description: '', project_id: '', employee_ids: [], deadline: '', priority: 'medium', manager_notes: '' });
        setShowCreateForm(false);
        setShowEmployeeDropdown(false);
        fetchTasks();
      } else {
        toast.error(data.message || 'Failed to create task');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const res = await fetch(`${BASE_URL}/api/manager/tasks/${taskId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) { toast.success('Task deleted'); fetchTasks(); }
      else toast.error('Failed to delete task');
    } catch { toast.error('Network error'); }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    // Optimistic
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      const res = await fetch(`${BASE_URL}/api/manager/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) { toast.error('Failed to update task'); fetchTasks(); }
    } catch { toast.error('Network error'); fetchTasks(); }
  };

  // Group tasks by status
  const tasksByStatus = Object.fromEntries(
    STATUS_SECTIONS.map(s => [s.key, tasks.filter(t => t.status === s.key)])
  );
  const totalActive = tasks.filter(t => t.status !== 'completed').length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Tasks</h2>
          <p className="text-[12px] text-white/35 mt-0.5">
            {tasks.length} total · {totalActive} active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setLoading(true); fetchTasks(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[12px] text-white/50 hover:text-white/80 transition-all"
          >
            <RefreshCw size={12} /> Refresh
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[12px] font-semibold transition-all shadow-[0_0_16px_rgba(220,38,38,0.25)]"
          >
            <Plus size={13} /> New Task
          </button>
        </div>
      </div>

      {/* ── Create Task Form ── */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-white/10 rounded-2xl p-5 bg-white/[0.025] backdrop-blur-sm overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/80">Create new task</h3>
              <button onClick={() => { setShowCreateForm(false); setShowEmployeeDropdown(false); }}>
                <X size={14} className="text-white/30 hover:text-white/60 transition-colors" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">Task Title *</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Enter task title"
                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">Project *</label>
                  <select
                    value={newTask.project_id}
                    onChange={e => setNewTask({ ...newTask, project_id: e.target.value })}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600/40 transition-colors"
                  >
                    <option value="" className="bg-[#111]">Select a project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id} className="bg-[#111]">{p.title}</option>
                    ))}
                  </select>
                </div>

                {/* Employee picker */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">Assign to Employees</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                      className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none text-left flex items-center justify-between"
                    >
                      <span className={newTask.employee_ids.length === 0 ? 'text-white/25' : 'text-white'}>
                        {newTask.employee_ids.length === 0 ? 'Select employees' : `${newTask.employee_ids.length} selected`}
                      </span>
                      <ChevronDown size={14} className={`text-white/30 transition-transform ${showEmployeeDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {showEmployeeDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-[#0f0f0f] border border-white/10 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto"
                        >
                          {employees.length === 0 ? (
                            <div className="p-3 text-sm text-white/30">No employees available</div>
                          ) : employees.map(emp => (
                            <label
                              key={emp.admin_id}
                              className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.04] cursor-pointer border-b border-white/[0.04] last:border-b-0 transition-colors"
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                newTask.employee_ids.includes(emp.admin_id)
                                  ? 'bg-red-600 border-red-600'
                                  : 'bg-transparent border-white/20'
                              }`}>
                                {newTask.employee_ids.includes(emp.admin_id) && <Check size={10} className="text-white" />}
                              </div>
                              <input
                                type="checkbox"
                                checked={newTask.employee_ids.includes(emp.admin_id)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setNewTask({ ...newTask, employee_ids: [...newTask.employee_ids, emp.admin_id] });
                                  } else {
                                    setNewTask({ ...newTask, employee_ids: newTask.employee_ids.filter(id => id !== emp.admin_id) });
                                  }
                                }}
                                className="hidden"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-white/80 font-medium">{emp.first_name} {emp.last_name}</div>
                                <div className="text-xs text-white/30 truncate">{emp.email}</div>
                              </div>
                            </label>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {newTask.employee_ids.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {newTask.employee_ids.map(empId => {
                          const emp = employees.find(e => e.admin_id === empId);
                          return emp ? (
                            <div key={empId} className="flex items-center gap-1.5 bg-red-600/15 border border-red-500/25 rounded-full px-2.5 py-0.5 text-[11px] text-red-300">
                              {emp.first_name} {emp.last_name}
                              <button type="button" onClick={() => setNewTask({ ...newTask, employee_ids: newTask.employee_ids.filter(id => id !== empId) })}>
                                <X size={10} className="hover:text-red-200 transition-colors" />
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">Deadline</label>
                  <div
                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 flex items-center cursor-pointer hover:border-white/20 focus-within:border-red-600/40 transition-colors"
                    onClick={() => {
                      const el = document.getElementById('task-deadline-input') as HTMLInputElement | null;
                      if (el) { try { el.showPicker(); } catch { el.focus(); } }
                    }}
                  >
                    <input
                      id="task-deadline-input"
                      type="date"
                      value={newTask.deadline}
                      onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                      className="flex-1 bg-transparent text-sm text-white focus:outline-none cursor-pointer"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">Urgency</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {([
                      { value: 'no_priority', label: 'None',   emoji: '—',  cls: 'text-white/30 border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04]',                       activeCls: 'bg-white/[0.08] border-white/20 text-white/70' },
                      { value: 'low',         label: 'Low',    emoji: '↓',  cls: 'text-white/40 border-white/[0.08] hover:border-blue-400/30 hover:bg-blue-400/[0.06]',           activeCls: 'bg-blue-400/10 border-blue-400/40 text-blue-300' },
                      { value: 'medium',      label: 'Medium', emoji: '→',  cls: 'text-white/40 border-white/[0.08] hover:border-yellow-400/30 hover:bg-yellow-400/[0.06]',       activeCls: 'bg-yellow-400/10 border-yellow-400/40 text-yellow-300' },
                      { value: 'high',        label: 'High',   emoji: '↑',  cls: 'text-white/40 border-white/[0.08] hover:border-orange-400/30 hover:bg-orange-400/[0.06]',      activeCls: 'bg-orange-400/10 border-orange-400/40 text-orange-300' },
                      { value: 'urgent',      label: 'Urgent', emoji: '⚡', cls: 'text-white/40 border-white/[0.08] hover:border-red-400/30 hover:bg-red-400/[0.06]',           activeCls: 'bg-red-400/10 border-red-400/40 text-red-300' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNewTask({ ...newTask, priority: opt.value })}
                        className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-center transition-all ${
                          newTask.priority === opt.value ? opt.activeCls : opt.cls
                        }`}
                      >
                        <span className="text-base leading-none">{opt.emoji}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider leading-none">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Enter task description…"
                  rows={3}
                  className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/40 resize-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">Manager Notes</label>
                <textarea
                  value={newTask.manager_notes}
                  onChange={e => setNewTask({ ...newTask, manager_notes: e.target.value })}
                  placeholder="Add any notes or instructions…"
                  rows={2}
                  className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/40 resize-none transition-colors"
                />
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setShowEmployeeDropdown(false); }}
                  className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/50 text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_12px_rgba(220,38,38,0.2)]"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Create Task
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Task Sections ── */}
      {loading ? (
        <div className="flex items-center gap-3 p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-white/30 text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading tasks…
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center p-12 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
          <CircleDashed size={28} className="text-white/15 mx-auto mb-3" />
          <p className="text-white/30 text-sm">No tasks yet.</p>
          <p className="text-white/20 text-xs mt-1">Create one to get started!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {STATUS_SECTIONS.map(section => (
            <TaskSection
              key={section.key}
              section={section}
              tasks={tasksByStatus[section.key] || []}
              onDelete={handleDeleteTask}
              onStatusChange={handleUpdateTaskStatus}
              defaultOpen={section.key !== 'completed'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagerTasks;
