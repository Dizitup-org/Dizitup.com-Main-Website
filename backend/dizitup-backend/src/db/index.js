const { Pool } = require('pg');
require('dotenv').config();

// 🔒 Safe log (don’t expose credentials)
console.log("📦 DATABASE_URL loaded:", !!process.env.DATABASE_URL);

const isProduction = !!process.env.DATABASE_URL;

// ✅ Create pool
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000, statement_timeout: 10000 }
    : {
        host:     process.env.DB_HOST,
        port:     parseInt(process.env.DB_PORT),
        database: process.env.DB_NAME,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
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