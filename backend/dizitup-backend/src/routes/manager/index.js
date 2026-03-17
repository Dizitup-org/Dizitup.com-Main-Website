// src/routes/manager/index.js
// ============================================================
// MANAGER ROUTES — /api/manager
// ============================================================
// Auth guards (protect + isAdmin + requireRole) are applied
// at route registration in app.js, not here.
// ============================================================

const express = require('express');
const db = require('../../db');
const router = express.Router();

// ----------------------------------------------------------
// GET /api/manager/projects
// ----------------------------------------------------------
router.get('/projects', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT p.*,
        (SELECT COUNT(*) FROM project_assignments pa WHERE pa.project_id = p.id AND pa.status = 'active') as employee_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_tasks
      FROM projects p ORDER BY p.created_at DESC
    `);
    res.json({ success: true, projects: result.rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// GET /api/manager/team
// ----------------------------------------------------------
router.get('/team', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT a.id, a.role, u.username, u.email, u.first_name, u.last_name, u.phone,
        (SELECT COUNT(*) FROM project_assignments pa WHERE pa.employee_id = a.id AND pa.status = 'active') as active_projects
      FROM admins a JOIN users u ON u.id = a.user_id
      WHERE a.role = 'employee' ORDER BY u.first_name
    `);
    res.json({ success: true, employees: result.rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// GET /api/manager/project/:projectId/assignments
// ----------------------------------------------------------
router.get('/project/:projectId/assignments', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT pa.*, a.role, u.username, u.email, u.first_name, u.last_name
      FROM project_assignments pa
      JOIN admins a ON a.id = pa.employee_id
      JOIN users u ON u.id = a.user_id
      WHERE pa.project_id = $1 AND pa.status = 'active'
    `, [req.params.projectId]);
    res.json({ success: true, assignments: result.rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// POST /api/manager/project/:projectId/assign
// ----------------------------------------------------------
router.post('/project/:projectId/assign', async (req, res, next) => {
  try {
    const { employee_id } = req.body;
    if (!employee_id) return res.status(400).json({ success: false, message: 'employee_id is required' });

    const result = await db.query(
      `INSERT INTO project_assignments (project_id, employee_id, assigned_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.params.projectId, employee_id, req.admin.id]
    );
    res.json({ success: true, assignment: result.rows[0] });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// DELETE /api/manager/assignment/:id
// ----------------------------------------------------------
router.delete('/assignment/:id', async (req, res, next) => {
  try {
    await db.query(
      `UPDATE project_assignments SET status = 'removed' WHERE id = $1`,
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// GET /api/manager/project/:projectId/tasks
// ----------------------------------------------------------
router.get('/project/:projectId/tasks', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT t.*, u.username, u.first_name, u.last_name
      FROM tasks t
      LEFT JOIN admins a ON a.id = t.employee_id
      LEFT JOIN users u ON u.id = a.user_id
      WHERE t.project_id = $1 ORDER BY t.created_at DESC
    `, [req.params.projectId]);
    res.json({ success: true, tasks: result.rows });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// POST /api/manager/tasks
// ----------------------------------------------------------
router.post('/tasks', async (req, res, next) => {
  try {
    const { project_id, employee_id, title, description, deadline, status } = req.body;
    if (!project_id || !title) {
      return res.status(400).json({ success: false, message: 'project_id and title are required' });
    }

    const result = await db.query(
      `INSERT INTO tasks (project_id, employee_id, title, description, deadline, status, assigned_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        project_id,
        employee_id || null,
        title,
        description || null,
        deadline || null,
        status || 'pending',
        req.admin.id
      ]
    );
    res.json({ success: true, task: result.rows[0] });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// PATCH /api/manager/tasks/:id
// ----------------------------------------------------------
router.patch('/tasks/:id', async (req, res, next) => {
  try {
    const allowedFields = ['title', 'description', 'status', 'deadline', 'employee_id'];
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex}`);
        values.push(req.body[field]);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(req.params.id);

    const result = await db.query(
      `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, task: result.rows[0] });
  } catch (err) { next(err); }
});

// ----------------------------------------------------------
// DELETE /api/manager/tasks/:id
// ----------------------------------------------------------
router.delete('/tasks/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
