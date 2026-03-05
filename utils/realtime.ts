// utils/realtime.ts — Supabase realtime replaced with no-op stub.
// Real-time updates can be implemented via SSE or polling from the backend when available.

export function subscribeToTable<T = any>(
  _table: string,
  _onInsert?: (payload: T) => void,
  _onUpdate?: (payload: T) => void,
  _onDelete?: (payload: { id: string }) => void
): () => void {
  // No-op: backend does not yet expose WebSocket/SSE channels.
  // Components should re-fetch data manually on user actions.
  return () => {};
}

