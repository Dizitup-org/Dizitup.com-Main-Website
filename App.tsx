
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Book from './pages/Book';
import AdminOverview from './pages/AdminOverview';
import AdminSales from './pages/AdminSales';
import AdminPortfolio from './pages/AdminPortfolio';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { AuthProvider } from './contexts/AuthProvider';
import { RequireAdmin, RequireAuth } from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
  return (
    <AuthProvider>
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

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
