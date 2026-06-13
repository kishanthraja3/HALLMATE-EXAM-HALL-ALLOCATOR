const { pool } = require('./src/db');

async function run() {
  try {
    const r1 = await pool.query('SELECT exam_date, time_from, time_to FROM allocation_sessions');
    console.log("All rows:", r1.rows);
    
    const r2 = await pool.query('SELECT id FROM allocation_sessions WHERE exam_date=$1 AND time_from=$2 AND time_to=$3', ['2026-06-04', '22:58', '02:53']);
    console.log("Check slot result:", r2.rows);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    pool.end();
  }
}

run();
