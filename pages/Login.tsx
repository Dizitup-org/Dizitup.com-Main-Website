import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthProvider'
import toast, { Toaster } from 'react-hot-toast'

const Login: React.FC = () => {
  const { signIn, signUp, resetPassword, user, isAdmin, loading } = useAuth()
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
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[Login] Submit clicked, mode=', mode)
    setSubmitting(true)
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
        if (!/.+@.+\..+/.test(email)) throw new Error('Invalid email')
        await signUp({
          email,
          password,
          username,
          first_name: firstName,
          last_name: lastName,
          phone: phone || undefined,
          business_name: businessName || undefined,
        })
        toast.success('Account created. You are now logged in.')
      }
      // Redirect handled by useEffect below watching user/isAdmin
    } catch (err: any) {
      console.error('[Login] Error', err)
      toast.error(err?.message || 'Authentication error')
    } finally {
      setSubmitting(false)
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
    if (!loading && user) {
      // Redirect only after auth finishes
      if (isAdmin) navigate('/admin', { replace: true })
      else navigate('/dashboard', { replace: true })
    }
  }, [user, isAdmin, loading, navigate])

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <Toaster position="top-right" />
      <div className="w-full max-w-md p-8 glass-panel">
        <h1 className="text-2xl font-heading font-bold mb-2">Welcome to Dizitup</h1>
        <p className="text-sm text-white/40 mb-6">Where AI fits your business.</p>
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
          <button type="submit" className={`w-full premium-btn font-bold ${submitting ? 'opacity-60' : ''}`} disabled={submitting} onClick={() => console.log('[Login] Button clicked')} aria-disabled={submitting}>
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
