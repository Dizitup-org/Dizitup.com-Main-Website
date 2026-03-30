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
const adminUserRoutes       = require('./routes/admin/users');
const salesRoutes           = require('./routes/admin/sales');
const portfolioRoutes       = require('./routes/admin/portfolio');
const projectsRoutes        = require('./routes/admin/projects');
const chatRoutes            = require('./routes/chat');
const adminChatRoutes       = require('./routes/admin/chat');
const managerRoutes         = require('./routes/manager/index');
const employeeRoutes        = require('./routes/employee/index');
const staffChatRoutes       = require('./routes/staff-chat');
const adminDocsRoutes       = require('./routes/admin/docs');
const managerDocsRoutes     = require('./routes/manager/docs');
const employeeDocsRoutes    = require('./routes/employee/docs');

// Middleware
const { protect } = require('./middleware/auth');
const { isAdmin } = require('./middleware/isAdmin');
const requireRole = require('./middleware/requireRole');
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
// limit increased to 50mb to handle base64-encoded images
app.use(express.json({ limit: '50mb' }));

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
// requireRole → checks specific role(s)
// All three must pass for admin routes to be accessible
// ============================================================
app.use('/api/admin/overview',  protect, isAdmin, requireRole('admin'), overviewRoutes);
app.use('/api/admin/bookings',  protect, isAdmin, requireRole('admin'), bookingRoutes);
app.use('/api/admin/users',     protect, isAdmin, requireRole('admin'), adminUserRoutes);
app.use('/api/admin/clients',   protect, isAdmin, requireRole('admin'), clientRoutes);
app.use('/api/admin/sales',     protect, isAdmin, requireRole('admin'), salesRoutes);
app.use('/api/admin/portfolio', protect, isAdmin, requireRole('admin'), portfolioRoutes); // admin management
app.use('/api/admin/projects',  protect, isAdmin, requireRole('admin'), projectsRoutes);
app.use('/api/admin/chat',      protect, isAdmin, requireRole('admin'), adminChatRoutes);

// ============================================================
// MANAGER ROUTES — accessible by admin + manager
// ============================================================
app.use('/api/manager', protect, isAdmin, requireRole('admin', 'manager'), managerRoutes);

// ============================================================
// EMPLOYEE ROUTES — accessible by admin + manager + employee
// ============================================================
app.use('/api/employee', protect, isAdmin, requireRole('admin', 'manager', 'employee'), employeeRoutes);

// ============================================================
// STAFF CHANNEL CHAT — accessible by admin + manager + employee
// ============================================================
app.use('/api/staff/chat', protect, isAdmin, requireRole('admin', 'manager', 'employee'), staffChatRoutes);

// ============================================================
// DOCS ROUTES — official document chain (admin→manager→employee)
// ============================================================
app.use('/api/admin/docs',    protect, isAdmin, requireRole('admin'), adminDocsRoutes);
app.use('/api/manager/docs',  protect, isAdmin, requireRole('admin', 'manager'), managerDocsRoutes);
app.use('/api/employee/docs', protect, isAdmin, requireRole('admin', 'manager', 'employee'), employeeDocsRoutes);

// User chat (protect applied inside chat.js per-route)
app.use('/api/chat',            chatRoutes);

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

