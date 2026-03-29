
import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';

const Footer: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const [hovered, setHovered] = useState(false);

  // Large DIZITUP text animates in when reaching the bottom of the page
  const textY = useTransform(scrollYProgress, [0.85, 1], [60, 0]);
  const textOpacity = useTransform(scrollYProgress, [0.85, 1], [0, 1]);
  const spotlightOpacity = useTransform(scrollYProgress, [0.9, 1], [0, 1]);

  return (
    <footer className="bg-transparent relative overflow-hidden">
      {/* Horizontal separator line */}
      <div className="border-t border-white/10" />


      {/* Footer content */}
      <div className="py-10 sm:py-14 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 sm:gap-10">
            <div>
              <p className="text-white/30 text-sm">© 2026 DIZITUP Agency. All rights reserved.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12 text-sm font-medium">
              <div className="flex flex-col gap-3">
                <span className="text-white/20 uppercase tracking-widest text-[10px]">Navigation</span>
                <a href="#engine" className="text-white/60 hover:text-white transition-colors">How it Works</a>
                <a href="#capabilities" className="text-white/60 hover:text-white transition-colors">Capabilities</a>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-white/20 uppercase tracking-widest text-[10px]">Legal</span>
                <a href="#" className="text-white/60 hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="text-white/60 hover:text-white transition-colors">Terms of Service</a>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-white/20 uppercase tracking-widest text-[10px]">Connect</span>
                <a href="#" className="text-white/60 hover:text-white transition-colors">Twitter</a>
                <a href="#" className="text-white/60 hover:text-white transition-colors">LinkedIn</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Large DIZITUP watermark — below footer content, Heizen-style */}
      <div
        className="overflow-hidden relative select-none"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* 3 Thin wardrobe spotlights above the text */}
        <motion.div
          style={{ opacity: spotlightOpacity }}
          className="absolute inset-0 pointer-events-none z-10"
        >
          {[20, 50, 80].map((leftPct, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: hovered ? 1 : 0.55 }}
              transition={{ duration: 0.8, delay: i * 0.12 }}
              className="absolute top-0"
              style={{ left: `${leftPct}%`, transform: 'translateX(-50%)' }}
            >
              {/* Thin beam */}
              <div
                style={{
                  width: '2px',
                  height: '100%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 60%, transparent 100%)',
                  filter: 'blur(0.5px)',
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
              />
              {/* Wide soft cone spreading downward */}
              <div
                style={{
                  width: '180px',
                  height: '200px',
                  background: 'radial-gradient(ellipse 50% 100% at 50% 0%, rgba(255,255,255,0.07) 0%, transparent 80%)',
                  transform: 'translateX(-50%)',
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  pointerEvents: 'none',
                }}
              />
              {/* Tiny fixture dot at top */}
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  background: 'rgba(255,255,255,0.6)',
                  borderRadius: '50%',
                  margin: '0 auto',
                  boxShadow: '0 0 8px rgba(255,255,255,0.5)',
                  position: 'relative',
                  zIndex: 2,
                }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* The big DIZITUP text */}
        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="text-center pt-6 pb-2 px-4 relative z-0"
        >
          <span
            className="font-heading font-black leading-none tracking-[0.18em]"
            style={{
              fontSize: 'clamp(4rem, 18vw, 14rem)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            DIZITUP
          </span>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
