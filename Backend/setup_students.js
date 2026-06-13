require('dotenv').config();
const { pool } = require('./src/db');

const students = [
  // IT Department
  { name: 'Arun Kumar', roll_no: '251001101', department: 'IT', year: 'I', degree: 'UG', email: '251001101@rajalakshmi.edu.in' },
  { name: 'Priya S', roll_no: '251001102', department: 'IT', year: 'I', degree: 'UG', email: '251001102@rajalakshmi.edu.in' },
  { name: 'Karthik R', roll_no: '251001103', department: 'IT', year: 'I', degree: 'UG', email: '251001103@rajalakshmi.edu.in' },
  { name: 'Divya M', roll_no: '251001104', department: 'IT', year: 'I', degree: 'UG', email: '251001104@rajalakshmi.edu.in' },
  { name: 'Rahul V', roll_no: '251001105', department: 'IT', year: 'I', degree: 'UG', email: '251001105@rajalakshmi.edu.in' },
  { name: 'Sneha P', roll_no: '251001106', department: 'IT', year: 'I', degree: 'UG', email: '251001106@rajalakshmi.edu.in' },
  { name: 'Vikram N', roll_no: '251001107', department: 'IT', year: 'I', degree: 'UG', email: '251001107@rajalakshmi.edu.in' },
  { name: 'Ananya K', roll_no: '251001108', department: 'IT', year: 'I', degree: 'UG', email: '251001108@rajalakshmi.edu.in' },
  { name: 'Suresh B', roll_no: '251001109', department: 'IT', year: 'I', degree: 'UG', email: '251001109@rajalakshmi.edu.in' },
  { name: 'Meena L', roll_no: '251001110', department: 'IT', year: 'I', degree: 'UG', email: '251001110@rajalakshmi.edu.in' },
  { name: 'Rajan T', roll_no: '251001111', department: 'IT', year: 'I', degree: 'UG', email: '251001111@rajalakshmi.edu.in' },
  { name: 'Kavitha S', roll_no: '251001112', department: 'IT', year: 'I', degree: 'UG', email: '251001112@rajalakshmi.edu.in' },
  { name: 'Deepak R', roll_no: '251001113', department: 'IT', year: 'I', degree: 'UG', email: '251001113@rajalakshmi.edu.in' },
  { name: 'Lakshmi V', roll_no: '251001114', department: 'IT', year: 'I', degree: 'UG', email: '251001114@rajalakshmi.edu.in' },
  { name: 'Ganesh M', roll_no: '251001115', department: 'IT', year: 'I', degree: 'UG', email: '251001115@rajalakshmi.edu.in' },
  { name: 'Pooja N', roll_no: '251001116', department: 'IT', year: 'I', degree: 'UG', email: '251001116@rajalakshmi.edu.in' },
  { name: 'Sathish K', roll_no: '251001117', department: 'IT', year: 'I', degree: 'UG', email: '251001117@rajalakshmi.edu.in' },
  { name: 'Revathi S', roll_no: '251001118', department: 'IT', year: 'I', degree: 'UG', email: '251001118@rajalakshmi.edu.in' },
  { name: 'Mani P', roll_no: '251001119', department: 'IT', year: 'I', degree: 'UG', email: '251001119@rajalakshmi.edu.in' },
  { name: 'Nithya R', roll_no: '251001120', department: 'IT', year: 'I', degree: 'UG', email: '251001120@rajalakshmi.edu.in' },

  // AI&ML Department
  { name: 'Balaji V', roll_no: '231501101', department: 'AI&ML', year: 'III', degree: 'UG', email: '231501101@rajalakshmi.edu.in' },
  { name: 'Saranya K', roll_no: '231501102', department: 'AI&ML', year: 'III', degree: 'UG', email: '231501102@rajalakshmi.edu.in' },
  { name: 'Vignesh M', roll_no: '231501103', department: 'AI&ML', year: 'III', degree: 'UG', email: '231501103@rajalakshmi.edu.in' },
  { name: 'Keerthana R', roll_no: '231501104', department: 'AI&ML', year: 'III', degree: 'UG', email: '231501104@rajalakshmi.edu.in' },
  { name: 'Praveen S', roll_no: '231501105', department: 'AI&ML', year: 'III', degree: 'UG', email: '231501105@rajalakshmi.edu.in' },
  { name: 'Anjali N', roll_no: '231501106', department: 'AI&ML', year: 'III', degree: 'UG', email: '231501106@rajalakshmi.edu.in' },
  { name: 'Dinesh P', roll_no: '231501107', department: 'AI&ML', year: 'III', degree: 'UG', email: '231501107@rajalakshmi.edu.in' },
  { name: 'Sowmya V', roll_no: '231501108', department: 'AI&ML', year: 'III', degree: 'UG', email: '231501108@rajalakshmi.edu.in' },
  { name: 'Harish K', roll_no: '231501109', department: 'AI&ML', year: 'III', degree: 'UG', email: '231501109@rajalakshmi.edu.in' },
  { name: 'Pavithra M', roll_no: '231501110', department: 'AI&ML', year: 'III', degree: 'UG', email: '231501110@rajalakshmi.edu.in' },
  { name: 'Senthil R', roll_no: '231501111', department: 'AI&ML', year: 'III', degree: 'UG', email: '231501111@rajalakshmi.edu.in' },
  { name: 'Geetha S', roll_no: '231501112', department: 'AI&ML', year: 'III', degree: 'UG', email: '231501112@rajalakshmi.edu.in' },
  { name: 'Muthu P', roll_no: '231501113', department: 'AI&ML', year: 'III', degree: 'UG', email: '231501113@rajalakshmi.edu.in' },
  { name: 'Vasantha K', roll_no: '231501114', department: 'AI&ML', year: 'III', degree: 'UG', email: '231501114@rajalakshmi.edu.in' },
  { name: 'Arjun N', roll_no: '231501115', department: 'AI&ML', year: 'III', degree: 'UG', email: '231501115@rajalakshmi.edu.in' },
  { name: 'Chithra V', roll_no: '231501116', department: 'AI&ML', year: 'III', degree: 'UG', email: '231501116@rajalakshmi.edu.in' },
  { name: 'Sugumar M', roll_no: '231501117', department: 'AI&ML', year: 'III', degree: 'UG', email: '231501117@rajalakshmi.edu.in' },
  { name: 'Nandhini R', roll_no: '231501118', department: 'AI&ML', year: 'III', degree: 'UG', email: '231501118@rajalakshmi.edu.in' },
  { name: 'Manoj S', roll_no: '231501119', department: 'AI&ML', year: 'III', degree: 'UG', email: '231501119@rajalakshmi.edu.in' },
  { name: 'Rubini K', roll_no: '231501120', department: 'AI&ML', year: 'III', degree: 'UG', email: '231501120@rajalakshmi.edu.in' },
];

async function setupDatabase() {
  try {
    console.log('Creating students table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name            TEXT NOT NULL,
        roll_no         TEXT UNIQUE NOT NULL,
        department      TEXT NOT NULL,
        year            TEXT NOT NULL,
        degree          TEXT NOT NULL,
        email           TEXT UNIQUE NOT NULL,
        password_hash   TEXT NOT NULL,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Optionally truncate table for clean re-run
    await pool.query('TRUNCATE TABLE students CASCADE;');

    console.log('Generating passwords and inserting students...');
    const plainPasswords = {};

    for (const student of students) {
      // Generate random 8 char alphanumeric password
      const password = crypto.randomBytes(4).toString('hex');
      plainPasswords[student.roll_no] = password;

      const password_hash = await bcrypt.hash(password, 10);

      await pool.query(
        `INSERT INTO students (name, roll_no, department, year, degree, email, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [student.name, student.roll_no, student.department, student.year, student.degree, student.email, password_hash]
      );
    }

    fs.writeFileSync('plain_passwords.json', JSON.stringify(plainPasswords, null, 2));
    console.log('Successfully seeded students and generated plain_passwords.json');
  } catch (error) {
    console.error('Error setting up students table:', error);
  } finally {
    pool.end();
  }
}

setupDatabase();
