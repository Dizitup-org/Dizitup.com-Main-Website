
import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { User, Lock, LogOut, Calendar, FolderOpen, Home as HomeIcon, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';

interface ClientLayoutProps {
  children: React.ReactNode;
  title: string;
  activeSection?: 'profile' | 'bookings' | 'projects' | 'accounts';
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children, title, activeSection }) => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'profile',   icon: User,       label: 'Profile' },
    { id: 'bookings',  icon: Calendar,   label: 'My Bookings' },
    { id: 'projects',  icon: FolderOpen, label: 'My Projects' },
    { id: 'accounts',  icon: Lock,       label: 'Accounts' },
  ] as const;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6">
        <Link to="/" className="text-xl font-bold font-heading tracking-tight flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <div className="w-3 h-3 bg-red-600 rounded-full" />
          DIZITUP <span className="text-[10px] text-red-500 font-black tracking-widest px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">CLIENT</span>
        </Link>
        {/* User info card */}
        <div className="mt-5 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 min-h-0 px-3 space-y-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(220,38,38,0.3) transparent' }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { navigate(`/dashboard?section=${item.id}`); setMobileOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeSection === item.id ? 'bg-red-600 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={() => { signOut(); navigate('/'); }}
          className="flex items-center gap-3 px-4 py-3 w-full text-white/40 hover:text-red-500 transition-colors text-sm font-medium"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[#0a0a0a] text-white flex overflow-hidden">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-64 border-r border-white/5 flex-col h-screen sticky top-0 bg-black/20 backdrop-blur-xl flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 left-0 h-full w-72 bg-[#0a0a0a] border-r border-white/10 z-50 md:hidden overflow-y-auto"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <main className="flex-grow flex flex-col min-w-0">
        <header className="h-16 md:h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-10 bg-black/10 backdrop-blur-sm flex-shrink-0 gap-3">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-white/20 hover:bg-white/10 transition-colors text-sm flex-shrink-0"
            >
              <HomeIcon className="w-4 h-4" />
              Home
            </Link>
            <h1 className="text-base md:text-xl font-bold font-heading truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 md:border-l md:border-white/10 md:pl-6">
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold">{user?.first_name} {user?.last_name}</p>
              <p className="text-[10px] text-white/30">Client Portal</p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
          </div>
        </header>

        <div
          className="flex-1 p-4 md:p-10 overflow-y-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(220,38,38,0.3) transparent' }}
        >
          {children}
        </div>
      </main>
    </div>
  );
};

export default ClientLayout;
