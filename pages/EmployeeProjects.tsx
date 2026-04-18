import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, ChevronDown, ChevronUp,
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
  id: string;
  title: string;
  status: string;
  description: string;
  deadline: string | null;
  priority?: string;
  project_title?: string;
  company_name?: string;
  manager_notes?: string;
  created_at?: string;
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

const PRIORITY_CONFIG: Record<string, { label: string; emoji: string; chipCls: string }> = {
  no_priority: { label: 'None',   emoji: '—',  chipCls: 'text-white/30 bg-white/[0.04] border-white/[0.08]' },
  low:         { label: 'Low',    emoji: '↓',  chipCls: 'text-blue-300 bg-blue-400/10 border-blue-400/20' },
  medium:      { label: 'Medium', emoji: '→',  chipCls: 'text-yellow-300 bg-yellow-400/10 border-yellow-400/20' },
  high:        { label: 'High',   emoji: '↑',  chipCls: 'text-orange-300 bg-orange-400/10 border-orange-400/20' },
  urgent:      { label: 'Urgent', emoji: '⚡', chipCls: 'text-red-300 bg-red-400/10 border-red-400/20' },
};

const daysLeft = (deadline: string) =>
  Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const [open, setOpen] = useState(false);
  const days = project.deadline ? daysLeft(project.deadline) : null;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-all text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <h3 className="font-heading font-bold text-base truncate">{project.title}</h3>
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_COLORS[project.status] ?? 'text-white/40 bg-white/5 border-white/10'}`}>
              {project.status}
            </span>
            {project.priority && project.priority !== 'no_priority' && PRIORITY_CONFIG[project.priority] && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_CONFIG[project.priority].chipCls}`}>
                {PRIORITY_CONFIG[project.priority].emoji} {PRIORITY_CONFIG[project.priority].label}
              </span>
            )}
          </div>
          {project.description && <p className="text-xs text-white/40 line-clamp-2">{project.description}</p>}
          <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
            {project.project_title && <span>{project.project_title}</span>}
            {project.company_name && <span>{project.company_name}</span>}
            {days !== null && (
              <span className={`flex items-center gap-1 font-mono ${days < 0 ? 'text-red-400' : days <= 3 ? 'text-yellow-400' : 'text-white/30'}`}>
                {days <= 3 && <AlertTriangle size={12} />}
                <Clock size={12} />
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
            <div className="p-5 space-y-4">
              {project.manager_notes && (
                <div>
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30 mb-2">Notes</h4>
                  <p className="text-sm text-white/60 leading-relaxed">{project.manager_notes}</p>
                </div>
              )}
              {project.description && (
                <div>
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30 mb-2">Details</h4>
                  <p className="text-sm text-white/60 leading-relaxed">{project.description}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EmployeeProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/employee/projects`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setProjects(data.projects);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { 
    fetchAll(); 
  }, [fetchAll]);

  const active = projects.filter(p => ['pending', 'in_progress'].includes(p.status));
  const completed = projects.filter(p => p.status === 'completed');
  const blocked = projects.filter(p => p.status === 'blocked');

  return (
    <AdminLayout title="Staff — Projects">
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
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-white/30">Active</h2>
                  <span className="text-xs font-mono text-white/20 ml-auto">{active.length}</span>
                </div>
                {active.map(p => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            )}
            {completed.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-white/30">Completed</h2>
                  <span className="text-xs font-mono text-white/20 ml-auto">{completed.length}</span>
                </div>
                {completed.map(p => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            )}
            {blocked.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-white/30">Blocked</h2>
                  <span className="text-xs font-mono text-white/20 ml-auto">{blocked.length}</span>
                </div>
                {blocked.map(p => (
                  <ProjectCard key={p.id} project={p} />
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
