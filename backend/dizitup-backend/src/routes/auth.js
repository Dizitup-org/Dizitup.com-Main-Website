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
const prisma = require('../utils/prisma');
const resend = require('../utils/resend');
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

    // Ensure username or email is unique
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: 'insensitive' } },
          { email: { equals: email, mode: 'insensitive' } }
        ]
      }
    });

    if (existingUser) {
      const field = existingUser.username.toLowerCase() === username.toLowerCase() ? 'Username' : 'Email';
      throw new AppError(`${field} already taken.`, 400);
    }

    // Insert user into database via Prisma
    const user = await prisma.users.create({
      data: {
        username,
        email,
        password_hash,
        first_name,
        last_name,
        phone: phone || null,
        business_name: business_name || null
      },
      select: {
        id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
        created_at: true
      }
    });

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

    // Find user by email via Prisma
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      // Use a vague message — don't reveal whether the email exists
      throw new AppError('Invalid email or password.', 401);
    }

    // Compare submitted password with stored hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    // Check if user is admin via Prisma
    const adminRecord = await prisma.admins.findUnique({
      where: { user_id: user.id },
      select: { role: true }
    });
    
    const isAdmin = !!adminRecord;
    const adminRole = adminRecord ? adminRecord.role : null;

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

    const successMsg = { success: true };

    // 1. Check if user exists via Prisma
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    
    if (!user) {
      // Return success even if email not found for security
      return res.json(successMsg);
    }

    // 2. Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // 3. Save via Prisma
    await prisma.PasswordResetToken.create({
      data: {
        email: email.toLowerCase().trim(),
        token,
        expiresAt
      }
    });

    // 4. Send email via Resend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/#/reset-password?token=${token}`;

    try {
      await resend.emails.send({
        from: 'Dizitup <onboarding@resend.dev>', // Update this to your verified domain in production
        to: email,
        subject: 'Reset Your Password',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0a0a0a;color:#fff;border-radius:12px">
            <h2 style="color:#fff">Reset Your Password</h2>
            <p style="color:#aaa">Click below to reset your Dizitup password. Expires in 15 minutes.</p>
            <a href="${resetLink}" style="display:inline-block;margin-top:24px;padding:12px 28px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
            <p style="color:#555;font-size:12px;margin-top:32px">If you didn't request this, ignore this email.</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error('[forgot-password] Resend Error:', mailErr);
      // We don't throw here to avoid revealing email existence, 
      // but in a real app you might want to log this carefully.
    }

    res.json(successMsg);
  } catch (err) {
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

    // 1. Find and validate token via Prisma
    const record = await prisma.PasswordResetToken.findUnique({
      where: { token }
    });

    if (!record || record.expiresAt < new Date()) {
      throw new AppError('Invalid or expired reset token.', 400);
    }

    // 2. Hash new password
    const hashed = await bcrypt.hash(password, 10);

    // 3. Update user via Prisma
    await prisma.users.update({
      where: { email: record.email },
      data: { password_hash: hashed }
    });

    // 4. Delete token (one-time use)
    await prisma.PasswordResetToken.delete({
      where: { token }
    });

    res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
