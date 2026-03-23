const { Pool } = require('pg');
require('dotenv').config();

console.log("DATABASE_URL:", process.env.DATABASE_URL);

// Use DATABASE_URL (Neon) if available, otherwise use local database config
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 2000 }
    : {
        host:     process.env.DB_HOST,
        port:     parseInt(process.env.DB_PORT),
        database: process.env.DB_NAME,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
);

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ PostgreSQL connected successfully (NEON)');
    release();
  }
});

module.exports = pool;