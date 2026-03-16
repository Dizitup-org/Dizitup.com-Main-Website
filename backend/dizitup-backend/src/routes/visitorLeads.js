// src/routes/visitorLeads.js
// ============================================================
// PUBLIC — VISITOR LEADS
// ============================================================
// POST /api/visitor-leads → save a visitor's personalization form entry
// ============================================================

const express = require('express');
const db = require('../db');

const router = express.Router();

// ----------------------------------------------------------
// POST /api/visitor-leads
// ----------------------------------------------------------
// Body: { name, agency_size, country }
// Creates the visitor_leads table if it doesn't exist,
// then inserts a row.
// ----------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    // Ensure table exists (idempotent)
    await db.query(`
      CREATE TABLE IF NOT EXISTS visitor_leads (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name       TEXT,
        agency_size TEXT,
        country    TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { name, agency_size, country } = req.body;

    const result = await db.query(
      `INSERT INTO visitor_leads (name, agency_size, country)
       VALUES ($1, $2, $3)
       RETURNING id, name, agency_size, country, created_at`,
      [name || null, agency_size || null, country || null]
    );

    res.status(201).json({ success: true, lead: result.rows[0] });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
