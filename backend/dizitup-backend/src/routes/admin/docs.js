// src/routes/admin/docs.js
// ============================================================
// ADMIN DOCS — /api/admin/docs
// ============================================================
// Admin uploads official PDFs (contracts, etc.) and sends them
// to a specific manager. Chain: Admin → Manager → Employee only.
//
// GET  /              — list all docs admin has sent
// POST /              — upload PDF + send to manager
// DELETE /:id         — delete a doc (admin only)
// ============================================================

const express = require('express');
const multer  = require('multer');
const db      = require('../../db');
const { uploadToCloudinary } = require('../../utils/cloudinary');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 20 * 1024 * 1024 }, // 20MB for documents
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed in Docs'));
    }
  },
});

// Auto-create staff_docs table
(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS staff_docs (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        title           TEXT        NOT NULL,
        description     TEXT,
        file_url        TEXT        NOT NULL,
        file_name       VARCHAR(255),
        file_size       INTEGER,
        uploaded_by     UUID,
        uploaded_by_name VARCHAR(255),
        sent_to_role    VARCHAR(20)  NOT NULL DEFAULT 'manager',
        sent_to_id      UUID,
        sent_to_name    VARCHAR(255),
        forwarded_from  UUID        REFERENCES staff_docs(id) ON DELETE SET NULL,
        forward_note    TEXT,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_staff_docs_sent_to ON staff_docs(sent_to_id, sent_to_role)`).catch(() => {});
  } catch (err) {
    console.error('staff_docs table init error:', err.message);
  }
})();

// ----------------------------------------------------------
// GET /api/admin/docs — all docs sent by admin
// ----------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT id, title, description, file_url, file_name, file_size,
             sent_to_role, sent_to_id, sent_to_name, created_at
      FROM staff_docs
      WHERE uploaded_by = $1 AND forwarded_from IS NULL
      ORDER BY created_at DESC
    `, [req.user.id]);
    res.json({ success: true, docs: result.rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// POST /api/admin/docs — upload PDF + send to manager
// multipart/form-data: file, title, description?, manager_id, manager_name
// ----------------------------------------------------------
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'PDF file is required' });
    }
    const { title, description, manager_id, manager_name } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'title is required' });
    }
    if (!manager_id) {
      return res.status(400).json({ success: false, message: 'manager_id is required' });
    }

    // Upload to Cloudinary
    const uploaded = await uploadToCloudinary(req.file.buffer, {
      folder:        'dizitup/docs',
      resource_type: 'raw',
    });

    // Get uploader's name
    const adminRes = await db.query(
      `SELECT first_name, last_name FROM users WHERE id = $1`,
      [req.user.id]
    );
    const adminName = adminRes.rows[0]
      ? `${adminRes.rows[0].first_name || ''} ${adminRes.rows[0].last_name || ''}`.trim()
      : 'Admin';

    const result = await db.query(`
      INSERT INTO staff_docs
        (title, description, file_url, file_name, file_size, uploaded_by, uploaded_by_name,
         sent_to_role, sent_to_id, sent_to_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'manager', $8, $9)
      RETURNING *
    `, [
      title.trim(),
      description?.trim() || null,
      uploaded.url,
      req.file.originalname,
      req.file.size,
      req.user.id,
      adminName,
      manager_id,
      manager_name?.trim() || 'Manager',
    ]);

    res.status(201).json({ success: true, doc: result.rows[0] });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// DELETE /api/admin/docs/:id — remove a doc (admin only)
// ----------------------------------------------------------
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      `DELETE FROM staff_docs WHERE id = $1 AND uploaded_by = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doc not found or not yours' });
    }
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
