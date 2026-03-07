// src/routes/visitorProfile.js
// ============================================================
// VISITOR PROFILE ROUTES
// ============================================================
// GET  /api/visitor-profile  → get visitor profile by device_id
// POST /api/visitor-profile  → create/update visitor profile
// ============================================================

const express = require('express');
const db = require('../db');
const { AppError } = require('../utils/errors');

const router = express.Router();

// ----------------------------------------------------------
// GET /api/visitor-profile?device_id=...
// ----------------------------------------------------------
// Query params: { device_id }
//
// Flow:
//   1. Validate device_id is provided
//   2. For now, return placeholder response
//   3. Later: query database for visitor profile
// ----------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const { device_id } = req.query;

    // Validate device_id is provided
    if (!device_id) {
      return res.status(400).json({
        success: false,
        error: 'device_id query parameter is required'
      });
    }

    // For now, return placeholder response
    // TODO: Implement database query when visitor_profiles table is created
    res.json({
      success: true,
      device_id: device_id,
      profile: null
    });

  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------
// POST /api/visitor-profile
// ----------------------------------------------------------
// Body: { device_id, ...profile_data }
//
// Flow:
//   1. Validate request body
//   2. For now, return success response
//   3. Later: create/update visitor profile in database
// ----------------------------------------------------------
router.post('/', async (req, res, next) => {
  try {
    const { device_id, ...profileData } = req.body;

    // Validate device_id is provided
    if (!device_id) {
      return res.status(400).json({
        success: false,
        error: 'device_id is required in request body'
      });
    }

    // For now, return placeholder response
    // TODO: Implement database insert/update when visitor_profiles table is created
    res.json({
      success: true,
      device_id: device_id,
      profile: {
        device_id: device_id,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;