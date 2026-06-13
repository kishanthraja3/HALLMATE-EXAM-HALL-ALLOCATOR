const { pool } = require('./src/db');

async function run() {
  try {
    const r1 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'allocation_sessions'
    `);
    console.log(r1.rows);
    
    const r2 = await pool.query(`SELECT id, exam_date, exam_date::text as text_date FROM allocation_sessions`);
    console.log(r2.rows);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    pool.end();
  }
}

run();
