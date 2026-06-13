require('dotenv').config();
const { pool } = require('./src/db');

const defaultRooms = [
  'A101', 'A102', 'A103',
  'B201', 'B202', 'B203',
  'C301', 'C302', 'C303',
  'D401', 'B210', 'B211',
  'B213', 'B218'
];

async function setupRooms() {
  try {
    console.log('Creating rooms table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        room_no VARCHAR(50) PRIMARY KEY,
        capacity INT DEFAULT 40
      );
    `);

    console.log('Inserting default rooms...');
    for (const room of defaultRooms) {
      await pool.query(
        `INSERT INTO rooms (room_no, capacity) VALUES ($1, $2) ON CONFLICT (room_no) DO NOTHING`,
        [room, 40]
      );
    }
    console.log('Successfully seeded rooms table.');
  } catch (error) {
    console.error('Error setting up rooms:', error);
  } finally {
    pool.end();
  }
}

setupRooms();
