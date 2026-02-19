
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, ArrowRight, Globe, ShieldCheck, Activity } from 'lucide-react';
import { getPublishedPortfolio, type PortfolioProject } from '../utils/portfolioStore';

// Explicitly type ProjectCard as React.FC to handle the reserved 'key' prop correctly in TypeScript
const ProjectCard: React.FC<{ project: PortfolioProject; index: number }> = ({ project, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group relative bg-[#050505] p-10 lg:p-16 flex flex-col justify-between aspect-square border-r border-b border-white/5 hover:bg-white/[0.01] transition-all duration-700 overflow-hidden"
    >
      {/* Dynamic Background Preview (Animated Gradient/Glass) */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-transparent" />
            {/* Live Link Simulation / Iframe Container */}
            <div className="absolute inset-10 mt-20 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden shadow-2xl">
              <div className="h-6 bg-white/5 border-b border-white/5 flex items-center px-3 gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                <div className="ml-2 text-[8px] font-mono text-white/20 truncate">{project.link}</div>
              </div>
              <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center">
                <Globe className="w-8 h-8 text-white/5 mb-4 animate-pulse" />
                <p className="text-[8px] font-mono text-white/10 tracking-[0.3em] uppercase">Connecting to Secure Node...</p>
                <div className="mt-4 w-1/2 h-px bg-white/5 relative overflow-hidden">
                  <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 bg-red-600/40 w-1/2"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.4em]">
            Deployment_0{index + 1}
          </span>
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-red-600" />
            <span className="text-[8px] font-mono text-red-600 uppercase tracking-widest font-black">Live_Sync_Active</span>
          </div>
        </div>
        <a
          href={project.link}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 rounded-full bg-white/5 border border-white/10 group-hover:bg-red-600 group-hover:border-red-600 transition-all"
        >
          <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white" />
        </a>
      </div>

      <div className="relative z-10 mt-auto">
        <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em] mb-4 group-hover:text-red-600/60 transition-colors">
          {project.category}
        </p>
        <h3 className="text-4xl lg:text-6xl font-heading font-bold tracking-tighter leading-[0.85] uppercase transition-all duration-700 group-hover:tracking-normal group-hover:text-white">
          {project.title.replace('_', ' ')}
        </h3>
      </div>

      <div className="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full bg-red-600 transition-all duration-1000 ease-out" />
    </motion.div>
  );
};

const Portfolio: React.FC = () => {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await getPublishedPortfolio();
      setProjects(data);
    };
    load();
  }, []);

  return (
    <section id="works" className="py-60 px-6 lg:px-20 bg-[#050505] relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-red-600/[0.02] blur-[150px] rounded-full -translate-y-1/2 translate-x-1/3" />

      <div className="container mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-32">
          <div className="max-w-2xl">
            <span className="text-red-600 font-mono text-[10px] uppercase tracking-[0.5em] mb-6 block">The Proof of Concept</span>
            <h2 className="text-6xl lg:text-[10rem] font-heading font-bold tracking-tighter leading-[0.75]">
              RECENT <br /> <span className="text-white/20 italic font-light">SYSTEMS.</span>
            </h2>
          </div>
          <div className="space-y-6 max-w-sm">
            <div className="flex items-center gap-3 text-white/20">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-widest">Client Confidentiality Maintained</span>
            </div>
            <p className="text-white/30 text-sm font-light leading-relaxed">
              We architect custom growth engines. These are a few of the latest deployments where AI logic meets high-conversion design.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 bg-white/5 border border-white/5">
          {projects.length > 0 ? (
            projects.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))
          ) : (
            <div className="md:col-span-2 lg:col-span-3 p-12 lg:p-20 text-center flex flex-col items-center justify-center min-h-[420px] bg-[#050505] border-r border-b border-white/5">
              <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em] mb-5">Portfolio</p>
              <h3 className="text-3xl md:text-5xl font-heading font-bold tracking-tighter mb-6">No projects published yet.</h3>
              <p className="text-white/30 text-sm font-light max-w-2xl leading-relaxed">
                Once you add projects from the admin panel, they will appear here automatically.
              </p>
            </div>
          )}

          <motion.div
            whileHover={{ backgroundColor: 'rgba(220, 38, 38, 1)' }}
            className="p-12 lg:p-16 bg-white/[0.01] flex flex-col justify-center items-center text-center group cursor-pointer transition-colors duration-500 min-h-[400px]"
          >
            <h3 className="text-4xl font-heading font-bold text-white mb-8 uppercase tracking-tighter leading-none group-hover:scale-110 transition-transform duration-700">
              DEPLOY YOUR <br /> OWN SYSTEM.
            </h3>
            <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white transition-all duration-500 relative">
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-full animate-ping" />
              <ArrowRight className="w-8 h-8 text-white group-hover:translate-x-2 transition-transform" />
            </div>
            <p className="mt-8 text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] group-hover:text-white transition-colors">Apply for Intake</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
