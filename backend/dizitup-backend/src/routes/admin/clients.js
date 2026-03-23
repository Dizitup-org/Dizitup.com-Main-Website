// src/routes/admin/clients.js
// ============================================================
// ADMIN — CLIENTS TAB
// ============================================================
// GET /api/admin/clients/query       → query_clients list
// GET /api/admin/clients/onboarded   → onboard_clients list
// GET /api/admin/clients/:id         → single client full detail
// POST /api/admin/clients/:id/projects → add a project
// POST /api/admin/clients/:clientId/projects/:projectId/payments → add payment
// ============================================================

const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../../db');
const { AppError } = require('../../utils/errors');
const { validators } = require('../../middleware/validate');

const router = express.Router();

// ----------------------------------------------------------
// Schema migrations — run at startup
// ----------------------------------------------------------
(async () => {
  try {
    await db.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS admin_notes TEXT`);
    await db.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS notes TEXT`);
    await db.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS status_note VARCHAR(255)`);
    await db.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(100) DEFAULT 'sent_to_manager'`);
    await db.query(`ALTER TABLE projects DROP CONSTRAINT IF EXISTS chk_project_status`);
    await db.query(`ALTER TABLE projects ADD CONSTRAINT chk_project_status CHECK (status IN ('active', 'paused', 'completed', 'cancelled', 'sent_to_manager', 'assigned_to_staff', 'under_execution'))`);
    await db.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS manager_notes TEXT`);
    await db.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'medium'`);
    await db.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS seen_at TIMESTAMPTZ`);
    await db.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ`);
  } catch (err) { console.error('[clients.js] Schema migration error:', err.message); }
})();

// ----------------------------------------------------------
// GET /api/admin/clients/query
// ----------------------------------------------------------
router.get('/query', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
      qc.id,
      b.id as booking_id,
      b.name,
      b.email,
      b.agency,
      b.project_type,
      b.notes,
      qc.created_at
      FROM query_clients qc
      JOIN bookings b
      ON qc.booking_id=b.id
      WHERE qc.status!='converted'
      ORDER BY qc.created_at DESC
    `);

    res.json({
      success: true,
      clients: result.rows
    });

  } catch (err) {
    next(err);
  }
});


// ----------------------------------------------------------
// GET /api/admin/clients/onboarded
// ----------------------------------------------------------
// Full onboarded clients list (STEP 6)
// ----------------------------------------------------------
router.get('/onboarded', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        id,
        booking_id,
        contact_name,
        email,
        company_name,
        onboarded_at
      FROM onboard_clients
      ORDER BY onboarded_at DESC
    `);

    res.json({ success: true, clients: result.rows });

  } catch (err) {
    next(err);
  }
});


