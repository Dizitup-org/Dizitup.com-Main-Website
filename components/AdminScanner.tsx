import React, { useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import { api } from '../utils/apiClient'
import toast from 'react-hot-toast'

const AdminScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [scanner, setScanner] = useState<QrScanner | null>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!videoRef.current) return
    const s = new QrScanner(videoRef.current, async (res) => {
      try {
        const payload = JSON.parse(res)
        const uid = String(payload.uid)
        const scanDate = new Date().toISOString().slice(0, 10)
        await api.post('/api/admin/attendance', {
          user_id: uid,
          scan_date: scanDate,
          scanned_at: new Date().toISOString(),
        })
        toast.success(`Attendance recorded for ${uid}`)
      } catch (e: any) {
        toast.error(e?.message || 'Scan error')
      }
    })
    setScanner(s)
    return () => {
      s.destroy()
    }
  }, [])

  const start = async () => {
    if (!scanner) return
    await scanner.start()
    setActive(true)
  }

  const stop = async () => {
    if (!scanner) return
    await scanner.stop()
    setActive(false)
  }

  return (
    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">QR Scanner</h3>
        {active ? (
          <button onClick={stop} className="px-3 py-1 bg-white/5 border border-white/10 rounded-xl">Stop</button>
        ) : (
          <button onClick={start} className="px-3 py-1 bg-red-600 rounded-xl">Start</button>
        )}
      </div>
      <video ref={videoRef} className="w-full rounded-xl" />
    </div>
  )
}

export default AdminScanner
