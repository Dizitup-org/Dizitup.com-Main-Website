import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  // Track scroll position for the Apple-style pill transition
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Progress bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 28, restDelta: 0.001 });

  const navItems = ['Capabilities', 'Works', 'Pricing'];

  const displayName = user
    ? user.first_name || user.username || user.email.split('@')[0]
    : null;

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  return (
    <>
      {/* Scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-700 via-red-500 to-red-600 z-[60] origin-left"
        style={{ scaleX, opacity: scrollYProgress }}
      />

      {/* ── Navbar ── Apple-style: full-width when at top, pills after scroll */}
      <motion.nav
        className="fixed z-50 left-0 right-0"
        animate={{
          top: scrolled ? 10 : 0,
          marginLeft: scrolled ? 16 : 0,
          marginRight: scrolled ? 16 : 0,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      >
        <motion.div
          className="relative overflow-hidden"
          animate={{
            borderRadius: scrolled ? 40 : 0,
            backgroundColor: scrolled ? 'rgba(0,0,0,0.82)' : 'rgba(0,0,0,0)',
            borderWidth: '1px',
            borderColor: scrolled ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0)',
            backdropFilter: scrolled ? 'blur(20px) saturate(1.8)' : 'blur(0px)',
            WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(1.8)' : 'blur(0px)',
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          style={{ borderStyle: 'solid' }}
        >
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">

              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
                <div className="w-2 h-2 bg-red-600 rounded-full group-hover:scale-150 transition-transform shadow-[0_0_8px_#dc2626]" />
                <span className="text-sm font-bold font-heading tracking-tight text-white">DIZITUP</span>
              </Link>

              {/* Center nav — Desktop */}
              <div className="hidden md:flex items-center gap-6 lg:gap-8">
                {navItems.map((item) => (
                  <motion.a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-white/50 hover:text-white transition-colors relative group"
                    whileHover={{ y: -1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    {item}
                    <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-white/40 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                  </motion.a>
                ))}
              </div>

              {/* Right — Auth */}
              <div className="hidden md:flex items-center gap-3">
                {user ? (
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-white/25 hover:bg-white/8 transition-all group"
                    >
                      <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                        {displayName?.[0]?.toUpperCase() ?? 'U'}
                      </div>
                      <span className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors max-w-[80px] truncate">
                        {displayName}
                      </span>
                      <LayoutDashboard className="w-3 h-3 text-white/30 group-hover:text-white/60 transition-colors" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleSignOut}
                      className="p-1.5 rounded-full text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Sign out"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ y: -1 }}
                      onClick={() => navigate('/login')}
                      className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-white/50 hover:text-white transition-colors"
                    >
                      Sign In
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.04, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate('/login')}
                      className="px-4 py-2 bg-white text-black text-[11px] font-black rounded-full hover:bg-white/90 transition-colors tracking-wider uppercase shadow-[0_0_16px_rgba(255,255,255,0.1)]"
                    >
                      Get Started
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-white/70 hover:text-white transition-colors p-1"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mobileMenuOpen ? 'x' : 'menu'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 240, damping: 26 }}
                className="md:hidden overflow-hidden border-t border-white/5 bg-black/90 backdrop-blur-xl"
              >
                <div className="px-5 py-4 space-y-1">
                  {navItems.map((item, i) => (
                    <motion.a
                      key={item}
                      href={`#${item.toLowerCase()}`}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.055 }}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-3 text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-white/50 hover:text-white transition-colors border-b border-white/5 last:border-0"
                    >
                      {item}
                    </motion.a>
                  ))}
                  <div className="pt-3 flex gap-2">
                    {user ? (
                      <>
                        <motion.button
                          initial={{ y: 6, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.18 }}
                          onClick={() => { navigate(isAdmin ? '/admin' : '/dashboard'); setMobileMenuOpen(false); }}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 text-white text-xs font-bold rounded-full hover:bg-white/10 transition-colors"
                        >
                          <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-[9px] font-bold text-white">
                            {displayName?.[0]?.toUpperCase() ?? 'U'}
                          </div>
                          {displayName}
                        </motion.button>
                        <motion.button
                          initial={{ y: 6, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.22 }}
                          onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                          className="px-3 py-2.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <motion.button
                          initial={{ y: 6, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.18 }}
                          onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                          className="flex-1 py-2.5 text-xs font-mono font-bold uppercase text-white/50 hover:text-white transition-colors"
                        >
                          Sign In
                        </motion.button>
                        <motion.button
                          initial={{ y: 6, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.22 }}
                          onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                          className="flex-1 py-2.5 bg-white text-black text-xs font-black rounded-full hover:bg-white/90 transition-colors tracking-wider uppercase"
                        >
                          Get Started
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.nav>

      {/* Spacer */}
      <div className="h-14 sm:h-16" />
    </>
  );
};

export default Navbar;