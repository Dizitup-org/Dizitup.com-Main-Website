const pool = require('./src/db');

async function debugData() {
  try {
    console.log('\n=== DEBUGGING DATA ===\n');

    // Check query_clients phone data
    console.log('1️⃣ Query Clients (with phone):');
    const queryClientsResult = await pool.query(`
      SELECT id, name, email, phone, status FROM query_clients LIMIT 5;
    `);
    console.table(queryClientsResult.rows);

    // Check onboard_clients phone data
    console.log('\n2️⃣ Onboard Clients (with phone):');
    const onboardResult = await pool.query(`
      SELECT id, contact_name, company_name, email, phone, status FROM onboard_clients LIMIT 5;
    `);
    console.table(onboardResult.rows);

    // Check projects and their client_id links
    console.log('\n3️⃣ Projects (checking client_id links):');
    const projectsResult = await pool.query(`
      SELECT id, title, client_id, client_name FROM projects LIMIT 5;
    `);
    console.table(projectsResult.rows);

    // Check if projects are properly linked to onboard_clients
    console.log('\n4️⃣ Projects WITH Client Names (via JOIN):');
    const projectsWithClientsResult = await pool.query(`
      SELECT 
        p.id, 
        p.title, 
        p.client_id,
        oc.company_name,
        oc.contact_name,
        p.client_name
      FROM projects p
      LEFT JOIN onboard_clients oc ON p.client_id = oc.id
      LIMIT 5;
    `);
    console.table(projectsWithClientsResult.rows);

    console.log('\n✅ Debug complete!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

debugData();
