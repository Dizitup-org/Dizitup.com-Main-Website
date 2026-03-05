import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthProvider'
import { api } from '../utils/apiClient'
import toast, { Toaster } from 'react-hot-toast'

type Project = { id: string; name: string; status: string }
type Attendance = { last_scan?: string; total_days?: number }

const Dashboard: React.FC = () => {
  const { user, profile, upsertProfile, uploadAvatar, signOut, changePassword, updateEmail } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [attendance, setAttendance] = useState<Attendance | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      try {
        const projRes = await api.get<{ projects: Project[] }>('/api/user/projects')
        setProjects(projRes.projects || [])
      } catch { setProjects([]) }

      try {
        const attRes = await api.get<{ last_scan?: string; total_days?: number }>('/api/user/attendance')
        setAttendance(attRes || null)
      } catch { setAttendance(null) }
    }
    fetchData()
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
    try {
      await uploadAvatar(file)
      toast.success('Avatar uploaded')
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed')
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Toaster position="top-right" />
      <main className="container mx-auto px-6 pt-24 pb-24">
        <h1 className="text-4xl font-heading font-bold mb-8">Dashboard</h1>

        <section className="grid md:grid-cols-3 gap-8">
          <div className="p-6 glass-panel">
            <h2 className="text-xl font-bold mb-4">Profile</h2>
            <form onSubmit={handleProfileSave} className="space-y-3">
              <input name="first_name" defaultValue={profile?.first_name || ''} className="w-full glass-input px-4 py-3" placeholder="First name" />
              <input name="last_name" defaultValue={profile?.last_name || ''} className="w-full glass-input px-4 py-3" placeholder="Last name" />
              <input name="username" defaultValue={profile?.username || ''} className="w-full glass-input px-4 py-3" placeholder="Username" />
              <input name="business_name" defaultValue={profile?.business_name || ''} className="w-full glass-input px-4 py-3" placeholder="Business name" />
              <input name="phone" defaultValue={profile?.phone || ''} className="w-full glass-input px-4 py-3" placeholder="Phone (optional)" />
              <button disabled={updating} className="w-full premium-btn font-bold">Save</button>
            </form>
          </div>

          <div className="p-6 glass-panel">
            <h2 className="text-xl font-bold mb-4">Avatar</h2>
            {profile?.avatar_url && (
              <img src={profile.avatar_url} alt="avatar" className="w-24 h-24 rounded-xl mb-3 object-cover" />
            )}
            <input type="file" accept="image/*" onChange={handleAvatarUpload} />
            <p className="text-xs text-white/40 mt-2">Uses buckets: avatars/ with path id/filename, validated + compressed.</p>
          </div>

          <div className="p-6 glass-panel">
            <h2 className="text-xl font-bold mb-4">Account</h2>
            <p className="text-sm text-white/60 mb-2">Joined: {profile?.joined_at ? new Date(profile.joined_at).toLocaleDateString() : '—'}</p>
            <p className="text-sm text-white/60 mb-2">Email: {profile?.email ?? user?.email ?? '—'}</p>
            <p className="text-sm text-white/60 mb-2">Credits: {profile?.credits ?? '—'}</p>
            <div className="space-y-2 mt-2">
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full glass-input px-3 py-2"
              />
              <input
                type="email"
                placeholder="New email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full glass-input px-3 py-2"
              />
              <div className="flex gap-2">
                <button onClick={async () => { try { await changePassword(newPassword); toast.success('Password updated'); setNewPassword('') } catch (e: any) { toast.error(e?.message || 'Update failed') } }} className="premium-btn">Change Password</button>
                <button onClick={async () => { try { await updateEmail(newEmail); toast.success('Email updated'); setNewEmail('') } catch (e: any) { toast.error(e?.message || 'Update failed') } }} className="premium-btn">Change Email</button>
                <button onClick={() => signOut()} className="premium-btn">Logout</button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 p-6 premium-card">
          <h2 className="text-xl font-bold mb-4">Projects</h2>
          <div className="space-y-2">
            {projects.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 glass-panel">
                <span>{p.name}</span>
                <span className="text-xs text-white/60">{p.status}</span>
              </div>
            ))}
            {projects.length === 0 && <p className="text-sm text-white/40">No projects yet.</p>}
          </div>
        </section>

        <section className="mt-10 p-6 premium-card">
          <h2 className="text-xl font-bold mb-4">Attendance</h2>
          <p className="text-sm text-white/60">Last scan: {attendance?.last_scan ? new Date(attendance.last_scan).toLocaleString() : '—'}</p>
          <p className="text-sm text-white/60">Total days: {attendance?.total_days ?? 0}</p>
        </section>
      </main>
    </div>
  )
}

export default Dashboard
