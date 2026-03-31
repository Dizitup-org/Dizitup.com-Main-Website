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
const crypto = require('crypto');
const db = require('../db');
const transporter = require('../utils/mailer');
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

// ----------------------------------------------------------
// POST /api/auth/forgot-password
// ----------------------------------------------------------
// Body: { email }
// ----------------------------------------------------------
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    validators.required(email, 'Email');
    validators.email(email);

    // 1. Check if user exists
    const userRes = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    
    // Always return same message even if email not found (security)
    const successMsg = { success: true, message: 'If that email is in our system, a reset link has been sent.' };

    if (userRes.rows.length === 0) {
      return res.json(successMsg);
    }

    // 2. Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // 3. Save to DB
    await db.query(
      'INSERT INTO password_reset_tokens (email, token, expires_at) VALUES ($1, $2, $3)',
      [email.toLowerCase().trim(), token, expiresAt]
    );

    // 4. Send email via Nodemailer
    const resetLink = `http://localhost:5173/#/reset-password?token=${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Reset your password — Dizitup',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2>Reset Your Password</h2>
          <p>We received a request to reset your password for your Dizitup account.</p>
          <p>Click the button below to set a new password. This link is valid for 15 minutes.</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>Best regards,<br/>The Dizitup Team</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 11px; color: #999;">If the button above doesn't work, copy and paste this URL into your browser:<br/>${resetLink}</p>
        </div>
      `,
    });

    res.json(successMsg);
  } catch (err) {
    console.error('[forgot-password] Error:', err);
    next(err);
  }
});

// ----------------------------------------------------------
// POST /api/auth/reset-password
// ----------------------------------------------------------
// Body: { token, password }
// ----------------------------------------------------------
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    validators.required(token, 'Token');
    validators.required(password, 'New password');
    validators.password(password);

    // 1. Find and validate token
    const tokenRes = await db.query(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (tokenRes.rows.length === 0) {
      throw new AppError('Invalid or expired reset token.', 400);
    }

    const { email } = tokenRes.rows[0];

    // 2. Hash new password
    const password_hash = await bcrypt.hash(password, 12);

    // 3. Update user
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      [password_hash, email]
    );

    // 4. Delete token (one-time use)
    await db.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);

    res.json({ success: true, message: 'Password has been reset successfully. You can now login.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
