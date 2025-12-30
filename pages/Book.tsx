
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Brain, Target, Zap, CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import MagneticButton from '../components/MagneticButton';

const Book: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [answers, setAnswers] = useState({
    name: '',
    niche: '',
    revenue: '',
    bottleneck: '',
    email: ''
  });

  const steps = [
    {
      id: 'name',
      question: "Identify yourself.",
      placeholder: "Full name or Brand name",
      type: 'input',
      icon: ShieldCheck
    },
    {
      id: 'niche',
      question: "Primary market sector?",
      options: ['SaaS / Tech', 'E-commerce', 'Coaching / Education', 'Professional Services'],
      type: 'select',
      icon: Target
    },
    {
      id: 'revenue',
      question: "Current monthly velocity?",
      options: ['Under ₹5L', '₹5L - ₹20L', '₹20L - ₹50L', '₹50L+'],
      type: 'select',
      icon: Zap
    },
    {
      id: 'bottleneck',
      question: "Systemic bottleneck?",
      options: ['Content Volume', 'Lead Generation', 'Technical Automation', 'Brand Authority'],
      type: 'select',
      icon: Brain
    }
  ];

  const handleNext = (val: string) => {
    const currentId = steps[step].id;
    const newAnswers = { ...answers, [currentId]: val };
    setAnswers(newAnswers);
    
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      startAnalysis(newAnswers);
    }
  };

  const startAnalysis = (finalAnswers: any) => {
    setIsAnalyzing(true);
    // Real-time Storage Logic
    const existingLeads = JSON.parse(localStorage.getItem('dizitup_leads') || '[]');
    const newLead = { 
      ...finalAnswers, 
      id: Math.random().toString(36).substr(2, 9),
      time: 'Just now',
      status: 'Awaiting Call' 
    };
    localStorage.setItem('dizitup_leads', JSON.stringify([newLead, ...existingLeads]));

    setTimeout(() => {
      setIsAnalyzing(false);
      setStep(steps.length);
    }, 3500);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600">
      <Navbar />
      
      <div className="container mx-auto px-6 pt-48 pb-20 max-w-4xl">
        <AnimatePresence mode="wait">
          {!isAnalyzing && step < steps.length && (
            <motion.div
              key="question"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-16"
            >
              <div className="flex items-center gap-6 text-red-600">
                <div className="p-3 rounded-2xl bg-red-600/10 border border-red-600/20">
                  {React.createElement(steps[step].icon, { className: "w-8 h-8" })}
                </div>
                <div className="h-px flex-grow bg-white/5" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">Phase 0{step + 1}</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-heading font-bold tracking-tighter leading-[0.9]">
                {steps[step].question}
              </h1>

              {steps[step].type === 'select' ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {steps[step].options?.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleNext(opt)}
                      className="p-10 text-left rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-red-600/40 hover:bg-red-600/5 transition-all duration-500 group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-2xl font-bold relative z-10 tracking-tight">{opt}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-8">
                  <input 
                    autoFocus
                    type="text"
                    placeholder={steps[step].placeholder}
                    className="w-full text-4xl md:text-6xl bg-transparent border-b-2 border-white/10 pb-6 focus:outline-none focus:border-red-600 transition-colors font-bold tracking-tighter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNext((e.target as HTMLInputElement).value);
                    }}
                  />
                  <p className="text-white/20 text-xs font-bold tracking-widest uppercase">Press Enter to Confirm</p>
                </div>
              )}

              {step > 0 && (
                <button 
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-3 text-white/30 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
                >
                  <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
              )}
            </motion.div>
          )}

          {isAnalyzing && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center space-y-12"
            >
              <div className="relative w-32 h-32">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-[3px] border-red-600/10 border-t-red-600 rounded-full"
                />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Brain className="w-10 h-10 text-red-600" />
                </motion.div>
              </div>
              <div>
                <h2 className="text-3xl font-bold font-heading mb-4 tracking-tighter">Running Logic Simulation...</h2>
                <div className="space-y-2">
                  <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Calculating Market Advantage for {answers.name}</p>
                  <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse delay-150">Calibrating {answers.bottleneck} Solution</p>
                </div>
              </div>
            </motion.div>
          )}

          {!isAnalyzing && step === steps.length && (
            <motion.div
              key="final"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-16"
            >
              <div className="p-16 rounded-[4rem] bg-white/[0.03] border border-white/5 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500">System Ready</span>
                  </div>
                  
                  <h2 className="text-6xl md:text-8xl font-heading font-bold mb-10 tracking-tighter leading-[0.85]">
                    Your Growth Path <br /> <span className="text-white/30 italic">is Cleared.</span>
                  </h2>
                  
                  <p className="text-2xl text-white/40 max-w-2xl mb-16 font-light leading-snug">
                    We've identified 3 proprietary AI triggers for <span className="text-white font-bold">{answers.name}</span>. We need 20 minutes to show you how to pull them.
                  </p>
                  
                  <div className="flex flex-col md:flex-row gap-6">
                    <input 
                      type="email" 
                      placeholder="Executive Email Address"
                      className="flex-grow px-10 py-6 bg-white/5 border border-white/10 rounded-3xl focus:outline-none focus:border-red-600 transition-all font-medium text-lg"
                      onChange={(e) => setAnswers({...answers, email: e.target.value})}
                    />
                    <MagneticButton>
                      <button 
                        onClick={() => {
                          const existing = JSON.parse(localStorage.getItem('dizitup_leads') || '[]');
                          const updated = existing.map((l: any, i: number) => i === 0 ? { ...l, email: answers.email } : l);
                          localStorage.setItem('dizitup_leads', JSON.stringify(updated));
                          alert("Strategic brief sent. Check your inbox.");
                          navigate('/');
                        }}
                        className="px-12 py-6 bg-red-600 text-white rounded-3xl font-bold hover:bg-red-700 transition-all uppercase tracking-widest text-xs shadow-xl shadow-red-600/20"
                      >
                        Claim My Strategy
                      </button>
                    </MagneticButton>
                  </div>
                </div>
              </div>

              <div className="text-center py-20 opacity-20 hover:opacity-100 transition-opacity">
                 <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-4">Encryption Standard</p>
                 <div className="flex justify-center gap-8 text-[9px] font-bold">
                    <span>SSL 256-BIT</span>
                    <span>GDPR COMPLIANT</span>
                    <span>AI-SECURITY LAYER v1.2</span>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Book;
