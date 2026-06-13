const express = require('express');
const cors = require('cors');
const sessionRoutes = require('./src/routes/sessions');
const roomRoutes = require('./src/routes/rooms');
const studentRoutes = require('./src/routes/students');
const teacherRoutes = require('./src/routes/teachers');
const adminRoutes = require('./src/routes/admin');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/sessions', sessionRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
