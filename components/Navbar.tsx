
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import MagneticButton from './MagneticButton';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';
import AuthModal from './AuthModal';

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const location = useLocation();
  const navigate = useNavigate();
  const showBack = location.pathname !== '/';
  const { user, profile, signOut, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[1.5px] bg-red-600 z-[60] origin-left shadow-[0_0_10px_#ff0000]"
        style={{ scaleX }}
      />
      
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-4 sm:top-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 w-[95%] sm:w-[90%] max-w-[1200px] px-4 sm:px-8 py-3 sm:py-4 rounded-full border border-white/5 backdrop-blur-2xl backdrop-blur-heavy ${scrolled ? 'bg-black/60 border-white/10' : 'bg-transparent'}`}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                onClick={() => {
                  const idx = (window.history.state as any)?.idx ?? 0;
                  if (idx > 0) navigate(-1); else navigate('/');
                }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-white/20 hover:bg-white/10 transition-colors text-[10px] font-mono uppercase tracking-[0.2em]"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            <Link to="/" className="text-lg font-bold font-heading tracking-tighter flex items-center gap-2 group">
            <div className="w-2 h-2 bg-red-600 rounded-full group-hover:scale-150 transition-transform shadow-[0_0_10px_#ff0000]" />
            <span>DIZITUP</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center gap-12 text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-white/30">
            {['Capabilities', 'Works', 'Pricing'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="hover:text-white transition-colors"
              >
                {item}
              </a>
            ))}
            {!user ? (
              <button onClick={() => setAuthOpen(true)} className="premium-btn premium-btn--icon">Login / Signup</button>
            ) : (
              <div className="relative">
                <button onClick={() => setOpen((o) => !o)} className="premium-btn premium-btn--icon text-[10px] font-mono uppercase tracking-[0.2em]">
                  <span>{profile?.username || 'Profile'}</span>
                  <span>▼</span>
                </button>
                {open && (
                  <div className="absolute right-0 mt-2 w-40 p-2 dropdown-panel text-[10px] font-mono">
                    <Link to="/dashboard" className="block px-3 py-2 rounded hover:bg-white/5">Dashboard</Link>
                    <Link to="/dashboard" className="block px-3 py-2 rounded hover:bg-white/5">Settings</Link>
                    {isAdmin && (
                      <Link to="/admin" className="block px-3 py-2 rounded hover:bg-white/5">Admin Panel</Link>
                    )}
                    <button onClick={() => { setOpen(false); signOut(); navigate('/'); }} className="block w-full text-left px-3 py-2 rounded hover:bg-white/5">Logout</button>
                  </div>
                )}
              </div>
            )}
          </div>
          <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

          {/* Booking CTA removed here to avoid duplication; hero and near-bottom CTAs remain as primary actions */}
        </div>
      </motion.nav>
    </>
  );
};

export default Navbar;
