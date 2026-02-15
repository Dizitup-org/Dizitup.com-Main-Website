
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import MagneticButton from './MagneticButton';
import { ArrowLeft, User, ShieldAlert, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';
import AuthModal from './AuthModal';

const Navbar: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Expand on scroll
  useEffect(() => {
    const handleScroll = () => {
      setExpanded(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const location = useLocation();
  const navigate = useNavigate();
  const showBack = location.pathname !== '/';
  const { user, profile, signOut, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  
  // Admin login state
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminCreds, setAdminCreds] = useState({ user: '', pass: '' });
  const [adminError, setAdminError] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('dizitup_auth') === 'true';
  });

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedUser = (import.meta as any).env?.User_ID || '';
    const expectedToken = (import.meta as any).env?.Secure_Token || '';

    if (adminCreds.user === expectedUser && adminCreds.pass === expectedToken) {
      localStorage.setItem('dizitup_auth', 'true');
      setIsAdminLoggedIn(true);
      setAdminModalOpen(false);
      setAdminCreds({ user: '', pass: '' });
      navigate('/admin');
    } else {
      setAdminError(true);
      setTimeout(() => setAdminError(false), 2000);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('dizitup_auth');
    setIsAdminLoggedIn(false);
    setOpen(false);
    navigate('/');
  };

  const isActive = expanded || hovered;

  return (
    <>
      {/* Progress bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[1.5px] bg-red-600 z-[60] origin-left shadow-[0_0_10px_#ff0000]"
        style={{ scaleX }}
      />
      
      {/* Dynamic Island Navbar */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={`
            flex items-center justify-between
            bg-black/80 backdrop-blur-2xl 
            border border-white/10 
            shadow-2xl shadow-black/50
            ${isActive 
              ? 'px-6 py-3 rounded-full gap-8' 
              : 'px-4 py-2 rounded-full gap-0'
            }
          `}
        >
          {/* Logo - Always visible */}
          <Link 
            to="/" 
            className="flex items-center gap-2 group"
          >
            <motion.div 
              layout
              className="w-2 h-2 bg-red-600 rounded-full group-hover:scale-150 transition-transform shadow-[0_0_10px_#ff0000]" 
            />
            <motion.span 
              layout
              className="text-sm font-bold font-heading tracking-tight text-white"
            >
              DIZITUP
            </motion.span>
          </Link>

          {/* Nav Items - Show when expanded */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-6 text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-white/50 overflow-hidden"
              >
                {showBack && (
                  <button
                    onClick={() => {
                      const idx = (window.history.state as any)?.idx ?? 0;
                      if (idx > 0) navigate(-1); else navigate('/');
                    }}
                    className="flex items-center gap-1 hover:text-white transition-colors whitespace-nowrap"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back
                  </button>
                )}
                
                {['Capabilities', 'Works', 'Pricing'].map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="hover:text-white transition-colors whitespace-nowrap"
                  >
                    {item}
                  </a>
                ))}
                
                {/* Profile Button */}
                {!isAdminLoggedIn ? (
                  <button 
                    onClick={() => setAdminModalOpen(true)} 
                    className="hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap text-white/70"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                ) : (
                  <div className="relative">
                    <button 
                      onClick={() => setOpen((o) => !o)} 
                      className="hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap text-red-400"
                    >
                      <User className="w-4 h-4" />
                      <span>Admin</span>
                      <span className="text-[8px]">▼</span>
                    </button>
                    {open && (
                      <div className="absolute right-0 mt-4 w-40 p-2 bg-black/95 border border-white/10 rounded-2xl backdrop-blur-xl z-[60] shadow-2xl">
                        <Link to="/admin" className="block px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 text-[10px]">Admin Panel</Link>
                        <Link to="/admin/clients" className="block px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 text-[10px]">Clients</Link>
                        <Link to="/admin/portfolio" className="block px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 text-[10px]">Portfolio</Link>
                        <button onClick={handleAdminLogout} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-red-400 text-[10px]">Logout</button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.nav>

      {/* Admin Login Modal - OUTSIDE nav element */}
      <AnimatePresence>
        {adminModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4"
            onClick={() => setAdminModalOpen(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent" />
              <button 
                onClick={() => setAdminModalOpen(false)} 
                className="absolute top-4 right-4 text-white/40 hover:text-white text-2xl transition-colors"
              >
                ✕
              </button>
              
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-red-600/10 flex items-center justify-center mb-6 border border-red-600/20">
                  <Lock className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-heading font-bold tracking-widest uppercase text-white">Admin Access</h1>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] mt-2">Dizitup Internal OS</p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-2">User_ID</label>
                  <input 
                    type="text" 
                    placeholder="Enter username"
                    value={adminCreds.user}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-red-600 transition-all font-mono text-sm text-white placeholder:text-white/20"
                    onChange={(e) => setAdminCreds({...adminCreds, user: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-2">Secure_Token</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={adminCreds.pass}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-red-600 transition-all font-mono text-sm text-white placeholder:text-white/20"
                    onChange={(e) => setAdminCreds({...adminCreds, pass: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-red-600 text-white rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-red-700 transition-all shadow-xl shadow-red-600/30 mt-2"
                >
                  Authenticate
                </button>
              </form>

              {adminError && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 p-4 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center gap-3 text-red-500 text-[10px] font-black uppercase tracking-widest"
                >
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" /> Access Denied
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};

export default Navbar;
