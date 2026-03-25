import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Mail, Lock, User, Phone, Building2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthProvider'
import AdminWelcome from '../components/AdminWelcome'
import toast, { Toaster } from 'react-hot-toast'

const PARTICLES = [
  { size: 3, x: '8%',  y: '18%', color: 'rgba(220,38,38,0.35)', duration: '14s', delay: '0s' },
  { size: 2, x: '82%', y: '12%', color: 'rgba(255,255,255,0.12)', duration: '18s', delay: '2s' },
  { size: 4, x: '22%', y: '72%', color: 'rgba(220,38,38,0.22)', duration: '16s', delay: '4s' },
  { size: 2, x: '68%', y: '62%', color: 'rgba(255,255,255,0.08)', duration: '20s', delay: '1s' },
  { size: 3, x: '50%', y: '38%', color: 'rgba(220,38,38,0.28)', duration: '15s', delay: '3s' },
  { size: 2, x: '88%', y: '82%', color: 'rgba(255,255,255,0.1)', duration: '17s', delay: '5s' },
  { size: 3, x: '15%', y: '55%', color: 'rgba(220,38,38,0.18)', duration: '19s', delay: '1.5s' },
  { size: 2, x: '60%', y: '28%', color: 'rgba(255,255,255,0.07)', duration: '13s', delay: '6s' },
]

interface InputFieldProps {
  type: string
  placeholder: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  icon: React.ReactNode
  required?: boolean
  showToggle?: boolean
}

const InputField: React.FC<InputFieldProps> = ({ type, placeholder, value, onChange, icon, required, showToggle }) => {
  const [show, setShow] = useState(false)
  const inputType = showToggle ? (show ? 'text' : 'password') : type
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
        {icon}
      </span>
      <input
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full glass-input px-4 py-3 pl-10 pr-10 text-sm"
      />
      {showToggle && (
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
          onClick={() => setShow((s) => !s)}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      )}
    </div>
  )
}

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
  const [showWelcome, setShowWelcome] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        toast.success('Welcome back!')
        // If admin, show welcome screen; otherwise redirect immediately
      } else {
        if (!email || !password || !confirm || !firstName || !username) {
          throw new Error('Fill all required fields')
        }
        if (password !== confirm) throw new Error('Passwords do not match')
        if (!/.+@.+\..+/.test(email)) throw new Error('Invalid email')
        await signUp({
          email, password, username,
          first_name: firstName,
          last_name: lastName,
          phone: phone || undefined,
          business_name: businessName || undefined,
        })
        toast.success('Account created. Welcome!')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Authentication error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = async () => {
    if (!email) { toast.error('Enter your email first'); return }
    try {
      await resetPassword(email)
      toast.success('Password reset email sent')
    } catch (err: any) {
      toast.error(err?.message || 'Reset error')
    }
  }

  useEffect(() => {
    if (!loading && user && !showWelcome) {
      // Show welcome screen for admins after login
      if (isAdmin && mode === 'login') {
        setShowWelcome(true)
      } else if (!isAdmin) {
        // Redirect non-admins to dashboard
        navigate('/dashboard', { replace: true })
      }
    }
  }, [user, isAdmin, loading, navigate, showWelcome, mode])

  const handleWelcomeComplete = () => {
    const role = user?.adminRole
    if (role === 'manager') navigate('/admin/manager/projects')
    else if (role === 'employee') navigate('/admin/employee/tasks')
    else navigate('/admin')
  }

  return (
    <>
      <AnimatePresence>
        {showWelcome && <AdminWelcome onComplete={handleWelcomeComplete} />}
      </AnimatePresence>

      <div className="relative min-h-screen bg-[#050505] flex items-center justify-center p-4 overflow-hidden">
      <Toaster position="top-right" toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />

      {/* Floating Particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="floating-particle"
          style={{
            width: p.size, height: p.size,
            left: p.x, top: p.y,
            background: p.color,
            boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
            '--duration': p.duration, '--delay': p.delay,
          } as React.CSSProperties}
        />
      ))}

      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-red-800/5 rounded-full blur-[100px]" />
      </div>

      {/* Back to home button */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors group"
      >
        <span className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-red-500/60 group-hover:bg-red-500/10 transition-all">
          <ArrowLeft size={13} />
        </span>
        Home
      </Link>

      {/* Logo */}
      <Link to="/" className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 group">
        <div className="w-2 h-2 bg-red-600 rounded-full group-hover:scale-150 transition-transform shadow-[0_0_10px_#ff0000]" />
        <span className="text-sm font-heading font-bold tracking-tight text-white">DIZITUP</span>
      </Link>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Red accent top line */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-red-500/80 to-transparent mb-0 rounded-t-2xl" />

        <div className="glass-panel p-7 sm:p-9 shadow-2xl">
          {/* Header */}
          <div className="mb-7">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_6px_#ff0000]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-red-500/80">
                {mode === 'login' ? 'Client Portal' : 'Create Account'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white leading-tight">
              {mode === 'login' ? 'Welcome back' : 'Get started'}
            </h1>
            <p className="text-sm text-white/35 mt-1">
              {mode === 'login' ? 'Sign in to your Dizitup dashboard.' : 'Join Dizitup — where AI fits your business.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <InputField type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={14} />} required />
            <InputField type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={14} />} required showToggle />

            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3 overflow-hidden"
                >
                  <InputField type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} icon={<Lock size={14} />} required showToggle />
                  <div className="grid grid-cols-2 gap-3">
                    <InputField type="text" placeholder="First name *" value={firstName} onChange={(e) => setFirstName(e.target.value)} icon={<User size={14} />} required />
                    <InputField type="text" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} icon={<User size={14} />} />
                  </div>
                  <InputField type="text" placeholder="Username *" value={username} onChange={(e) => setUsername(e.target.value)} icon={<User size={14} />} required />
                  <InputField type="text" placeholder="Business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} icon={<Building2 size={14} />} />
                  <InputField type="tel" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<Phone size={14} />} />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: submitting ? 1 : 0.98 }}
              className="w-full mt-1 py-3 rounded-xl font-heading font-bold text-sm tracking-wide
                bg-gradient-to-r from-red-600 to-red-700
                hover:from-red-500 hover:to-red-600
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_28px_rgba(220,38,38,0.5)]
                transition-all duration-300"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </span>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </motion.button>
          </form>

          {/* Footer actions */}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/[0.07]">
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-xs text-white/40 hover:text-white transition-colors underline underline-offset-2"
            >
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Login'}
            </button>
            {mode === 'login' && (
              <button
                onClick={handleReset}
                className="text-xs text-white/40 hover:text-red-400 transition-colors underline underline-offset-2"
              >
                Forgot password?
              </button>
            )}
          </div>
        </div>

        {/* Bottom glow line */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent mt-0 rounded-b-2xl" />
      </motion.div>
      </div>
    </>
  )
}

export default Login
