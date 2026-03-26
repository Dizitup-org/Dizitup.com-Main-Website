
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Book from './pages/Book';
import AdminOverview from './pages/AdminOverview';
import AdminSales from './pages/AdminSales';
import AdminPortfolio from './pages/AdminPortfolio';
import AdminClients from './pages/AdminClients';
import AdminBookings from './pages/AdminBookings';
import AdminClientDetail from './pages/AdminClientDetail';
import AdminProjects from './pages/AdminProjects';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminChat from './pages/AdminChat';
import ManagerProjects from './pages/ManagerProjects';
import ManagerTeam from './pages/ManagerTeam';
import ManagerChat from './pages/ManagerChat';
import ManagerTasks from './pages/ManagerTasks';
import EmployeeTasks from './pages/EmployeeTasks';
import EmployeeProjects from './pages/EmployeeProjects';
import EmployeeChat from './pages/EmployeeChat';
import { AuthProvider } from './contexts/AuthProvider';
import { BookingProvider } from './contexts/BookingContext';
import { RequireAdmin, RequireAuth, RequireRole } from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BookingProvider>
        <HashRouter>
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/book" element={<Book />} />
            <Route path="/login" element={<Login />} />

            {/* User Dashboard (auth only) */}
            <Route
              path="/dashboard"
              element={(
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              )}
            />

            {/* Admin Routes (admin only) */}
            <Route
              path="/admin"
              element={(
                <RequireAdmin>
                  <AdminOverview />
                </RequireAdmin>
              )}
            />
            <Route
              path="/admin/sales"
              element={(
                <RequireAdmin>
                  <AdminSales />
                </RequireAdmin>
              )}
            />
            <Route
              path="/admin/portfolio"
              element={(
                <RequireAdmin>
                  <AdminPortfolio />
                </RequireAdmin>
              )}
            />
            <Route
              path="/admin/clients"
              element={(
                <RequireAdmin>
                  <AdminClients />
                </RequireAdmin>
              )}
            />
            <Route
              path="/admin/bookings"
              element={(
                <RequireAdmin>
                  <AdminBookings />
                </RequireAdmin>
              )}
            />
            <Route
              path="/admin/clients/:clientId"
              element={(
                <RequireAdmin>
                  <AdminClientDetail />
                </RequireAdmin>
              )}
            />
            <Route
              path="/admin/projects"
              element={(
                <RequireAdmin>
                  <AdminProjects />
                </RequireAdmin>
              )}
            />
            <Route
              path="/admin/chat"
              element={(
                <RequireAdmin>
                  <AdminChat />
                </RequireAdmin>
              )}
            />

            {/* Manager Routes */}
            <Route
              path="/admin/manager/projects"
              element={(
                <RequireRole roles={['admin', 'manager']}>
                  <ManagerProjects />
                </RequireRole>
              )}
            />
            <Route
              path="/admin/manager/team"
              element={(
                <RequireRole roles={['admin', 'manager']}>
                  <ManagerTeam />
                </RequireRole>
              )}
            />
            <Route
              path="/admin/manager/tasks"
              element={(
                <RequireRole roles={['admin', 'manager']}>
                  <ManagerTasks />
                </RequireRole>
              )}
            />
            <Route
              path="/admin/manager/chat"
              element={(
                <RequireRole roles={['admin', 'manager']}>
                  <ManagerChat />
                </RequireRole>
              )}
            />

            {/* Employee Routes */}
            <Route
              path="/admin/employee/tasks"
              element={(
                <RequireRole roles={['admin', 'manager', 'employee']}>
                  <EmployeeTasks />
                </RequireRole>
              )}
            />
            <Route
              path="/admin/employee/projects"
              element={(
                <RequireRole roles={['admin', 'manager', 'employee']}>
                  <EmployeeProjects />
                </RequireRole>
              )}
            />
            <Route
              path="/admin/employee/chat"
              element={(
                <RequireRole roles={['admin', 'manager', 'employee']}>
                  <EmployeeChat />
                </RequireRole>
              )}
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </BookingProvider>
    </AuthProvider>
  );
};

export default App;
