
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="py-12 sm:py-20 bg-black border-t border-white/5 relative">
      {/* Animated gradient glow */}
      <div className="footer-glow-border absolute top-0 left-0 right-0" />
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 sm:gap-10">
          <div>
            <Link to="/" className="text-2xl font-bold font-heading tracking-tight flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              DIZITUP
            </Link>
            <p className="text-white/30 text-sm">© 2024 DIZITUP Agency. All rights reserved.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12 text-sm font-medium">
            <div className="flex flex-col gap-3">
              <span className="text-white/20 uppercase tracking-widest text-[10px]">Navigation</span>
              <a href="#engine" className="text-white/60 hover:text-white transition-colors">How it Works</a>
              <a href="#capabilities" className="text-white/60 hover:text-white transition-colors">Capabilities</a>
              {/* Removed extra booking link to enforce two total CTAs */}
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
    </footer>
  );
};

export default Footer;
