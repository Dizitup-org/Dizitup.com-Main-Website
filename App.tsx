
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Book from './pages/Book';
import AdminOverview from './pages/AdminOverview';
import AdminSales from './pages/AdminSales';
import AdminPortfolio from './pages/AdminPortfolio';
import AdminClients from './pages/AdminClients';
import AdminClientDetail from './pages/AdminClientDetail';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { AuthProvider } from './contexts/AuthProvider';
import ErrorBoundary from './components/ErrorBoundary';
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
              <ErrorBoundary>
                <RequireAdmin>
                  <AdminOverview />
                </RequireAdmin>
              </ErrorBoundary>
            )}
          />
          <Route
            path="/admin/sales"
            element={(
              <ErrorBoundary>
                <RequireAdmin>
                  <AdminSales />
                </RequireAdmin>
              </ErrorBoundary>
            )}
          />
          <Route
            path="/admin/portfolio"
            element={(
              <ErrorBoundary>
                <RequireAdmin>
                  <AdminPortfolio />
                </RequireAdmin>
              </ErrorBoundary>
            )}
          />

          <Route
            path="/admin/clients"
            element={(
              <ErrorBoundary>
                <RequireAdmin>
                  <AdminClients />
                </RequireAdmin>
              </ErrorBoundary>
            )}
          />
          <Route
            path="/admin/clients/:clientId"
            element={(
              <ErrorBoundary>
                <RequireAdmin>
                  <AdminClientDetail />
                </RequireAdmin>
              </ErrorBoundary>
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
