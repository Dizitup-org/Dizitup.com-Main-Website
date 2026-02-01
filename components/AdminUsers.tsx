import React, { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'

type ProfileRow = {
  id: string
  email?: string
  first_name?: string
  last_name?: string
  username?: string
  business_name?: string
  phone?: string
  joined_at?: string
}

const AdminUsers: React.FC = () => {
  const [rows, setRows] = useState<ProfileRow[]>([])
  const [count, setCount] = useState<number>(0)
  useEffect(() => {
    const fetch = async () => {
      // Requires RLS policy allowing admins to select all profiles
      const { data } = await supabase
        .from('profiles')
        .select('id,email,first_name,last_name,username,business_name,phone,joined_at', { count: 'exact' })
        .order('joined_at', { ascending: false })
        .limit(10)
      setRows(data || [])
      // Count will be available via header if policy allows; fallback to rows length
      setCount((data as any)?.length ?? rows.length)
    }
    fetch()
  }, [])

  return (
    <div className="p-8 rounded-[3rem] bg-white/[0.02] border border-white/10">
      <h4 className="text-sm font-black uppercase tracking-widest text-white/60 mb-6">Users</h4>
      <p className="text-[10px] font-mono text-white/40 mb-4">Recent signups (showing up to 10)</p>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/10">
            <div>
              <p className="font-bold text-sm">{r.first_name} {r.last_name} <span className="text-white/40">@{r.username}</span></p>
              <p className="text-[10px] font-mono text-white/40">{r.email} • {r.business_name}</p>
            </div>
            <div className="text-[10px] text-white/30 font-mono">{r.joined_at ? new Date(r.joined_at).toLocaleDateString() : '—'}</div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-white/40">No users to display (check RLS policies for admin read access).</p>
        )}
      </div>
    </div>
  )
}

export default AdminUsers
