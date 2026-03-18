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
// GET /:channel — fetch last 50 messages
// ----------------------------------------------------------
router.get('/:channel', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, sender_name, message, created_at
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
// Body: { message: string, sender_name: string }
// ----------------------------------------------------------
router.post('/:channel', async (req, res, next) => {
  try {
    const { message, sender_name } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }
    const name = (sender_name || 'Unknown').trim();
    const result = await db.query(
      `INSERT INTO team_messages (channel, sender_name, message)
       VALUES ($1, $2, $3)
       RETURNING id, sender_name, message, created_at`,
      [req.params.channel, name, message.trim()]
    );
    res.json({ success: true, message: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
