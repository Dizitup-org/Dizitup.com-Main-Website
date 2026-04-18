const db = require('./src/db');
db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'sales_%';")
  .then(r => { 
    console.log("Tables found:", r.rows.map(row => row.table_name)); 
    process.exit(0); 
  })
  .catch(e => { 
    console.error("DB Error:", e.message); 
    process.exit(1); 
  });
