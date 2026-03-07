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
const db = require('../../db');
const { AppError } = require('../../utils/errors');
const { validators } = require('../../middleware/validate');

const router = express.Router();


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
    // Client info
    const clientResult = await db.query(
      `SELECT oc.*, u.username, u.email AS user_email, u.phone AS user_phone
       FROM onboard_clients oc
       JOIN users u ON u.id = oc.user_id
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
             'id',           s.id,
             'paid_amount',  s.paid_amount,
             'payment_date', s.payment_date,
             'notes',        s.notes
           ) ORDER BY s.payment_date
         ) FILTER (WHERE s.id IS NOT NULL)                      AS payments
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
    next(err);
  }
});


// ----------------------------------------------------------
// POST /api/admin/clients/:id/projects
// ----------------------------------------------------------
// Add a project to an onboarded client
// Body: { title, description?, start_date?, end_date?, project_amount, expenses? }
// ----------------------------------------------------------
router.post('/:id/projects', async (req, res, next) => {
  try {
    const { title, description, start_date, end_date, project_amount, expenses } = req.body;

    validators.required(title,          'Project title');
    validators.required(project_amount, 'Project amount');
    validators.positiveNumber(project_amount, 'Project amount');

    const result = await db.query(
      `INSERT INTO projects
         (client_id, title, description, start_date, end_date, project_amount, expenses)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.params.id, title, description || null,
        start_date || null, end_date || null,
        project_amount, expenses || 0,
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
    const { amount_paid, payment_date, notes } = req.body;

    validators.required(amount_paid, 'Amount paid');
    validators.positiveNumber(amount_paid, 'Amount paid');

    const result = await db.query(
      `INSERT INTO sales (project_id, amount_paid, payment_date, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        req.params.projectId,
        amount_paid,
        payment_date || new Date().toISOString().split('T')[0],
        notes || null,
      ]
    );

    res.status(201).json({ success: true, payment: result.rows[0] });

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

module.exports = router;
