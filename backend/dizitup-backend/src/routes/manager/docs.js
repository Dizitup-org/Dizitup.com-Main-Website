// src/routes/manager/docs.js
// ============================================================
// MANAGER DOCS — /api/manager/docs
// ============================================================
// Manager receives docs from admin and can forward to employees.
//
// GET  /inbox         — docs received from admin
// GET  /sent          — docs forwarded to employees
// POST /forward/:id   — forward a received doc to an employee
// ============================================================

const express = require('express');
const multer  = require('multer');
const db      = require('../../db');
const { uploadToCloudinary } = require('../../utils/cloudinary');

const router = express.Router();

// Accepted document mimetypes
const ALLOWED_DOC_MIMETYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const ALLOWED_ALL_MIMETYPES = [
  ...ALLOWED_DOC_MIMETYPES,
  'image/jpeg', 'image/png', 'image/webp',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_ALL_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, Word (doc/docx), Excel (xls/xlsx), and images are allowed'));
    }
  },
});

// ----------------------------------------------------------
// GET /api/manager/docs/inbox — docs sent to this manager by admin
// ----------------------------------------------------------
router.get('/inbox', async (req, res, next) => {
  try {
    // Get the admin_id for this manager
    const adminRes = await db.query(
      `SELECT id FROM admins WHERE user_id = $1`, [req.user.id]
    );
    if (adminRes.rows.length === 0) {
      return res.json({ success: true, docs: [] });
    }
    const adminId = adminRes.rows[0].id;

    const result = await db.query(`
      SELECT id, title, description, file_url, file_name, file_size,
             uploaded_by_name, created_at
      FROM staff_docs
      WHERE sent_to_role = 'manager'
        AND sent_to_id = $1
        AND forwarded_from IS NULL
      ORDER BY created_at DESC
    `, [adminId]);

    res.json({ success: true, docs: result.rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// GET /api/manager/docs/sent — docs forwarded by this manager
// ----------------------------------------------------------
router.get('/sent', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT id, title, description, file_url, file_name, file_size,
             sent_to_name, forward_note, created_at
      FROM staff_docs
      WHERE uploaded_by = $1 AND sent_to_role = 'employee'
      ORDER BY created_at DESC
    `, [req.user.id]);

    res.json({ success: true, docs: result.rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// POST /api/manager/docs/forward/:id — forward a doc to employee
// Body: { employee_id, employee_name, note? }
// ----------------------------------------------------------
router.post('/forward/:id', async (req, res, next) => {
  try {
    const { employee_id, employee_name, note } = req.body;
    if (!employee_id) {
      return res.status(400).json({ success: false, message: 'employee_id is required' });
    }

    // Fetch the original doc
    const docRes = await db.query(
      `SELECT * FROM staff_docs WHERE id = $1 AND sent_to_role = 'manager'`,
      [req.params.id]
    );
    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doc not found' });
    }
    const original = docRes.rows[0];

    // Get manager's name
    const mgr = await db.query(
      `SELECT first_name, last_name FROM users WHERE id = $1`, [req.user.id]
    );
    const mgrName = mgr.rows[0]
      ? `${mgr.rows[0].first_name || ''} ${mgr.rows[0].last_name || ''}`.trim()
      : 'Manager';

    // Insert forwarded copy (same file_url, linked via forwarded_from)
    const result = await db.query(`
      INSERT INTO staff_docs
        (title, description, file_url, file_name, file_size,
         uploaded_by, uploaded_by_name,
         sent_to_role, sent_to_id, sent_to_name,
         forwarded_from, forward_note)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'employee', $8, $9, $10, $11)
      RETURNING *
    `, [
      original.title,
      original.description,
      original.file_url,
      original.file_name,
      original.file_size,
      req.user.id,
      mgrName,
      employee_id,
      employee_name?.trim() || 'Employee',
      original.id,
      note?.trim() || null,
    ]);

    res.status(201).json({ success: true, doc: result.rows[0] });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// POST /api/manager/docs/upload — upload a doc directly to employee
// multipart/form-data: file, title, description, employee_id, employee_name
// ----------------------------------------------------------
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const { title, description, employee_id, employee_name } = req.body;
    if (!title || !employee_id) {
      return res.status(400).json({ success: false, message: 'Title and employee_id are required' });
    }

    const isImage = req.file.mimetype.startsWith('image/');
    const isPdf   = req.file.mimetype === 'application/pdf';
    const uploaded = await uploadToCloudinary(req.file.buffer, {
      folder:          'dizitup/docs',
      resource_type:   isImage ? 'image' : 'raw',
      ...(!isImage && {
        use_filename:    true,
        unique_filename: true,
        ...(isPdf && { format: 'pdf' }),
      }),
    });

    const mgr = await db.query(
      `SELECT first_name, last_name FROM users WHERE id = $1`, [req.user.id]
    );
    const mgrName = mgr.rows[0]
      ? `${mgr.rows[0].first_name || ''} ${mgr.rows[0].last_name || ''}`.trim()
      : 'Manager';

    const result = await db.query(`
      INSERT INTO staff_docs
        (title, description, file_url, file_name, file_size,
         uploaded_by, uploaded_by_name,
         sent_to_role, sent_to_id, sent_to_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'employee', $8, $9)
      RETURNING *
    `, [
      title.trim(),
      description?.trim() || null,
      uploaded.url,
      req.file.originalname,
      req.file.size,
      req.user.id,
      mgrName,
      employee_id,
      employee_name?.trim() || 'Employee'
    ]);

    res.status(201).json({ success: true, doc: result.rows[0] });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// DELETE /api/manager/docs/:id — delete a sent/uploaded doc
// ----------------------------------------------------------
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      `DELETE FROM staff_docs WHERE id = $1 AND uploaded_by = $2 AND sent_to_role = 'employee' RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found or not authorized' });
    }
    res.json({ success: true, message: 'Document deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
