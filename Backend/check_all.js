const { pool } = require('./src/db');

async function run() {
  const res = await pool.query('SELECT exam_date::text as t_date, time_from, time_to FROM allocation_sessions');
  console.table(res.rows);
  pool.end();
}
run();
