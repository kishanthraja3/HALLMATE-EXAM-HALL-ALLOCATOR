const { Pool } = require('pg');
require('dotenv').config();

let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
} else {
  pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'Examhall',
    password: process.env.DB_PASSWORD || 'yourpassword',
    port: process.env.DB_PORT || 5432,
  });
}

pool.on('connect', () => console.log('Connected to PostgreSQL'));
pool.on('error', (err) => console.error('PostgreSQL error', err));

module.exports = { 
  query: (text, params) => pool.query(text, params),
  pool 
};
