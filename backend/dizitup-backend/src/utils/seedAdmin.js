// src/utils/seedAdmin.js
// ============================================================
// AUTO-SEED ADMIN ACCOUNT ON SERVER STARTUP
// ============================================================
// Reads ADMIN_EMAIL and ADMIN_PASSWORD from .env.
// On every server start it ensures:
//   1. A user with that email exists in the users table
//   2. That user has a row in the admins table
// This means the admin can always log in via the normal
// POST /api/auth/login endpoint using those credentials.
// ============================================================

const bcrypt = require('bcryptjs');
const db     = require('../db');

const seedAdmin = async () => {
  const email    = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not set in .env — skipping admin seed.');
    return;
  }

  try {
    // 1. Find or create the user
    let userResult = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    let userId;

    if (userResult.rows.length === 0) {
      // User doesn't exist — create them
      const hash = await bcrypt.hash(password, 12);
      const inserted = await db.query(
        `INSERT INTO users (username, email, password_hash, first_name, last_name)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ['admin', email.toLowerCase().trim(), hash, 'Admin', 'User']
      );
      userId = inserted.rows[0].id;
      console.log('✅ Admin user created:', email);
    } else {
      userId = userResult.rows[0].id;

      // Update password hash in case ADMIN_PASSWORD changed
      const hash = await bcrypt.hash(password, 12);
      await db.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [hash, userId]
      );
    }

    // 2. Ensure user is in the admins table
    const adminCheck = await db.query(
      'SELECT id FROM admins WHERE user_id = $1',
      [userId]
    );

    if (adminCheck.rows.length === 0) {
      await db.query(
        `INSERT INTO admins (user_id, role) VALUES ($1, $2)`,
        [userId, 'superadmin']
      );
      console.log('✅ Admin role granted to:', email);
    }

    console.log('✅ Admin account ready — login with ADMIN_EMAIL from .env');

  } catch (err) {
    console.error('❌ Admin seed failed:', err.message);
  }

  // ----------------------------------------------------------
  // ADDITIONAL STAFF ACCOUNTS
  // ----------------------------------------------------------
  const staffAccounts = [
    { email: 'atanu@dizitup.com',    password: 'atanu123',  first_name: 'Atanu', last_name: 'Roy',     username: 'atanu',   role: 'admin'    },
    { email: 'piyush@dizitup.com',   password: 'piyush123', first_name: 'Piyush', last_name: 'Paul',    username: 'piyush',  role: 'manager'  },
    { email: 'diziteam@dizitup.com', password: 'team123',   first_name: 'Dizi',  last_name: 'Team',    username: 'diziteam', role: 'employee' },
  ];

  for (const staff of staffAccounts) {
    try {
      // Check if user already exists
      const existing = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [staff.email]
      );

      let staffUserId;

      if (existing.rows.length > 0) {
        // User exists — ensure last_name is up to date
        staffUserId = existing.rows[0].id;
        await db.query(
          'UPDATE users SET last_name = $1 WHERE id = $2',
          [staff.last_name, staffUserId]
        );
      } else {
        // Create user
        const hash = await bcrypt.hash(staff.password, 12);
        const inserted = await db.query(
          `INSERT INTO users (username, email, password_hash, first_name, last_name)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [staff.username, staff.email, hash, staff.first_name, staff.last_name]
        );
        staffUserId = inserted.rows[0].id;
        console.log(`✅ Staff user created: ${staff.email} (${staff.role})`);
      }

      // Ensure admin row exists
      const adminRow = await db.query(
        'SELECT id FROM admins WHERE user_id = $1',
        [staffUserId]
      );

      if (adminRow.rows.length === 0) {
        await db.query(
          `INSERT INTO admins (user_id, role) VALUES ($1, $2)`,
          [staffUserId, staff.role]
        );
        console.log(`✅ Role '${staff.role}' granted to: ${staff.email}`);
      }
    } catch (err) {
      console.error(`❌ Staff seed failed for ${staff.email}:`, err.message);
    }
  }
};

module.exports = seedAdmin;
