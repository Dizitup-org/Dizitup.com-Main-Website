const express = require('express');
const db = require('../db');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/me', protect, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone, u.business_name,
              a.role as admin_role
       FROM users u
       LEFT JOIN admins a ON a.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'User not found.' });
    const row = result.rows[0];
    const isAdmin = !!row.admin_role;
    res.json({
      success: true,
      user: {
        id: row.id, username: row.username, email: row.email,
        first_name: row.first_name, last_name: row.last_name,
        phone: row.phone, business_name: row.business_name,
        isAdmin,
        adminRole: row.admin_role || null
      }
    });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// GET /api/user/my-project
// ----------------------------------------------------------
// Returns the authenticated client's projects and admin updates.
// Looks up the onboard_clients row linked to this user.
// Each project includes its updates feed (newest first).
// ----------------------------------------------------------
// ----------------------------------------------------------
// GET /api/user/my-bookings
// ----------------------------------------------------------
// Returns all bookings submitted by this user's email.
// ----------------------------------------------------------
router.get('/my-bookings', protect, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, agency, project_type, meeting_date, meeting_time, status, notes, created_at
       FROM bookings
       WHERE email = (SELECT email FROM users WHERE id = $1)
         AND status != 'meeting_done'
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, bookings: result.rows });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------
// GET /api/user/client-status
// ----------------------------------------------------------
// Returns whether the logged-in user is 'onboarded', 'follow_up', or 'none'.
// Used by the frontend booking gate.
// ----------------------------------------------------------
router.get('/client-status', protect, async (req, res, next) => {
  try {
    const onboarded = await db.query(
      'SELECT id FROM onboard_clients WHERE user_id = $1 LIMIT 1',
      [req.user.id]
    );
    if (onboarded.rows.length > 0) {
      return res.json({ success: true, clientStatus: 'onboarded' });
    }
    const followUp = await db.query(
      'SELECT id FROM query_clients WHERE user_id = $1 LIMIT 1',
      [req.user.id]
    );
    if (followUp.rows.length > 0) {
      return res.json({ success: true, clientStatus: 'follow_up' });
    }
    res.json({ success: true, clientStatus: 'none' });
  } catch (err) { next(err); }
});

router.get('/my-project', protect, async (req, res, next) => {
  try {
    // Find the onboarded client linked to this user
    const clientResult = await db.query(
      'SELECT id, contact_name, company_name FROM onboard_clients WHERE user_id = $1',
      [req.user.id]
    );

    if (clientResult.rows.length === 0) {
      return res.json({ success: true, projects: [] });
    }

    const clientId = clientResult.rows[0].id;

    // Fetch projects with their updates
    const projectsResult = await db.query(
      `SELECT
         p.id,
         p.title,
         p.description,
         p.status,
         p.total_amount,
         p.start_date,
         p.end_date,
         p.deadline,
         p.created_at,
         COALESCE(
           JSON_AGG(
             JSON_BUILD_OBJECT('id', pu.id, 'message', pu.message, 'created_at', pu.created_at)
             ORDER BY pu.created_at DESC
           ) FILTER (WHERE pu.id IS NOT NULL),
           '[]'
         ) AS updates
       FROM projects p
       LEFT JOIN project_updates pu ON pu.project_id = p.id
       WHERE p.client_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [clientId]
    );

    res.json({ success: true, projects: projectsResult.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;