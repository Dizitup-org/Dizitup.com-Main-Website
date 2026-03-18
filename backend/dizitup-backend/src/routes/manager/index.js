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

// Auto-create tasks table if not exists
(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
        title        TEXT NOT NULL,
        description  TEXT,
        employee_id  UUID REFERENCES admins(id),
        assigned_by  UUID REFERENCES admins(id),
        status       VARCHAR(50) DEFAULT 'pending',
        deadline     DATE,
        updated_at   TIMESTAMPTZ,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (err) { console.error('Tasks table init:', err.message, err.stack); }
})();

// ----------------------------------------------------------
// GET /api/manager/employees
// Returns all staff (managers + employees) with full fields
// Also used by task assignment dropdowns (employees only filtered client-side)
// ----------------------------------------------------------
router.get('/employees', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT a.id as admin_id, a.user_id, a.role,
             u.username, u.email, u.first_name, u.last_name, u.phone, u.created_at
      FROM admins a JOIN users u ON u.id = a.user_id
      WHERE a.role IN ('manager', 'employee')
      ORDER BY a.role, u.first_name
    `);
    res.json({ success: true, employees: result.rows });
  } catch (err) { console.error('[GET /manager/employees]', err.message, err.stack); next(err); }
});

// ----------------------------------------------------------
// POST /api/manager/employees — create a new employee account
// Body: { username, email, password, first_name, last_name, phone? }
// ----------------------------------------------------------
router.post('/employees', async (req, res, next) => {
  const bcrypt = require('bcryptjs');
  const crypto = require('crypto');
  const client = await db.connect();
  try {
    const { username, email, first_name, last_name, phone } = req.body;
    const plainPassword = req.body.password || crypto.randomBytes(4).toString('hex');
    if (!username || !email || !first_name || !last_name) {
      return res.status(400).json({ success: false, message: 'username, email, first_name, and last_name are required' });
    }
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }
    const password_hash = await bcrypt.hash(plainPassword, 10);
    await client.query('BEGIN');
    const userResult = await client.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [username, email.toLowerCase().trim(), password_hash, first_name, last_name, phone || null]
    );
    const newUser = userResult.rows[0];
    const adminResult = await client.query(
      `INSERT INTO admins (user_id, role) VALUES ($1, 'employee') RETURNING *`,
      [newUser.id]
    );
    await client.query('COMMIT');
    res.status(201).json({
      success: true,
      temp_password: plainPassword,
      employee: { ...adminResult.rows[0], ...newUser, admin_id: adminResult.rows[0].id },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[POST /manager/employees]', err.message, err.stack);
    next(err);
  } finally { client.release(); }
});

// ----------------------------------------------------------
// DELETE /api/manager/employees/:id — remove staff access
// :id = admin_id (row in admins table)
// ----------------------------------------------------------
router.delete('/employees/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM admins WHERE id = $1 AND role = \'employee\'', [req.params.id]);
    res.json({ success: true });
  } catch (err) { console.error('[DELETE /manager/employees/:id]', err.message, err.stack); next(err); }
});

// ----------------------------------------------------------
// GET /api/manager/tasks
// ----------------------------------------------------------
router.get('/tasks', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT t.*,
        p.title as project_title,
        oc.company_name,
        u.first_name, u.last_name,
        COALESCE(u.first_name || ' ' || u.last_name, '') as assigned_name
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN onboard_clients oc ON oc.id = p.client_id
      LEFT JOIN admins a ON a.id = t.employee_id
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY t.created_at DESC
    `);
    res.json({ success: true, tasks: result.rows });
  } catch (err) { console.error('[GET /manager/tasks]', err.message, err.stack); next(err); }
});

// ----------------------------------------------------------
// GET /api/manager/projects
// ----------------------------------------------------------
router.get('/projects', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT p.*, oc.company_name, oc.contact_name,
        (SELECT COUNT(*) FROM project_assignments pa WHERE pa.project_id = p.id AND pa.status = 'active') as employee_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_tasks
      FROM projects p
      LEFT JOIN onboard_clients oc ON oc.id = p.client_id
      ORDER BY p.created_at DESC
    `);
    res.json({ success: true, projects: result.rows });
  } catch (err) { console.error('[GET /manager/projects]', err.message, err.stack); next(err); }
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
  } catch (err) { console.error('[GET /manager/team]', err.message, err.stack); next(err); }
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
  } catch (err) { console.error('[GET /manager/project/assignments]', err.message, err.stack); next(err); }
});
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
  } catch (err) { console.error('[POST /manager/project/assign]', err.message, err.stack); next(err); }
});
// ----------------------------------------------------------
router.delete('/assignment/:id', async (req, res, next) => {
  try {
    await db.query(
      `UPDATE project_assignments SET status = 'removed' WHERE id = $1`,
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) { console.error('[DELETE /manager/assignment]', err.message, err.stack); next(err); }
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
  } catch (err) { console.error('[GET /manager/project/tasks]', err.message, err.stack); next(err); }
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

// ----------------------------------------------------------
// GET /api/manager/tasks/:id/notes — read-only notes view
// ----------------------------------------------------------
router.get('/tasks/:id/notes', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT tn.*, u.first_name, u.last_name
       FROM task_notes tn
       LEFT JOIN users u ON u.id = tn.employee_id
       WHERE tn.task_id = $1
       ORDER BY tn.created_at ASC`,
      [req.params.id]
    );
    res.json({ success: true, notes: result.rows });
  } catch (err) { next(err); }
});

module.exports = router;
