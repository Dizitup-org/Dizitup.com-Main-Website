import QRCode from 'qrcode'
import { supabase } from './supabaseClient'

export async function generateAndStoreUserQr(userId: string): Promise<string> {
  const content = JSON.stringify({ uid: userId, ts: Date.now() })
  const dataUrl = await QRCode.toDataURL(content, { errorCorrectionLevel: 'M', margin: 1, width: 512 })
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  const path = `${userId}/qr.png`
  const { error } = await supabase.storage.from('qr_codes').upload(path, blob, { upsert: true, contentType: 'image/png' })
  if (error) throw error
  const { data } = await supabase.storage.from('qr_codes').getPublicUrl(path)
  return data.publicUrl
}
