// src/routes/manager/docs.js
// ============================================================
// MANAGER DOCS — /api/manager/docs
// ============================================================
// Manager receives docs from admin and can forward to employees.
//
// GET  /inbox         — docs received from admin
// GET  /sent          — docs forwarded to employees
// POST /forward/:id   — forward a received doc to an employee
// ============================================================

const express = require('express');
const db      = require('../../db');

const router = express.Router();

// ----------------------------------------------------------
// GET /api/manager/docs/inbox — docs sent to this manager by admin
// ----------------------------------------------------------
router.get('/inbox', async (req, res, next) => {
  try {
    // Get the admin_id for this manager
    const adminRes = await db.query(
      `SELECT id FROM admins WHERE user_id = $1`, [req.user.id]
    );
    if (adminRes.rows.length === 0) {
      return res.json({ success: true, docs: [] });
    }
    const adminId = adminRes.rows[0].id;

    const result = await db.query(`
      SELECT id, title, description, file_url, file_name, file_size,
             uploaded_by_name, created_at
      FROM staff_docs
      WHERE sent_to_role = 'manager'
        AND sent_to_id = $1
        AND forwarded_from IS NULL
      ORDER BY created_at DESC
    `, [adminId]);

    res.json({ success: true, docs: result.rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// GET /api/manager/docs/sent — docs forwarded by this manager
// ----------------------------------------------------------
router.get('/sent', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT id, title, description, file_url, file_name, file_size,
             sent_to_name, forward_note, created_at
      FROM staff_docs
      WHERE uploaded_by = $1 AND forwarded_from IS NOT NULL
      ORDER BY created_at DESC
    `, [req.user.id]);

    res.json({ success: true, docs: result.rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// POST /api/manager/docs/forward/:id — forward a doc to employee
// Body: { employee_id, employee_name, note? }
// ----------------------------------------------------------
router.post('/forward/:id', async (req, res, next) => {
  try {
    const { employee_id, employee_name, note } = req.body;
    if (!employee_id) {
      return res.status(400).json({ success: false, message: 'employee_id is required' });
    }

    // Fetch the original doc
    const docRes = await db.query(
      `SELECT * FROM staff_docs WHERE id = $1 AND sent_to_role = 'manager'`,
      [req.params.id]
    );
    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doc not found' });
    }
    const original = docRes.rows[0];

    // Get manager's name
    const mgr = await db.query(
      `SELECT first_name, last_name FROM users WHERE id = $1`, [req.user.id]
    );
    const mgrName = mgr.rows[0]
      ? `${mgr.rows[0].first_name || ''} ${mgr.rows[0].last_name || ''}`.trim()
      : 'Manager';

    // Insert forwarded copy (same file_url, linked via forwarded_from)
    const result = await db.query(`
      INSERT INTO staff_docs
        (title, description, file_url, file_name, file_size,
         uploaded_by, uploaded_by_name,
         sent_to_role, sent_to_id, sent_to_name,
         forwarded_from, forward_note)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'employee', $8, $9, $10, $11)
      RETURNING *
    `, [
      original.title,
      original.description,
      original.file_url,
      original.file_name,
      original.file_size,
      req.user.id,
      mgrName,
      employee_id,
      employee_name?.trim() || 'Employee',
      original.id,
      note?.trim() || null,
    ]);

    res.status(201).json({ success: true, doc: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
