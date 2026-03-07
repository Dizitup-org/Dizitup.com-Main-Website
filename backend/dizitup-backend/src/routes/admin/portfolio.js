// src/routes/admin/portfolio.js
// ============================================================
// ADMIN — PORTFOLIO TAB
// ============================================================
// GET    /api/admin/portfolio      → list all portfolio items
// POST   /api/admin/portfolio      → add new portfolio item
// PUT    /api/admin/portfolio/:id  → update item
// DELETE /api/admin/portfolio/:id  → delete item
//
// NOTE: Run this SQL to add the portfolio table first:
//
// CREATE TABLE portfolio (
//   id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
//   title        VARCHAR(200)  NOT NULL,
//   description  TEXT,
//   category     VARCHAR(100),
//   image_url    TEXT,
//   project_url  TEXT,
//   tech_stack   TEXT[],       -- array of strings: ['React','Node']
//   completed_at DATE,
//   is_featured  BOOLEAN       NOT NULL DEFAULT false,
//   created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
// );
// ============================================================

const express = require('express');
const db = require('../../db');
const { AppError } = require('../../utils/errors');
const { validators } = require('../../middleware/validate');

const router = express.Router();


// GET all portfolio items (public endpoint — frontend displays these)
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * FROM portfolio ORDER BY is_featured DESC, created_at DESC`
    );
    res.json({ success: true, portfolio: result.rows });
  } catch (err) { next(err); }
});


// POST — Add new portfolio item (admin only — enforced in app.js)
router.post('/', async (req, res, next) => {
  try {
    // Accept both frontend field names (brand_name/internal_label/target_url/brand_type)
    // and the canonical DB field names (title/project_url/category)
    const title       = req.body.title       || req.body.brand_name   || req.body.internal_label;
    const project_url = req.body.project_url || req.body.target_url;
    const category    = req.body.category    || req.body.brand_type;
    const {
      description, image_url,
      tech_stack, completed_at, is_featured,
    } = req.body;

    validators.required(title, 'Title / Internal Label');

    const result = await db.query(
      `INSERT INTO portfolio
         (title, description, category, image_url, project_url,
          tech_stack, completed_at, is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        title,
        description   || null,
        category      || null,
        image_url     || null,
        project_url   || null,
        tech_stack    || [],
        completed_at  || null,
        is_featured   ?? false,
      ]
    );

    res.status(201).json({ success: true, item: result.rows[0] });

  } catch (err) { next(err); }
});


// PUT — Update portfolio item
router.put('/:id', async (req, res, next) => {
  try {
    const {
      title, description, category,
      image_url, project_url,
      tech_stack, completed_at, is_featured,
    } = req.body;

    const result = await db.query(
      `UPDATE portfolio SET
         title        = COALESCE($1, title),
         description  = COALESCE($2, description),
         category     = COALESCE($3, category),
         image_url    = COALESCE($4, image_url),
         project_url  = COALESCE($5, project_url),
         tech_stack   = COALESCE($6, tech_stack),
         completed_at = COALESCE($7, completed_at),
         is_featured  = COALESCE($8, is_featured)
       WHERE id = $9
       RETURNING *`,
      [title, description, category, image_url, project_url,
       tech_stack, completed_at, is_featured, req.params.id]
    );

    if (result.rows.length === 0) throw new AppError('Portfolio item not found.', 404);
    res.json({ success: true, item: result.rows[0] });

  } catch (err) { next(err); }
});


// DELETE — Remove portfolio item
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      'DELETE FROM portfolio WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('Portfolio item not found.', 404);
    res.json({ success: true, message: 'Portfolio item deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
