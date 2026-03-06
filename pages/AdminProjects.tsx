import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Loader2, FolderOpen, RefreshCw, Plus, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface AdminProject {
  id: string;
  project_name: string;
  client_name?: string;
  created_at?: string;
}

const AdminProjects: React.FC = () => {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New project form
  const [showForm, setShowForm] = useState(false);
  const [formClientName, setFormClientName] = useState('');
  const [formProjectName, setFormProjectName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('dizitup_token');
      const res = await fetch(`${API_URL}/api/admin/projects`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setProjects(data.projects ?? []);
    } catch (err: any) {
      const msg = err.message || 'Failed to load projects';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Delete project "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem('dizitup_token');
      const res = await fetch(`${API_URL}/api/admin/projects/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      toast.success(`Project "${name}" deleted`);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete project');
    } finally {
      setDeletingId(null);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setFormClientName('');
    setFormProjectName('');
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const project_name = formProjectName.trim();
    const brand_name = formClientName.trim();
    if (!project_name || !brand_name) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('dizitup_token');
      const res = await fetch(`${API_URL}/api/admin/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ client_name: formClientName.trim(), project_name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      toast.success(`Project "${project_name}" created!`);
      closeForm();
      fetchProjects();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Projects">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <p className="text-white/40 text-sm">All projects linked to onboarded clients</p>
          <div className="flex gap-3">
            <button
              onClick={fetchProjects}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-white/5 text-white/60 font-bold hover:bg-white/10 transition-colors flex items-center gap-2 disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>

        {/* Inline create form */}
        {showForm && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-base">Create New Project</h3>
              <button onClick={closeForm} className="text-white/30 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Client Name *</label>
                <input
                  type="text"
                  value={formClientName}
                  onChange={(e) => setFormClientName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Project Name *</label>
                <input
                  type="text"
                  value={formProjectName}
                  onChange={(e) => setFormProjectName(e.target.value)}
                  placeholder="e.g. Website Redesign"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={submitting || !formProjectName.trim() || !formClientName.trim()}
                  className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-red-500" />
            <span className="ml-3 text-white/60">Loading projects...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="py-10 text-center">
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={fetchProjects}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <>
            {projects.length === 0 ? (
              <div className="py-20 text-center">
                <FolderOpen className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/40 text-sm">No projects created yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10 backdrop-blur-xl">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/[0.03]">
                    <tr className="text-left text-white/40 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">Project Name</th>
                      <th className="px-6 py-4 font-semibold">Brand Name</th>
                      <th className="px-6 py-4 font-semibold">Created Date</th>
                      <th className="px-6 py-4 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {projects.map((project) => (
                      <tr key={project.id} className="hover:bg-white/[0.03] transition-all">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center text-red-500">
                              <FolderOpen className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-white">{project.project_name || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-white/70">{project.client_name || '-'}</td>
                        <td className="px-6 py-4 text-white/50 text-xs">
                          {project.created_at
                            ? new Date(project.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleDeleteProject(project.id, project.project_name)}
                            disabled={deletingId === project.id}
                            className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                            title="Delete project"
                          >
                            {deletingId === project.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProjects;
