// src/routes/staff-chat.js
// ============================================================
// TEAM / CHANNEL-BASED CHAT — /api/staff/chat
// ============================================================
// Accessible by admin, manager, and employee roles.
// Uses a simple channel string key (e.g. 'admin_manager',
// 'manager_employee_uuid') to separate conversations.
//
// GET  /:channel              — last 50 messages (newest at bottom)
// POST /:channel              — send a text message
// POST /:channel/upload       — upload an image or PDF (multipart)
// DELETE /:channel/messages/:id — delete own message
// ============================================================

const express  = require('express');
const multer   = require('multer');
const db       = require('../db');
const { uploadToCloudinary } = require('../utils/cloudinary');

const router = express.Router();

// multer: memory storage — file lands in req.file.buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG/PNG/WEBP/GIF) and PDFs are allowed'));
    }
  },
});

// Auto-create / migrate team_messages table on startup
(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS team_messages (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        channel     VARCHAR(200) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        message     TEXT,
        sender_id   UUID,
        media_url   TEXT,
        media_type  VARCHAR(50),
        file_name   VARCHAR(255),
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    // Add media columns to existing table if not present (idempotent)
    await db.query(`ALTER TABLE team_messages ADD COLUMN IF NOT EXISTS media_url TEXT`).catch(() => {});
    await db.query(`ALTER TABLE team_messages ADD COLUMN IF NOT EXISTS media_type VARCHAR(50)`).catch(() => {});
    await db.query(`ALTER TABLE team_messages ADD COLUMN IF NOT EXISTS file_name VARCHAR(255)`).catch(() => {});
    await db.query(`ALTER TABLE team_messages ADD COLUMN IF NOT EXISTS sender_id UUID`).catch(() => {});
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_team_msg_channel ON team_messages(channel, created_at)`
    ).catch(() => {});
  } catch (err) {
    console.error('Team chat table init error:', err.message);
  }
})();

// ----------------------------------------------------------
// PERMISSION VALIDATION HELPER
// ----------------------------------------------------------
const validateChannelAccess = (channel, userRole, userId) => {
  if (channel === 'admin_manager') {
    return userRole === 'admin' || userRole === 'manager';
  }
  if (channel.startsWith('manager_employee_')) {
    if (userRole === 'admin' || userRole === 'manager') return true;
    const employeeIdInChannel = channel.replace('manager_employee_', '');
    return userRole === 'employee' && userId === employeeIdInChannel;
  }
  return true;
};

// ----------------------------------------------------------
// GET /:channel — fetch last 50 messages
// ----------------------------------------------------------
router.get('/:channel', async (req, res, next) => {
  try {
    const userRole = req.admin?.role || 'employee';
    if (!validateChannelAccess(req.params.channel, userRole, req.user?.id)) {
      return res.status(403).json({ success: false, message: 'Access denied to this channel' });
    }
    const result = await db.query(
      `SELECT id, sender_name, message, sender_id, media_url, media_type, file_name, created_at
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
// POST /:channel — send a text message
// Body: { message: string, sender_name: string, sender_id?: string }
// ----------------------------------------------------------
router.post('/:channel', async (req, res, next) => {
  try {
    const { message, sender_name, sender_id } = req.body;
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
       RETURNING id, sender_name, message, sender_id, media_url, media_type, file_name, created_at`,
      [req.params.channel, name, message.trim(), sender_id || null]
    );
    res.json({ success: true, message: result.rows[0] });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// POST /:channel/upload — send image or PDF
// multipart/form-data: file (required), sender_name (required), sender_id (optional)
// ----------------------------------------------------------
router.post('/:channel/upload', upload.single('file'), async (req, res, next) => {
  try {
    const userRole = req.admin?.role || 'employee';
    if (!validateChannelAccess(req.params.channel, userRole, req.user?.id)) {
      return res.status(403).json({ success: false, message: 'Access denied to this channel' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { sender_name, sender_id } = req.body;
    const isPdf = req.file.mimetype === 'application/pdf';

    // Upload to Cloudinary
    const uploaded = await uploadToCloudinary(req.file.buffer, {
      folder:        'dizitup/chat',
      resource_type: isPdf ? 'raw' : 'image',
    });

    const mediaType = isPdf ? 'pdf' : 'image';
    const name      = (sender_name || 'Unknown').trim();

    const result = await db.query(
      `INSERT INTO team_messages (channel, sender_name, sender_id, media_url, media_type, file_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, sender_name, message, sender_id, media_url, media_type, file_name, created_at`,
      [req.params.channel, name, sender_id || null, uploaded.url, mediaType, req.file.originalname]
    );

    res.json({ success: true, message: result.rows[0] });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// DELETE /:channel/messages/:id — delete own message
// ----------------------------------------------------------
router.delete('/:channel/messages/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      `DELETE FROM team_messages WHERE id = $1 AND sender_id = $2 RETURNING id`,
      [req.params.id, req.user?.id]
    );
    if (result.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not your message or not found' });
    }
    res.json({ success: true, deleted: result.rows[0].id });
  } catch (err) { next(err); }
});

module.exports = router;
