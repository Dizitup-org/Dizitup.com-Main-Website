
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import MagneticButton from './MagneticButton';
import { ArrowLeft, User, Menu } from 'lucide-react';
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

  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
        className="fixed top-4 z-50 flex items-center justify-between w-full px-4 lg:px-0 lg:left-1/2 lg:-translate-x-1/2 lg:max-w-[95vw] lg:w-max"
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          animate={{
            justifyContent: isActive && !isMobile ? "space-between" : "center"
          }}
          className={`
            flex items-center
            bg-black/80 backdrop-blur-2xl 
            border border-white/10 
            shadow-2xl shadow-black/50
            overflow-hidden
            ${isActive && !isMobile
              ? 'px-6 py-3 rounded-full gap-8' 
              : 'px-4 py-2 rounded-full gap-0'
            }
          `}
        >
          {/* Logo - Always visible */}
          <Link 
            to="/" 
            className="flex items-center gap-2 group shrink-0"
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

          {/* Desktop Nav Items */}
          <AnimatePresence>
            {!isMobile && isActive && (
              <motion.div
                layout
                initial={{ opacity: 0, x: 20, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 'auto' }}
                exit={{ opacity: 0, x: 20, width: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-6 text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-white/50 whitespace-nowrap overflow-hidden"
              >
                {showBack && (
                  <button
                    onClick={() => {
                      const idx = (window.history.state as any)?.idx ?? 0;
                      if (idx > 0) navigate(-1); else navigate('/');
                    }}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back
                  </button>
                )}
                
                {['Capabilities', 'Works', 'Pricing'].map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="hover:text-white transition-colors"
                  >
                    {item}
                  </a>
                ))}
                
                {/* Profile Button */}
                {!isAdmin ? (
                  <button 
                    onClick={() => navigate('/login')} 
                    className="hover:text-white transition-colors flex items-center gap-1 text-white/70"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                ) : (
                  <Link 
                    to="/admin" 
                    className="hover:text-white transition-colors flex items-center gap-1 text-red-400"
                  >
                    <User className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Mobile Hamburger Button - Separate from pill layout */}
        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white hover:text-red-500 transition-colors focus:outline-none flex items-center justify-center"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
      </motion.nav>

      {/* Mobile Fullscreen Menu Overlay */}
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center pt-20"
          >
            <div className="flex flex-col items-center gap-8 text-center px-6">
              {['Capabilities', 'Works', 'Pricing'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl sm:text-3xl font-heading font-bold text-white/70 hover:text-white transition-colors tracking-tight"
                >
                  {item}
                </a>
              ))}
              <div className="w-12 h-[1px] bg-white/10 my-4" />
              {!isAdmin ? (
                <button 
                  onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} 
                  className="text-lg font-mono tracking-widest uppercase text-white hover:text-red-500 transition-colors"
                >
                  Profile
                </button>
              ) : (
                <Link 
                  to="/admin" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-mono tracking-widest uppercase text-red-400 hover:text-red-500 transition-colors"
                >
                  Admin
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};

export default Navbar;
