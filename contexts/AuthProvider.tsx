import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import type { User, Session } from '@supabase/supabase-js'
import { validateAndCompressImage } from '../utils/storage'
import { generateAndStoreUserQr } from '../utils/qr'

type Profile = {
  id: string
  email?: string
  first_name?: string
  last_name?: string
  username?: string
  business_name?: string
  phone?: string
  avatar_url?: string
  subscription?: string
  credits?: number
  joined_at?: string
}

type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  profile: Profile | null
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  changePassword: (newPassword: string) => Promise<void>
  updateEmail: (newEmail: string) => Promise<void>
  upsertProfile: (data: Partial<Profile>) => Promise<void>
  uploadAvatar: (file: File) => Promise<string | null>
  deleteAccount: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
      if (data.session?.user) {
        await refreshRoleAndProfile(data.session.user.id)
      }
    }
    init()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (newSession?.user) {
        await refreshRoleAndProfile(newSession.user.id)
      } else {
        setIsAdmin(false)
        setProfile(null)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const refreshRoleAndProfile = async (uid: string) => {
    try {
      // Role check via admins table
      const { data: adminRows } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', uid)
        .limit(1)
      setIsAdmin(Boolean(adminRows && adminRows.length > 0))

      // Profile fetch by auth.uid()
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .limit(1)
      setProfile((prof && prof[0]) || null)
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn('refreshRoleAndProfile aborted');
      } else {
        console.error('refreshRoleAndProfile error:', err);
      }
    }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    const uid = data.user?.id
    if (!uid) return
    // Automations on signup (RLS-compliant, scoped by auth.uid())
    await supabase.from('profiles').upsert({ id: uid, joined_at: new Date().toISOString(), email }, { onConflict: 'id' })
    await supabase.from('credits').upsert({ user_id: uid, credits: 0 }, { onConflict: 'user_id' })
    await supabase.from('attendance').upsert({ user_id: uid }, { onConflict: 'user_id' })
    await generateAndStoreUserQr(uid)
    await refreshRoleAndProfile(uid)
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/login',
    })
    if (error) throw error
  }

  const changePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  const updateEmail = async (newEmail: string) => {
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) throw error
    if (!user) return
    const { error: pError } = await supabase.from('profiles').update({ email: newEmail }).eq('id', user.id)
    if (pError) throw pError
    await refreshRoleAndProfile(user.id)
  }

  const upsertProfile = async (data: Partial<Profile>) => {
    if (!user) throw new Error('Not authenticated')
    const payload = { id: user.id, ...data }
    // Validate username uniqueness if present
    if (data.username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', data.username)
        .neq('id', user.id)
        .limit(1)
      if (existing && existing.length > 0) {
        throw new Error('Username already taken')
      }
    }
    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' })
    if (error) throw error
    await refreshRoleAndProfile(user.id)
  }

  const uploadAvatar = async (file: File) => {
    if (!user) throw new Error('Not authenticated')
    const optimized = await validateAndCompressImage(file)
    const path = `${user.id}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('avatars').upload(path, optimized, {
      upsert: false,
    })
    if (error) throw error
    const { data: urlData } = await supabase.storage.from('avatars').getPublicUrl(path)
    await upsertProfile({ avatar_url: urlData.publicUrl })
    return urlData.publicUrl
  }

  const deleteAccount = async () => {
    // Client cannot use service role; provide UI action call to backend if needed.
    // For now, sign out and instruct contacting support.
    await signOut()
  }

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    loading,
    isAdmin,
    profile,
    signUp,
    signIn,
    signOut,
    resetPassword,
    changePassword,
    updateEmail,
    upsertProfile,
    uploadAvatar,
    deleteAccount,
  }), [user, session, loading, isAdmin, profile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
