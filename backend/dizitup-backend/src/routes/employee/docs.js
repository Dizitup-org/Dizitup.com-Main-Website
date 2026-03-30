// src/routes/employee/docs.js
// ============================================================
// EMPLOYEE DOCS — /api/employee/docs
// ============================================================
// Employee reads docs forwarded by their manager. Read-only.
//
// GET  /  — docs forwarded to this employee
// ============================================================

const express = require('express');
const db      = require('../../db');

const router = express.Router();

// ----------------------------------------------------------
// GET /api/employee/docs
// ----------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    // Get admin_id for this employee
    const adminRes = await db.query(
      `SELECT id FROM admins WHERE user_id = $1`, [req.user.id]
    );
    if (adminRes.rows.length === 0) {
      return res.json({ success: true, docs: [] });
    }
    const adminId = adminRes.rows[0].id;

    const result = await db.query(`
      SELECT id, title, description, file_url, file_name, file_size,
             uploaded_by_name, forward_note, created_at
      FROM staff_docs
      WHERE sent_to_role = 'employee'
        AND sent_to_id = $1
      ORDER BY created_at DESC
    `, [adminId]);

    res.json({ success: true, docs: result.rows });
  } catch (err) { next(err); }
});

module.exports = router;
