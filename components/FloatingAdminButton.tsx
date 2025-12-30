
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const FloatingAdminButton: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 2, duration: 1 }}
      className="fixed bottom-8 right-8 z-[100]"
    >
      <Link to="/admin/login">
        <motion.div 
          whileHover={{ width: '160px' }}
          className="h-14 w-14 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-start px-4 gap-4 overflow-hidden group transition-all duration-500 hover:border-red-600/50 hover:shadow-[0_0_30px_rgba(220,38,38,0.2)]"
        >
          <div className="flex-shrink-0 relative">
            <div className="absolute inset-0 bg-red-600 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            <Shield className="w-5 h-5 text-white/40 group-hover:text-red-500 transition-colors relative z-10" />
          </div>
          <span className="text-[10px] font-mono font-black uppercase tracking-widest text-white/0 group-hover:text-white transition-all whitespace-nowrap">
            System Access
          </span>
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default FloatingAdminButton;
