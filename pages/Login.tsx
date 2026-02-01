import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthProvider'
import toast, { Toaster } from 'react-hot-toast'
import { supabase } from '../utils/supabaseClient'

const Login: React.FC = () => {
  const { signIn, signUp, resetPassword, user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (mode === 'login') {
        await signIn(email, password)
        toast.success('Logged in')
      } else {
        // Validation
        if (!email || !password || !confirm || !firstName || !username) {
          throw new Error('Fill required fields')
        }
        if (password !== confirm) {
          throw new Error('Passwords do not match')
        }
        const emailValid = /.+@.+\..+/.test(email)
        if (!emailValid) throw new Error('Invalid email')

        await signUp(email, password)
        // After signup, update profile fields by id
        const { data: sessionData } = await supabase.auth.getSession()
        const uid = sessionData.session?.user?.id
        if (uid) {
          // Unique username check
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username)
            .neq('id', uid)
            .limit(1)
          if (existing && existing.length > 0) {
            throw new Error('Username already taken')
          }
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: uid,
              email,
              first_name: firstName,
              last_name: lastName,
              username,
              business_name: businessName,
              phone,
            }, { onConflict: 'id' })
          if (error) throw error
        }
        toast.success('Signup successful. Check email if confirmation required.')
      }
      // Post-login routing by role: query admins table immediately
      const { data: sessionData } = await supabase.auth.getSession()
      const uid = sessionData.session?.user?.id
      if (uid) {
        const { data: adminRows } = await supabase.from('admins').select('user_id').eq('user_id', uid).limit(1)
        if (adminRows && adminRows.length > 0) navigate('/admin', { replace: true })
        else navigate('/dashboard', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    } catch (err: any) {
      toast.error(err?.message || 'Authentication error')
    }
  }

  const handleReset = async () => {
    try {
      await resetPassword(email)
      toast.success('Password reset sent')
    } catch (err: any) {
      toast.error(err?.message || 'Reset error')
    }
  }

  useEffect(() => {
    if (user) {
      // If already logged in, redirect based on role
      if (isAdmin) navigate('/admin', { replace: true })
      else navigate('/dashboard', { replace: true })
    }
  }, [user, isAdmin, navigate])

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <Toaster position="top-right" />
      <div className="w-full max-w-md p-8 glass-panel">
        <h1 className="text-2xl font-heading font-bold mb-6">Access</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full glass-input px-4 py-3"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full glass-input px-4 py-3"
            required
          />
          {mode === 'signup' && (
            <>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full glass-input px-4 py-3"
                required
              />
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full glass-input px-4 py-3"
                required
              />
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full glass-input px-4 py-3"
              />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full glass-input px-4 py-3"
                required
              />
              <input
                type="text"
                placeholder="Business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full glass-input px-4 py-3"
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full glass-input px-4 py-3"
              />
            </>
          )}
          <button type="submit" className="w-full premium-btn font-bold">
            {mode === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <div className="flex items-center justify-between mt-4 text-xs text-white/60">
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="underline">
            {mode === 'login' ? 'Create account' : 'Already have account? Login'}
          </button>
          <button onClick={handleReset} className="underline">Reset password</button>
        </div>
      </div>
    </div>
  )
}

export default Login
