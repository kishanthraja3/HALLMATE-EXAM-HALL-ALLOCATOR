const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM students WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const student = result.rows[0];
    const match = await bcrypt.compare(password, student.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: student.id, roll_no: student.roll_no, name: student.name, department: student.department, role: "student" },
      process.env.STUDENT_JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      student: {
        name: student.name,
        roll_no: student.roll_no,
        department: student.department,
        year: student.year,
        degree: student.degree,
        email: student.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { roll_no } = req.student;
    const result = await pool.query(
      'SELECT name, roll_no, department, year, degree, email FROM students WHERE roll_no = $1',
      [roll_no]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAllocation = async (req, res) => {
  try {
    const { roll_no } = req.student;

    // Step 1: Find published allocation for this student
    const result = await pool.query(`
      SELECT 
        sa.room_no,
        sa.seat_label,
        sa.subject_code,
        s.exam_date,
        s.time_from,
        s.time_to,
        s.published_at,
        s.rules_snapshot
      FROM seat_allocations sa
      JOIN allocation_sessions s ON s.id = sa.session_id
      WHERE sa.roll_no = $1
      AND s.status = 'published'
      AND s.exam_date >= CURRENT_DATE
      ORDER BY s.exam_date ASC, s.time_from ASC
      LIMIT 1
    `, [roll_no]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No allocation found for upcoming exams' });
    }

    const alloc = result.rows[0];

    // Step 2: Check visibility
    // Assume rules_snapshot is JSON and has visibilityOffset. Default to 120 mins.
    let visibilityOffsetMinutes = 120;
    if (alloc.rules_snapshot && alloc.rules_snapshot.visibilityOffset) {
      visibilityOffsetMinutes = alloc.rules_snapshot.visibilityOffset;
    }

    // Combine exam_date and time_from into a single Date object safely in local time
    const year = alloc.exam_date.getFullYear();
    const month = String(alloc.exam_date.getMonth() + 1).padStart(2, '0');
    const day = String(alloc.exam_date.getDate()).padStart(2, '0');
    const examDateStr = `${year}-${month}-${day}`;
    
    const examDateTimeStr = `${examDateStr}T${alloc.time_from}`;
    const examDateTime = new Date(examDateTimeStr);
    
    // Calculate visibleFrom
    const visibleFrom = new Date(examDateTime.getTime() - visibilityOffsetMinutes * 60000);
    const now = new Date();

    // TEMPORARY: Bypass visibility check for testing purposes
    /*
    if (now < visibleFrom) {
      return res.status(403).json({
        error: "Allocation not visible yet",
        visible_from: visibleFrom,
        message: `Check after ${visibleFrom.toLocaleString()}`
      });
    }
    */

    // Fetch student info again just to return the full payload exactly as required
    const studentRes = await pool.query('SELECT name, roll_no, department, year, degree FROM students WHERE roll_no = $1', [roll_no]);
    const student = studentRes.rows[0];

    // Step 3: If visible return details
    res.json({
      exam_date: examDateStr,
      time_from: alloc.time_from,
      time_to: alloc.time_to,
      room_no: alloc.room_no,
      seat_label: alloc.seat_label,
      subject_code: alloc.subject_code,
      student
    });

  } catch (error) {
    console.error('Allocation check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTimetable = async (req, res) => {
  try {
    const { roll_no } = req.student;

    const result = await pool.query(`
      SELECT
        s.exam_date,
        s.time_from,
        s.time_to,
        sa.subject_code,
        sa.room_no,
        sa.seat_label,
        s.rules_snapshot
      FROM seat_allocations sa
      JOIN allocation_sessions s ON s.id = sa.session_id
      WHERE sa.roll_no = $1
      AND s.status = 'published'
      AND s.exam_date >= CURRENT_DATE
      ORDER BY s.exam_date ASC, s.time_from ASC
    `, [roll_no]);

    const timetable = result.rows.map(alloc => {
      let visibilityOffsetMinutes = 120;
      if (alloc.rules_snapshot && alloc.rules_snapshot.visibilityOffset) {
        visibilityOffsetMinutes = alloc.rules_snapshot.visibilityOffset;
      }
      
      const year = alloc.exam_date.getFullYear();
      const month = String(alloc.exam_date.getMonth() + 1).padStart(2, '0');
      const day = String(alloc.exam_date.getDate()).padStart(2, '0');
      const examDateStr = `${year}-${month}-${day}`;
      
      const examDateTimeStr = `${examDateStr}T${alloc.time_from}`;
      const examDateTime = new Date(examDateTimeStr);
      const visibleFrom = new Date(examDateTime.getTime() - visibilityOffsetMinutes * 60000);
      const now = new Date();

      // TEMPORARY: Always visible for testing
      const is_visible = true; // now >= visibleFrom;

      return {
        exam_date: examDateStr,
        time_from: alloc.time_from,
        time_to: alloc.time_to,
        subject_code: alloc.subject_code,
        room_no: is_visible ? alloc.room_no : null,
        seat_label: is_visible ? alloc.seat_label : null,
        is_visible
      };
    });

    res.json(timetable);

  } catch (error) {
    console.error('Timetable error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { roll_no } = req.student;
    const { current_password, new_password } = req.body;

    const result = await pool.query('SELECT password_hash FROM students WHERE roll_no = $1', [roll_no]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const { password_hash } = result.rows[0];
    const match = await bcrypt.compare(current_password, password_hash);
    if (!match) {
      return res.status(401).json({ error: "Current password incorrect" });
    }

    const new_password_hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE students SET password_hash = $1 WHERE roll_no = $2', [new_password_hash, roll_no]);

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
