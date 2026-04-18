// src/routes/sales.js
// ============================================================
// SALES TEAM DASHBOARD ROUTES
// ============================================================
// All routes protected by protect + isAdmin + requireRole('admin','sales')
// mounted in app.js at /api/sales
//
// GET    /api/sales/leads?region=india|foreign  → leads by region
// POST   /api/sales/leads                        → add new lead
// PATCH  /api/sales/leads/:id                    → update lead
// DELETE /api/sales/leads/:id                    → delete lead
// POST   /api/sales/leads/:id/create-profile     → create user from lead
// GET    /api/sales/documents                    → admin-uploaded docs
// GET    /api/sales/messages                     → team chat messages
// POST   /api/sales/messages                     → post a message
// ============================================================

const express = require('express');
const bcrypt  = require('bcryptjs');
const db      = require('../db');

const router = express.Router();

// ============================================================
// LEADS
// ============================================================

// ----------------------------------------------------------
// GET /api/sales/leads?region=india|foreign
// ----------------------------------------------------------
router.get('/leads', async (req, res, next) => {
  try {
    const { region, status } = req.query;
    const conditions = [];
    const values     = [];

    if (region) {
      values.push(region);
      conditions.push(`region = $${values.length}`);
    }
    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.query(
      `SELECT * FROM sales_leads ${where} ORDER BY created_at DESC`,
      values
    );

    res.json({ success: true, leads: result.rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// POST /api/sales/leads
// ----------------------------------------------------------
router.post('/leads', async (req, res, next) => {
  try {
    const {
      name, email, phone, company,
      region = 'india', status = 'cold',
      followup_date, notes
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!['india', 'foreign'].includes(region)) {
      return res.status(400).json({ success: false, message: 'Region must be india or foreign' });
    }

    const result = await db.query(
      `INSERT INTO sales_leads
         (added_by, region, name, email, phone, company, status, followup_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.user.id, region, name,
        email || null, phone || null, company || null,
        status, followup_date || null, notes || null
      ]
    );

    res.status(201).json({ success: true, lead: result.rows[0] });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// PATCH /api/sales/leads/:id
// ----------------------------------------------------------
router.patch('/leads/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, company, status, followup_date, notes, converted } = req.body;

    // Build dynamic SET clause
    const setClauses = [];
    const values     = [];

    const addField = (col, val) => {
      if (val !== undefined) {
        values.push(val === '' ? null : val);
        setClauses.push(`${col} = $${values.length}`);
      }
    };

    addField('name',          name);
    addField('email',         email);
    addField('phone',         phone);
    addField('company',       company);
    addField('status',        status);
    addField('followup_date', followup_date);
    addField('notes',         notes);
    addField('converted',     converted);

    // Always update updated_at
    setClauses.push(`updated_at = NOW()`);

    if (setClauses.length === 1) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    const result = await db.query(
      `UPDATE sales_leads SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    res.json({ success: true, lead: result.rows[0] });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// DELETE /api/sales/leads/:id
// ----------------------------------------------------------
router.delete('/leads/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      `DELETE FROM sales_leads WHERE id = $1 RETURNING id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    res.json({ success: true });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// POST /api/sales/leads/:id/create-profile
// ----------------------------------------------------------
// Creates a user account in the users table for this lead
// using temp password Dizitup@123
// ----------------------------------------------------------
router.post('/leads/:id/create-profile', async (req, res, next) => {
  const client = await db.connect();
  try {
    const { username, email, password, firstName, lastName, phone, company } = req.body;

    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'Missing required profile fields' });
    }

    const leadResult = await client.query(
      'SELECT * FROM sales_leads WHERE id = $1',
      [req.params.id]
    );

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const lead = leadResult.rows[0];

    // Check if user already exists
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase().trim(), username.toLowerCase().trim()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email or username already exists'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await client.query('BEGIN');

    const userResult = await client.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, phone, business_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, email, first_name, last_name`,
      [
        username.toLowerCase().trim(),
        email.toLowerCase().trim(),
        passwordHash,
        firstName,
        lastName,
        phone || null,
        company || null
      ]
    );

    const newUser = userResult.rows[0];

    // Mark lead as converted
    await client.query(
      `UPDATE sales_leads SET converted = true, status = 'onboarded', updated_at = NOW() WHERE id = $1`,
      [lead.id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      user: newUser,
      profileUrl: `/#/book?email=${encodeURIComponent(newUser.email)}`
    });

  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ============================================================
// DOCUMENTS
// ============================================================

// ----------------------------------------------------------
// GET /api/sales/documents
// ----------------------------------------------------------
router.get('/documents', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT sd.*, u.first_name || ' ' || u.last_name as uploaded_by_name
       FROM sales_documents sd
       LEFT JOIN users u ON u.id = sd.uploaded_by_user_id
       ORDER BY sd.created_at DESC`
    );
    res.json({ success: true, documents: result.rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// POST /api/sales/documents   (admin only — for uploading)
// ----------------------------------------------------------
router.post('/documents', async (req, res, next) => {
  try {
    const { title, file_url } = req.body;
    if (!title || !file_url) {
      return res.status(400).json({ success: false, message: 'title and file_url are required' });
    }

    const result = await db.query(
      `INSERT INTO sales_documents (title, file_url, uploaded_by_user_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, file_url, req.user.id]
    );

    res.status(201).json({ success: true, document: result.rows[0] });
  } catch (err) { next(err); }
});

// ============================================================
// MESSAGES (Sales team chat)
// ============================================================

// ----------------------------------------------------------
// GET /api/sales/messages
// ----------------------------------------------------------
router.get('/messages', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * FROM sales_messages ORDER BY created_at ASC LIMIT 200`
    );
    res.json({ success: true, messages: result.rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// POST /api/sales/messages
// ----------------------------------------------------------
router.post('/messages', async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const senderName = `${req.user.first_name} ${req.user.last_name}`.trim() || req.user.username;

    const result = await db.query(
      `INSERT INTO sales_messages (sender_id, sender_name, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.id, senderName, message.trim()]
    );

    res.status(201).json({ success: true, message: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
