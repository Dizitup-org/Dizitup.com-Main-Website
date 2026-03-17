// src/middleware/requireRole.js
// ============================================================
// ROLE-BASED ACCESS CONTROL MIDDLEWARE
// ============================================================
// Usage:  requireRole('admin', 'manager')
// Always use AFTER protect + isAdmin middleware.
// Checks req.admin.role against the allowed roles list.
// ============================================================

module.exports = (...roles) => (req, res, next) => {
  if (!req.admin || !roles.includes(req.admin.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }
  next();
};
