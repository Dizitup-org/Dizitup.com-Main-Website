// src/routes/bookings.js
// ============================================================
// PUBLIC BOOKING ROUTES
// ============================================================
// POST /api/bookings  → create new booking
// ============================================================

const express = require('express');
const db = require('../db');
const { AppError } = require('../utils/errors');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ----------------------------------------------------------
// POST /api/bookings
// ----------------------------------------------------------
// Body: { name, email, agency, project_type, meeting_date, meeting_time, notes, status }
//
// Flow:
//   1. Validate all required inputs
//   2. Insert booking into bookings table
//   3. Return success response
// ----------------------------------------------------------
router.post('/', protect, async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      agency,
      project_type,
      meeting_date,
      meeting_time,
      notes,
      status
    } = req.body;

    // Validate required fields
    if (!name || !email || !agency || !project_type || !meeting_date || !meeting_time) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, agency, project_type, meeting_date, meeting_time'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Use the authenticated user's ID directly
    const user_id = req.user.id;

    // Insert booking into database using parameterized query
    const result = await db.query(
      `INSERT INTO bookings (user_id, name, email, phone, agency, project_type, meeting_date, meeting_time, notes, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING id`,
      [user_id, name, email, phone || null, agency, project_type, meeting_date, meeting_time, notes || '', status || 'pending']
    );

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Booking created'
    });

  } catch (err) {
    // Handle database constraint errors
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Booking with this information already exists'
      });
    }
    
    next(err);
  }
});

module.exports = router;