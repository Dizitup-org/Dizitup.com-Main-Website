import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, User, Shield, Camera, Clock, Mail, Coins, ChevronDown, ChevronUp, LogOut, KeyRound, AtSign, FolderOpen, CalendarDays, Phone, MessageCircle, Send, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthProvider'
import toast, { Toaster } from 'react-hot-toast'
import { api, getToken } from '../utils/apiClient'
import type { ProjectRow, ProjectUpdate, BookingRow } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface ChatMessage {
  id: string
  sender_type: 'user' | 'admin'
  message: string
  is_read: boolean
  created_at: string
}

type ProjectWithUpdates = ProjectRow & { updates?: ProjectUpdate[] }

const PARTICLES = [
  { size: 3, x: '5%',  y: '15%', color: 'rgba(220,38,38,0.3)',  duration: '14s', delay: '0s' },
  { size: 2, x: '85%', y: '10%', color: 'rgba(255,255,255,0.1)', duration: '18s', delay: '2s' },
  { size: 4, x: '20%', y: '75%', color: 'rgba(220,38,38,0.2)',  duration: '16s', delay: '4s' },
  { size: 2, x: '72%', y: '60%', color: 'rgba(255,255,255,0.08)', duration: '20s', delay: '1s' },
  { size: 3, x: '92%', y: '45%', color: 'rgba(220,38,38,0.25)', duration: '15s', delay: '3s' },
  { size: 2, x: '40%', y: '88%', color: 'rgba(255,255,255,0.07)', duration: '17s', delay: '5s' },
]

