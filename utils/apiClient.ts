// utils/apiClient.ts — replaces supabaseClient.ts
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function getToken(): string | null { return localStorage.getItem('dizitup_token'); }
export function setToken(token: string) { 
  localStorage.setItem('dizitup_token', token);
  console.log('💾 Token saved to localStorage:', token.substring(0, 20) + '...');
}
export function removeToken() { 
  localStorage.removeItem('dizitup_token');
  console.log('🗑️ Token removed from localStorage');
}

// Test if current token is valid
export async function validateToken(): Promise<boolean> {
  const token = getToken();
  if (!token) {
    console.log('❌ No token found for validation');
    return false;
  }
  
  try {
    const response = await fetch(`${BASE_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const isValid = response.ok;
    console.log('🔍 Token validation result:', isValid);
    return isValid;
  } catch (error) {
    console.error('❌ Token validation failed:', error);
    return false;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Always get fresh token from localStorage for each request
  const token = getToken();
  console.log(`🔄 API Request: ${options.method || 'GET'} ${BASE_URL}${path}`);
  console.log(`🎫 Token found: ${token ? 'YES' : 'NO'}`);
  if (token) console.log(`🔑 Authorization header: Bearer ${token.substring(0, 20)}...`);
  
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  });
  
  // Always add Authorization header if token exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    console.log('✅ Authorization header set successfully');
  } else {
    console.log('⚠️ No token available for Authorization header');
  }
  
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });
  
  const data = await res.json();
  console.log(`📡 API Response: ${res.status}`, data);
  
  if (!res.ok) {
    console.error(`❌ API Error: ${res.status}`, data);
    if (res.status === 401) {
      console.log('🚨 Unauthorized - token may be invalid or expired');
      // Don't auto-remove token here, let the auth provider handle it
    }
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data as T;
}

export const api = {
  get:    <T>(path: string)                  => request<T>(path, { method: 'GET' }),
  post:   <T>(path: string, body: unknown)   => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown)   => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown)   => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: <T>(path: string)                  => request<T>(path, { method: 'DELETE' }),
};