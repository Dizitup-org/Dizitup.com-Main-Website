import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthProvider'

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAdmin } = useAuth()
  
  // 🚨 TEMPORARY DEV BYPASS - REMOVE BEFORE PRODUCTION!
  const DEV_BYPASS = true; // Set to false when you want authentication back
  
  if (DEV_BYPASS) {
    console.log('🚨 DEV MODE: Bypassing admin authentication');
    return <>{children}</>;
  }
  
  const tokenExists = !!localStorage.getItem('dizitup_token');
  console.log('🛡️ RequireAdmin check:', { 
    loading, 
    user: user ? { id: user.id, email: user.email, isAdmin: user.isAdmin } : null, 
    isAdmin,
    tokenExists
  });
  
  if (loading) {
    console.log('⏳ Auth still loading...');
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-white animate-pulse">Authenticating...</div>
      </div>
    )
  }
  
  if (!user) {
    console.log('❌ No user found, redirecting to admin login. Token exists:', tokenExists);
    return <Navigate to="/admin-login" replace />
  }
  
  if (!isAdmin) {
    console.log('❌ User found but not admin:', { 
      userEmail: user.email, 
      userIsAdmin: user.isAdmin,
      computedIsAdmin: isAdmin,
      tokenExists
    });
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-white/60 mb-8">Administrative privileges required.</p>
          <p className="text-xs text-white/40 mb-4">User: {user.email} | Admin: {user.isAdmin ? 'Yes' : 'No'}</p>
          <button 
            onClick={() => window.location.href = '/#/admin-login'}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Admin Login
          </button>
        </div>
      </div>
    )
  }
  
  console.log('✅ Admin access granted!');
  return <>{children}</>
}