// ----------------------------------------------------------
// POST /api/admin/clients/onboard
// ----------------------------------------------------------
// Convert a booking into an onboarded client.
// Body: { booking_id, contact_name, email, phone?, company_name? }
// ----------------------------------------------------------
router.post('/onboard', async (req, res, next) => {
  try {
    const { booking_id, contact_name, email, phone, company_name } = req.body;

    if (!booking_id)    throw new AppError('booking_id is required.', 400);
    if (!contact_name)  throw new AppError('contact_name is required.', 400);
    if (!email)         throw new AppError('email is required.', 400);

    // Fetch user_id from the booking — required by NOT NULL constraint
    const bookingRow = await db.query(
      'SELECT user_id FROM bookings WHERE id = $1',
      [booking_id]
    );
    if (bookingRow.rows.length === 0) throw new AppError('Booking not found.', 404);
    const user_id = bookingRow.rows[0].user_id;
    if (!user_id) throw new AppError('Booking has no associated user_id.', 400);

    // Prevent duplicate onboards
    const existing = await db.query(
      'SELECT id FROM onboard_clients WHERE booking_id = $1',
      [booking_id]
    );
    if (existing.rows.length > 0) {
      throw new AppError('Booking is already onboarded.', 400);
    }

    const result = await db.query(
      `INSERT INTO onboard_clients
         (user_id, booking_id, contact_name, email, phone, company_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, booking_id, contact_name, email, phone || null, company_name || null]
    );

    // Mark query_client as converted if one exists
    await db.query(
      `UPDATE query_clients SET status = 'converted' WHERE booking_id = $1`,
      [booking_id]
    );

    res.status(201).json({ success: true, client: result.rows[0] });

  } catch (err) {
    console.error('Admin route error [POST /clients/onboard]:', err);
    if (err.statusCode) return next(err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ----------------------------------------------------------
// GET /api/admin/clients/:id
// ----------------------------------------------------------
// Single client — full detail page:
// personal info + all projects + all payments
// ----------------------------------------------------------
router.get('/:id', async (req, res, next) => {
  try {
    // Ensure dependent tables exist before querying
    await db.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id   UUID REFERENCES onboard_clients(id) ON DELETE CASCADE,
        title       TEXT,
        description TEXT,
        status      TEXT DEFAULT 'active',
        total_amount NUMERIC(12,2) DEFAULT 0,
        expenses     NUMERIC(12,2) DEFAULT 0,
        start_date  DATE,
        end_date    DATE,
        deadline    DATE,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS project_updates (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
        message     TEXT NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Client info
    const clientResult = await db.query(
      `SELECT oc.*, u.username, u.email AS user_email, u.phone AS user_phone
       FROM onboard_clients oc
       LEFT JOIN users u ON u.id = oc.user_id
       WHERE oc.id = $1`,
      [req.params.id]
    );
    if (clientResult.rows.length === 0) throw new AppError('Client not found.', 404);

    // Projects with payment details
    const projectsResult = await db.query(
      `SELECT
         p.id,
         p.title,
         p.description,
         p.status,
         p.total_amount,
         p.expenses,
         p.start_date,
         p.end_date,
         p.created_at,
(p.total_amount - p.expenses)                       AS profit,
COALESCE(SUM(s.paid_amount), 0)                     AS total_paid,
(p.total_amount - COALESCE(SUM(s.paid_amount), 0))  AS pending_amount,
         JSON_AGG(
           JSON_BUILD_OBJECT(
             'id',              s.id,
             'paid_amount',     s.paid_amount,
             'payment_date',    s.sale_date,
             'notes',           s.notes,
             'pending_amount',  s.pending_amount,
             'expenses',        s.expenses
           ) ORDER BY s.sale_date
         ) FILTER (WHERE s.id IS NOT NULL)                      AS sales
       FROM projects p
       LEFT JOIN sales s ON s.project_id = p.id
       WHERE p.client_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [req.params.id]
    );

    // Financial totals for this client
    const totalsResult = await db.query(
      `SELECT
         COALESCE(SUM(p.total_amount), 0)             AS total_revenue,
         COALESCE(SUM(p.expenses), 0)                   AS total_expenses,
         COALESCE(SUM(p.total_amount - p.expenses), 0) AS total_profit,
         COALESCE(SUM(s_totals.paid), 0)                AS total_collected
       FROM projects p
       LEFT JOIN (
         SELECT project_id, SUM(paid_amount) AS paid FROM sales GROUP BY project_id
       ) s_totals ON s_totals.project_id = p.id
       WHERE p.client_id = $1`,
      [req.params.id]
    );

    res.json({
      success: true,
      client:   clientResult.rows[0],
      projects: projectsResult.rows,
      totals:   totalsResult.rows[0],
    });

  } catch (err) {
    console.error('[GET /clients/:id] Error:', err.message, err.stack);
    next(err);
  }
});


