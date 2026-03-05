
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Terminal, Lock } from 'lucide-react';
import AdminWelcome from '../components/AdminWelcome';
import { useAuth } from '../contexts/AuthProvider';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [creds, setCreds] = useState({ user: '', pass: '' });
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    
    try {
      console.log('🚀 Starting login process...');
      await signIn(creds.user, creds.pass);
      console.log('✅ SignIn completed, showing welcome...');
      setShowWelcome(true);
    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(true);
      setTimeout(() => setError(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleWelcomeComplete = () => {
    console.log('🎉 Welcome complete, navigating to admin dashboard...');
    navigate('/admin');
  };

  return (
    <>
      <AnimatePresence>
        {showWelcome && <AdminWelcome onComplete={handleWelcomeComplete} />}
      </AnimatePresence>

    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/10 backdrop-blur-3xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-red-600/20" />
        
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-red-600/10 flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-heading font-bold tracking-widest uppercase">Node_Access</h1>
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] mt-2">Dizitup Internal OS v2.4</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-2">Email</label>
            <input 
              type="email" 
              placeholder="roybrothers@gmail.com"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-600 transition-all font-mono text-sm"
              value={creds.user}
              onChange={(e) => setCreds({...creds, user: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-2">Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-600 transition-all font-mono text-sm"
              value={creds.pass}
              onChange={(e) => setCreds({...creds, pass: e.target.value})}
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-red-600 text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-red-600/20"
          >
            {loading ? 'Authenticating...' : 'Decrypt & Authenticate'}
          </button>
        </form>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center gap-3 text-red-500 text-[10px] font-black uppercase tracking-widest"
          >
            <ShieldAlert className="w-4 h-4" /> Access Denied: Invalid Credentials
          </motion.div>
        )}

        <div className="mt-10 flex justify-center gap-6 opacity-10">
          <Terminal className="w-4 h-4" />
          <div className="w-px h-4 bg-white" />
          <span className="text-[8px] font-mono">ENCRYPTED_SESSION_ACTIVE</span>
        </div>
      </motion.div>
    </div>
    </>
  );
};

export default AdminLogin;
