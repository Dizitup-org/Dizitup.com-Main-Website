import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // At 0% scroll → transparent, flush to top
  // At 10% scroll → opaque background, floating pill
  const navbarBg = useTransform(scrollYProgress, [0, 0.1], [0, 0.85]);
  const navbarTop = useTransform(scrollYProgress, [0, 0.1], [0, 12]);
  const navbarLeft = useTransform(scrollYProgress, [0, 0.1], [0, 16]);
  const navbarRight = useTransform(scrollYProgress, [0, 0.1], [0, 16]);
  const navbarRadius = useTransform(scrollYProgress, [0, 0.1], [0, 40]);
  const borderOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  const navItems = ['Capabilities', 'Works', 'Pricing'];

  return (
    <>
      {/* Progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[1.5px] bg-red-600 z-[60] origin-left shadow-[0_0_10px_#ff0000]"
        style={{ scaleX }}
      />

      {/* Floating Navbar */}
      <motion.nav
        className="fixed z-50 backdrop-blur-xl"
        style={{
          top: navbarTop,
          left: navbarLeft,
          right: navbarRight,
          borderRadius: navbarRadius,
          backgroundColor: useTransform(navbarBg, (v) => `rgba(0,0,0,${v})`),
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: useTransform(borderOpacity, (v) => `rgba(255,255,255,${v * 0.12})`),
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left - Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 group shrink-0"
            >
              <div className="w-2 h-2 bg-red-600 rounded-full group-hover:scale-150 transition-transform shadow-[0_0_10px_#ff0000]" />
              <span className="text-sm font-bold font-heading tracking-tight text-white">DIZITUP</span>
            </Link>

            {/* Center - Nav Items (Desktop) */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-xs font-mono font-bold uppercase tracking-[0.15em] text-white/50 hover:text-white transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Right - Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {!isAdmin ? (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-xs font-mono font-bold uppercase tracking-[0.15em] text-white/50 hover:text-white transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-full hover:bg-red-700 transition-colors"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <Link
                  to="/admin"
                  className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-full hover:bg-red-700 transition-colors"
                >
                  Admin
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white hover:text-red-500 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden pb-4 space-y-3"
            >
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-mono font-bold uppercase tracking-[0.15em] text-white/50 hover:text-white transition-colors"
                >
                  {item}
                </a>
              ))}
              <div className="pt-3 border-t border-white/10 flex gap-2">
                {!isAdmin ? (
                  <>
                    <button
                      onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                      className="flex-1 text-xs font-mono font-bold uppercase text-white/50 hover:text-white transition-colors"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                      className="flex-1 px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-full hover:bg-red-700 transition-colors"
                    >
                      Get Started
                    </button>
                  </>
                ) : (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-full hover:bg-red-700 transition-colors text-center"
                  >
                    Admin
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Spacer for fixed navbar */}
      <div className="h-16" />
    </>
  );
};

export default Navbar;