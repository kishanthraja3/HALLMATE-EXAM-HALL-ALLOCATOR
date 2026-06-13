const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { stringify } = require('csv-stringify/sync');
const { pool } = require('../db');

exports.login = async (req, res) => {
  const { teacher_id, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM teachers WHERE teacher_id = $1', [teacher_id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid teacher ID or password" });
    }

    const teacher = result.rows[0];
    const match = await bcrypt.compare(password, teacher.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid teacher ID or password" });
    }

    const token = jwt.sign(
      { id: teacher.id, teacher_id: teacher.teacher_id, name: teacher.name, role: "teacher" },
      process.env.TEACHER_JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      teacher: {
        name: teacher.name,
        teacher_id: teacher.teacher_id
      }
    });
  } catch (error) {
    console.error('Teacher login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { teacher_id } = req.teacher;
    const result = await pool.query('SELECT name, teacher_id FROM teachers WHERE teacher_id = $1', [teacher_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Teacher not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Teacher profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getDuty = async (req, res) => {
  try {
    const { teacher_id } = req.teacher;
    const result = await pool.query(`
      SELECT
        srs.room_no,
        srs.exam_date,
        srs.time_from,
        srs.time_to,
        srs.session_id,
        s.status
      FROM session_room_staff srs
      JOIN allocation_sessions s ON s.id = srs.session_id
      WHERE srs.teacher_id = $1
      AND s.status = 'published'
      AND s.exam_date >= CURRENT_DATE
      ORDER BY s.exam_date ASC, s.time_from ASC
      LIMIT 1
    `, [teacher_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No upcoming exam duty found" });
    }

    const row = result.rows[0];
    const year = row.exam_date.getFullYear();
    const month = String(row.exam_date.getMonth() + 1).padStart(2, '0');
    const day = String(row.exam_date.getDate()).padStart(2, '0');
    
    res.json({
      ...row,
      exam_date: `${year}-${month}-${day}`
    });
  } catch (error) {
    console.error('Teacher duty error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.downloadStudentList = async (req, res) => {
  try {
    const { teacher_id } = req.teacher;
    const { session_id, room_no } = req.query;

    if (!session_id || !room_no) {
      return res.status(400).json({ error: 'session_id and room_no are required' });
    }

    const authCheck = await pool.query(`
      SELECT * FROM session_room_staff
      WHERE teacher_id = $1 AND session_id = $2 AND room_no = $3
    `, [teacher_id, session_id, room_no]);

    if (authCheck.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    const result = await pool.query(`
      SELECT
        sa.roll_no,
        s.name as student_name,
        s.department,
        s.year,
        s.degree,
        sa.subject_code,
        sa.seat_label
      FROM seat_allocations sa
      JOIN students s ON s.roll_no = sa.roll_no
      WHERE sa.session_id = $1 AND sa.room_no = $2
      ORDER BY sa.seat_label ASC
    `, [session_id, room_no]);

    const sessionRes = await pool.query(`SELECT exam_date, time_from, time_to FROM allocation_sessions WHERE id = $1`, [session_id]);
    const sessionData = sessionRes.rows[0];
    const year = sessionData.exam_date.getFullYear();
    const month = String(sessionData.exam_date.getMonth() + 1).padStart(2, '0');
    const day = String(sessionData.exam_date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const csvData = result.rows.map((row, index) => ({
      'S.No': index + 1,
      'Room No': room_no,
      'Roll No': row.roll_no,
      'Student Name': row.student_name,
      'Department': row.department,
      'Year': row.year,
      'Degree': row.degree,
      'Subject Code': row.subject_code,
      'Seat No': row.seat_label
    }));

    let csvStr = `EXAM DUTY STUDENT LIST\n`;
    csvStr += `Room No: ${room_no}\n`;
    csvStr += `Date: ${formattedDate}\n`;
    csvStr += `Timing: ${sessionData.time_from} to ${sessionData.time_to}\n\n`;
    csvStr += stringify(csvData, { header: true });

    res.header('Content-Type', 'text/csv');
    res.attachment(`room_${room_no}_students.csv`);
    res.send(csvStr);
  } catch (error) {
    console.error('Download student list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.requestAlteration = async (req, res) => {
  try {
    const { teacher_id } = req.teacher;
    const { session_id, room_no, exam_date, time_from, time_to, reason, suggested_alt_id } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: "Reason is required" });
    }

    if (!session_id || !room_no || !exam_date || !time_from || !time_to) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const authCheck = await pool.query(`
      SELECT * FROM session_room_staff
      WHERE teacher_id = $1 AND session_id = $2 AND room_no = $3
    `, [teacher_id, session_id, room_no]);

    if (authCheck.rows.length === 0) {
      return res.status(403).json({ error: "You are not assigned to this room" });
    }

    const pendingCheck = await pool.query(`
      SELECT * FROM alteration_requests
      WHERE requesting_teacher_id = $1 AND session_id = $2 AND room_no = $3 AND status = 'pending'
    `, [teacher_id, session_id, room_no]);

    if (pendingCheck.rows.length > 0) {
      return res.status(400).json({ error: "You already have a pending request for this duty" });
    }

    if (suggested_alt_id && suggested_alt_id.trim() !== '') {
      const altCheck = await pool.query('SELECT * FROM teachers WHERE teacher_id = $1', [suggested_alt_id.trim()]);
      if (altCheck.rows.length === 0) {
        return res.status(400).json({ error: "Suggested alternate teacher ID not found" });
      }
    }

    const result = await pool.query(`
      INSERT INTO alteration_requests
        (session_id, requesting_teacher_id, room_no, exam_date, time_from, time_to, reason, suggested_alt_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [session_id, teacher_id, room_no, exam_date, time_from, time_to, reason, suggested_alt_id || null]);

    res.json({
      success: true,
      message: "Alteration request submitted successfully",
      request_id: result.rows[0].id
    });
  } catch (error) {
    console.error('Request alteration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAlterationHistory = async (req, res) => {
  try {
    const { teacher_id } = req.teacher;
    const result = await pool.query(`
      SELECT
        id, room_no, exam_date, time_from, time_to, reason,
        suggested_alt_id, status, final_teacher_id, created_at
      FROM alteration_requests
      WHERE requesting_teacher_id = $1
      ORDER BY created_at DESC
    `, [teacher_id]);

    const history = result.rows.map(row => {
      const year = row.exam_date.getFullYear();
      const month = String(row.exam_date.getMonth() + 1).padStart(2, '0');
      const day = String(row.exam_date.getDate()).padStart(2, '0');
      return {
        ...row,
        exam_date: `${year}-${month}-${day}`
      };
    });

    res.json(history);
  } catch (error) {
    console.error('Get alteration history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { teacher_id } = req.teacher;
    const { current_password, new_password } = req.body;

    const result = await pool.query('SELECT password_hash FROM teachers WHERE teacher_id = $1', [teacher_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Teacher not found' });

    const match = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!match) return res.status(401).json({ error: 'Current password incorrect' });

    const hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE teachers SET password_hash = $1 WHERE teacher_id = $2', [hash, teacher_id]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Teacher change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
