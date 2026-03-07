// src/routes/admin/sales.js
// ============================================================
// ADMIN — SALES DASHBOARD
// ============================================================
// GET    /api/admin/sales              → all sales
// POST   /api/admin/sales              → create new sale
// GET    /api/admin/sales/overview     → dashboard KPIs
// GET    /api/admin/sales/chart        → weekly revenue
// GET    /api/admin/sales/service-mix  → count by sale type
// ============================================================

const express = require('express');
const db = require('../../db');
const { AppError } = require('../../utils/errors');

const router = express.Router();

// ----------------------------------------------------------
// GET /api/admin/sales
// ----------------------------------------------------------
// Return all sales ordered by sale_date DESC
// ----------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        s.id,
        s.project_id,
        p.title AS project_title,
        s.client_name,
        s.service,
        s.amount,
        s.sale_date,
        s.type,
        s.status,
        s.notes
      FROM sales s
      LEFT JOIN projects p ON p.id = s.project_id
      ORDER BY s.sale_date DESC
    `);

    res.json({
      success: true,
      sales: result.rows || []
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------
// POST /api/admin/sales
// ----------------------------------------------------------
// Create a new sale from the Add Sale modal
// ----------------------------------------------------------
router.post('/', async (req, res, next) => {
  try {
    const { project_id, client_name, service, amount, sale_date, type, status, notes } = req.body;

    if (!client_name || !service || !amount) {
      throw new AppError('client_name, service, and amount are required', 400);
    }

    // paid_amount: full amount if Paid, otherwise 0
    const paid_amount = (status === 'Paid') ? amount : 0;

    const result = await db.query(`
      INSERT INTO sales
      (project_id, client_name, service, amount, paid_amount, sale_date, type, status, notes, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *
    `, [project_id || null, client_name, service, amount, paid_amount, sale_date, type, status, notes]);

    res.status(201).json({
      success: true,
      sale: result.rows[0]
    });

  } catch (err) {
    console.error('Admin route error [POST /sales]:', err);
    if (err.statusCode) return next(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------
// GET /api/admin/sales/overview
// ----------------------------------------------------------
// Return dashboard KPIs: total_revenue, monthly_revenue,
// active_retainers, average_sale
// ----------------------------------------------------------
router.get('/overview', async (req, res, next) => {
  try {
    const [totalRes, monthlyRes, avgRes, retainersRes] = await Promise.all([
      db.query(`
        SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM sales
      `),
      db.query(`
        SELECT COALESCE(SUM(amount), 0) AS monthly_revenue
        FROM sales
        WHERE date_trunc('month', sale_date) = date_trunc('month', CURRENT_DATE)
      `),
      db.query(`
        SELECT COALESCE(AVG(amount), 0) AS average_sale FROM sales
      `),
      db.query(`
        SELECT COUNT(*) AS active_retainers
        FROM sales
        WHERE type = 'Retainer' AND status = 'Active'
      `)
    ]);

    res.json({
      success: true,
      overview: {
        total_revenue:    parseFloat(totalRes.rows[0].total_revenue),
        monthly_revenue:  parseFloat(monthlyRes.rows[0].monthly_revenue),
        active_retainers: parseInt(retainersRes.rows[0].active_retainers, 10),
        average_sale:     parseFloat(avgRes.rows[0].average_sale)
      }
    });

  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------
// GET /api/admin/sales/chart
// ----------------------------------------------------------
// Return weekly revenue totals grouped by week start date
// ----------------------------------------------------------
router.get('/chart', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        date_trunc('week', sale_date)::date AS week,
        COALESCE(SUM(amount), 0)            AS revenue
      FROM sales
      GROUP BY week
      ORDER BY week ASC
    `);

    res.json({
      success: true,
      chart: result.rows.map(row => ({
        week:    row.week,
        revenue: parseFloat(row.revenue)
      }))
    });

  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------
// GET /api/admin/sales/service-mix
// ----------------------------------------------------------
// Return count of sales grouped by type
// ----------------------------------------------------------
router.get('/service-mix', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        type,
        COUNT(*) AS count
      FROM sales
      GROUP BY type
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      service_mix: result.rows.map(row => ({
        type:  row.type,
        count: parseInt(row.count, 10)
      }))
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
