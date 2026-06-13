require('dotenv').config();
const { pool } = require('./src/db');

async function setup() {
  try {
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name            TEXT NOT NULL,
        teacher_id      TEXT UNIQUE NOT NULL,
        password_hash   TEXT NOT NULL,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS alteration_requests (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id            UUID REFERENCES allocation_sessions(id),
        requesting_teacher_id TEXT NOT NULL,
        room_no               TEXT NOT NULL,
        exam_date             DATE NOT NULL,
        time_from             TIME NOT NULL,
        time_to               TIME NOT NULL,
        reason                TEXT NOT NULL,
        suggested_alt_id      TEXT,
        status                TEXT DEFAULT 'pending',
        resolved_by           TEXT,
        final_teacher_id      TEXT,
        created_at            TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Seed data
    const plainPasswordsPath = path.join(__dirname, 'plain_passwords.json');
    let plainPasswords = {};
    if (fs.existsSync(plainPasswordsPath)) {
      plainPasswords = JSON.parse(fs.readFileSync(plainPasswordsPath, 'utf8'));
    }

    const teachersToSeed = [
      { name: 'Kumars',       id: 'T001' },
      { name: 'Saja R',       id: 'T002' },
      { name: 'Kishore U',    id: 'T003' },
      { name: 'Raja K',       id: 'T004' },
      { name: 'Priya Nair',   id: 'T005' },
      { name: 'Ramesh Kumar', id: 'T006' }
    ];

    for (const t of teachersToSeed) {
      // check if exists
      const res = await pool.query('SELECT * FROM teachers WHERE teacher_id = $1', [t.id]);
      if (res.rows.length === 0) {
        const plainPassword = Math.random().toString(36).slice(-8);
        const passwordHash = await bcrypt.hash(plainPassword, 10);
        await pool.query(
          'INSERT INTO teachers (name, teacher_id, password_hash) VALUES ($1, $2, $3)',
          [t.name, t.id, passwordHash]
        );
        plainPasswords[t.id] = plainPassword;
      }
    }

    fs.writeFileSync(plainPasswordsPath, JSON.stringify(plainPasswords, null, 2));
    console.log('Database setup complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up DB:', error);
    process.exit(1);
  }
}

setup();
