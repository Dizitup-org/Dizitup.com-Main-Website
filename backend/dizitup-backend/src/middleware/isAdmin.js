// src/middleware/isAdmin.js
// ============================================================
// ADMIN ROUTE PROTECTION MIDDLEWARE
// ============================================================
// Always use AFTER protect middleware, never standalone.
// Usage:  router.get('/admin/overview', protect, isAdmin, handler)
//
// Logic: checks if the authenticated user has a row in
//        the admins table. If not → 403 Forbidden.
// ============================================================

const db = require('../db');
const { AppError } = require('../utils/errors');

const isAdmin = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, role FROM admins WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Access denied. Admins only.', 403);
    }

    // Attach admin role to request
    req.admin = result.rows[0];
    next();

  } catch (err) {
    next(err);
  }
};

module.exports = { isAdmin };
