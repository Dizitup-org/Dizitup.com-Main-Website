// src/routes/staff-chat.js
// ============================================================
// TEAM / CHANNEL-BASED CHAT — /api/staff/chat
// ============================================================
// Accessible by admin, manager, and employee roles.
// Uses a simple channel string key (e.g. 'admin_manager',
// 'manager_employee_uuid') to separate conversations.
//
// GET  /:channel — last 50 messages (newest at bottom)
// POST /:channel — send a message
// ============================================================

const express = require('express');
const db = require('../db');
const router = express.Router();

// Auto-create team_messages table on startup
(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS team_messages (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        channel     VARCHAR(200) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        message     TEXT        NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_team_msg_channel ON team_messages(channel, created_at)`
    ).catch(() => {});
  } catch (err) {
    console.error('Team chat table init error:', err.message);
  }
})();

// ----------------------------------------------------------
// PERMISSION VALIDATION HELPER
// Validates channel access based on user role
// ----------------------------------------------------------
const validateChannelAccess = (channel, userRole, userId) => {
  // admin_manager: only admin and manager
  if (channel === 'admin_manager') {
    return userRole === 'admin' || userRole === 'manager';
  }
  
  // manager_employee_*: admin and manager always allowed, employee only if userId matches
  if (channel.startsWith('manager_employee_')) {
    if (userRole === 'admin' || userRole === 'manager') {
      return true;
    }
    // Employee: only if userId in channel matches their ID
    const employeeIdInChannel = channel.split('_')[2]; // manager_employee_{userId}
    return userRole === 'employee' && userId === employeeIdInChannel;
  }
  
  return true; // default allow
};

// ----------------------------------------------------------
// GET /:channel — fetch last 50 messages
// ----------------------------------------------------------
router.get('/:channel', async (req, res, next) => {
  try {
    // req.admin is attached by isAdmin middleware
    const userRole = req.admin?.role || 'employee';
    
    if (!validateChannelAccess(req.params.channel, userRole, req.user?.id)) {
      return res.status(403).json({ success: false, message: 'Access denied to this channel' });
    }
    
    const result = await db.query(
      `SELECT id, sender_name, message, sender_id, created_at
       FROM team_messages
       WHERE channel = $1
       ORDER BY created_at ASC
       LIMIT 50`,
      [req.params.channel]
    );
    res.json({ success: true, messages: result.rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// POST /:channel — send a message
// Body: { message: string, sender_name: string, sender_id?: string }
// ----------------------------------------------------------
router.post('/:channel', async (req, res, next) => {
  try {
    const { message, sender_name, sender_id } = req.body;
    
    // req.admin is attached by isAdmin middleware
    const userRole = req.admin?.role || 'employee';
    
    if (!validateChannelAccess(req.params.channel, userRole, req.user?.id)) {
      return res.status(403).json({ success: false, message: 'Access denied to this channel' });
    }
    
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }
    
    const name = (sender_name || 'Unknown').trim();
    const result = await db.query(
      `INSERT INTO team_messages (channel, sender_name, message, sender_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, sender_name, message, sender_id, created_at`,
      [req.params.channel, name, message.trim(), sender_id || null]
    );
    res.json({ success: true, message: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
