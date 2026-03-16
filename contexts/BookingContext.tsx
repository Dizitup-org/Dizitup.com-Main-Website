
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Country } from '../components/PersonalizationFlow';
import { useAuth } from './AuthProvider';
import { getToken } from '../utils/apiClient';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface BookingContextValue {
  isOpen: boolean;
  packageName: string;
  country: Country;
  openBooking: (packageName?: string) => void;
  closeBooking: () => void;
  setCountry: (c: Country) => void;
  // Auth gate
  authPromptOpen: boolean;
  closeAuthPrompt: () => void;
  pendingPackage: string;
  onBookingLoginSuccess: () => void;
  // Client-status gate
  contactAdminOpen: boolean;
  closeContactAdmin: () => void;
  showAdminChat: boolean;
  // Chat control (ContactAdminModal → ChatWidget)
  chatForceOpen: boolean;
  clearChatForceOpen: () => void;
  openAdminChat: () => void;
}

const BookingContext = createContext<BookingContextValue>({
  isOpen: false,
  packageName: '',
  country: 'Other',
  openBooking: () => {},
  closeBooking: () => {},
  setCountry: () => {},
  authPromptOpen: false,
  closeAuthPrompt: () => {},
  pendingPackage: '',
  onBookingLoginSuccess: () => {},
  contactAdminOpen: false,
  closeContactAdmin: () => {},
  showAdminChat: false,
  chatForceOpen: false,
  clearChatForceOpen: () => {},
  openAdminChat: () => {},
});

export const useBooking = () => useContext(BookingContext);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [packageName, setPackageName] = useState('');
  const [country, setCountry] = useState<Country>('Other');

  // Auth gate
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [pendingPackage, setPendingPackage] = useState('');

  // Client-status gates
  const [contactAdminOpen, setContactAdminOpen] = useState(false);
  const [showAdminChat, setShowAdminChat] = useState(false);

  // Chat control
  const [chatForceOpen, setChatForceOpen] = useState(false);

  // Set when user needs to reopen booking after login
  const [openAfterLogin, setOpenAfterLogin] = useState<string | null>(null);

  // Check client status, then open the correct gate
  const doStatusCheckAndOpen = useCallback(async (pkg: string) => {
    try {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/api/user/client-status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      const status: string = data.clientStatus ?? 'none';

      if (status === 'onboarded') {
        setContactAdminOpen(true);
        return;
      }
      if (status === 'follow_up') {
        setShowAdminChat(true);
        setPackageName(pkg);
        setIsOpen(true);
        return;
      }
    } catch {
      // On status check error, fall through to normal booking
    }
    setShowAdminChat(false);
    setPackageName(pkg);
    setIsOpen(true);
  }, []);

  // After login: when `user` becomes truthy, fire the pending open
  useEffect(() => {
    if (user && openAfterLogin !== null) {
      const pkg = openAfterLogin;
      setOpenAfterLogin(null);
      setAuthPromptOpen(false);
      doStatusCheckAndOpen(pkg);
    }
  }, [user, openAfterLogin, doStatusCheckAndOpen]);

  const openBooking = useCallback((pkg?: string) => {
    if (!user) {
      setPendingPackage(pkg ?? '');
      setAuthPromptOpen(true);
      return;
    }
    doStatusCheckAndOpen(pkg ?? '');
  }, [user, doStatusCheckAndOpen]);

  const closeBooking = useCallback(() => {
    setIsOpen(false);
    setShowAdminChat(false);
  }, []);

  const closeAuthPrompt = useCallback(() => {
    setAuthPromptOpen(false);
    setPendingPackage('');
  }, []);

  // AuthModal calls this after successful login
  const onBookingLoginSuccess = useCallback(() => {
    setOpenAfterLogin(pendingPackage);
  }, [pendingPackage]);

  const closeContactAdmin = useCallback(() => setContactAdminOpen(false), []);

  const openAdminChat = useCallback(() => {
    setContactAdminOpen(false);
    setChatForceOpen(true);
  }, []);

  const clearChatForceOpen = useCallback(() => setChatForceOpen(false), []);

  return (
    <BookingContext.Provider value={{
      isOpen, packageName, country, openBooking, closeBooking, setCountry,
      authPromptOpen, closeAuthPrompt, pendingPackage, onBookingLoginSuccess,
      contactAdminOpen, closeContactAdmin,
      showAdminChat, chatForceOpen, clearChatForceOpen, openAdminChat,
    }}>
      {children}
    </BookingContext.Provider>
  );
};
