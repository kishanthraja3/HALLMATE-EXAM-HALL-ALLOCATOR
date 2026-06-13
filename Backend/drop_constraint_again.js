const { pool } = require('./src/db');

async function run() {
  try {
    console.log("Dropping unique constraints...");
    
    // Drop the implicit unique constraint
    await pool.query('ALTER TABLE allocation_sessions DROP CONSTRAINT IF EXISTS allocation_sessions_exam_date_time_from_time_to_key');
    await pool.query('ALTER TABLE allocation_sessions DROP CONSTRAINT IF EXISTS unique_exam_slot');
    
    console.log("Constraints dropped successfully");
  } catch(e) {
    console.error("DB Error:", e);
  } finally {
    pool.end();
  }
}
run();
