// frontend/lib/api.js
// ============================================================
// FRONTEND API HELPER
// ============================================================
// This file lives in your Next.js project (not the backend).
// It gives you clean functions to call every backend endpoint.
//
// SETUP:
//   1. Create a file: frontend/lib/api.js
//   2. Add to your .env.local:
//      NEXT_PUBLIC_API_URL=http://localhost:4000
//
// USAGE EXAMPLE:
//   import api from '@/lib/api'
//
//   // In a component or page:
//   const { user, projects } = await api.user.getMe()
// ============================================================

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ----------------------------------------------------------
// Core fetch wrapper
// ----------------------------------------------------------
// Handles: setting Authorization header, parsing JSON,
//          throwing errors with clear messages.
// ----------------------------------------------------------
async function request(method, path, body = null) {
  // Get token from localStorage (set it when user logs in)
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('dizitup_token')
    : null;

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      // Only add Authorization if we have a token
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();

  // If server returned an error, throw it so .catch() works
  if (!data.success && !res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// Shorthand helpers
const get    = (path)        => request('GET',    path);
const post   = (path, body)  => request('POST',   path, body);
const put    = (path, body)  => request('PUT',    path, body);
const patch  = (path, body)  => request('PATCH',  path, body);
const del    = (path)        => request('DELETE', path);


// ----------------------------------------------------------
// AUTH HELPERS
// ----------------------------------------------------------
const auth = {
  signup: (data)  => post('/api/auth/signup', data),
  login:  (data)  => post('/api/auth/login',  data),

  // Call after login to store the token
  saveToken: (token) => localStorage.setItem('dizitup_token', token),
  clearToken: ()     => localStorage.removeItem('dizitup_token'),
  getToken:   ()     => localStorage.getItem('dizitup_token'),
};


// ----------------------------------------------------------
// USER HELPERS
// ----------------------------------------------------------
const user = {
  getMe:           ()     => get('/api/user/me'),
  getBookings:     ()     => get('/api/user/bookings'),
  getProjects:     ()     => get('/api/user/projects'),
  updateProfile:   (data) => put('/api/user/update-profile', data),
  changeUsername:  (data) => put('/api/user/change-username', data),
};


// ----------------------------------------------------------
// ADMIN HELPERS
// ----------------------------------------------------------
const admin = {
  // Overview
  getOverview:      ()       => get('/api/admin/overview'),
  getMonthlyRevenue:()       => get('/api/admin/overview/monthly'),

  // Bookings
  getBookings:      (status) => get(`/api/admin/bookings${status ? `?status=${status}` : ''}`),
  getBooking:       (id)     => get(`/api/admin/bookings/${id}`),
  updateStatus:     (id, status) => patch(`/api/admin/bookings/${id}/status`, { status }),
  onboardClient:    (id, data)   => post(`/api/admin/bookings/${id}/onboard`, data),

  // Clients
  getQueryClients:     ()   => get('/api/admin/clients/query'),
  getOnboardedClients: ()   => get('/api/admin/clients/onboarded'),
  getClient:           (id) => get(`/api/admin/clients/${id}`),
  addProject:          (clientId, data)           => post(`/api/admin/clients/${clientId}/projects`, data),
  addPayment:          (clientId, projectId, data) => post(`/api/admin/clients/${clientId}/projects/${projectId}/payments`, data),

  // Sales
  getSales: () => get('/api/admin/sales'),

  // Portfolio
  getPortfolio:     ()        => get('/api/admin/portfolio'),
  addPortfolioItem: (data)    => post('/api/admin/portfolio', data),
  updatePortfolio:  (id,data) => put(`/api/admin/portfolio/${id}`, data),
  deletePortfolio:  (id)      => del(`/api/admin/portfolio/${id}`),
};


// ----------------------------------------------------------
// EXAMPLE: Login flow in a Next.js component
// ----------------------------------------------------------
/*
  import api from '@/lib/api'
  import { useRouter } from 'next/navigation'

  export default function LoginPage() {
    const router = useRouter()

    async function handleLogin(e) {
      e.preventDefault()
      try {
        const res = await api.auth.login({
          email: e.target.email.value,
          password: e.target.password.value,
        })

        // Save token to localStorage
        api.auth.saveToken(res.token)

        // Redirect based on role
        if (res.user.isAdmin) {
          router.push('/admin/dashboard')
        } else {
          router.push('/dashboard')
        }
      } catch (err) {
        alert(err.message) // show error to user
      }
    }

    return (
      <form onSubmit={handleLogin}>
        <input name="email" type="email" />
        <input name="password" type="password" />
        <button type="submit">Login</button>
      </form>
    )
  }
*/

const api = { auth, user, admin };
export default api;
