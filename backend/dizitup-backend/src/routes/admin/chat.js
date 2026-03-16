// src/routes/admin/chat.js
// ============================================================
// ADMIN CHAT ROUTES
// ============================================================
// GET  /api/admin/chat/conversations          → list all conversations
// GET  /api/admin/chat/messages/:conversationId → messages for one thread
// POST /api/admin/chat/message                → admin sends a reply
// ============================================================

const express = require('express');
const db = require('../../db');
const router = express.Router();

// ----------------------------------------------------------
// GET /api/admin/chat/conversations
// ----------------------------------------------------------
router.get('/conversations', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        cc.id,
        cc.status,
        cc.last_message_at,
        cc.created_at,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        (
          SELECT COUNT(*)::int FROM chat_messages cm
          WHERE cm.conversation_id = cc.id
            AND cm.sender_type = 'user'
            AND cm.is_read = FALSE
        ) AS unread_count,
        (
          SELECT message FROM chat_messages cm
          WHERE cm.conversation_id = cc.id
          ORDER BY cm.created_at DESC LIMIT 1
        ) AS last_message
      FROM chat_conversations cc
      JOIN users u ON u.id = cc.user_id
      ORDER BY cc.last_message_at DESC
    `);
    res.json({ success: true, conversations: result.rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// GET /api/admin/chat/messages/:conversationId
// ----------------------------------------------------------
router.get('/messages/:conversationId', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, sender_type, sender_id, message, is_read, created_at
       FROM chat_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [req.params.conversationId]
    );
    res.json({ success: true, messages: result.rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// POST /api/admin/chat/message
// ----------------------------------------------------------
// Body: { conversationId, message }
// Marks all unread user messages in the conversation as read.
// ----------------------------------------------------------
router.post('/message', async (req, res, next) => {
  try {
    const { conversationId, message } = req.body;
    if (!conversationId || !message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'conversationId and message are required' });
    }

    // Mark user messages in this convo as read
    await db.query(
      `UPDATE chat_messages SET is_read = TRUE
       WHERE conversation_id = $1 AND sender_type = 'user' AND is_read = FALSE`,
      [conversationId]
    );

    // Insert admin reply
    const result = await db.query(
      `INSERT INTO chat_messages (conversation_id, sender_type, message)
       VALUES ($1, 'admin', $2)
       RETURNING id, sender_type, message, is_read, created_at`,
      [conversationId, message.trim()]
    );

    await db.query(
      'UPDATE chat_conversations SET last_message_at = NOW() WHERE id = $1',
      [conversationId]
    );

    res.status(201).json({ success: true, message: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
