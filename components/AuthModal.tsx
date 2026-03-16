import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthProvider'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const AuthModal: React.FC<{ open: boolean; onClose: () => void; onLoginSuccess?: () => void }> = ({ open, onClose, onLoginSuccess }) => {
  const { signIn, signUp, isAdmin, loading } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[AuthModal] Submit clicked, mode=', mode)
    setSubmitting(true)
    try {
      if (mode === 'login') {
        console.log('[AuthModal] Attempt signIn')
        await signIn(email, password)
        onClose()
        toast.success('Logged in')
        onLoginSuccess?.()
      } else {
        if (!email || !password || !confirm) throw new Error('Fill required fields')
        if (password !== confirm) throw new Error('Passwords do not match')
        console.log('[AuthModal] Attempt signUp')
        await signUp({ email, password, username: email.split('@')[0], first_name: '', last_name: '' })
        toast.success('Signup successful. Complete your profile in Dashboard.')
        onClose()
      }
    } catch (err: any) {
      console.error('[AuthModal] Error', err)
      toast.error(err?.message || 'Auth error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 modal-overlay backdrop-blur-sm z-[100] flex items-center justify-center">
      <div className="w-full max-w-md p-6 glass-panel modal-content">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{mode === 'login' ? 'Login' : 'Sign Up'}</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full glass-input px-4 py-3" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full glass-input px-4 py-3" required />
          {mode === 'signup' && (
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" className="w-full glass-input px-4 py-3" required />
          )}
          <button type="submit" className={`w-full premium-btn font-bold ${submitting ? 'opacity-60' : ''}`} disabled={submitting} onClick={() => console.log('[AuthModal] Button clicked')} aria-disabled={submitting}>{mode === 'login' ? 'Login' : 'Sign Up'}</button>
        </form>
        <div className="flex items-center justify-between mt-3 text-xs text-white/60">
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="underline">
            {mode === 'login' ? 'Create account' : 'Already have account? Login'}
          </button>
          <button onClick={() => { onClose(); navigate('/login') }} className="underline">Advanced signup</button>
        </div>
      </div>
    </div>
  )
}

export default AuthModal
