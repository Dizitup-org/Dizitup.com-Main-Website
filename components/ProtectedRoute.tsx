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
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-white animate-pulse">Authenticating...</div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/admin-login" replace />
  }
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-white/60 mb-8">Administrative privileges required.</p>
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
  
  return <>{children}</>
}

export const RequireRole: React.FC<{ roles: string[], children: React.ReactNode }> = ({ roles, children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-white animate-pulse">Authenticating...</div>
      </div>
    )
  }

  if (!user || !user.isAdmin) return <Navigate to="/admin-login" replace />
  if (!roles.includes(user.adminRole ?? '')) return <Navigate to="/admin-login" replace />
  return <>{children}</>
}

