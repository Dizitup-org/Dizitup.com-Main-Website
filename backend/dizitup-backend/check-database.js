// check-database.js
// Run this script to verify database tables exist and create them if needed

require('dotenv').config();
const db = require('./src/db');

async function checkAndCreateTables() {
  console.log('🔍 Checking database tables...');
  
  try {
    // Check if query_clients table exists
    const queryClientsCheck = await db.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'query_clients'
      );
    `);
    
    // Check if onboard_clients table exists  
    const onboardClientsCheck = await db.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'onboard_clients'
      );
    `);
    
    const queryClientsExists = queryClientsCheck.rows[0].exists;
    const onboardClientsExists = onboardClientsCheck.rows[0].exists;
    
    console.log(`📋 query_clients table: ${queryClientsExists ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`📋 onboard_clients table: ${onboardClientsExists ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (!queryClientsExists || !onboardClientsExists) {
      console.log('🔨 Creating missing tables...');
      
      if (!queryClientsExists) {
        await db.query(`
          CREATE TABLE query_clients (
            id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            booking_id  UUID        NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
            status      VARCHAR(50) NOT NULL DEFAULT 'active',
            notes       TEXT,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT chk_query_status CHECK (status IN ('active', 'converted', 'closed'))
          );
          CREATE INDEX idx_query_clients_booking_id ON query_clients(booking_id);
          CREATE INDEX idx_query_clients_status ON query_clients(status);
        `);
        console.log('✅ query_clients table created');
      }
      
      if (!onboardClientsExists) {
        await db.query(`
          CREATE TABLE onboard_clients (
            id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
            booking_id   UUID         NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
            contact_name VARCHAR(200) NOT NULL,
            email        VARCHAR(200) NOT NULL,
            company_name VARCHAR(200),
            phone        VARCHAR(50),
            created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
          );
          CREATE INDEX idx_onboard_clients_booking_id ON onboard_clients(booking_id);
        `);
        console.log('✅ onboard_clients table created');
      }
      
      console.log('🎉 Database setup complete!');
    } else {
      console.log('🎉 All required tables exist!');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('💡 Make sure your PostgreSQL database is running and the connection details in .env are correct');
  }
  
  process.exit(0);
}

checkAndCreateTables();