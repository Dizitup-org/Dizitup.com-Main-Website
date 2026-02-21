import { supabase } from './supabaseClient'

export function subscribeToTable<T = any>(
  table: string, 
  onInsert?: (payload: T) => void, 
  onUpdate?: (payload: T) => void,
  onDelete?: (payload: { id: string }) => void
) {
  const channel = supabase.channel(`realtime:${table}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table }, (payload) => {
      onInsert?.(payload.new as T)
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table }, (payload) => {
      onUpdate?.(payload.new as T)
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table }, (payload) => {
      onDelete?.(payload.old as { id: string })
    })
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
