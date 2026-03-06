
import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ExternalLink, Trash2, Layout, CheckCircle2 } from 'lucide-react';
import { deletePortfolioProject } from '../utils/portfolioStore';
import { api } from '../utils/apiClient';

interface PortfolioItem {
  id: string;
  title: string;
  category: string | null;
  project_url: string | null;
  created_at: string;
}

const AdminPortfolio: React.FC = () => {
  const [projects, setProjects] = useState<PortfolioItem[]>([]);
  const [form, setForm] = useState({ brand_name: '', target_url: '', brand_type: 'AI Architecture' });
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/portfolio') as any;
      setProjects(res.portfolio || []);
    } catch (err) {
      console.error('Failed to load portfolio:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const addProject = async () => {
    if (!form.brand_name) return;
    setSubmitting(true);
    try {
      const res = await api.post('/api/admin/portfolio', {
        brand_name: form.brand_name,
        target_url: form.target_url,
        brand_type: form.brand_type,
      }) as any;
      if (res.success && res.item) {
        setProjects((prev) => [res.item, ...prev]);
        setForm({ brand_name: '', target_url: '', brand_type: 'AI Architecture' });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to add project:', err);
    }
    setSubmitting(false);
  };

  const removeProject = async (id: string) => {
    const { error } = await deletePortfolioProject(id);
    if (!error) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <AdminLayout title="Portfolio Management">
      <div className="grid lg:grid-cols-3 gap-10">
        {/* Form */}
        <div className="space-y-6">
          <div className="p-8 glass-panel sticky top-10 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl pointer-events-none" />

            <h3 className="text-xl font-bold font-heading mb-8 flex items-center gap-3">
              <Plus className="w-5 h-5 text-red-600" />
              Deploy New Work
            </h3>

            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Internal_Label</label>
                <input
                  type="text"
                  value={form.brand_name}
                  placeholder="e.g. Nexus_Automation"
                  className="w-full glass-input px-5 py-4 text-sm focus:outline-none font-mono"
                  onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Target_URL</label>
                <input
                  type="text"
                  value={form.target_url}
                  placeholder="https://..."
                  className="w-full glass-input px-5 py-4 text-sm focus:outline-none font-mono"
                  onChange={(e) => setForm({ ...form, target_url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Brand_Type</label>
                <input
                  type="text"
                  value={form.brand_type}
                  placeholder="e.g. E-commerce, SaaS, Agency"
                  className="w-full glass-input px-5 py-4 text-sm focus:outline-none font-mono"
                  onChange={(e) => setForm({ ...form, brand_type: e.target.value })}
                />
              </div>

              <button
                onClick={addProject}
                disabled={submitting || !form.brand_name}
                className="w-full premium-btn font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 group disabled:opacity-50"
              >
                <div className="w-2 h-2 rounded-full bg-white group-hover:scale-150 transition-transform" />
                {submitting ? 'Deploying...' : 'Push to Live Grid'}
              </button>

              <AnimatePresence>
                {showSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-widest justify-center mt-4"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Successfully Deployed
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-8 px-4">
            <div>
              <h3 className="text-2xl font-bold font-heading">Production Grid</h3>
              <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">Status: Operational</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{projects.length} Nodes Active</span>
            </div>
          </div>

          {loading ? (
            <div className="py-40 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-8 h-8 border-2 border-white/10 border-t-red-600 rounded-full mx-auto mb-4"
              />
              <p className="font-mono text-xs tracking-[0.4em] uppercase text-white/20">Loading...</p>
            </div>
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                {projects.map((project) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={project.id}
                    className="p-8 premium-card flex items-center justify-between group transition-all duration-500"
                  >
                    <div className="flex items-center gap-8">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-red-600/10 flex items-center justify-center border border-red-600/20 group-hover:bg-red-600/20 transition-colors">
                        <Layout className="w-7 h-7 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xl mb-1 tracking-tight group-hover:text-red-500 transition-colors">{project.title}</h4>
                        <div className="flex items-center gap-4">
                          {project.category && (
                            <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">{project.category}</p>
                          )}
                          {project.project_url && (
                            <>
                              <div className="w-1 h-1 rounded-full bg-white/10" />
                              <p className="text-[9px] font-mono text-white/10 truncate max-w-[200px]">{project.project_url}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {project.project_url && (
                        <a
                          href={project.project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="premium-btn text-white/80"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      )}
                      <button
                        onClick={() => removeProject(project.id)}
                        className="premium-btn"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {projects.length === 0 && (
                <div className="py-40 text-center flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full border border-dashed border-white/10 flex items-center justify-center mb-6">
                    <Layout className="w-8 h-8 text-white/5" />
                  </div>
                  <p className="font-mono text-xs tracking-[0.4em] uppercase text-white/10">System Empty. Deploy first node.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPortfolio;
