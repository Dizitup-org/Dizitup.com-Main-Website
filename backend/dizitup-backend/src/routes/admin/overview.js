// src/routes/admin/overview.js
// ============================================================
// ADMIN — OVERVIEW TAB
// ============================================================
// GET /api/admin/overview  → all dashboard metrics in one call
// GET /api/admin/overview/monthly → monthly revenue chart data
// ============================================================

const express = require('express');
const db = require('../../db');

const router = express.Router();

// ----------------------------------------------------------
// GET /api/admin/overview
// ----------------------------------------------------------
// Returns all KPIs for the admin Overview tab.
// Uses multiple parallel queries (Promise.all) for speed.
// ----------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    // Run all queries in parallel — much faster than sequential
    const [
      financials,
      clients,
      bookings,
      conversionRate,
    ] = await Promise.all([

      // 1. Financial aggregates
      db.query(`
        SELECT
          COALESCE(SUM(p.total_amount), 0)            AS total_revenue,
          COALESCE(SUM(p.total_amount - p.expenses), 0) AS total_profit,
          COALESCE(SUM(p.expenses), 0)                  AS total_expenditure,
          COALESCE(SUM(s_totals.paid), 0)               AS total_collected,
          COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'active') AS active_projects,
          COUNT(DISTINCT p.id)                          AS total_projects
        FROM projects p
        LEFT JOIN (
          SELECT project_id, SUM(paid_amount) AS paid
          FROM sales
          GROUP BY project_id
        ) s_totals ON s_totals.project_id = p.id
      `),

      // 2. Client counts
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'active')    AS active_clients,
          COUNT(*)                                      AS total_clients
        FROM onboard_clients
      `),

      // 3. Booking counts by status
      db.query(`
        SELECT
          COUNT(*)                                         AS total_bookings,
          COUNT(*) FILTER (WHERE status = 'pending')      AS pending,
          COUNT(*) FILTER (WHERE status = 'accepted')     AS accepted,
          COUNT(*) FILTER (WHERE status = 'follow_up')    AS follow_up,
          COUNT(*) FILTER (WHERE status = 'rejected')     AS rejected
        FROM bookings
      `),

      // 4. Conversion rate = onboarded / total bookings * 100
      db.query(`
        SELECT
          ROUND(
            CASE WHEN COUNT(b.id) = 0 THEN 0
            ELSE (COUNT(oc.id)::DECIMAL / COUNT(b.id)) * 100
            END, 2
          ) AS conversion_rate
        FROM bookings b
        LEFT JOIN onboard_clients oc ON oc.booking_id = b.id
      `),
    ]);

    res.json({
      success: true,
      data: {
        ...financials.rows[0],
        ...clients.rows[0],
        bookings:        bookings.rows[0],
        conversion_rate: conversionRate.rows[0].conversion_rate,
      },
    });

  } catch (err) {
    next(err);
  }
});


// ----------------------------------------------------------
// GET /api/admin/overview/monthly
// ----------------------------------------------------------
// Returns last 12 months of revenue for the growth chart.
// DATE_TRUNC('month', date) rounds a date down to month start.
// ----------------------------------------------------------
router.get('/monthly', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', s.payment_date), 'Mon YYYY') AS month,
        DATE_TRUNC('month', s.payment_date)                       AS month_date,
        SUM(s.amount_paid)                                        AS revenue,
        COUNT(DISTINCT s.project_id)                             AS projects_paid
      FROM sales s
      WHERE s.payment_date >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', s.payment_date)
      ORDER BY month_date ASC
    `);

    res.json({
      success: true,
      monthly: result.rows,
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
