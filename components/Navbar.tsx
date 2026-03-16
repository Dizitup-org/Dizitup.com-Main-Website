
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import MagneticButton from './MagneticButton';
import { ArrowLeft, User } from 'lucide-react';
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

  const handleAdminLogout = () => {
    signOut();
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
                {!isAdmin ? (
                  <button 
                    onClick={() => navigate('/login')} 
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

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};

export default Navbar;
