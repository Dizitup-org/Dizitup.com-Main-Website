import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthProvider'
import toast, { Toaster } from 'react-hot-toast'
import { api } from '../utils/apiClient'
import type { ProjectRow, ProjectUpdate } from '../types'

type ProjectWithUpdates = ProjectRow & { updates?: ProjectUpdate[] }

const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  active:    { bg: 'bg-green-500/10',  border: 'border-green-500/20',  text: 'text-green-400' },
  completed: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
  paused:    { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' },
  cancelled: { bg: 'bg-red-500/10',    border: 'border-red-500/20',    text: 'text-red-400' },
}

function StatusBadge({ status }: { status: string | null }) {
  const s = statusColors[status || ''] ?? { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/60' }
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.border} ${s.text}`}>
      {status || 'Unknown'}
    </span>
  )
}

const Dashboard: React.FC = () => {
  const { user, profile, upsertProfile, uploadAvatar, signOut, changePassword, updateEmail } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [projects, setProjects] = useState<ProjectWithUpdates[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [showAllProjects, setShowAllProjects] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    let isMounted = true
    const fetchProject = async () => {
      setProjectsLoading(true)
      try {
        const data = await api.get<{ success: boolean; projects: ProjectWithUpdates[] }>('/api/user/my-project')
        if (isMounted) setProjects(data.projects || [])
      } catch {
        // non-fatal — user may not have a project yet
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

        <section className="mt-10 space-y-6">
          <h2 className="text-xl font-bold">My Project</h2>

          {projectsLoading && (
            <div className="p-8 rounded-2xl glass-panel flex items-center gap-3 text-white/60">
              <span className="animate-spin text-lg">↻</span> Loading project…
            </div>
          )}

          {!projectsLoading && projects.length === 0 && (
            <div className="p-8 rounded-2xl glass-panel text-center text-white/40">
              No project assigned yet. Check back soon!
            </div>
          )}

          {!projectsLoading && projects.length > 0 && (() => {
            const latest = projects[0]
            const others = projects.slice(1)
            return (
              <>
                {/* Latest project hero card */}
                <div className="p-6 rounded-2xl premium-card space-y-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="text-2xl font-bold mb-1">{latest.title || 'Untitled Project'}</h3>
                      {latest.description && <p className="text-sm text-white/60">{latest.description}</p>}
                    </div>
                    <StatusBadge status={latest.status} />
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-white/60">
                    {latest.deadline && <span>⏰ Deadline: {new Date(latest.deadline).toLocaleDateString()}</span>}
                    {latest.total_amount != null && <span>💰 Value: ₹{latest.total_amount.toLocaleString()}</span>}
                  </div>

                  {/* Project Updates Feed */}
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Updates from Dizitup</p>
                    {(!latest.updates || latest.updates.length === 0) && (
                      <p className="text-xs text-white/30 italic">No updates yet.</p>
                    )}
                    {(latest.updates || []).map((u) => (
                      <div key={u.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white/80">
                        <p>{u.message}</p>
                        <p className="text-[10px] text-white/30 mt-1">{new Date(u.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Other projects (collapsed) */}
                {others.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowAllProjects((v) => !v)}
                      className="text-sm text-white/50 hover:text-white transition-colors mb-3"
                    >
                      {showAllProjects ? '▲ Hide' : `▼ Show ${others.length} more project${others.length > 1 ? 's' : ''}`}
                    </button>
                    {showAllProjects && (
                      <div className="space-y-3">
                        {others.map((p) => (
                          <div key={p.id} className="p-4 rounded-xl glass-panel flex items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold text-sm">{p.title || 'Untitled'}</p>
                              {p.deadline && <p className="text-xs text-white/40">Deadline: {new Date(p.deadline).toLocaleDateString()}</p>}
                            </div>
                            <StatusBadge status={p.status} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )
          })()}
        </section>

      </main>
    </div>
  )
}

export default Dashboard
