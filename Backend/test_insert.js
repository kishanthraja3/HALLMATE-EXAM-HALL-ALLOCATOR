const { pool } = require('./src/db');

async function run() {
  await pool.query('INSERT INTO allocation_sessions (exam_date, time_from, time_to) VALUES ($1, $2, $3)', ['2026-06-04', '10:00', '11:00']);
  const res = await pool.query('SELECT exam_date, exam_date::text as t FROM allocation_sessions WHERE time_from=$1', ['10:00:00']);
  console.log(res.rows);
  pool.end();
}
run();
