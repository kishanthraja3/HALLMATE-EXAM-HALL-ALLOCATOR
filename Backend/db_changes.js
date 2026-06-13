const { pool } = require('./src/db');

async function run() {
  try {
    console.log("Starting DB changes...");
    
    // Drop unique constraint
    await pool.query('ALTER TABLE allocation_sessions DROP CONSTRAINT IF EXISTS unique_exam_slot');
    
    // Add columns
    await pool.query('ALTER TABLE session_rooms ADD COLUMN IF NOT EXISTS exam_date DATE, ADD COLUMN IF NOT EXISTS time_from TIME, ADD COLUMN IF NOT EXISTS time_to TIME');
    await pool.query('ALTER TABLE seat_allocations ADD COLUMN IF NOT EXISTS exam_date DATE, ADD COLUMN IF NOT EXISTS time_from TIME, ADD COLUMN IF NOT EXISTS time_to TIME');
    await pool.query('ALTER TABLE session_room_staff ADD COLUMN IF NOT EXISTS exam_date DATE, ADD COLUMN IF NOT EXISTS time_from TIME, ADD COLUMN IF NOT EXISTS time_to TIME');
    
    // Drop and recreate FKs with ON DELETE CASCADE
    await pool.query('ALTER TABLE seat_allocations DROP CONSTRAINT IF EXISTS seat_allocations_session_id_fkey');
    await pool.query('ALTER TABLE seat_allocations ADD CONSTRAINT seat_allocations_session_id_fkey FOREIGN KEY (session_id) REFERENCES allocation_sessions(id) ON DELETE CASCADE');
    
    await pool.query('ALTER TABLE session_rooms DROP CONSTRAINT IF EXISTS session_rooms_session_id_fkey');
    await pool.query('ALTER TABLE session_rooms ADD CONSTRAINT session_rooms_session_id_fkey FOREIGN KEY (session_id) REFERENCES allocation_sessions(id) ON DELETE CASCADE');
    
    await pool.query('ALTER TABLE session_room_staff DROP CONSTRAINT IF EXISTS session_room_staff_session_id_fkey');
    await pool.query('ALTER TABLE session_room_staff ADD CONSTRAINT session_room_staff_session_id_fkey FOREIGN KEY (session_id) REFERENCES allocation_sessions(id) ON DELETE CASCADE');
    
    console.log("DB changes successful");
  } catch(e) {
    console.error("DB Error:", e);
  } finally {
    pool.end();
  }
}
run();
