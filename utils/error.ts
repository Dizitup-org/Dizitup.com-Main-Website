export function handleSupabaseError(err: any, context?: string) {
  const message = err?.message || 'Unexpected error'
  const code = err?.code
  // Log minimal details for dev; avoid leaking sensitive info
  console.error('[SupabaseError]', { context, code, message })
  return message
}
