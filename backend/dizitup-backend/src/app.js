// src/app.js
// ============================================================
// MAIN SERVER FILE
// ============================================================
// This is where everything connects:
//   - Express app is created
//   - Middleware is registered (CORS, JSON parsing)
//   - All routes are mounted at their URL prefixes
//   - Error handler is registered last
//
// HOW MIDDLEWARE WORKS:
//   Express processes each request through a chain of functions.
//   Each function can modify req/res or call next() to continue.
//   Order matters — register middleware BEFORE routes.
// ============================================================

require('dotenv').config(); // Load .env variables FIRST

const express = require('express');
const cors    = require('cors');

// Route files
const authRoutes            = require('./routes/auth');
const userRoutes            = require('./routes/user');
const visitorProfileRoutes  = require('./routes/visitorProfile');
const visitorLeadRoutes     = require('./routes/visitorLeads');
const publicBookingRoutes   = require('./routes/bookings');
const overviewRoutes        = require('./routes/admin/overview');
const bookingRoutes         = require('./routes/admin/bookings');
const clientRoutes          = require('./routes/admin/clients');
const salesRoutes           = require('./routes/admin/sales');
const portfolioRoutes       = require('./routes/admin/portfolio');
const projectsRoutes        = require('./routes/admin/projects');
const adminUserRoutes       = require('./routes/admin/users');

// Middleware
const { protect } = require('./middleware/auth');
const { isAdmin } = require('./middleware/isAdmin');
const { errorHandler } = require('./utils/errors');

const app = express();

// ============================================================
// GLOBAL MIDDLEWARE
// ============================================================

// CORS — Allow your frontend to call this backend
// In production: replace '*' with your actual frontend URL
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse incoming JSON request bodies
// Without this, req.body is undefined
app.use(express.json());

// Log every request in development (helpful for debugging)
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ============================================================
// ROUTES
// ============================================================

// Health check — useful to confirm server is running
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes (no login required)
app.use('/api/auth',            authRoutes);
app.use('/api/visitor-profile', visitorProfileRoutes);
app.use('/api/visitor-leads',   visitorLeadRoutes);
app.use('/api/bookings',        publicBookingRoutes);
app.use('/api/portfolio',       portfolioRoutes); // public GET for frontend display

// User routes (login required — protect applied inside user.js)
app.use('/api/user', userRoutes);

// ============================================================
// ADMIN ROUTES
// ============================================================
// protect  → verifies JWT
// isAdmin  → checks admins table
// Both must pass for admin routes to be accessible
// ============================================================
// DEV ONLY: Authentication temporarily disabled for admin routes
// Re-enable protect + isAdmin once full workflow is confirmed working:
//   app.use('/api/admin/overview',  protect, isAdmin, overviewRoutes);
//   app.use('/api/admin/bookings',  protect, isAdmin, bookingRoutes);
//   app.use('/api/admin/clients',   protect, isAdmin, clientRoutes);
//   app.use('/api/admin/sales',     protect, isAdmin, salesRoutes);
//   app.use('/api/admin/portfolio', protect, isAdmin, portfolioRoutes);
app.use('/api/admin/overview',  overviewRoutes);
app.use('/api/admin/bookings',  bookingRoutes);
app.use('/api/admin/clients',   clientRoutes);
app.use('/api/admin/sales',     salesRoutes);
app.use('/api/admin/portfolio', portfolioRoutes); // admin management
app.use('/api/admin/projects',  projectsRoutes);
app.use('/api/admin/users',     adminUserRoutes);

// ============================================================
// 404 — Route not found
// ============================================================
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

// ============================================================
// CENTRAL ERROR HANDLER — must be LAST
// ============================================================
app.use(errorHandler);

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`🚀 Dizitup backend running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);

  // Ensure admin account exists on every startup
  const seedAdmin = require('./utils/seedAdmin');
  await seedAdmin();
});

module.exports = app;
