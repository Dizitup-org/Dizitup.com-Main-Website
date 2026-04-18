import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import ChatBox from '../components/ChatBox';
import { useAuth } from '../contexts/AuthProvider';
import { getToken } from '../utils/apiClient';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const authHeaders = (): Record<string, string> => {
  const t = getToken();
  if (!t) return {};
  return { Authorization: `Bearer ${t}` };
};

interface Employee { id: string; admin_id: string; first_name: string; last_name: string; username: string; }

const ManagerChat: React.FC = () => {
  const { user } = useAuth();
  const senderName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Manager';
  const [tab, setTab] = useState<'admin' | 'employee'>('admin');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/manager/employees`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        const onlyEmployees = (data.employees as any[]).filter(e => e.role === 'employee' || e.role === 'sales');
        setEmployees(onlyEmployees.map(e => ({
          id: e.user_id || e.id,
          admin_id: e.admin_id || e.id,
          first_name: e.first_name,
          last_name: e.last_name,
          username: e.username,
        })));
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  return (
    <AdminLayout title="Manager — Chat">
      <div className="space-y-6">
        {/* Tab bar */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('admin')}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === 'admin' ? 'bg-red-600 text-white' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
            }`}
          >
            Admin Channel
          </button>
          <button
            onClick={() => setTab('employee')}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === 'employee' ? 'bg-red-600 text-white' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
            }`}
          >
            Staff Channel
          </button>
        </div>

        {/* Tab 1: Admin ↔ Manager channel */}
        {tab === 'admin' && (
          <div className="max-w-2xl">
            <ChatBox
              channel="admin_manager"
              senderName={senderName}
              label="Admin ↔ Manager"
            />
          </div>
        )}

        {/* Tab 2: Manager ↔ Staff channels */}
        {tab === 'employee' && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Staff list */}
            <div className="space-y-2">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30 mb-3">Select Staff</p>
              {employees.length === 0 && (
                <p className="text-xs text-white/20 italic">No staff yet</p>
              )}
              {employees.map(emp => (
                <button
                  key={emp.admin_id}
                  onClick={() => setSelectedEmployee(emp)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                    selectedEmployee?.admin_id === emp.admin_id
                      ? 'bg-red-600/20 border-red-500/40 text-white'
                      : 'bg-white/[0.02] border-white/10 text-white/60 hover:text-white hover:border-white/25'
                  }`}
                >
                  <p className="font-bold">{emp.first_name} {emp.last_name}</p>
                  <p className="text-[10px] font-mono text-white/30">@{emp.username}</p>
                </button>
              ))}
            </div>

            {/* Chat panel */}
            <div className="md:col-span-2">
              {selectedEmployee ? (
                <ChatBox
                  channel={`manager_employee_${selectedEmployee.id}`}
                  senderName={senderName}
                  label={`Chat with ${selectedEmployee.first_name}`}
                />
              ) : (
                <div className="flex items-center justify-center h-40 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <p className="text-xs text-white/20">Select staff member to open chat</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ManagerChat;
