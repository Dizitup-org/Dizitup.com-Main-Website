import React from 'react';
import AdminLayout from '../components/AdminLayout';
import ManagerTasks from '../components/ManagerTasks';

const ManagerTasksPage: React.FC = () => {
  return (
    <AdminLayout title="Manager — Tasks">
      <div className="h-full overflow-y-auto">
        <ManagerTasks />
      </div>
    </AdminLayout>
  );
};

export default ManagerTasksPage;
