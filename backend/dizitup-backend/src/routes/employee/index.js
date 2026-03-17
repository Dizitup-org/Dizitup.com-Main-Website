// src/routes/employee/index.js
// ============================================================
// EMPLOYEE ROUTES — /api/employee
// ============================================================
// Auth guards (protect + isAdmin + requireRole) are applied
// at route registration in app.js, not here.
// ============================================================

const express = require('express');
const db = require('../../db');
const router = express.Router();

// ----------------------------------------------------------
// GET /api/employee/projects
// ----------------------------------------------------------
router.get('/projects', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT p.* FROM projects p
      JOIN project_assignments pa ON pa.project_id = p.id
      WHERE pa.employee_id = $1 AND pa.status = 'active'
      ORDER BY p.created_at DESC
    `, [req.admin.id]);
    res.json({ success: true, projects: result.rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// GET /api/employee/tasks
// ----------------------------------------------------------
router.get('/tasks', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT t.*, p.title as project_title FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.employee_id = $1 ORDER BY t.deadline ASC NULLS LAST
    `, [req.admin.id]);
    res.json({ success: true, tasks: result.rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// PATCH /api/employee/tasks/:id/status
// ----------------------------------------------------------
router.patch('/tasks/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'in_progress', 'completed', 'blocked'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const result = await db.query(
      `UPDATE tasks SET status = $1, updated_at = NOW()
       WHERE id = $2 AND employee_id = $3 RETURNING *`,
      [status, req.params.id, req.admin.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found or not assigned to you' });
    }

    res.json({ success: true, task: result.rows[0] });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// POST /api/employee/updates
// ----------------------------------------------------------
router.post('/updates', async (req, res, next) => {
  try {
    const { project_id, update_text } = req.body;
    if (!project_id || !update_text) {
      return res.status(400).json({ success: false, message: 'project_id and update_text are required' });
    }

    // Validate that this employee is assigned to the project
    const assigned = await db.query(
      `SELECT id FROM project_assignments
       WHERE project_id = $1 AND employee_id = $2 AND status = 'active'`,
      [project_id, req.admin.id]
    );

    if (assigned.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this project' });
    }

    const result = await db.query(
      `INSERT INTO project_updates (project_id, message, employee_id, author_role)
       VALUES ($1, $2, $3, 'employee') RETURNING *`,
      [project_id, update_text, req.admin.id]
    );

    res.json({ success: true, update: result.rows[0] });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// GET /api/employee/updates/:projectId
// ----------------------------------------------------------
router.get('/updates/:projectId', async (req, res, next) => {
  try {
    // Validate assignment first
    const assigned = await db.query(
      `SELECT id FROM project_assignments
       WHERE project_id = $1 AND employee_id = $2 AND status = 'active'`,
      [req.params.projectId, req.admin.id]
    );

    if (assigned.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this project' });
    }

    const result = await db.query(
      `SELECT * FROM project_updates WHERE project_id = $1 ORDER BY created_at DESC`,
      [req.params.projectId]
    );

    res.json({ success: true, updates: result.rows });
  } catch (err) { next(err); }
});

module.exports = router;
