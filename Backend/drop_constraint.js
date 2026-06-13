const { pool } = require('./src/db');

async function run() {
  try {
    await pool.query('ALTER TABLE seat_allocations DROP CONSTRAINT IF EXISTS seat_allocations_session_id_room_no_seat_label_key;');
    console.log('Constraint dropped successfully');
  } catch (err) {
    console.error('Error dropping constraint:', err.message || err);
  } finally {
    await pool.end();
    process.exit();
  }
}
run();
