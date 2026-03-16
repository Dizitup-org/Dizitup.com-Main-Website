// src/routes/chat.js
// ============================================================
// USER CHAT ROUTES (authenticated)
// ============================================================
// GET  /api/chat/conversation  → get or create conversation
// GET  /api/chat/messages      → all messages (for polling)
// POST /api/chat/message       → send a message
// ============================================================

const express = require('express');
const db = require('../db');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Auto-create chat tables on first load
(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status          VARCHAR(20) DEFAULT 'open',
        last_message_at TIMESTAMPTZ DEFAULT NOW(),
        created_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID        NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
        sender_type     VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'admin')),
        sender_id       UUID,
        message         TEXT        NOT NULL,
        is_read         BOOLEAN     DEFAULT FALSE,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON chat_messages(conversation_id, created_at)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_chat_conv_user ON chat_conversations(user_id)`).catch(() => {});
  } catch (err) {
    console.error('Chat table init error:', err.message);
  }
})();

// ----------------------------------------------------------
// GET /api/chat/conversation
// ----------------------------------------------------------
// Returns existing conversation for user, or creates one.
// ----------------------------------------------------------
router.get('/conversation', protect, async (req, res, next) => {
  try {
    let result = await db.query(
      'SELECT id, status, last_message_at, created_at FROM chat_conversations WHERE user_id = $1 LIMIT 1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      result = await db.query(
        'INSERT INTO chat_conversations (user_id) VALUES ($1) RETURNING id, status, last_message_at, created_at',
        [req.user.id]
      );
    }
    res.json({ success: true, conversation: result.rows[0] });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// GET /api/chat/messages
// ----------------------------------------------------------
// Returns all messages for the user's conversation.
// Marks admin messages as read when user fetches.
// ----------------------------------------------------------
router.get('/messages', protect, async (req, res, next) => {
  try {
    const convResult = await db.query(
      'SELECT id FROM chat_conversations WHERE user_id = $1 LIMIT 1',
      [req.user.id]
    );
    if (convResult.rows.length === 0) {
      return res.json({ success: true, messages: [], conversationId: null });
    }
    const conversationId = convResult.rows[0].id;

    // Mark admin messages as read
    await db.query(
      `UPDATE chat_messages SET is_read = TRUE
       WHERE conversation_id = $1 AND sender_type = 'admin' AND is_read = FALSE`,
      [conversationId]
    );

    const messages = await db.query(
      `SELECT id, sender_type, message, is_read, created_at
       FROM chat_messages WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversationId]
    );
    res.json({ success: true, messages: messages.rows, conversationId });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// POST /api/chat/message
// ----------------------------------------------------------
// Body: { message: string }
// ----------------------------------------------------------
router.post('/message', protect, async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    // Get or create conversation
    let convResult = await db.query(
      'SELECT id FROM chat_conversations WHERE user_id = $1 LIMIT 1',
      [req.user.id]
    );
    if (convResult.rows.length === 0) {
      convResult = await db.query(
        'INSERT INTO chat_conversations (user_id) VALUES ($1) RETURNING id',
        [req.user.id]
      );
    }
    const conversationId = convResult.rows[0].id;

    const result = await db.query(
      `INSERT INTO chat_messages (conversation_id, sender_type, sender_id, message)
       VALUES ($1, 'user', $2, $3)
       RETURNING id, sender_type, message, is_read, created_at`,
      [conversationId, req.user.id, message.trim()]
    );

    await db.query(
      'UPDATE chat_conversations SET last_message_at = NOW() WHERE id = $1',
      [conversationId]
    );

    res.status(201).json({ success: true, message: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
