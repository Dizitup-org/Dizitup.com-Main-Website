
import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Users, LogOut, Search, Layout, Home as HomeIcon, Shield, FolderOpen, UserPlus, MessageCircle, CheckSquare, Calendar, FileText, Menu, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';
import { getToken } from '../utils/apiClient';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const { signOut, user, isAdmin } = useAuth();
  const token = getToken();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = user?.adminRole === 'manager'
    ? [
        { to: '/admin/manager/projects', icon: FolderOpen, label: 'Projects' },
        { to: '/admin/manager/tasks', icon: CheckSquare, label: 'Tasks' },
        { to: '/admin/manager/team', icon: Users, label: 'Team' },
        { to: '/admin/manager/chat', icon: MessageCircle, label: 'Chat' },
        { to: '/admin/manager/docs', icon: FileText, label: 'Docs' },
      ]
    : user?.adminRole === 'employee'
    ? [
        { to: '/admin/employee/tasks', icon: CheckSquare, label: 'My Tasks' },
        { to: '/admin/employee/projects', icon: FolderOpen, label: 'My Projects' },
        { to: '/admin/employee/chat', icon: MessageCircle, label: 'Chat' },
        { to: '/admin/employee/docs', icon: FileText, label: 'Docs' },
      ]
    : [
        { to: '/admin', icon: LayoutDashboard, label: 'Overview' },
        { to: '/admin/bookings', icon: Calendar, label: 'Bookings' },
        { to: '/admin/clients', icon: Users, label: 'Clients' },
        { to: '/admin/projects', icon: FolderOpen, label: 'Projects' },
        { to: '/admin/sales', icon: BarChart3, label: 'Sales' },
        { to: '/admin/portfolio', icon: Layout, label: 'Portfolio' },
        { to: '/admin/chat', icon: MessageCircle, label: 'Chat' },
        { to: '/admin/manager/team', icon: UserPlus, label: 'Team' },
        { to: '/admin/docs', icon: FileText, label: 'Docs' },
      ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6">
        <Link to="/" className="text-xl font-bold font-heading tracking-tight flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <div className="w-3 h-3 bg-red-600 rounded-full" />
          DIZITUP <span className="text-[10px] text-red-500 font-black tracking-widest px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 uppercase">
            {user?.adminRole === 'manager' ? 'MANAGER' : user?.adminRole === 'employee' ? 'STAFF' : 'ADMIN'}
          </span>
        </Link>

        {/* Auth status — compact on mobile */}
        <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
          <div className="flex items-center gap-2 mb-1.5">
            <Shield className="w-3.5 h-3.5 text-white/40" />
            <span className="text-[10px] font-mono text-gray-400">Auth Status</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono">
            <span className={token ? 'text-green-400' : 'text-red-400'}>Token {token ? '✓' : '✗'}</span>
            <span className={user ? 'text-green-400' : 'text-red-400'}>User {user ? '✓' : '✗'}</span>
            <span className={isAdmin ? 'text-green-400' : 'text-red-400'}>Admin {isAdmin ? '✓' : '✗'}</span>
          </div>
          {user && <div className="text-[10px] text-gray-500 mt-1.5 break-all">{user.email}</div>}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 min-h-0 px-3 space-y-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(220,38,38,0.3) transparent' }}>
        {navItems.map((item, i) => (
          <NavLink
            key={i}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-red-600 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
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
              {/* Close button */}
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
        {/* Header */}
        <header className="h-16 md:h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-10 bg-black/10 backdrop-blur-sm flex-shrink-0 gap-3">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate(-1)}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-white/20 hover:bg-white/10 transition-colors text-sm flex-shrink-0"
            >
              ← Back
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

          <div className="flex items-center gap-2 md:gap-6 flex-shrink-0">
            {/* Search — hide on small */}
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input type="text" placeholder="Search..." className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-red-600/50 w-52 transition-all" />
            </div>
            {/* User info */}
            <div className="flex items-center gap-2 md:gap-3 md:border-l md:border-white/10 md:pl-6">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold">{user?.first_name} {user?.last_name}</p>
                <p className="text-[10px] text-white/30 capitalize">{user?.adminRole === 'employee' ? 'staff' : (user?.adminRole ?? 'admin')}</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
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

export default AdminLayout;
