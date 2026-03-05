import QRCode from 'qrcode'
import { getToken } from './apiClient'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function generateAndStoreUserQr(userId: string): Promise<string> {
  const content = JSON.stringify({ uid: userId, ts: Date.now() })
  const dataUrl = await QRCode.toDataURL(content, { errorCorrectionLevel: 'M', margin: 1, width: 512 })
  const res = await fetch(dataUrl)
  const blob = await res.blob()

  const formData = new FormData()
  formData.append('qr', blob, 'qr.png')
  formData.append('user_id', userId)

  const token = getToken()
  const uploadRes = await fetch(`${BASE_URL}/api/user/qr`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  const json = await uploadRes.json()
  if (!uploadRes.ok) throw new Error(json.error || 'QR upload failed')
  return json.url
}
