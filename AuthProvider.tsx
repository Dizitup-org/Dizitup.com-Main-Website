import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken, removeToken } from '../utils/apiClient';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export type AuthUser = {
  id: string; email: string; username: string;
  first_name: string; last_name: string;
  phone?: string; business_name?: string;
  isAdmin: boolean; adminRole?: string;
  avatar_url?: string; joined_at?: string; credits?: number;
};

type AuthContextValue = {
  user: AuthUser | null; loading: boolean; isAdmin: boolean; profile: AuthUser | null;
  signUp: (data: { email: string; password: string; username: string; first_name: string; last_name: string; phone?: string; business_name?: string; }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  resetPassword: (email: string) => Promise<void>;
  upsertProfile: (data: { first_name?: string; last_name?: string; username?: string; business_name?: string; phone?: string }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    console.log('🔄 AuthProvider initialization - token found:', token ? 'YES' : 'NO');
    
    if (!token) { 
      console.log('❌ No token found, user not authenticated');
      setLoading(false); 
      return; 
    }
    
    console.log('🔍 Verifying token with backend...');
    api.get<{ success: boolean; user: AuthUser }>('/api/user/me')
      .then((response) => {
        console.log('✅ Token verification successful:', response);
        if (response.success && response.user) {
          setUser(response.user);
          console.log('📝 User restored from token:', { email: response.user.email, isAdmin: response.user.isAdmin });
        } else {
          console.log('❌ Invalid response format, removing token');
          removeToken();
          setUser(null);
        }
      })
      .catch((error) => {
        console.error('❌ Token verification failed:', error);
        console.log('🗑️ Removing invalid token');
        removeToken();
        setUser(null);
      })
      .finally(() => {
        console.log('✅ Auth initialization complete');
        setLoading(false);
      });
  }, []);

  const signUp = async (data: Parameters<AuthContextValue['signUp']>[0]) => {
    const res = await api.post<{ token: string; user: AuthUser }>('/api/auth/signup', data);
    setToken(res.token); setUser(res.user);
  };
  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting admin login with:', { email, password: '***' });
    
    try {
      const res = await api.post<{ token: string; user: AuthUser }>(
        '/api/auth/login',
        { email, password }
      );

      console.log('✅ LOGIN RESPONSE:', res);
      console.log('🎫 Token received:', res.token ? 'YES' : 'NO');
      console.log('👤 User object:', res.user);
      console.log('🔑 isAdmin flag:', res.user?.isAdmin);

      // Validate response
      if (!res.token || !res.user) {
        throw new Error('Invalid response from server - missing token or user');
      }

      // Save token using utility function
      setToken(res.token);
      console.log('💾 Token saved to localStorage:', localStorage.getItem('dizitup_token') ? 'SUCCESS' : 'FAILED');

      // Update user state
      setUser(res.user);
      console.log('📝 User state updated:', res.user);
      console.log('🎯 Auth context will show isAdmin:', res.user?.isAdmin);

    } catch (error: any) {
      console.error('❌ Login failed:', error);
      removeToken(); // Clear any existing token
      setUser(null); // Clear user state
      throw new Error(error?.message || 'Login failed. Please check your credentials.');
    }
  };

  const signOut = () => { removeToken(); setUser(null); };

  const resetPassword = async (email: string) => {
    await api.post('/api/auth/reset-password', { email });
  };

  const upsertProfile = async (data: { first_name?: string; last_name?: string; username?: string; business_name?: string; phone?: string }) => {
    const res = await api.patch<{ user: AuthUser }>('/api/user/profile', data);
    if (res.user) setUser(res.user);
  };

  const uploadAvatar = async (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await fetch(`${BASE_URL}/api/user/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Avatar upload failed');
    if (data.user) setUser(data.user);
    else if (data.avatar_url && user) setUser({ ...user, avatar_url: data.avatar_url });
  };

  const changePassword = async (newPassword: string) => {
    await api.post('/api/user/change-password', { password: newPassword });
  };

  const updateEmail = async (newEmail: string) => {
    const res = await api.patch<{ user: AuthUser }>('/api/user/email', { email: newEmail });
    if (res.user) setUser(res.user);
  };

  const value = useMemo<AuthContextValue>(() => {
    const computedIsAdmin = user?.isAdmin ?? false;
    console.log('🔄 Auth context value computed:', { 
      hasUser: !!user, 
      userEmail: user?.email,
      userIsAdmin: user?.isAdmin, 
      computedIsAdmin,
      loading,
      tokenExists: !!getToken()
    });
    return {
      user, loading, isAdmin: computedIsAdmin, profile: user,
      signUp, signIn, signOut, resetPassword, upsertProfile, uploadAvatar, changePassword, updateEmail,
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};