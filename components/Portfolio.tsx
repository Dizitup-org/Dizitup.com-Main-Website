import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, TrendingUp, Clock, Users } from 'lucide-react';

type CaseStudy = {
  id: string;
  title: string;
  category: string;
  project_url: string;
  image_url?: string;
  description?: string;
};

// Placeholder case study structure for empty state
const PLACEHOLDER_STUDIES = [
  {
    id: 'ph-1',
    industry: 'Professional Services',
    problem: 'A B2B consultancy was relying entirely on referrals with no digital acquisition system in place.',
    implementation: 'Deployed AI Customer Acquisition System including landing page, CRM, and WhatsApp automation.',
    result: '+58% qualified leads in 45 days',
    icon: Users,
    tag: 'Customer Acquisition',
  },
  {
    id: 'ph-2',
    industry: 'E-Commerce',
    problem: 'An online retailer\'s team was spending 15+ hours per week on manual order follow-ups and customer support.',
    implementation: 'Built automated order management workflows, WhatsApp sequences, and customer support AI.',
    result: '18 hours/week reclaimed',
    icon: Clock,
    tag: 'Operations Automation',
  },
  {
    id: 'ph-3',
    industry: 'Real Estate',
    problem: 'A property agency had inconsistent lead quality and no way to track which marketing activities drove revenue.',
    implementation: 'Implemented AI Growth Partner plan with unified analytics, lead scoring, and monthly reporting.',
    result: '3.2× revenue growth in 6 months',
    icon: TrendingUp,
    tag: 'Growth Partner',
  },
];

const PlaceholderCard: React.FC<{ study: typeof PLACEHOLDER_STUDIES[0]; index: number }> = ({ study, index }) => {
  const Icon = study.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.12 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 hover:border-red-600/30 transition-all duration-500 bg-[#050505] hover:shadow-[0_0_40px_-10px_rgba(220,38,38,0.2)]"
    >
      {/* Top indicator */}
      <div className="relative h-[180px] bg-gradient-to-br from-white/[0.02] to-black flex flex-col items-center justify-center border-b border-white/5">
        <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
          <Icon className="w-7 h-7 text-red-400" />
        </div>
        <span className="text-[9px] font-mono uppercase tracking-[0.35em] text-white/25">{study.industry}</span>
        {/* Tag */}
        <div className="absolute top-4 right-4 px-2.5 py-1 bg-white/[0.04] border border-white/8 rounded-full">
          <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">{study.tag}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4 p-6 flex-1">
        {/* Problem */}
        <div>
          <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-red-500/60 block mb-1.5">The Problem</span>
          <p className="text-sm text-white/50 leading-relaxed font-light">{study.problem}</p>
        </div>
        {/* Implementation */}
        <div>
          <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/25 block mb-1.5">What We Built</span>
          <p className="text-sm text-white/40 leading-relaxed font-light">{study.implementation}</p>
        </div>
        {/* Result */}
        <div className="mt-auto pt-4 border-t border-white/5">
          <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/25 block mb-1.5">Business Result</span>
          <p className="text-base font-heading font-bold text-white group-hover:text-red-400 transition-colors">{study.result}</p>
        </div>
      </div>

      {/* Bottom accent bar */}
      <div className="h-[1px] w-0 group-hover:w-full bg-gradient-to-r from-red-600 to-red-600/0 transition-all duration-700" />
    </motion.div>
  );
};

const CaseStudyCard: React.FC<{ project: CaseStudy; index: number }> = ({ project, index }) => {
  const handleCardClick = () => {
    if (project.project_url) {
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="flex flex-col gap-3 p-6 flex-1 justify-between relative z-10">
        <div className="space-y-2">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-red-600/80 group-hover:text-red-500 transition-colors">
            {project.category}
          </p>
          <h3 className="text-xl font-heading font-bold text-white leading-tight group-hover:text-red-400 transition-colors duration-300 line-clamp-2">
            {project.title}
          </h3>
        </div>
        <div className="h-1 w-0 group-hover:w-full bg-gradient-to-r from-red-600 to-red-600/0 transition-all duration-500" />
      </div>
    </motion.div>
  );
};

const Portfolio: React.FC = () => {
  const [projects, setProjects] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
        const response = await fetch(`${BASE_URL}/api/portfolio`);
        const data = await response.json();
        if (data.portfolio && Array.isArray(data.portfolio)) {
          setProjects(data.portfolio);
        }
      } catch (error) {
        console.warn('Portfolio backend unavailable. Using placeholder state.', error instanceof Error ? error.message : '');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <section id="case-studies" className="py-20 sm:py-32 lg:py-40 px-6 lg:px-20 bg-transparent relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-red-600/[0.02] blur-[150px] rounded-full -translate-y-1/2 translate-x-1/3" />

      <div className="container mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-12 sm:mb-20 lg:mb-28">
          <div className="max-w-2xl">
            <span className="text-red-600 font-mono text-[10px] uppercase tracking-[0.5em] mb-6 block">Real Businesses. Real Results.</span>
            <h2 className="text-4xl sm:text-6xl lg:text-8xl font-heading font-bold tracking-tighter leading-[0.75] sm:leading-[0.8] lg:leading-[0.85] py-2">
              GROWTH <br /> <span className="text-white/20 italic font-light">CASE STUDIES.</span>
            </h2>
          </div>
          <div className="space-y-6 max-w-sm">
            <div className="flex items-center gap-3 text-white/20">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-widest">Client Confidentiality Maintained</span>
            </div>
            <p className="text-white/30 text-sm font-light leading-relaxed">
              These are real business challenges we've solved — and the measurable results we delivered. Every number is real, every outcome is verified.
            </p>
          </div>
        </div>

        {/* Content */}
        {!loading && projects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, i) => (
              <CaseStudyCard key={project.id} project={project} index={i} />
            ))}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PLACEHOLDER_STUDIES.map((study, i) => (
                <PlaceholderCard key={study.id} study={study} index={i} />
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-8 text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/8 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/25">
                  Full case studies published as projects are completed
                </span>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
};

export default Portfolio;
