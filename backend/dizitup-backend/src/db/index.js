// src/db/index.js
// ============================================================
// DATABASE CONNECTION POOL
// ============================================================
// WHY A POOL?
//   Opening a new DB connection for every request is slow and
//   expensive. A "pool" keeps a set of connections open and
//   reuses them. pg.Pool handles this automatically.
//
// HOW TO USE:
//   const db = require('./db');
//   const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
//   result.rows → array of row objects
//   result.rows[0] → first row (or undefined if no match)
// ============================================================

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // Pool sizing — fine for most apps
  max: 10,              // max 10 simultaneous connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection when the server starts
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ PostgreSQL connected successfully');
    release(); // return connection back to pool
  }
});

module.exports = pool;
