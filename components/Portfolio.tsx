
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';

type PortfolioItem = {
  id: string;
  title: string;
  category: string;
  project_url: string;
  image_url?: string;
  description?: string;
};

const ProjectCard: React.FC<{ project: PortfolioItem; index: number }> = ({ project, index }) => {
  const handleCardClick = () => {
    if (project.project_url) {
      // Ensure absolute URL before opening
      let url = project.project_url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      window.open(url, '_blank');
    }
  };

  return (
    <motion.div
      onClick={handleCardClick}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 hover:border-red-600/30 transition-all duration-300 cursor-pointer bg-[#050505] hover:shadow-2xl hover:shadow-red-600/10"
    >
      {/* Image Thumbnail */}
      <div className="relative w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden rounded-t-2xl">
        {project.image_url ? (
          <img
            src={project.image_url}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-700/50 to-gray-900/50 backdrop-blur-sm">
            <div className="text-center space-y-2">
              <div className="text-gray-400 text-2xl font-bold opacity-20">✦</div>
              <div className="text-gray-500 text-xs font-mono tracking-widest">Preview Unavailable</div>
            </div>
          </div>
        )}
        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Card Content */}
      <div className="flex flex-col gap-3 p-6 flex-1 justify-between relative z-10">
        <div className="space-y-2">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-red-600/80 group-hover:text-red-500 transition-colors">
            {project.category}
          </p>
          <h3 className="text-xl font-heading font-bold text-white leading-tight group-hover:text-red-400 transition-colors duration-300 line-clamp-2">
            {project.title}
          </h3>
        </div>
        
        {/* Bottom accent bar */}
        <div className="h-1 w-0 group-hover:w-full bg-gradient-to-r from-red-600 to-red-600/0 transition-all duration-500" />
      </div>
    </motion.div>
  );
};

const Portfolio: React.FC = () => {
  const [projects, setProjects] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/portfolio');
        const data = await response.json();
        
        if (data.portfolio && Array.isArray(data.portfolio)) {
          setProjects(data.portfolio);
        }
      } catch (error) {
        console.warn('Portfolio backend unavailable. Using empty fallback state.', error instanceof Error ? error.message : '');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <section id="works" className="py-20 sm:py-32 lg:py-40 px-6 lg:px-20 bg-[#050505] relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-red-600/[0.02] blur-[150px] rounded-full -translate-y-1/2 translate-x-1/3" />

      <div className="container mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-12 sm:mb-20 lg:mb-28">
          <div className="max-w-2xl">
            <span className="text-red-600 font-mono text-[10px] uppercase tracking-[0.5em] mb-6 block">The Proof of Concept</span>
            <h2 className="text-4xl sm:text-6xl lg:text-8xl font-heading font-bold tracking-tighter leading-[0.75] sm:leading-[0.8] lg:leading-[0.85] py-2">
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length > 0 ? (
            projects.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))
          ) : (
            <div className="md:col-span-2 lg:col-span-3 p-12 lg:p-20 text-center flex flex-col items-center justify-center min-h-[300px] bg-[#050505]/50 border border-white/5 rounded">
              <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em] mb-5">Portfolio</p>
              <h3 className="text-3xl md:text-5xl font-heading font-bold tracking-tighter mb-6">No projects published yet.</h3>
              <p className="text-white/30 text-sm font-light max-w-2xl leading-relaxed">
                Once you add projects from the admin panel, they will appear here automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
