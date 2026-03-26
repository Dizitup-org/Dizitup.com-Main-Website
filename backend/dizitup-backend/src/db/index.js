const { Pool } = require('pg');
require('dotenv').config();

// 🔒 Safe log (don’t expose credentials)
console.log("📦 DATABASE_URL loaded:", !!process.env.DATABASE_URL);

const isProduction = !!process.env.DATABASE_URL;

// ✅ Create pool
const pool = new Pool(
  isProduction
    ? {
        connectionString: process.env.DATABASE_URL,

        // 🔥 REQUIRED for Railway / Neon / cloud DBs
        ssl: {
          rejectUnauthorized: false,
        },

        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
      : {}
);

// ✅ Test connection properly (async safe)
async function testDBConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');

    const res = await client.query('SELECT NOW()');
    console.log('🕒 DB Time:', res.rows[0].now);

    client.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
}

// Run test
testDBConnection();

module.exports = pool;