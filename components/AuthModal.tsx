import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthModal: React.FC<{ open: boolean; onClose: () => void; onLoginSuccess?: () => void }> = ({ open, onClose }) => {
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      onClose()
      navigate('/login')
    }
  }, [open, navigate, onClose])

  return null
}

export default AuthModal
