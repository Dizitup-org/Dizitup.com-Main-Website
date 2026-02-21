
import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Users, Settings, LogOut, Search, Layout, ArrowLeft, Home as HomeIcon } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      <aside className="w-64 border-r border-white/5 flex flex-col h-screen sticky top-0 bg-black/20 backdrop-blur-xl">
        <div className="p-8">
          <Link to="/" className="text-xl font-bold font-heading tracking-tight flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            DIZITUP <span className="text-[10px] text-red-500 font-black tracking-widest px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">ADMIN</span>
          </Link>
        </div>

        <nav className="flex-grow px-4 space-y-2">
          {[
            { to: '/admin', icon: LayoutDashboard, label: 'Overview' },
            { to: '/admin/sales', icon: BarChart3, label: 'Sales' },
            { to: '/admin/portfolio', icon: Layout, label: 'Portfolio' },
            { to: '/admin/clients', icon: Users, label: 'Clients' },
            { to: '#', icon: Settings, label: 'Settings' },
          ].map((item, i) => (
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
              localStorage.removeItem('dizitup_auth');
              window.location.href = '#/admin/login';
            }}
            className="flex items-center gap-3 px-4 py-3 w-full text-white/40 hover:text-red-500 transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-grow">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-black/10 backdrop-blur-sm">
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
                <p className="text-sm font-bold">Roy Brothers</p>
                <p className="text-[10px] text-white/30">Founder</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center font-bold text-sm">RB</div>
            </div>
          </div>
        </header>
        <div className="p-10">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
