const express = require('express');
const db = require('../db');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/me', protect, async (req, res, next) => {
  try {
    const u = await db.query(
      'SELECT id, username, email, first_name, last_name, phone, business_name FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!u.rows.length) return res.status(404).json({ success: false, error: 'User not found.' });
    const a = await db.query('SELECT role FROM admins WHERE user_id = $1', [req.user.id]);
    const isAdmin = a.rows.length > 0;
    res.json({
      success: true,
      user: { ...u.rows[0], isAdmin, adminRole: isAdmin ? a.rows[0].role : null }
    });
  } catch (err) { next(err); }
});

module.exports = router;