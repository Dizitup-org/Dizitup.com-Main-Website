
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import MagneticButton from './MagneticButton';

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

  return (
    <>
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[1.5px] bg-red-600 z-[60] origin-left shadow-[0_0_10px_#ff0000]"
        style={{ scaleX }}
      />
      
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 w-[90%] max-w-[1200px] px-8 py-4 rounded-full border border-white/5 backdrop-blur-2xl ${scrolled ? 'bg-black/60 border-white/10' : 'bg-transparent'}`}
      >
        <div className="flex justify-between items-center">
          <Link to="/" className="text-lg font-bold font-heading tracking-tighter flex items-center gap-2 group">
            <div className="w-2 h-2 bg-red-600 rounded-full group-hover:scale-150 transition-transform shadow-[0_0_10px_#ff0000]" />
            <span>DIZITUP</span>
          </Link>
          
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
            <Link to="/admin/login" className="hover:text-red-500">Admin</Link>
          </div>

          {/* Booking CTA removed here to avoid duplication; hero and near-bottom CTAs remain as primary actions */}
        </div>
      </motion.nav>
    </>
  );
};

export default Navbar;
