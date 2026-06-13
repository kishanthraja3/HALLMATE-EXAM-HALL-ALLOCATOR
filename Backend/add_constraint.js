const { pool } = require('./src/db');

async function run() {
  try {
    console.log("Adding unique constraint on allocation_sessions...");
    await pool.query('ALTER TABLE allocation_sessions ADD CONSTRAINT unique_exam_slot UNIQUE (exam_date, time_from, time_to)');
    console.log("Success! Unique constraint added.");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    pool.end();
  }
}

run();
