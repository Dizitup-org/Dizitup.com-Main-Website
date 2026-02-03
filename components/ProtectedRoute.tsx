import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthProvider'

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    let t: any
    if (loading) {
      t = setTimeout(() => setTimedOut(true), 5000)
    } else {
      setTimedOut(false)
    }
    return () => { if (t) clearTimeout(t) }
  }, [loading])
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-sm">
          {timedOut ? 'Auth failed. Please retry.' : 'Loading…'}
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, loading } = useAuth()
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    let t: any
    if (loading) {
      t = setTimeout(() => setTimedOut(true), 5000)
    } else {
      setTimedOut(false)
    }
    return () => { if (t) clearTimeout(t) }
  }, [loading])
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-sm">
          {timedOut ? 'Auth failed. Please retry.' : 'Checking access…'}
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
