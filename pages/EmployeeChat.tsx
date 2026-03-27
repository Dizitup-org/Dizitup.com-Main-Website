import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import ChatBox from '../components/ChatBox';
import { useAuth } from '../contexts/AuthProvider';
import { getToken } from '../utils/apiClient';
import { MessageCircle } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const authHeaders = (): Record<string, string> => {
  const t = getToken();
  if (!t) return {};
  return { Authorization: `Bearer ${t}` };
};

interface Manager { id: string; admin_id: string; first_name: string; last_name: string; username: string; }

const EmployeeChat: React.FC = () => {
  const { user } = useAuth();
  const senderName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Employee';
  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);

  const fetchManagers = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/manager/employees`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        const onlyManagers = (data.employees as any[]).filter(e => e.role === 'manager');
        setManagers(onlyManagers.map(m => ({
          id: m.user_id || m.id,
          admin_id: m.admin_id || m.id,
          first_name: m.first_name,
          last_name: m.last_name,
          username: m.username,
        })));
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchManagers(); }, [fetchManagers]);

  return (
    <AdminLayout title="Employee — Manager Chat">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Manager list */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle size={16} className="text-red-500" />
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30">Team Managers</p>
          </div>
          {managers.length === 0 && (
            <p className="text-xs text-white/20 italic">No managers assigned yet</p>
          )}
          {managers.map(mgr => (
            <button
              key={mgr.admin_id}
              onClick={() => setSelectedManager(mgr)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                selectedManager?.admin_id === mgr.admin_id
                  ? 'bg-red-600/20 border-red-500/40 text-white'
                  : 'bg-white/[0.02] border-white/10 text-white/60 hover:text-white hover:border-white/25'
              }`}
            >
              <p className="font-bold">{mgr.first_name} {mgr.last_name}</p>
              <p className="text-[10px] font-mono text-white/30">@{mgr.username}</p>
            </button>
          ))}
        </div>

        {/* Chat panel */}
        <div className="md:col-span-2">
          {selectedManager ? (
            <ChatBox
              channel={`manager_employee_${selectedManager.id}`}
              senderName={senderName}
              apiBase="/api/staff/chat"
              label={`Chat with ${selectedManager.first_name}`}
            />
          ) : (
            <div className="flex items-center justify-center h-40 rounded-2xl border border-white/10 bg-white/[0.02]">
              <p className="text-xs text-white/20">Select a manager to open chat</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default EmployeeChat;
