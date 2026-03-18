import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, Users, CheckSquare, ChevronDown, ChevronUp,
  Plus, Trash2, UserPlus, X, Loader2, RefreshCw, Clock,
} from 'lucide-react';
import { api, getToken } from '../utils/apiClient';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const authHeaders = (): Record<string, string> => {
  const t = getToken();
  if (!t) return {};
  return { Authorization: `Bearer ${t}` };
};

interface Project {
  id: string; title: string; description: string; status: string;
  deadline: string | null; total_amount: number | null;
  company_name?: string; contact_name?: string;
  employee_count: number; task_count: number; completed_tasks: number;
}
interface Employee { id: string; user_id: string; role: string; username: string; email: string; first_name: string; last_name: string; active_projects: number; }
interface Assignment { id: string; employee_id: string; username: string; first_name: string; last_name: string; email: string; }
interface Task { id: string; project_id: string; title: string; description: string; status: string; deadline: string | null; first_name: string | null; last_name: string | null; username: string | null; employee_id: string | null; }
interface TaskNote { id: string; task_id: string; employee_name: string; note: string; created_at: string; first_name?: string; last_name?: string; }

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-400 bg-green-500/10 border-green-500/20',
  completed: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  paused: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  cancelled: 'text-red-400 bg-red-500/10 border-red-500/20',
  pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  in_progress: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  blocked: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_COLORS[status] ?? 'text-white/40 bg-white/5 border-white/10'}`}>
    {status.replace('_', ' ')}
  </span>
);

const ManagerProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, Assignment[]>>({});
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [newTask, setNewTask] = useState({ title: '', description: '', deadline: '', employee_id: '', status: 'pending' });
  const [addingTask, setAddingTask] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [taskNotes, setTaskNotes] = useState<Record<string, TaskNote[]>>({});

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/manager/projects`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setProjects(data.projects);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/manager/team`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setEmployees(data.employees);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchProjects(); fetchTeam(); }, [fetchProjects, fetchTeam]);

  const loadProjectDetails = async (projectId: string) => {
    const [aRes, tRes] = await Promise.all([
      fetch(`${BASE_URL}/api/manager/project/${projectId}/assignments`, { headers: authHeaders() }),
      fetch(`${BASE_URL}/api/manager/project/${projectId}/tasks`, { headers: authHeaders() }),
    ]);
    const [aData, tData] = await Promise.all([aRes.json(), tRes.json()]);
    if (aData.success) setAssignments(prev => ({ ...prev, [projectId]: aData.assignments }));
    if (tData.success) setTasks(prev => ({ ...prev, [projectId]: tData.tasks }));
  };

  const loadTaskNotes = async (taskId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/manager/tasks/${taskId}/notes`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setTaskNotes(prev => ({ ...prev, [taskId]: data.notes }));
    } catch { /* silent */ }
  };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    await loadProjectDetails(id);
  };

  const assignEmployee = async (projectId: string) => {
    if (!selectedEmployee) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/api/manager/project/${projectId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ employee_id: selectedEmployee }),
      });
      const data = await res.json();
      if (data.success) { await loadProjectDetails(projectId); setAssigningId(null); setSelectedEmployee(''); fetchProjects(); }
    } catch { /* silent */ } finally { setSubmitting(false); }
  };

  const removeAssignment = async (assignmentId: string, projectId: string) => {
    await fetch(`${BASE_URL}/api/manager/assignment/${assignmentId}`, { method: 'DELETE', headers: authHeaders() });
    await loadProjectDetails(projectId);
    fetchProjects();
  };

  const createTask = async (projectId: string) => {
    if (!newTask.title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/api/manager/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ project_id: projectId, ...newTask, employee_id: newTask.employee_id || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        await loadProjectDetails(projectId);
        setAddingTask(null);
        setNewTask({ title: '', description: '', deadline: '', employee_id: '', status: 'pending' });
        fetchProjects();
      }
    } catch { /* silent */ } finally { setSubmitting(false); }
  };

  const deleteTask = async (taskId: string, projectId: string) => {
    await fetch(`${BASE_URL}/api/manager/tasks/${taskId}`, { method: 'DELETE', headers: authHeaders() });
    await loadProjectDetails(projectId);
    fetchProjects();
  };

  const updateTaskStatus = async (taskId: string, status: string, projectId: string) => {
    await fetch(`${BASE_URL}/api/manager/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ status }),
    });
    await loadProjectDetails(projectId);
    fetchProjects();
  };

  return (
    <AdminLayout title="Manager — Projects">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Projects</h1>
            <p className="text-sm text-white/40 mt-1">Assign team members and manage tasks</p>
          </div>
          <button onClick={() => { setLoading(true); fetchProjects(); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-all">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 p-8 rounded-2xl bg-white/[0.03] border border-white/5 text-white/40">
            <Loader2 size={18} className="animate-spin" /> Loading projects…
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
            <FolderOpen size={32} className="text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No projects found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map(p => (
              <div key={p.id} className="rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-all overflow-hidden">
                {/* Project header row */}
                <div role="button" tabIndex={0} onClick={() => toggleExpand(p.id)} onKeyDown={e => e.key === 'Enter' && toggleExpand(p.id)} className="w-full flex items-center justify-between px-6 py-4 gap-4 cursor-pointer select-none">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                      <FolderOpen size={15} className="text-red-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading font-bold text-sm truncate">{p.title}</p>
                      {p.company_name && <p className="text-[10px] text-white/40 font-mono mt-0.5 truncate">{p.company_name}</p>}
                      {p.deadline && (
                        <p className="text-[10px] text-white/30 flex items-center gap-1 mt-0.5">
                          <Clock size={9} /> {new Date(p.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={p.status} />
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 text-xs text-white/50">
                      <Users size={11} /> {p.employee_count}
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 text-xs text-white/50">
                      <CheckSquare size={11} /> {p.completed_tasks}/{p.task_count}
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setAddingTask(addingTask === p.id ? null : p.id);
                        if (expandedId !== p.id) { setExpandedId(p.id); loadProjectDetails(p.id); }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-[10px] text-red-400 font-bold transition-all"
                    >
                      <Plus size={10} /> Task
                    </button>
                    {expandedId === p.id ? <ChevronUp size={15} className="text-white/30" /> : <ChevronDown size={15} className="text-white/30" />}
                  </div>
                </div>

                {/* Task progress bar */}
                {p.task_count > 0 && (
                  <div className="px-6 pb-3 -mt-2">
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-red-600 rounded-full transition-all" style={{ width: `${Math.round((p.completed_tasks / p.task_count) * 100)}%` }} />
                    </div>
                  </div>
                )}

                {/* Expanded detail panel */}
                <AnimatePresence>
                  {expandedId === p.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-white/[0.06] overflow-hidden"
                    >
                      <div className="px-6 py-5 grid md:grid-cols-2 gap-6">
                        {/* Assignments panel */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30">Assigned Team</p>
                            <button
                              onClick={() => setAssigningId(assigningId === p.id ? null : p.id)}
                              className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-red-400/70 hover:text-red-400 transition-colors"
                            >
                              <UserPlus size={11} /> Assign
                            </button>
                          </div>

                          {assigningId === p.id && (
                            <div className="flex gap-2">
                              <select
                                value={selectedEmployee}
                                onChange={e => setSelectedEmployee(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600/50"
                              >
                                <option value="">Select employee…</option>
                                {employees.map(e => (
                                  <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.username})</option>
                                ))}
                              </select>
                              <button
                                onClick={() => assignEmployee(p.id)}
                                disabled={!selectedEmployee || submitting}
                                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-sm font-bold transition-all"
                              >
                                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                              </button>
                              <button onClick={() => setAssigningId(null)} className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                                <X size={14} className="text-white/40" />
                              </button>
                            </div>
                          )}

                          <div className="space-y-2">
                            {(assignments[p.id] ?? []).length === 0 ? (
                              <p className="text-xs text-white/25 italic">No employees assigned yet</p>
                            ) : (
                              (assignments[p.id] ?? []).map(a => (
                                <div key={a.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07]">
                                  <div>
                                    <p className="text-sm font-medium">{a.first_name} {a.last_name}</p>
                                    <p className="text-[10px] text-white/30">{a.email}</p>
                                  </div>
                                  <button onClick={() => removeAssignment(a.id, p.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all">
                                    <X size={12} />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Tasks panel */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30">Tasks</p>
                            <button
                              onClick={() => setAddingTask(addingTask === p.id ? null : p.id)}
                              className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-red-400/70 hover:text-red-400 transition-colors"
                            >
                              <Plus size={11} /> New Task
                            </button>
                          </div>

                          {addingTask === p.id && (
                            <div className="space-y-2 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                              <input
                                placeholder="Task title *"
                                value={newTask.title}
                                onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/50"
                              />
                              <textarea
                                placeholder="Description (optional)"
                                value={newTask.description}
                                onChange={e => setNewTask(t => ({ ...t, description: e.target.value }))}
                                rows={2}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/50 resize-none"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="date"
                                  value={newTask.deadline}
                                  onChange={e => setNewTask(t => ({ ...t, deadline: e.target.value }))}
                                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600/50"
                                />
                                <select
                                  value={newTask.employee_id}
                                  onChange={e => setNewTask(t => ({ ...t, employee_id: e.target.value }))}
                                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600/50"
                                >
                                  <option value="">Assign to…</option>
                                  {employees.map(e => (
                                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => createTask(p.id)}
                                  disabled={!newTask.title.trim() || submitting}
                                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-sm font-bold transition-all flex items-center justify-center gap-2"
                                >
                                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create Task
                                </button>
                                <button onClick={() => setAddingTask(null)} className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                                  <X size={14} className="text-white/40" />
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="space-y-2">
                            {(tasks[p.id] ?? []).length === 0 ? (
                              <p className="text-xs text-white/25 italic">No tasks yet</p>
                            ) : (
                              (tasks[p.id] ?? []).map(t => (
                                <div key={t.id} className="rounded-xl bg-white/[0.04] border border-white/[0.07] overflow-hidden">
                                  <div className="flex items-start justify-between gap-3 px-3 py-2.5">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{t.title}</p>
                                      {(t.first_name || t.username) && (
                                        <p className="text-[10px] text-white/30 mt-0.5">{t.first_name ? `${t.first_name} ${t.last_name}` : t.username}</p>
                                      )}
                                      {t.deadline && (
                                        <p className="text-[10px] text-white/25 mt-0.5"><Clock size={9} className="inline mr-1" />{new Date(t.deadline).toLocaleDateString()}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      <select
                                        value={t.status}
                                        onChange={e => updateTaskStatus(t.id, e.target.value, p.id)}
                                        className={`text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 border focus:outline-none bg-transparent cursor-pointer ${STATUS_COLORS[t.status] ?? 'text-white/40 border-white/10'}`}
                                      >
                                        {['pending', 'in_progress', 'completed', 'blocked'].map(s => (
                                          <option key={s} value={s} className="bg-[#1a1a1a] text-white normal-case">{s.replace('_', ' ')}</option>
                                        ))}
                                      </select>
                                      <button
                                        onClick={() => {
                                          if (expandedTaskId === t.id) { setExpandedTaskId(null); }
                                          else { setExpandedTaskId(t.id); loadTaskNotes(t.id); }
                                        }}
                                        className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/30 transition-all"
                                      >
                                        {expandedTaskId === t.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                      </button>
                                      <button onClick={() => deleteTask(t.id, p.id)} className="p-1 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all">
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  </div>
                                  {expandedTaskId === t.id && (
                                    <div className="border-t border-white/[0.06] px-3 py-3 space-y-2">
                                      {!taskNotes[t.id] ? (
                                        <div className="flex items-center gap-2 text-xs text-white/30"><Loader2 size={11} className="animate-spin" /> Loading notes…</div>
                                      ) : taskNotes[t.id].length === 0 ? (
                                        <p className="text-xs text-white/20 italic">No notes from employee yet</p>
                                      ) : (
                                        taskNotes[t.id].map(n => (
                                          <div key={n.id} className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                                            <div className="flex items-center justify-between">
                                              <p className="text-[10px] font-bold text-white/50">
                                                {n.first_name ? `${n.first_name} ${n.last_name}` : n.employee_name}
                                              </p>
                                              <p className="text-[9px] text-white/25 font-mono">{new Date(n.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <p className="text-xs text-white/60 leading-relaxed">{n.note}</p>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
};

export default ManagerProjects;
