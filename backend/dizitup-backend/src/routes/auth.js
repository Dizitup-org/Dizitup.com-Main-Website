// src/routes/auth.js
// ============================================================
// AUTHENTICATION ROUTES
// ============================================================
// POST /api/auth/signup  → create account
// POST /api/auth/login   → get JWT token
// ============================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { AppError } = require('../utils/errors');
const { validators } = require('../middleware/validate');

const router = express.Router();

// ----------------------------------------------------------
// Helper: create a signed JWT for a user
// ----------------------------------------------------------
const signToken = (userId) => {
  return jwt.sign(
    { userId },                     // payload — what we store inside the token
    process.env.JWT_SECRET,         // secret key used to sign
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ----------------------------------------------------------
// POST /api/auth/signup
// ----------------------------------------------------------
// Body: { username, email, password, first_name, last_name,
//         phone?, business_name? }
//
// Flow:
//   1. Validate all inputs
//   2. Hash the password (NEVER store plain text)
//   3. Insert into users table
//   4. Return JWT + user data
// ----------------------------------------------------------
router.post('/signup', async (req, res, next) => {
  try {
    const {
      username, email, password,
      first_name, last_name,
      phone, business_name
    } = req.body;

    // Validate inputs
    validators.required(username,   'Username');
    validators.required(email,      'Email');
    validators.required(password,   'Password');
    validators.required(first_name, 'First name');
    validators.required(last_name,  'Last name');
    validators.username(username);
    validators.email(email);
    validators.password(password);

    // Hash the password
    const password_hash = await bcrypt.hash(password, 12);

    // Ensure username is unique
    const usernameCheck = await db.query(
      'SELECT 1 FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1',
      [username]
    );
    if (usernameCheck.rows.length > 0) {
      throw new AppError('Username already taken. Please choose another.', 400);
    }

    // Ensure email is unique
    const emailCheck = await db.query(
      'SELECT 1 FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email]
    );
    if (emailCheck.rows.length > 0) {
      throw new AppError('Email already registered. Please login instead.', 400);
    }

    // Insert user into database
    // $1, $2, $3 etc. are parameterised placeholders.
    // NEVER use string concatenation for SQL — this prevents SQL injection.
    const result = await db.query(
      `INSERT INTO users
         (username, email, password_hash, first_name, last_name, phone, business_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, email, first_name, last_name, created_at`,
      [username, email, password_hash, first_name, last_name, phone || null, business_name || null]
    );

    const user = result.rows[0];
    const token = signToken(user.id);

    res.status(201).json({
      success: true,
      token,
      user,
    });

  } catch (err) {
    next(err); // pass to central error handler
  }
});

// ----------------------------------------------------------
// POST /api/auth/login
// ----------------------------------------------------------
// Body: { email, password }
//
// Flow:
//   1. Find user by email
//   2. Compare password with stored hash
//   3. Return JWT + user data
// ----------------------------------------------------------
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    validators.required(email,    'Email');
    validators.required(password, 'Password');

    // Find user by email
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      // Use a vague message — don't reveal whether the email exists
      throw new AppError('Invalid email or password.', 401);
    }

    const user = result.rows[0];

    // Compare submitted password with stored hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    // Check if user is admin
    const adminCheck = await db.query(
      'SELECT role FROM admins WHERE user_id = $1',
      [user.id]
    );
    const isAdmin = adminCheck.rows.length > 0;
    const adminRole = isAdmin ? adminCheck.rows[0].role : null;

    const token = signToken(user.id);

    // Return user data without password_hash
    res.json({
      success: true,
      token,
      user: {
        id:            user.id,
        username:      user.username,
        email:         user.email,
        first_name:    user.first_name,
        last_name:     user.last_name,
        phone:         user.phone,
        business_name: user.business_name,
        isAdmin,
        adminRole,
      },
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
