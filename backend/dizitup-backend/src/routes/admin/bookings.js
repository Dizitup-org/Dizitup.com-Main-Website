// src/routes/admin/bookings.js
// ============================================================
// ADMIN — BOOKINGS TAB
// ============================================================
// GET    /api/admin/bookings           → all bookings
// PATCH  /api/admin/bookings/:id/status → update status
//          (follow_up auto-creates query_clients via trigger)
// POST   /api/admin/bookings/:id/onboard → convert to client
// ============================================================

const express = require('express');
const db = require('../../db');
const { AppError } = require('../../utils/errors');
const { validators } = require('../../middleware/validate');

const router = express.Router();

// ----------------------------------------------------------
// Schema migration + auto-cleanup for declined bookings
// ----------------------------------------------------------
(async () => {
  try {
    // Add declined_at column if it doesn't exist
    await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ`);
    
    // Run cleanup job on startup and every hour
    const cleanupDeclinedBookings = async () => {
      try {
        const result = await db.query(`
          DELETE FROM bookings 
          WHERE status = 'declined' 
          AND declined_at IS NOT NULL 
          AND declined_at < NOW() - INTERVAL '24 hours'
        `);
        if (result.rowCount > 0) {
          console.log(`[Bookings cleanup] Deleted ${result.rowCount} declined bookings older than 24 hours`);
        }
      } catch (err) {
        console.error('[Bookings cleanup error]', err.message);
      }
    };
    
    // Run cleanup immediately
    await cleanupDeclinedBookings();
    
    // Run cleanup every hour
    setInterval(cleanupDeclinedBookings, 60 * 60 * 1000);
  } catch (err) {
    console.error('[Bookings schema migration error]', err.message);
  }
})();

// ----------------------------------------------------------
// GET /api/admin/bookings
// ----------------------------------------------------------
// Full booking list with user details joined in.
// Frontend can filter by status using query param:
//   /api/admin/bookings?status=pending
// ----------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;

    // Build WHERE clause conditionally
    // $1 will be the status if provided, otherwise we skip the filter
    let query = `
      SELECT
        b.id,
        b.name,
        b.email,
        u.phone,
        b.agency,
        b.project_type,
        b.notes,
        b.meeting_date,
        b.meeting_time,
        b.status,
        b.created_at,
        u.username,
        -- Is there already a query_clients record?
        (SELECT EXISTS(SELECT 1 FROM query_clients qc WHERE qc.booking_id = b.id)) AS has_follow_up,
        -- Is there already an onboarded client?
        (SELECT EXISTS(SELECT 1 FROM onboard_clients oc WHERE oc.booking_id = b.id)) AS is_onboarded
      FROM bookings b
      LEFT JOIN users u ON u.id = b.user_id
    `;

    const values = [];
    if (status) {
      query += ` WHERE b.status = $1`;
      values.push(status);
    }

    query += ` ORDER BY b.created_at DESC`;

    const result = await db.query(query, values);

    res.json({
      success:  true,
      bookings: result.rows,
    });

  } catch (err) {
    next(err);
  }
});


// ----------------------------------------------------------
// GET /api/admin/bookings/:id
// ----------------------------------------------------------
// Single booking detail
// ----------------------------------------------------------
router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT
         b.*,
         u.first_name, u.last_name, u.email, u.phone, u.business_name
       FROM bookings b
       LEFT JOIN users u ON u.id = b.user_id
       WHERE b.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) throw new AppError('Booking not found.', 404);

    res.json({ success: true, booking: result.rows[0] });

  } catch (err) {
    next(err);
  }
});


// ----------------------------------------------------------
// PATCH /api/admin/bookings/:id
// ----------------------------------------------------------
// Update booking status directly via body { status }
// ----------------------------------------------------------
router.patch('/:id', async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) throw new AppError('Status is required.', 400);

    const updateQuery = status === 'declined'
      ? `UPDATE bookings SET status = $1, declined_at = NOW() WHERE id = $2 RETURNING *`
      : `UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *`;

    const result = await db.query(
      updateQuery,
      [status, req.params.id]
    );

    if (result.rows.length === 0) throw new AppError('Booking not found.', 404);

    if (status === 'follow_up') {
      const bookingRow = await db.query(
        'SELECT user_id FROM bookings WHERE id = $1',
        [req.params.id]
      );
      const user_id = bookingRow.rows[0]?.user_id;
      if (!user_id) throw new AppError('Booking has no associated user_id.', 400);

      const existing = await db.query(
        'SELECT id FROM query_clients WHERE booking_id = $1',
        [req.params.id]
      );
      if (existing.rows.length === 0) {
        // Fetch booking data and user phone
        const bookingData = await db.query(
          `SELECT b.name, b.email, u.phone FROM bookings b
           LEFT JOIN users u ON b.user_id = u.id
           WHERE b.id = $1`,
          [req.params.id]
        );
        const { name, email, phone } = bookingData.rows[0] || {};
        
        await db.query(
          `INSERT INTO query_clients (booking_id, user_id, name, email, phone) VALUES ($1, $2, $3, $4, $5)`,
          [req.params.id, user_id, name || null, email || null, phone || null]
        );
      }
    }

    res.json({ success: true, booking: result.rows[0] });

  } catch (err) {
    console.error('Admin route error [PATCH /bookings/:id]:', err);
    if (err.statusCode) return next(err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ----------------------------------------------------------
// PATCH /api/admin/bookings/:id/status
// ----------------------------------------------------------
// PATCH /api/admin/bookings/:id/status
// ----------------------------------------------------------
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      throw new AppError('Status is required', 400);
    }

    console.log(`Updating booking ${req.params.id} to status: ${status}`);

    const updateQuery = status === 'declined'
      ? `UPDATE bookings SET status = $1, declined_at = NOW() WHERE id = $2 RETURNING *`
      : `UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *`;

    const result = await db.query(
      updateQuery,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Booking not found', 404);
    }

    console.log('Booking updated successfully:', result.rows[0]);

    if (status === 'follow_up') {
      console.log('Creating query_clients record...');
      try {
        const userRow = await db.query(
          'SELECT user_id FROM bookings WHERE id = $1',
          [req.params.id]
        );
        const user_id = userRow.rows[0]?.user_id;
        if (!user_id) throw new AppError('Booking has no associated user_id.', 400);

        const existingQuery = await db.query(
          'SELECT id FROM query_clients WHERE booking_id = $1',
          [req.params.id]
        );
        
        if (existingQuery.rows.length === 0) {
          // Fetch booking data and user phone
          const bookingData = await db.query(
            `SELECT b.name, b.email, u.phone FROM bookings b
             LEFT JOIN users u ON b.user_id = u.id
             WHERE b.id = $1`,
            [req.params.id]
          );
          const { name, email, phone } = bookingData.rows[0] || {};
          
          await db.query(
            `INSERT INTO query_clients (booking_id, user_id, status, name, email, phone)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [req.params.id, user_id, 'active', name || null, email || null, phone || null]
          );
          console.log('Query client record created successfully');
        } else {
          console.log('Query client record already exists');
        }
      } catch (queryErr) {
        console.error('Error creating query_clients record:', queryErr);
        throw new AppError('Failed to create follow-up record: ' + queryErr.message, 500);
      }
    }

    res.json({
      success: true,
      booking: result.rows[0]
    });

  } catch (err) {
    console.error('STATUS UPDATE ERROR:', err);
    next(err);
  }
});

