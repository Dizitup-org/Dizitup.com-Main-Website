// src/routes/admin/projects.js
// ============================================================
// ADMIN — PROJECTS
// ============================================================
// GET  /api/admin/projects → all projects with client info
// POST /api/admin/projects → create a new project by client name
// ============================================================

const express     = require('express');
const db          = require('../../db');
const { protect } = require('../../middleware/auth');
const { isAdmin } = require('../../middleware/isAdmin');

const router = express.Router();

// Apply auth to all routes in this file
router.use(protect, isAdmin);

// ----------------------------------------------------------
// GET /api/admin/projects
// ----------------------------------------------------------
// p.title aliased as project_name; client_name aliased as brand_name.
// ----------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        p.id,
        p.title         AS project_name,
        p.client_name   AS brand_name,
        p.created_at
      FROM projects p
      ORDER BY p.created_at DESC
    `);

    res.json({ success: true, projects: result.rows });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------
// POST /api/admin/projects
// ----------------------------------------------------------
// Body: { project_name (required), client_id? (UUID), client_name? }
// Inserts directly — no client lookup or validation.
// Run once if needed:
//   ALTER TABLE projects ALTER COLUMN client_id DROP NOT NULL;
//   ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_name TEXT;
// ----------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const brand_name = req.body.brand_name || req.body.client_name;
    const { client_id, project_name } = req.body;

    if (!project_name || !project_name.trim()) {
      return res.status(400).json({ success: false, error: 'project_name is required' });
    }

    const result = await db.query(`
      INSERT INTO projects (client_id, client_name, title)
      VALUES ($1, $2, $3)
      RETURNING id, client_id, client_name AS brand_name, title AS project_name, created_at
    `, [client_id ?? null, brand_name ? brand_name.trim() : null, project_name.trim()]);

    res.status(201).json({ success: true, project: result.rows[0] });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------
// DELETE /api/admin/projects/:id
// ----------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------
// POST /api/admin/projects/:id/updates
// ----------------------------------------------------------
// Post an admin update message against a project.
// Body: { message }
// Table is auto-created on first use.
// ----------------------------------------------------------
router.post('/:id/updates', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, error: 'message is required' });
    }

    // Ensure table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS project_updates (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        message     TEXT        NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const result = await db.query(
      `INSERT INTO project_updates (project_id, message) VALUES ($1, $2) RETURNING *`,
      [req.params.id, String(message).trim()]
    );

    res.status(201).json({ success: true, update: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/projects/:id/updates — fetch all updates for a project
router.get('/:id/updates', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM project_updates WHERE project_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, updates: result.rows });
  } catch (err) {
    console.error('[GET /projects/:id/updates]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

