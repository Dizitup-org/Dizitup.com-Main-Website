
import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Users, LogOut, Search, Layout, ArrowLeft, Home as HomeIcon, Shield, FolderOpen, UserPlus, MessageCircle, CheckSquare, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';
import { getToken } from '../utils/apiClient';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const { signOut, user, isAdmin } = useAuth();
  const token = getToken();
  
  return (
    <div className="h-screen bg-[#0a0a0a] text-white flex overflow-hidden">
      <aside className="w-64 border-r border-white/5 flex flex-col h-screen sticky top-0 bg-black/20 backdrop-blur-xl">
        <div className="p-8">
          <Link to="/" className="text-xl font-bold font-heading tracking-tight flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            DIZITUP <span className="text-[10px] text-red-500 font-black tracking-widest px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">ADMIN</span>
          </Link>
          
          {/* Debug Auth Status */}
          <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-mono text-gray-400">Auth Status</span>
            </div>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-400">Token:</span>
                <span className={token ? "text-green-400" : "text-red-400"}>
                  {token ? "✓" : "✗"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">User:</span>
                <span className={user ? "text-green-400" : "text-red-400"}>
                  {user ? "✓" : "✗"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Admin:</span>
                <span className={isAdmin ? "text-green-400" : "text-red-400"}>
                  {isAdmin ? "✓" : "✗"}
                </span>
              </div>
              {user && (
                <div className="text-xs text-gray-500 mt-2 break-all">
                  {user.email}
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 min-h-0 px-4 space-y-2 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(220,38,38,0.3) transparent' }}>
          {(user?.adminRole === 'manager'
            ? [
                { to: '/admin/manager/projects', icon: FolderOpen, label: 'Projects' },
                { to: '/admin/manager/tasks', icon: CheckSquare, label: 'Tasks' },
                { to: '/admin/manager/team', icon: Users, label: 'Team' },
                { to: '/admin/manager/chat', icon: MessageCircle, label: 'Chat' },
              ]
            : user?.adminRole === 'employee'
            ? [
                { to: '/admin/employee/tasks', icon: CheckSquare, label: 'My Tasks' },
                { to: '/admin/employee/projects', icon: FolderOpen, label: 'My Projects' },
                { to: '/admin/employee/chat', icon: MessageCircle, label: 'Chat' },
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
              ]
          ).map((item, i) => (
            <NavLink
              key={i}
              to={item.to}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-red-600 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => {
              signOut();
              navigate('/');
            }}
            className="flex items-center gap-3 px-4 py-3 w-full text-white/40 hover:text-red-500 transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-black/10 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-white/20 hover:bg-white/10 transition-colors text-sm"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-white/20 hover:bg-white/10 transition-colors text-sm"
              aria-label="Go to Home"
            >
              <HomeIcon className="w-4 h-4" />
              Home
            </Link>
            <h1 className="text-xl font-bold font-heading ml-2">{title}</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input type="text" placeholder="Search..." className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-red-600/50 w-64 transition-all" />
            </div>
            <div className="flex items-center gap-3 border-l border-white/10 pl-6">
              <div className="text-right">
                <p className="text-sm font-bold">{user?.first_name} {user?.last_name}</p>
                <p className="text-[10px] text-white/30 capitalize">{user?.adminRole ?? 'admin'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center font-bold text-sm">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 p-10 overflow-hidden">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
