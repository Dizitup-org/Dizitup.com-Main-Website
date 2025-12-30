
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Book from './pages/Book';
import AdminOverview from './pages/AdminOverview';
import AdminSales from './pages/AdminSales';
import AdminLogin from './pages/AdminLogin';
import AdminPortfolio from './pages/AdminPortfolio';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/book" element={<Book />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/sales" element={<AdminSales />} />
        <Route path="/admin/portfolio" element={<AdminPortfolio />} />
        
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
