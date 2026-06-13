const { pool } = require('./src/db');

async function run() {
  try {
    console.log("Altering session_room_staff to drop NOT NULL constraint on room_no...");
    await pool.query('ALTER TABLE session_room_staff ALTER COLUMN room_no DROP NOT NULL');
    console.log("Success! room_no can now be NULL.");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    pool.end();
  }
}

run();