// ----------------------------------------------------------
// POST /api/admin/clients/:id/projects
// ----------------------------------------------------------
// Add a project to an onboarded client
// Body: { title, description?, start_date?, end_date?, total_amount?, expenses? }
// ----------------------------------------------------------
router.post('/:id/projects', async (req, res, next) => {
  try {
    const { title, description, admin_notes, start_date, end_date, deadline, total_amount, expenses } = req.body;
    validators.required(title, 'Project title');
    validators.required(total_amount, 'Project amount');
    validators.positiveNumber(total_amount, 'Project amount');

    const result = await db.query(
      `INSERT INTO projects
         (client_id, title, description, admin_notes, start_date, end_date, deadline, total_amount, expenses, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.params.id, title, description || null,
        admin_notes || null,
        start_date || null, end_date || null, deadline || null,
        total_amount, expenses || 0, 'sent_to_manager',
      ]
    );

    res.status(201).json({ success: true, project: result.rows[0] });

  } catch (err) {
    next(err);
  }
});


// ----------------------------------------------------------
// POST /api/admin/clients/:clientId/projects/:projectId/payments
// ----------------------------------------------------------
// Record a payment against a project
// Body: { amount_paid, payment_date?, notes? }
// ----------------------------------------------------------
router.post('/:clientId/projects/:projectId/payments', async (req, res, next) => {
  try {
    const { paid_amount, sale_date, notes } = req.body;

    validators.required(paid_amount, 'Amount paid');
    validators.positiveNumber(paid_amount, 'Amount paid');

    const result = await db.query(
      `INSERT INTO sales (project_id, paid_amount, sale_date, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        req.params.projectId,
        paid_amount,
        sale_date || new Date().toISOString().split('T')[0],
        notes || null,
      ]
    );

    res.status(201).json({ success: true, payment: result.rows[0] });

  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------
// PATCH /api/admin/clients/:clientId/projects/:projectId/payments/:paymentId
// ----------------------------------------------------------
// Edit an existing payment record
// Body: { paid_amount?, sale_date?, notes?, pending_amount?, expenses? }
// ----------------------------------------------------------
router.patch('/:clientId/projects/:projectId/payments/:paymentId', async (req, res, next) => {
  try {
    const { paid_amount, sale_date, notes, pending_amount, expenses } = req.body;

    const result = await db.query(
      `UPDATE sales
       SET paid_amount     = COALESCE($1, paid_amount),
           sale_date       = COALESCE($2::date, sale_date),
           notes           = COALESCE($3, notes),
           pending_amount  = COALESCE($4, pending_amount),
           expenses        = COALESCE($5, expenses)
       WHERE id = $6 AND project_id = $7
       RETURNING *`,
      [
        paid_amount != null ? paid_amount : null,
        sale_date || null,
        notes !== undefined ? notes : null,
        pending_amount != null ? pending_amount : null,
        expenses != null ? expenses : null,
        req.params.paymentId,
        req.params.projectId,
      ]
    );

    if (result.rows.length === 0) throw new AppError('Payment not found.', 404);

    res.json({ success: true, payment: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------
// DELETE /api/admin/clients/:id
// ----------------------------------------------------------
// Remove an onboarded client by ID.
// ----------------------------------------------------------
router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM onboard_clients WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------
// POST /api/admin/clients/:id/create-account
// ----------------------------------------------------------
// Create or reset the portal login for an onboarded client.
// If the client's email already has a user record, the password
// is reset (useful for credential resets).
// Returns { email, temp_password } to relay to the client.
// ----------------------------------------------------------
router.post('/:id/create-account', async (req, res, next) => {
  try {
    const clientResult = await db.query(
      'SELECT * FROM onboard_clients WHERE id = $1',
      [req.params.id]
    );
    if (clientResult.rows.length === 0) throw new AppError('Client not found.', 404);

    const client = clientResult.rows[0];
    const email = client.email;

    // Generate a 12-char URL-safe alphanumeric temp password
    const tempPassword = crypto.randomBytes(9).toString('base64url').slice(0, 12);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);

    let userId;
    if (existingUser.rows.length > 0) {
      // Reset password for existing user
      userId = existingUser.rows[0].id;
      await db.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [hashedPassword, userId]
      );
    } else {
      // Create a new portal user
      const baseUsername = (client.contact_name || 'client')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 16);
      const uniqueSuffix = crypto.randomBytes(2).toString('hex');
      const username = `${baseUsername}${uniqueSuffix}`;

      const userResult = await db.query(
        `INSERT INTO users (username, email, password_hash, first_name, phone)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [username, email, hashedPassword, client.contact_name || '', client.phone || null]
      );
      userId = userResult.rows[0].id;
    }

    // Ensure onboard_clients.user_id is linked
    await db.query(
      'UPDATE onboard_clients SET user_id = $1 WHERE id = $2',
      [userId, req.params.id]
    );

    res.status(201).json({
      success: true,
      credentials: {
        email,
        temp_password: tempPassword,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