const statusConfig: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  active:            { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-400',  dot: 'bg-green-400' },
  completed:         { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', dot: 'bg-purple-400' },
  paused:            { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  cancelled:         { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-400',    dot: 'bg-red-400' },
  // booking-specific
  pending:           { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  accepted:          { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-400',  dot: 'bg-green-400' },
  follow_up:         { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-400' },
  // project workflow statuses
  sent_to_manager:   { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  assigned_to_staff: { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-400',   dot: 'bg-blue-400' },
  under_execution:   { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-400' },
}

const STATUS_LABELS: Record<string, string> = {
  sent_to_manager:   'Sent to Manager',
  assigned_to_staff: 'Assigned to Staff',
  under_execution:   'Under Execution',
}

function StatusBadge({ status }: { status: string | null }) {
  const s = statusConfig[status || ''] ?? { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/60', dot: 'bg-white/40' }
  const label = STATUS_LABELS[status || ''] ?? (status || 'Unknown')
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.border} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } }),
}

const Dashboard: React.FC = () => {
  const { user, profile, upsertProfile, uploadAvatar, signOut, changePassword, updateEmail } = useAuth()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [projects, setProjects] = useState<ProjectWithUpdates[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [showAllProjects, setShowAllProjects] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)

  // Client status for chat visibility (mirrors ChatWidget restriction)
  const [clientStatus, setClientStatus] = useState<'none' | 'follow_up' | 'onboarded' | null>(null)

  // Admin chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let isMounted = true
    const fetchBookings = async () => {
      try {
        const data = await api.get<{ success: boolean; bookings: BookingRow[] }>('/api/user/my-bookings')
        if (isMounted) setBookings(data.bookings || [])
      } catch {
        // non-fatal
      } finally {
        if (isMounted) setBookingsLoading(false)
      }
    }
    fetchBookings()
    return () => { isMounted = false }
  }, [user])

  // Fetch client status
  useEffect(() => {
    if (!user) { setClientStatus('none'); return }
    const token = getToken()
    fetch(`${BASE_URL}/api/user/client-status`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(d => setClientStatus(d.clientStatus ?? 'none'))
      .catch(() => setClientStatus('none'))
  }, [user])

  // Chat fetch + polling
  const fetchChatMessages = useCallback(async () => {
    const token = getToken()
    try {
      const res = await fetch(`${BASE_URL}/api/chat/messages`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) {
        setChatMessages(data.messages ?? [])
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    if (clientStatus === 'follow_up' || clientStatus === 'onboarded') {
      fetchChatMessages()
      chatPollRef.current = setInterval(fetchChatMessages, 4000)
    }
    return () => { if (chatPollRef.current) clearInterval(chatPollRef.current) }
  }, [clientStatus, fetchChatMessages])

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatSending) return
    setChatSending(true)
    const token = getToken()
    try {
      const res = await fetch(`${BASE_URL}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: chatInput.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setChatInput('')
        await fetchChatMessages()
      }
    } catch { /* silent */ } finally {
      setChatSending(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    const fetchProject = async () => {
      setProjectsLoading(true)
      try {
        const data = await api.get<{ success: boolean; projects: ProjectWithUpdates[] }>('/api/user/my-project')
        if (isMounted) setProjects(data.projects || [])
      } catch {
        // non-fatal
      } finally {
        if (isMounted) setProjectsLoading(false)
      }
    }
    fetchProject()
    return () => { isMounted = false }
  }, [user])

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const first_name = String(formData.get('first_name') || '')
    const last_name = String(formData.get('last_name') || '')
    const username = String(formData.get('username') || '')
    const business_name = String(formData.get('business_name') || '')
    const phone = String(formData.get('phone') || '')
    setUpdating(true)
    try {
      await upsertProfile({ first_name, last_name, username, business_name, phone })
      toast.success('Profile updated')
    } catch (err: any) {
      toast.error(err?.message || 'Update failed')
    } finally {
      setUpdating(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    try {
      await uploadAvatar(file)
      toast.success('Avatar uploaded')
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed')
      setAvatarPreview(null)
    }
  }

  const displayName = profile?.first_name
    ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`
    : (profile?.username || user?.email?.split('@')[0] || 'Client')

  const avatarSrc = avatarPreview || profile?.avatar_url

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <Toaster position="top-right" toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />

      {/* Particles */}
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

      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-600/4 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-red-800/3 rounded-full blur-[120px]" />
      </div>

      {/* Top header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors group"
          >
            <span className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-red-500/50 group-hover:bg-red-500/10 group-hover:shadow-[0_0_10px_rgba(220,38,38,0.3)] transition-all">
              <ArrowLeft size={13} />
            </span>
            <span className="hidden sm:inline">Back to Home</span>
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group absolute left-1/2 -translate-x-1/2">
            <div className="w-2 h-2 bg-red-600 rounded-full group-hover:scale-150 transition-transform shadow-[0_0_10px_#ff0000]" />
            <span className="text-sm font-heading font-bold tracking-tight">DIZITUP</span>
          </Link>

          {/* Sign out */}
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-white/35 hover:text-red-400 transition-colors group"
          >
            <LogOut size={13} className="group-hover:translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
        {/* Progress line */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
      </header>

      <main className="container mx-auto px-4 sm:px-6 pt-10 pb-24">

        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_6px_#ff0000]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-red-500/80">Client Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold">Dashboard</h1>
          <p className="text-sm text-white/35 mt-1">Welcome back, <span className="text-white/60">{displayName}</span></p>
        </motion.div>

        {/* Top cards grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">

          {/* Profile card */}
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="glass-panel p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <User size={14} className="text-white/50" />
              </div>
              <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-white/80">Profile</h2>
            </div>
            <form onSubmit={handleProfileSave} className="space-y-2.5">
              {([
                { name: 'first_name', placeholder: 'First name', defaultValue: profile?.first_name || '' },
                { name: 'last_name', placeholder: 'Last name', defaultValue: profile?.last_name || '' },
                { name: 'username', placeholder: 'Username', defaultValue: profile?.username || '' },
                { name: 'business_name', placeholder: 'Business name', defaultValue: profile?.business_name || '' },
                { name: 'phone', placeholder: 'Phone', defaultValue: profile?.phone || '' },
              ] as const).map((f) => (
                <input
                  key={f.name}
                  name={f.name}
                  defaultValue={f.defaultValue}
                  placeholder={f.placeholder}
                  className="w-full glass-input px-3 py-2.5 text-sm"
                />
              ))}
              <motion.button
                type="submit"
                disabled={updating}
                whileHover={{ scale: updating ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-1 py-2.5 rounded-xl text-sm font-heading font-bold
                  bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600
                  disabled:opacity-50 shadow-[0_0_16px_rgba(220,38,38,0.25)]
                  hover:shadow-[0_0_22px_rgba(220,38,38,0.45)] transition-all duration-300"
              >
                {updating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving…
                  </span>
                ) : 'Save Profile'}
              </motion.button>
            </form>
          </motion.div>

          {/* Avatar card */}
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="glass-panel p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <Camera size={14} className="text-white/50" />
              </div>
              <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-white/80">Avatar</h2>
            </div>

            {/* Avatar display */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center shadow-lg">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={36} className="text-white/20" />
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  <Camera size={18} className="text-white" />
                </label>
              </div>

              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />

              <label
                htmlFor="avatar-upload"
                className="w-full text-center py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider
                  premium-btn cursor-pointer hover:border-red-500/40 transition-all"
              >
                Upload Photo
              </label>
              <p className="text-[11px] text-white/25 text-center leading-relaxed">
                Stored securely in avatars/ bucket.
              </p>
            </div>
          </motion.div>

          {/* Account card */}
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="glass-panel p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <Shield size={14} className="text-white/50" />
              </div>
              <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-white/80">Account</h2>
            </div>

            {/* Account info pills */}
            <div className="space-y-2 mb-4">
              {[
                { icon: <Clock size={12} />, label: 'Joined', value: profile?.joined_at ? new Date(profile.joined_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                { icon: <Mail size={12} />, label: 'Email', value: profile?.email ?? user?.email ?? '—' },
                { icon: <Coins size={12} />, label: 'Credits', value: profile?.credits != null ? String(profile.credits) : '—' },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-white/30">{icon}</span>
                  <span className="text-xs text-white/40">{label}:</span>
                  <span className="text-xs text-white/70 ml-auto truncate max-w-[140px]">{value}</span>
                </div>
              ))}
            </div>

            {/* Security actions */}
            <div className="space-y-2 pt-2 border-t border-white/[0.07]">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none"><KeyRound size={12} /></span>
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full glass-input px-3 py-2.5 pl-8 text-xs"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none"><AtSign size={12} /></span>
                <input
                  type="email"
                  placeholder="New email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full glass-input px-3 py-2.5 pl-8 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={async () => {
                    try { await changePassword(newPassword); toast.success('Password updated'); setNewPassword('') }
                    catch (e: any) { toast.error(e?.message || 'Failed') }
                  }}
                  className="premium-btn text-xs py-2 font-bold"
                >
                  Change Password
                </button>
                <button
                  onClick={async () => {
                    try { await updateEmail(newEmail); toast.success('Email updated'); setNewEmail('') }
                    catch (e: any) { toast.error(e?.message || 'Failed') }
                  }}
                  className="premium-btn text-xs py-2 font-bold"
                >
                  Change Email
                </button>
              </div>
              <button
                onClick={() => signOut()}
                className="w-full premium-btn text-xs py-2.5 font-bold text-red-400/80 hover:text-red-400 border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 flex items-center justify-center gap-2"
              >
                <LogOut size={12} /> Sign Out
              </button>
            </div>
          </motion.div>
        </div>

        {/* Projects section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-5"
        >
          {/* Section header */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <FolderOpen size={14} className="text-white/50" />
            </div>
            <div>
              <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-white/80">My Project</h2>
            </div>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
          </div>

          {/* Loading */}
          {projectsLoading && (
            <div className="p-8 glass-panel flex items-center gap-3 text-white/40">
              <span className="w-4 h-4 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
              <span className="text-sm">Loading your project…</span>
            </div>
          )}

          {/* Empty */}
          {!projectsLoading && projects.length === 0 && (
            <div className="p-10 glass-panel text-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                <FolderOpen size={20} className="text-white/20" />
              </div>
              <p className="text-sm text-white/35">No project assigned yet.</p>
              <p className="text-xs text-white/20 mt-1">Check back soon — your team is on it!</p>
            </div>
          )}

          {/* Projects */}
          {!projectsLoading && projects.length > 0 && (() => {
            const latest = projects[0]
            const others = projects.slice(1)
            return (
              <>
                {/* Latest project hero */}
                <div className="premium-card p-6 space-y-5">
                  {/* Top accent */}
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent rounded-t-2xl" style={{ position: 'relative' }} />

                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-500/70 mb-1">Latest Project</p>
                      <h3 className="text-xl sm:text-2xl font-heading font-bold">{latest.title || 'Untitled Project'}</h3>
                      {latest.description && <p className="text-sm text-white/50 mt-1 max-w-xl">{latest.description}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={latest.status} />
                      {(latest as any).status_note && <p className="text-[10px] text-white/35 italic">{(latest as any).status_note}</p>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {latest.deadline && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/50">
                        <Clock size={11} className="text-white/30" />
                        Deadline: {new Date(latest.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    {latest.total_amount != null && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/50">
                        <Coins size={11} className="text-white/30" />
                        Value: ₹{latest.total_amount.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  {/* Updates feed */}
                  <div className="pt-3 border-t border-white/[0.07]">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-white/30 mb-3">Updates from Dizitup</p>
                    {(!latest.updates || latest.updates.length === 0) ? (
                      <p className="text-xs text-white/25 italic">No updates yet — your team is working on it.</p>
                    ) : (
                      <div className="space-y-2">
                        {(latest.updates || []).map((u) => (
                          <div key={u.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.12] transition-colors">
                            <p className="text-sm text-white/75">{u.message}</p>
                            <p className="text-[10px] text-white/25 mt-1.5">{new Date(u.created_at).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Other projects */}
                {others.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowAllProjects((v) => !v)}
                      className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-white/35 hover:text-white/60 transition-colors mb-3"
                    >
                      {showAllProjects ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      {showAllProjects ? 'Hide' : `Show ${others.length} more project${others.length > 1 ? 's' : ''}`}
                    </button>
                    <AnimatePresence>
                      {showAllProjects && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 overflow-hidden"
                        >
                          {others.map((p) => (
                            <div key={p.id} className="p-4 glass-panel flex items-center justify-between gap-4">
                              <div>
                                <p className="font-heading font-bold text-sm">{p.title || 'Untitled'}</p>
                                {p.deadline && <p className="text-xs text-white/35 mt-0.5">Deadline: {new Date(p.deadline).toLocaleDateString()}</p>}
                              </div>
                              <StatusBadge status={p.status} />
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )
          })()}
        </motion.section>

        {/* Bookings section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="mt-10 space-y-5"
        >
          {/* Section header */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <CalendarDays size={14} className="text-white/50" />
            </div>
            <div>
              <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-white/80">My Bookings</h2>
            </div>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
          </div>

          {/* Loading */}
          {bookingsLoading && (
            <div className="p-8 glass-panel flex items-center gap-3 text-white/40">
              <span className="w-4 h-4 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
              <span className="text-sm">Loading your bookings…</span>
            </div>
          )}

          {/* Empty */}
          {!bookingsLoading && bookings.length === 0 && (
            <div className="p-10 glass-panel text-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                <CalendarDays size={20} className="text-white/20" />
              </div>
              <p className="text-sm text-white/35">No bookings yet.</p>
              <p className="text-xs text-white/20 mt-1">
                Book a free strategy call —{' '}
                <a href="/#book" className="text-red-500/60 hover:text-red-400 underline underline-offset-2 transition-colors">schedule now</a>
              </p>
            </div>
          )}

          {/* Booking cards */}
          {!bookingsLoading && bookings.length > 0 && (
            <div className="space-y-3">
              {bookings.map((b) => {
                const sc = statusConfig[b.status || ''] ?? { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/60', dot: 'bg-white/40' }
                return (
                  <div key={b.id} className="glass-panel p-5 space-y-3 hover:border-white/20 transition-colors">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30 mb-0.5">Strategy Call</p>
                        <p className="font-heading font-bold text-white/90">{b.project_type || 'General Enquiry'}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${sc.bg} ${sc.border} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {(b.status || 'pending').replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {b.meeting_date && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/50">
                          <CalendarDays size={11} className="text-white/30" />
                          {new Date(b.meeting_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {b.meeting_time && <> · {b.meeting_time}</>}
                        </span>
                      )}
                      {b.agency && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/50">
                          <Phone size={11} className="text-white/30" />
                          {b.agency}
                        </span>
                      )}
                    </div>

                    {b.notes && (
                      <p className="text-xs text-white/35 border-t border-white/[0.06] pt-3 leading-relaxed">{b.notes}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </motion.section>

        {/* ── Chat with Dizitup Admin ─────────────────────────── */}
        {(clientStatus === 'follow_up' || clientStatus === 'onboarded') && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="mt-10 space-y-5"
          >
            {/* Section header */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center">
                <MessageCircle size={14} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-white/80">Chat with Dizitup Admin</h2>
              </div>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-red-500/20 to-transparent" />
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-green-400/70">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Online
              </span>
            </div>

            {/* Chat panel */}
            <div className="glass-panel flex flex-col overflow-hidden" style={{ minHeight: '560px' }}>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-[0_0_14px_rgba(220,38,38,0.35)]">
                  <MessageCircle size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Dizitup Admin</p>
                  <p className="text-[10px] text-green-400 font-mono">● Online · replies within minutes</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <MessageCircle size={20} className="text-white/20" />
                    </div>
                    <p className="text-sm text-white/35">No messages yet</p>
                    <p className="text-xs text-white/20">Send a message to start chatting with the admin team</p>
                  </div>
                )}
                {chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.sender_type === 'user'
                          ? 'bg-red-600 text-white rounded-br-sm shadow-[0_2px_12px_rgba(220,38,38,0.25)]'
                          : 'bg-white/[0.06] border border-white/10 text-white/80 rounded-bl-sm'
                      }`}
                    >
                      {msg.sender_type === 'admin' && (
                        <p className="text-[9px] font-bold uppercase tracking-wider text-white/40 mb-1">Admin</p>
                      )}
                      {msg.message}
                      <p className={`text-[9px] mt-1 ${msg.sender_type === 'user' ? 'text-white/50' : 'text-white/30'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input area */}
              <div className="px-5 py-4 border-t border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-end gap-3">
                  <textarea
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage() }
                    }}
                    placeholder="Type a message to admin…"
                    rows={1}
                    className="flex-1 bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-600/50 resize-none transition-all"
                    style={{ maxHeight: '120px', overflowY: 'auto' }}
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim() || chatSending}
                    className="w-11 h-11 flex-shrink-0 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-[0_0_12px_rgba(220,38,38,0.3)] hover:shadow-[0_0_18px_rgba(220,38,38,0.5)]"
                  >
                    {chatSending
                      ? <Loader2 size={16} className="text-white animate-spin" />
                      : <Send size={16} className="text-white" />
                    }
                  </button>
                </div>
                <p className="text-[10px] text-white/20 mt-2 text-center">
                  Messages are visible to the Dizitup admin team · Press Enter to send
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* Bottom back link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 flex justify-center"
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors group"
          >
            <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Dizitup Home
          </button>
        </motion.div>

      </main>
    </div>
  )
}

export default Dashboard
