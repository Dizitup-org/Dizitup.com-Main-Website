// src/utils/errors.js
// ============================================================
// CENTRALISED ERROR HANDLING
// ============================================================
// Instead of writing res.status(400).json({ error: '...' })
// everywhere, we throw AppError and one central handler
// catches it and sends the right response.
// ============================================================

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // we caused this on purpose
  }
}

// Express error handler middleware (must have 4 params)
const errorHandler = (err, req, res, next) => {
  // Log full error in development, minimal in production
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 Error:', err);
  } else {
    console.error('🔴 Error:', err.message);
  }

  // Known operational errors (our own AppError)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // PostgreSQL unique violation (duplicate email/username)
  if (err.code === '23505') {
    const field = err.detail?.match(/\((.+?)\)/)?.[1] || 'field';
    return res.status(409).json({
      success: false,
      error: `${field} already exists.`,
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Referenced record does not exist.',
    });
  }

  // Unknown errors — don't leak internals to client
  res.status(500).json({
    success: false,
    error: 'Something went wrong. Please try again.',
  });
};

module.exports = { AppError, errorHandler };