// ----------------------------------------------------------
// DELETE /api/admin/bookings/:id
// ----------------------------------------------------------
router.delete('/:id', async (req, res, next) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Remove child records that reference this booking first
    await client.query('DELETE FROM query_clients WHERE booking_id = $1', [req.params.id]);

    const result = await client.query(
      'DELETE FROM bookings WHERE id=$1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new AppError('Booking not found.', 404);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Booking deleted'
    });

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});


// ----------------------------------------------------------
// POST /api/admin/bookings/:id/onboard
// ----------------------------------------------------------
router.post('/:id/onboard', async (req, res, next) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    
    console.log(`Onboarding booking ${req.params.id}...`);

    const booking = await client.query(
      `SELECT b.user_id, b.name, b.email, b.agency, u.phone
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       WHERE b.id = $1`,
      [req.params.id]
    );

    if (booking.rows.length === 0) {
      throw new AppError('Booking not found', 404);
    }

    const { user_id, name, email, phone, agency } = booking.rows[0];
    console.log('Booking data retrieved:', { user_id, name, email, agency });

    if (!user_id) {
      throw new AppError('Booking has no associated user_id.', 400);
    }

    if (!name || !email) {
      throw new AppError('Booking missing required data (name or email)', 400);
    }

    console.log('Inserting into onboard_clients...');
    
    // Check if already onboarded
    const existingOnboard = await client.query(
      'SELECT id FROM onboard_clients WHERE booking_id = $1',
      [req.params.id]
    );
    
    if (existingOnboard.rows.length > 0) {
      throw new AppError('Booking is already onboarded', 400);
    }
    
    const onboardResult = await client.query(
      `INSERT INTO onboard_clients
       (user_id, booking_id, contact_name, email, phone, company_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, req.params.id, name, email, phone || null, agency || null]
    );

    console.log('Onboard client created:', onboardResult.rows[0]);

    console.log('Updating query_clients status to converted...');
    const updateResult = await client.query(
      `UPDATE query_clients
       SET status = 'converted'
       WHERE booking_id = $1
       RETURNING id`,
      [req.params.id]
    );
    
    console.log(`Updated ${updateResult.rows.length} query_clients records`);

    await client.query('COMMIT');
    console.log('Transaction committed successfully');

    res.json({
      success: true,
      client: onboardResult.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ONBOARD ERROR:', err);
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
