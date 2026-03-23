import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Loader2, FolderOpen, RefreshCw, Trash2, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface AdminProject {
  id: string;
  project_name: string;
  client_name?: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
  assigned_to?: string;
  manager_id?: string | null;
}

interface Manager {
  admin_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

const AdminProjects: React.FC = () => {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal state for assigning manager
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [managersLoading, setManagersLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");

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

  // Refetch projects when page becomes visible (user comes back from another page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProjects();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also refetch on focus
    const handleFocus = () => {
      fetchProjects();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
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

  const fetchManagers = useCallback(async () => {
    setManagersLoading(true);
    try {
      const token = localStorage.getItem('dizitup_token');
      const res = await fetch(`${API_URL}/api/admin/users/staff`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      
      // Filter only managers
      const managersOnly = (data.staff || []).filter((staff: any) => staff.role === 'manager');
      setManagers(managersOnly);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch managers');
      setManagers([]);
    } finally {
      setManagersLoading(false);
    }
  }, []);

  const handleOpenManagerModal = async (projectId: string) => {
    setSelectedProjectId(projectId);
    setShowManagerModal(true);
    await fetchManagers();
  };

  const handleAssignManager = async (managerId: string) => {
    if (!selectedProjectId) return;
    
    setAssigningId(selectedProjectId);
    try {
      const token = localStorage.getItem('dizitup_token');
      const res = await fetch(`${API_URL}/api/admin/projects/${selectedProjectId}/assign-manager`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ manager_id: managerId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      
      // Update the project in the list
      const manager = managers.find(m => m.admin_id === managerId);
      const managerName = manager ? `${manager.first_name} ${manager.last_name}` : 'Manager';
      
      setProjects(prev => prev.map(p => 
        p.id === selectedProjectId 
          ? { ...p, manager_id: managerId, assigned_to: managerName } 
          : p
      ));
      
      toast.success(`Project assigned to ${managerName}`);
      setShowManagerModal(false);
      setSelectedProjectId(null);
      
      // Refetch projects to ensure database is in sync
      setTimeout(() => fetchProjects(), 500);
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign manager');
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <AdminLayout title="Projects">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <p className="text-white/40 text-sm">All projects linked to onboarded clients</p>
          <button
            onClick={fetchProjects}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-white/5 text-white/60 font-bold hover:bg-white/10 transition-colors flex items-center gap-2 disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

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
                      <th className="px-6 py-4 font-semibold">Client Name</th>
                      <th className="px-6 py-4 font-semibold">Assign to Manager</th>
                      <th className="px-6 py-4 font-semibold">Assigned To</th>
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
                        <td className="px-6 py-4 text-white/70">
                          {project.first_name || project.last_name 
                            ? `${project.first_name || ''} ${project.last_name || ''}`.trim() 
                            : '-'
                          }
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleOpenManagerModal(project.id)}
                            disabled={assigningId === project.id || !!project.assigned_to}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                              project.assigned_to 
                                ? 'bg-white/10 text-white/40 cursor-default hover:bg-white/10' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            } disabled:opacity-50`}
                          >
                            {assigningId === project.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Users className="w-3 h-3" />
                            )}
                            Assign
                          </button>
                        </td>
                        <td className="px-6 py-4 text-white/70 text-sm font-medium">
                          {project.assigned_to ? (
                            <span className="px-3 py-1.5 rounded-lg bg-green-600/10 text-green-400 text-xs font-semibold border border-green-600/20">
                              {project.assigned_to}
                            </span>
                          ) : (
                            <span className="text-white/30">—</span>
                          )}
                        </td>
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

        {/* Manager Assignment Modal */}
        {showManagerModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-black border border-white/10 rounded-2xl shadow-xl max-w-sm w-full backdrop-blur-xl">
              <div className="flex justify-between items-center p-6 border-b border-white/10">
                <h3 className="text-lg font-bold text-white">Assign to Manager</h3>
                <button
                  onClick={() => {
                    setShowManagerModal(false);
                    setSelectedProjectId(null);
                    setSelectedManagerId("");
                  }}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {managersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    <span className="ml-2 text-white/60 text-sm">Loading managers...</span>
                  </div>
                ) : managers.length === 0 ? (
                  <p className="text-white/50 text-sm text-center py-8">No managers available</p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-white/60">Select a manager below. This project will be assigned to the selected manager and will appear in their projects section.</p>
                    <select
                      value={selectedManagerId}
                      onChange={(e) => setSelectedManagerId(e.target.value)}
                      disabled={assigningId === selectedProjectId}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23ffffff' opacity='0.6' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 1rem center',
                        backgroundAttachment: 'fixed',
                        paddingRight: '2.5rem',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        color: '#ffffff'
                      }}
                    >
                      <option value="" style={{ color: '#ffffff', backgroundColor: '#1e293b' }}>Choose a manager...</option>
                      {managers.map((manager) => (
                        <option key={manager.admin_id} value={manager.admin_id} style={{ color: '#ffffff', backgroundColor: '#1e293b' }}>
                          {manager.first_name} {manager.last_name} - {manager.email}
                        </option>
                      ))}
                    </select>

                    {selectedManagerId && (
                      <button
                        onClick={() => {
                          handleAssignManager(selectedManagerId);
                          setSelectedManagerId("");
                        }}
                        disabled={assigningId === selectedProjectId}
                        className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {assigningId === selectedProjectId ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Assigning...
                          </span>
                        ) : (
                          "Confirm Assign"
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProjects;
