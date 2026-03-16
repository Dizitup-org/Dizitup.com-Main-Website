// src/routes/admin/users.js
// ============================================================
// ADMIN — USERS (Booking Leads)
// ============================================================
// GET /api/admin/users → all distinct leads from bookings table
// ============================================================

const express = require('express');
const db = require('../../db');

const router = express.Router();

// ----------------------------------------------------------
// GET /api/admin/users
// ----------------------------------------------------------
// Returns all booking entries as leads, sorted by created_at DESC.
// Each row represents a unique form submission.
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

module.exports = router;
