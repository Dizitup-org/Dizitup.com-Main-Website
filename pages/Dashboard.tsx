import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, Loader2, RotateCcw, CalendarDays, Phone, Send, Mail, Eye, EyeOff, MessageCircle, KeyRound } from 'lucide-react'
import { useAuth } from '../contexts/AuthProvider'
import { useBooking } from '../contexts/BookingContext'
import ClientLayout from '../components/ClientLayout'
import BookingModal from '../components/BookingModal'
import toast, { Toaster } from 'react-hot-toast'
import { api } from '../utils/apiClient'
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
type SectionType = 'profile' | 'bookings' | 'projects' | 'accounts'

const statusConfig: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  active:            { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-400',  dot: 'bg-green-400' },
  completed:         { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', dot: 'bg-purple-400' },
  pending:           { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  accepted:          { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-400',  dot: 'bg-green-400' },
  follow_up:         { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-400' },
  declined:          { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-400',    dot: 'bg-red-400' },
  onboarded:         { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-400',   dot: 'bg-blue-400' },
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  follow_up: 'Follow-up',
  under_execution: 'Under Execution',
  accepted: 'Accepted',
  declined: 'Declined',
  onboarded: 'Onboarded',
  meeting_done: 'Completed',
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

const Dashboard: React.FC = () => {
  const { user, upsertProfile, uploadAvatar, changePassword, updateEmail } = useAuth()
  const { openBooking, closeBooking, isOpen, packageName, country, setCountry, authPromptOpen, closeAuthPrompt } = useBooking()
  const [searchParams] = useSearchParams()
  const activeSection = (searchParams.get('section') || 'profile') as SectionType

  // Form states
  const [newPassword, setNewPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Data states
  const [projects, setProjects] = useState<ProjectWithUpdates[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [clientStatus, setClientStatus] = useState<'none' | 'follow_up' | 'onboarded' | null>(null)
  const [detailStatus, setDetailStatus] = useState<string | null>(null)

  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch bookings
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
  }, [])

  // Fetch projects
  useEffect(() => {
    let isMounted = true
    const fetchProjects = async () => {
      try {
        const data = await api.get<{ success: boolean; project: ProjectWithUpdates[] }>('/api/user/my-project')
        if (isMounted) setProjects(data.project || [])
      } catch {
        // non-fatal
      } finally {
        if (isMounted) setProjectsLoading(false)
      }
    }
    fetchProjects()
    return () => { isMounted = false }
  }, [])

  // Fetch client status
  useEffect(() => {
    let isMounted = true
    const fetchStatus = async () => {
      try {
        const data = await api.get<{ success: boolean; clientStatus: 'none' | 'follow_up' | 'onboarded'; detailStatus?: string }>('/api/user/client-status')
        if (isMounted && data.clientStatus) {
          setClientStatus(data.clientStatus)
          if (data.detailStatus) setDetailStatus(data.detailStatus)
        }
      } catch {
        // non-fatal
      }
    }
    fetchStatus()
    return () => { isMounted = false }
  }, [])

  // Fetch chat messages
  useEffect(() => {
    if (clientStatus !== 'follow_up' && clientStatus !== 'onboarded') return

    let isMounted = true
    const fetchMessages = async () => {
      try {
        const data = await api.get<{ success: boolean; messages: ChatMessage[] }>('/api/chat/messages')
        if (isMounted) setChatMessages(data.messages || [])
      } catch {
        // non-fatal
      }
    }

    fetchMessages()
    chatPollRef.current = setInterval(fetchMessages, 4000)
    return () => {
      isMounted = false
      if (chatPollRef.current) clearInterval(chatPollRef.current)
    }
  }, [clientStatus])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Handle profile update
  const handleSaveProfile = async () => {
    if (!user) return
    setUpdating(true)
    try {
      await upsertProfile({
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        business_name: user.business_name,
        phone: user.phone,
      })
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setUpdating(false)
    }
  }

  // Handle avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      setAvatarPreview(evt.target?.result as string)
    }
    reader.readAsDataURL(file)

    setUpdating(true)
    try {
      await uploadAvatar(file)
      toast.success('Avatar updated successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload avatar')
    } finally {
      setUpdating(false)
    }
  }

  // Handle password change
  const handleChangePassword = async () => {
    if (!newPassword) {
      toast.error('Please enter a new password')
      return
    }
    setUpdating(true)
    try {
      await changePassword(newPassword)
      setNewPassword('')
      toast.success('Password changed successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password')
    } finally {
      setUpdating(false)
    }
  }

  // Handle email change
  const handleChangeEmail = async () => {
    if (!newEmail) {
      toast.error('Please enter a new email')
      return
    }
    setUpdating(true)
    try {
      await updateEmail(newEmail)
      setNewEmail('')
      toast.success('Email changed successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to change email')
    } finally {
      setUpdating(false)
    }
  }

  // Handle send chat message
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return
    setChatSending(true)
    try {
      await api.post('/api/chat/message', { message: chatInput })
      setChatInput('')
      // Refetch messages
      const data = await api.get<{ success: boolean; messages: ChatMessage[] }>('/api/chat/messages')
      setChatMessages(data.messages || [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message')
    } finally {
      setChatSending(false)
    }
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection user={user} updating={updating} avatarPreview={avatarPreview} onAvatarChange={handleAvatarChange} onSaveProfile={handleSaveProfile} />

      case 'bookings':
        return <BookingsSection bookings={bookings} bookingsLoading={bookingsLoading} openBooking={openBooking} />

      case 'projects':
        return <ProjectsSection projects={projects} projectsLoading={projectsLoading} />

      case 'accounts':
        return (
          <AccountsSection
            user={user}
            updating={updating}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            onChangePassword={handleChangePassword}
            newEmail={newEmail}
            setNewEmail={setNewEmail}
            onChangeEmail={handleChangeEmail}
            clientStatus={clientStatus}
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            chatSending={chatSending}
            onSendMessage={handleSendMessage}
            chatEndRef={chatEndRef}
          />
        )

      default:
        return null
    }
  }

  return (
    <ClientLayout title="Dashboard" activeSection={activeSection} clientStatus={clientStatus} detailStatus={detailStatus}>
      <Toaster position="top-right" />
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderSection()}
      </motion.div>
      <BookingModal isOpen={isOpen} onClose={closeBooking} prefilledPackage={packageName} country={country} />
    </ClientLayout>
  )
}

// Profile Section Component
const ProfileSection: React.FC<{
  user: any
  updating: boolean
  avatarPreview: string | null
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSaveProfile: () => void
}> = ({ user, updating, avatarPreview, onAvatarChange, onSaveProfile }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {/* Profile Form */}
    <div className="md:col-span-2 space-y-6">
      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">First Name</label>
          <input
            type="text"
            value={user?.first_name || ''}
            disabled
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Last Name</label>
          <input
            type="text"
            value={user?.last_name || ''}
            disabled
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Business Name</label>
          <input
            type="text"
            value={user?.business_name || ''}
            disabled
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Phone</label>
          <input
            type="tel"
            value={user?.phone || ''}
            disabled
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium"
          />
        </div>
        <button
          onClick={onSaveProfile}
          disabled={updating}
          className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm uppercase tracking-wider transition-all disabled:opacity-50"
        >
          {updating ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>

    {/* Avatar */}
    <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center space-y-4">
      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
        {avatarPreview ? (
          <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
        ) : user?.avatar_url ? (
          <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          `${user?.first_name?.[0]}${user?.last_name?.[0]}`
        )}
      </div>
      <label className="w-full">
        <input
          type="file"
          accept="image/*"
          onChange={onAvatarChange}
          className="hidden"
        />
        <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 cursor-pointer transition-all text-xs font-semibold">
          <Camera className="w-4 h-4" />
          Upload Photo
        </div>
      </label>
      <p className="text-[10px] text-white/30">Recommended size: 400x400px</p>
    </div>
  </div>
)

// Bookings Section Component
const BookingsSection: React.FC<{
  bookings: BookingRow[]
  bookingsLoading: boolean
  openBooking: (pkg: string) => void
}> = ({ bookings, bookingsLoading, openBooking }) => (
  <div className="space-y-6">
    <div>
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold font-heading text-white">My Bookings</h2>
        {bookings.length === 0 ? (
          <button
            onClick={() => openBooking('')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-all"
          >
            <CalendarDays size={16} />
            Book a Meeting
          </button>
        ) : (
          <button
            onClick={() => openBooking('')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all"
          >
            <RotateCcw size={16} />
            Re-book
          </button>
        )}
      </div>
      {bookingsLoading && (
        <div className="p-8 glass-panel flex items-center gap-3 text-white/40">
          <span className="w-4 h-4 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
          <span className="text-sm">Loading your bookingsâ€¦</span>
        </div>
      )}

      {!bookingsLoading && bookings.length === 0 && (
        <div className="p-10 glass-panel text-center">
          <CalendarDays className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/35">No bookings yet.</p>
        </div>
      )}

      {!bookingsLoading && bookings.length > 0 && (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="glass-panel p-5 space-y-3 hover:border-white/20 transition-colors">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30 mb-0.5">Strategy Call</p>
                  <p className="font-heading font-bold text-white/90">{b.project_type || 'General Enquiry'}</p>
                </div>
                <StatusBadge status={b.status || 'pending'} />
              </div>

              <div className="flex flex-wrap gap-3">
                {b.meeting_date && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/50">
                    <CalendarDays size={11} className="text-white/30" />
                    {new Date(b.meeting_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {b.meeting_time && <> Â· {b.meeting_time}</>}
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
          ))}
        </div>
      )}
    </div>
  </div>
)

// Projects Section Component
const ProjectsSection: React.FC<{
  projects: ProjectWithUpdates[]
  projectsLoading: boolean
}> = ({ projects, projectsLoading }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold font-heading text-white mb-4">My Projects</h2>
      {projectsLoading && (
        <div className="p-8 glass-panel flex items-center gap-3 text-white/40">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading projectsâ€¦</span>
        </div>
      )}

      {!projectsLoading && projects.length === 0 && (
        <div className="p-10 glass-panel text-center">
          <p className="text-sm text-white/35">No active projects yet.</p>
        </div>
      )}

      {!projectsLoading && projects.length > 0 && (
        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p.id} className="glass-panel p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30 mb-0.5">Project</p>
                  <p className="font-heading font-bold text-white/90">{p.title}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              {p.description && <p className="text-sm text-white/50">{p.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)

// Accounts Section Component
const AccountsSection: React.FC<any> = ({
  user,
  updating,
  newPassword,
  setNewPassword,
  showPassword,
  setShowPassword,
  onChangePassword,
  newEmail,
  setNewEmail,
  onChangeEmail,
  clientStatus,
  chatMessages,
  chatInput,
  setChatInput,
  chatSending,
  onSendMessage,
  chatEndRef,
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Account Settings */}
    <div className="lg:col-span-2 space-y-6">
      {/* Email */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Mail className="w-5 h-5 text-red-400" />
          Email
        </h3>
        <p className="text-sm text-white/50">{user?.email}</p>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="New email address"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30"
        />
        <button
          onClick={onChangeEmail}
          disabled={updating || !newEmail}
          className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-sm uppercase transition-all disabled:opacity-50"
        >
          {updating ? 'Updating...' : 'Change Email'}
        </button>
      </div>

      {/* Password */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-red-400" />
          Password
        </h3>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 pr-10"
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={onChangePassword}
          disabled={updating || !newPassword}
          className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-sm uppercase transition-all disabled:opacity-50"
        >
          {updating ? 'Updating...' : 'Change Password'}
        </button>
      </div>
    </div>

    {/* Chat with Admin */}
    {(clientStatus === 'follow_up' || clientStatus === 'onboarded') && (
      <div className="glass-panel p-6 rounded-2xl flex flex-col h-[600px]">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold">Chat with Admin</h3>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 mb-4 pr-2" style={{ scrollbarWidth: 'thin' }}>
          {chatMessages.map((msg: any) => (
            <div key={msg.id} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  msg.sender_type === 'user'
                    ? 'bg-red-600 text-white'
                    : 'bg-white/10 text-white/70'
                }`}
              >
                {msg.message}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !chatSending && onSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-red-600/50"
          />
          <button
            onClick={onSendMessage}
            disabled={chatSending || !chatInput.trim()}
            className="p-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all disabled:opacity-50"
          >
            {chatSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    )}
  </div>
)

export default Dashboard
