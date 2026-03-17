// src/routes/admin/users.js
// ============================================================
// ADMIN — USERS (Booking Leads) + STAFF MANAGEMENT
// ============================================================
// GET  /api/admin/users        → all distinct leads
// GET  /api/admin/users/staff  → list managers & employees
// POST /api/admin/users/staff  → create staff member
// PATCH /api/admin/users/staff/:adminId → change role
// DELETE /api/admin/users/staff/:adminId → remove staff access
// ============================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../../db');
const requireRole = require('../../middleware/requireRole');

const router = express.Router();

// ----------------------------------------------------------
// GET /api/admin/users
// ----------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id,
        name,
        agency_size,
        country,
        created_at
      FROM visitor_leads
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      users: result.rows || [],
      total: result.rowCount,
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================================
// STAFF MANAGEMENT — admin only
// ==============================================================

// ----------------------------------------------------------
// GET /api/admin/users/staff
// ----------------------------------------------------------
router.get('/staff', requireRole('admin'), async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT a.id as admin_id, a.role, a.user_id,
             u.username, u.email, u.first_name, u.last_name, u.phone, u.created_at
      FROM admins a JOIN users u ON u.id = a.user_id
      WHERE a.role IN ('manager', 'employee')
      ORDER BY a.role, u.first_name
    `);
    res.json({ success: true, staff: result.rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// POST /api/admin/users/staff
// ----------------------------------------------------------
// Uses pool.connect() + BEGIN/COMMIT/ROLLBACK transaction pattern
// ----------------------------------------------------------
router.post('/staff', requireRole('admin'), async (req, res, next) => {
  const client = await db.connect();
  try {
    const { username, email, password, first_name, last_name, phone, role } = req.body;

    if (!['manager', 'employee'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be "manager" or "employee"' });
    }
    if (!username || !email || !password || !first_name || !last_name) {
      return res.status(400).json({ success: false, message: 'username, email, password, first_name, last_name are required' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await client.query('BEGIN');

    const userResult = await client.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [username, email.toLowerCase().trim(), password_hash, first_name, last_name, phone || null]
    );
    const newUser = userResult.rows[0];

    const adminResult = await client.query(
      `INSERT INTO admins (user_id, role) VALUES ($1, $2) RETURNING *`,
      [newUser.id, role]
    );
    const newAdmin = adminResult.rows[0];

    await client.query('COMMIT');

    // Remove password_hash from response
    delete newUser.password_hash;
    res.status(201).json({ success: true, staff: { user: newUser, admin: newAdmin } });

  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ----------------------------------------------------------
// PATCH /api/admin/users/staff/:adminId
// ----------------------------------------------------------
router.patch('/staff/:adminId', requireRole('admin'), async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['manager', 'employee'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be "manager" or "employee"' });
    }

    const result = await db.query(
      `UPDATE admins SET role = $1 WHERE id = $2 AND role != 'admin' RETURNING *`,
      [role, req.params.adminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found or cannot modify an admin' });
    }

    res.json({ success: true });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// DELETE /api/admin/users/staff/:adminId
// ----------------------------------------------------------
router.delete('/staff/:adminId', requireRole('admin'), async (req, res, next) => {
  try {
    const result = await db.query(
      `DELETE FROM admins WHERE id = $1 AND role != 'admin' RETURNING id`,
      [req.params.adminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found or cannot remove an admin' });
    }

    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
