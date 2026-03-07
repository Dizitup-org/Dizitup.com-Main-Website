// src/middleware/validate.js
// ============================================================
// INPUT VALIDATION HELPERS
// ============================================================
// We validate BEFORE hitting the database.
// This prevents bad data, SQL injection attempts, and gives
// users clear error messages.
//
// We do this manually (no extra library) so you understand
// exactly what is being checked.
// ============================================================

const { AppError } = require('../utils/errors');

// Reusable validators
const validators = {

  // Must be a non-empty string
  required: (value, fieldName) => {
    if (value === undefined || value === null || String(value).trim() === '') {
      throw new AppError(`${fieldName} is required.`, 400);
    }
  },

  // Valid email format
  email: (value) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(value)) {
      throw new AppError('Invalid email address.', 400);
    }
  },

  // Password must be at least 8 characters
  password: (value) => {
    if (value.length < 8) {
      throw new AppError('Password must be at least 8 characters.', 400);
    }
  },

  // Username: letters, digits, underscores, hyphens only
  username: (value) => {
    if (!/^[a-zA-Z0-9_\-]+$/.test(value)) {
      throw new AppError('Username may only contain letters, numbers, underscores, and hyphens.', 400);
    }
    if (value.length < 3 || value.length > 50) {
      throw new AppError('Username must be between 3 and 50 characters.', 400);
    }
  },

  // Must be a positive number
  positiveNumber: (value, fieldName) => {
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      throw new AppError(`${fieldName} must be a positive number.`, 400);
    }
  },

  // Must be a valid ISO date string e.g. "2025-03-01"
  date: (value, fieldName) => {
    if (isNaN(Date.parse(value))) {
      throw new AppError(`${fieldName} must be a valid date (YYYY-MM-DD).`, 400);
    }
  },
};

module.exports = { validators };
