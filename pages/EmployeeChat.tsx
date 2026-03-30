import React from 'react';
import AdminLayout from '../components/AdminLayout';
import ChatBox from '../components/ChatBox';
import { useAuth } from '../contexts/AuthProvider';
import { MessageCircle, Info } from 'lucide-react';

const EmployeeChat: React.FC = () => {
  const { user } = useAuth();
  const senderName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Employee';

  // Channel is keyed by the employee's user-id, same as what the tasks page used.
  // Backend validates: manager_employee_{userId} — employee can only access their own channel.
  const channel = user?.id ? `manager_employee_${user.id}` : null;

  return (
    <AdminLayout title="Employee — Manager Chat">
      <div className="space-y-4">
        {/* Info banner */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <Info size={14} className="text-red-400/70 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-0.5">Direct Line</p>
            <p className="text-[12px] text-white/40 leading-relaxed">
              Send messages directly to your manager. They will see your messages in their dashboard.
            </p>
          </div>
        </div>

        {/* Chat panel */}
        {channel ? (
          <ChatBox
            channel={channel}
            senderName={senderName}
            label="Chat with Manager"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-60 rounded-2xl border border-white/[0.06] bg-white/[0.02] gap-3">
            <MessageCircle size={28} className="text-white/15" />
            <p className="text-xs text-white/25">Loading your chat…</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default EmployeeChat;
