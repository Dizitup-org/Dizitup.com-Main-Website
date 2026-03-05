
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import MagneticButton from './MagneticButton';
import { ArrowLeft, User, ShieldAlert, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';
import AuthModal from './AuthModal';
import AdminWelcome from './AdminWelcome';

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
  const [adminLoading, setAdminLoading] = useState(false);
  const [showAdminWelcome, setShowAdminWelcome] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError(false);
    
    try {
      await signIn(adminCreds.user, adminCreds.pass);
      setAdminModalOpen(false);
      setAdminCreds({ user: '', pass: '' });
      setShowAdminWelcome(true);
    } catch (err) {
      setAdminError(true);
      setTimeout(() => setAdminError(false), 2000);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAdminWelcomeComplete = () => {
    setShowAdminWelcome(false);
    navigate('/admin');
  };

  const handleAdminLogout = () => {
    signOut();
    setOpen(false);
    navigate('/');
  };

  const isActive = expanded || hovered;

  return (
    <>
      {/* Admin Welcome Animation */}
      <AnimatePresence>
        {showAdminWelcome && <AdminWelcome onComplete={handleAdminWelcomeComplete} />}
      </AnimatePresence>

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
                {!isAdmin ? (
                  <button 
                    onClick={() => setAdminModalOpen(true)} 
                    className="hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap text-white/70"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                ) : (
                  <Link 
                    to="/admin" 
                    className="hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap text-red-400"
                  >
                    <User className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
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
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-2">Email</label>
                  <input 
                    type="email" 
                    placeholder="roybrothers@gmail.com"
                    value={adminCreds.user}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-red-600 transition-all font-mono text-sm text-white placeholder:text-white/20"
                    onChange={(e) => setAdminCreds({...adminCreds, user: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-2">Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={adminCreds.pass}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-red-600 transition-all font-mono text-sm text-white placeholder:text-white/20"
                    onChange={(e) => setAdminCreds({...adminCreds, pass: e.target.value})}
                    required
                  />
                </div>

                <button 
                  type="submit"
                  disabled={adminLoading}
                  className="w-full py-4 bg-red-600 text-white rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-red-600/30 mt-2"
                >
                  {adminLoading ? 'Authenticating...' : 'Authenticate'}
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
