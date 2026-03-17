import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, CheckSquare, ChevronDown, ChevronUp,
  Loader2, RefreshCw, AlertTriangle, Clock,
} from 'lucide-react';
import { getToken } from '../utils/apiClient';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const authHeaders = () => {
  const t = getToken();
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};

interface Project {
  id: string; title: string; status: string;
  description: string; deadline: string | null;
}

interface Task {
  id: string; project_id: string; title: string;
  description: string; status: string; deadline: string | null;
}

interface ProjectUpdate {
  id: string; update_text: string; author_name: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active:      'text-green-400 bg-green-500/10 border-green-500/20',
  completed:   'text-purple-400 bg-purple-500/10 border-purple-500/20',
  paused:      'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  pending:     'text-yellow-400 bg-yellow-500/5 border-yellow-500/15',
  in_progress: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  blocked:     'text-red-400 bg-red-500/10 border-red-500/20',
};

const TASK_DOT: Record<string, string> = {
  pending: 'bg-yellow-400', in_progress: 'bg-blue-400',
  completed: 'bg-green-400', blocked: 'bg-red-400',
};

const daysLeft = (deadline: string) =>
  Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);

const ProjectCard: React.FC<{ project: Project; allTasks: Task[] }> = ({ project, allTasks }) => {
  const [open, setOpen] = useState(false);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);

  const myTasks = allTasks.filter(t => t.project_id === project.id);
  const completedCount = myTasks.filter(t => t.status === 'completed').length;
  const progress = myTasks.length > 0 ? Math.round((completedCount / myTasks.length) * 100) : 0;
  const days = project.deadline ? daysLeft(project.deadline) : null;

  const loadUpdates = useCallback(async () => {
    if (loadingUpdates) return;
    setLoadingUpdates(true);
    try {
      const res = await fetch(`${BASE_URL}/api/employee/updates/${project.id}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setUpdates(data.updates);
      else toast.error('Could not load updates');
    } catch { toast.error('Network error'); }
    finally { setLoadingUpdates(false); }
  }, [project.id, loadingUpdates]);

  const handleToggle = () => {
    if (!open) loadUpdates();
    setOpen(v => !v);
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-all text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <h3 className="font-heading font-bold text-base truncate">{project.title}</h3>
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_COLORS[project.status] ?? 'text-white/40 bg-white/5 border-white/10'}`}>
              {project.status}
            </span>
          </div>
          {project.description && <p className="text-xs text-white/40 truncate">{project.description}</p>}
          <div className="flex items-center gap-4 mt-2">
            {/* Progress */}
            {myTasks.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-white/30">{completedCount}/{myTasks.length}</span>
              </div>
            )}
            {/* Deadline */}
            {days !== null && (
              <span className={`flex items-center gap-1 text-[10px] font-mono ${days < 0 ? 'text-red-400' : days <= 3 ? 'text-yellow-400' : 'text-white/30'}`}>
                {days <= 3 && <AlertTriangle size={9} />}
                <Clock size={9} />
                {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
              </span>
            )}
          </div>
        </div>
        <div className="text-white/30 flex-shrink-0">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/[0.06] overflow-hidden"
          >
            <div className="p-5 grid md:grid-cols-2 gap-5">
              {/* My tasks on this project */}
              <div>
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30 mb-3">My Tasks</h4>
                {myTasks.length === 0 ? (
                  <p className="text-xs text-white/20 italic">No tasks assigned on this project</p>
                ) : (
                  <div className="space-y-2">
                    {myTasks.map(task => (
                      <div key={task.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${TASK_DOT[task.status] ?? 'bg-white/20'}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold leading-snug">{task.title}</p>
                          {task.description && <p className="text-[10px] text-white/30 mt-0.5 leading-relaxed">{task.description}</p>}
                        </div>
                        <span className={`ml-auto text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-lg border flex-shrink-0 ${STATUS_COLORS[task.status] ?? 'text-white/40 border-white/10 bg-white/5'}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Updates feed */}
              <div>
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30 mb-3">Project Updates</h4>
                {loadingUpdates ? (
                  <div className="flex items-center gap-2 text-white/30 text-xs">
                    <Loader2 size={12} className="animate-spin" /> Loading…
                  </div>
                ) : updates.length === 0 ? (
                  <p className="text-xs text-white/20 italic">No updates yet</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {updates.map(u => (
                      <div key={u.id} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <p className="text-xs leading-relaxed">{u.update_text}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] font-mono text-white/25">{u.author_name}</span>
                          <span className="text-[10px] font-mono text-white/20">
                            {new Date(u.created_at).toLocaleDateString(undefined, { month:'short', day:'numeric' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EmployeeProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, tRes] = await Promise.all([
        fetch(`${BASE_URL}/api/employee/projects`, { headers: authHeaders() }),
        fetch(`${BASE_URL}/api/employee/tasks`, { headers: authHeaders() }),
      ]);
      const [pData, tData] = await Promise.all([pRes.json(), tRes.json()]);
      if (pData.success) setProjects(pData.projects);
      if (tData.success) setTasks(tData.tasks);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const active = projects.filter(p => p.status === 'active');
  const other = projects.filter(p => p.status !== 'active');

  return (
    <AdminLayout title="Employee — Projects">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">My Projects</h1>
            <p className="text-sm text-white/40 mt-1">{projects.length} assigned · {active.length} active</p>
          </div>
          <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-all">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 p-8 rounded-2xl bg-white/[0.03] border border-white/5 text-white/40">
            <Loader2 size={18} className="animate-spin" /> Loading projects…
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
            <Briefcase size={32} className="text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No projects assigned yet</p>
            <p className="text-xs text-white/20 mt-1">You'll see projects when a manager assigns you</p>
          </div>
        ) : (
          <div className="space-y-6">
            {active.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-white/30">Active</h2>
                  <span className="text-xs font-mono text-white/20 ml-auto">{active.length}</span>
                </div>
                {active.map(p => (
                  <ProjectCard key={p.id} project={p} allTasks={tasks} />
                ))}
              </div>
            )}
            {other.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white/20" />
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-white/30">Other</h2>
                  <span className="text-xs font-mono text-white/20 ml-auto">{other.length}</span>
                </div>
                {other.map(p => (
                  <ProjectCard key={p.id} project={p} allTasks={tasks} />
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
};

export default EmployeeProjects;
