require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setup() {
  try {
    console.log('🔍 Checking Database Setup...');
    const client = await pool.connect();
    
    // 1. Ensure uuid-ossp or pgcrypto for gen_random_uuid()
    console.log('⚙️ Ensuring pgcrypto extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    // 2. Create table
    console.log('📦 Creating password_reset_tokens table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    console.log('✅ Database setup complete!');
    client.release();
  } catch (err) {
    console.error('❌ Setup Failed:', err.message);
  } finally {
    await pool.end();
  }
}

setup();
