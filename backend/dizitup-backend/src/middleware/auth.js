// src/middleware/auth.js
// ============================================================
// JWT AUTHENTICATION MIDDLEWARE
// ============================================================
// HOW JWT WORKS:
//   1. User logs in → backend creates a signed token containing
//      their user_id and sends it back.
//   2. Frontend stores the token (localStorage or cookie).
//   3. Frontend sends it in every request header:
//      Authorization: Bearer eyJhbGci...
//   4. This middleware reads the header, verifies the token,
//      and attaches the user data to req.user.
//   5. If token is missing or invalid → 401 Unauthorized.
//
// USAGE IN ROUTES:
//   router.get('/me', protect, (req, res) => {
//     // req.user.id is available here
//   });
// ============================================================

const jwt = require('jsonwebtoken');
const db = require('../db');
const { AppError } = require('../utils/errors');

const protect = async (req, res, next) => {
  try {
    // 1. Check the Authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Not authenticated. Please log in.', 401);
    }

    // 2. Extract the token (remove "Bearer " prefix)
    const token = authHeader.split(' ')[1];

    // 3. Verify and decode the token
    //    jwt.verify throws if expired or tampered with
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Check the user still exists in the database
    //    (handles case where account was deleted after token issued)
    const result = await db.query(
      'SELECT id, username, email, first_name, last_name FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User no longer exists.', 401);
    }

    // 5. Attach user to the request object
    req.user = result.rows[0];
    next(); // pass control to the actual route handler

  } catch (err) {
    // jwt.verify throws JsonWebTokenError or TokenExpiredError
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Session expired. Please log in again.', 401));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    next(err);
  }
};

module.exports = { protect };
