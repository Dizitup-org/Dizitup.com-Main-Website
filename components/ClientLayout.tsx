import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { User, Lock, LogOut, Calendar, FolderOpen, ArrowLeft, Home as HomeIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';

interface ClientLayoutProps {
  children: React.ReactNode;
  title: string;
  activeSection?: 'profile' | 'bookings' | 'projects' | 'accounts';
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children, title, activeSection }) => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const navItems = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'bookings', icon: Calendar, label: 'My Bookings' },
    { id: 'projects', icon: FolderOpen, label: 'My Projects' },
    { id: 'accounts', icon: Lock, label: 'Accounts' },
  ] as const;

  return (
    <div className="h-screen bg-[#0a0a0a] text-white flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col h-screen sticky top-0 bg-black/20 backdrop-blur-xl">
        <div className="p-8">
          <Link to="/" className="text-xl font-bold font-heading tracking-tight flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            DIZITUP <span className="text-[10px] text-red-500 font-black tracking-widest px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">CLIENT</span>
          </Link>
          
          {/* User Info */}
          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center font-bold text-sm">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 min-h-0 px-4 space-y-2 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(220,38,38,0.3) transparent' }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/dashboard?section=${item.id}`)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeSection === item.id
                  ? 'bg-red-600 text-white'
                  : 'text-white/40 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
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

      {/* Main Content */}
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
          <div className="flex items-center gap-3 border-l border-white/10 pl-6">
            <div className="text-right">
              <p className="text-sm font-bold">{user?.first_name} {user?.last_name}</p>
              <p className="text-[10px] text-white/30">Client Portal</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center font-bold text-sm">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
          </div>
        </header>

        <div className="flex-1 p-10 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
};

export default ClientLayout;
