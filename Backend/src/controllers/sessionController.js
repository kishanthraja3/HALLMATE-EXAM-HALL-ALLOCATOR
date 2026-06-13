const db = require('../db');
const { parse } = require('csv-parse/sync');
const { allocate } = require('../services/allocationEngine');
const { generateRoomRangeCSV, generateStaffCSV, generateSeatMapCSV } = require('../services/csvGenerator');

const checkSlot = async (req, res, next) => {
  try {
    const { exam_date, time_from, time_to } = req.body;
    const result = await db.query(
      "SELECT id FROM allocation_sessions WHERE exam_date=$1 AND time_from=$2 AND time_to=$3 AND status='published'",
      [exam_date, time_from, time_to]
    );
    if (result.rows.length > 0) {
      return res.status(409).json({ error: "A published allocation already exists for this slot. Cannot create a new allocation for the same date and time.", existing_id: result.rows[0].id });
    }
    return res.status(200).json({ available: true });
  } catch (err) {
    next(err);
  }
};

const createSession = async (req, res, next) => {
  try {
    const { exam_date, time_from, time_to, rules, selected_seats } = req.body;
    
    // Step 0: Check if PUBLISHED allocation exists for this slot
    const published = await db.query(
      `SELECT id FROM allocation_sessions 
       WHERE exam_date = $1 
       AND time_from = $2 
       AND time_to = $3
       AND status = 'published'`,
      [exam_date, time_from, time_to]
    );

    if (published.rows.length > 0) {
      return res.status(409).json({ 
        error: 'A published allocation already exists for this slot. Cannot create a new allocation for the same date and time.' 
      });
    }

    // Step 0.5: Delete any existing DRAFT for same slot
    await db.query(
      `DELETE FROM allocation_sessions
       WHERE exam_date = $1
       AND time_from = $2
       AND time_to = $3
       AND status = 'draft'`,
      [exam_date, time_from, time_to]
    );
    
    if (!req.files || !req.files.rooms || !req.files.students || !req.files.teachers) {
      return res.status(400).json({ error: "Missing required CSV files" });
    }

    // Step 1: Parse rooms CSV
    const roomsRecords = parse(req.files.rooms[0].buffer, { columns: true, skip_empty_lines: true });
    const roomNos = roomsRecords.map(r => r.room_no || r.RoomNo || r['Room No'] || r.roomNo);

    // Step 2: Verify rooms exist in database
    for (const room_no of roomNos) {
      if (!room_no) continue;
      const result = await db.query('SELECT room_no FROM rooms WHERE room_no = $1', [room_no]);
      if (result.rows.length === 0) {
        return res.status(400).json({ error: `Room ${room_no} not found in database` });
      }
    }

    // Step 3: Parse students CSV
    const studentsRecords = parse(req.files.students[0].buffer, { columns: true, skip_empty_lines: true });
    if (studentsRecords.length > 0) {
      const requiredCols = ['name', 'roll_no', 'dept', 'year', 'degree', 'subject_code'];
      const firstRow = studentsRecords[0];
      const missingCols = requiredCols.filter(col => !Object.keys(firstRow).includes(col));
      if (missingCols.length > 0) {
        return res.status(400).json({ error: `Students CSV missing columns: ${missingCols.join(', ')}` });
      }
    }

    // Step 4: Parse teachers CSV
    const teachersRecords = parse(req.files.teachers[0].buffer, { columns: true, skip_empty_lines: true });
    if (teachersRecords.length > 0) {
      const requiredCols = ['teacher_name', 'teacher_id'];
      const firstRow = teachersRecords[0];
      const missingCols = requiredCols.filter(col => !Object.keys(firstRow).includes(col));
      if (missingCols.length > 0) {
        return res.status(400).json({ error: `Teachers CSV missing columns: ${missingCols.join(', ')}` });
      }
    }

    // Step 5: Get selected_seats
    let parsedSeats = {};
    try {
      parsedSeats = JSON.parse(selected_seats);
    } catch (e) {
      return res.status(400).json({ error: "Invalid selected_seats JSON" });
    }

    // Step 6 & 7 & 8: Calculate capacity
    let totalBenches = 0;
    for (const room_no in parsedSeats) {
      totalBenches += parsedSeats[room_no].length;
    }

    let parsedRules = {};
    try {
      parsedRules = rules ? JSON.parse(rules) : {};
    } catch (e) {}

    const subjectCodes = new Set(studentsRecords.map(s => s.subject_code));
    const uniqueSubjectCount = subjectCodes.size;
    const studentsPerBench = uniqueSubjectCount === 1 ? 1 : (parsedRules.maxPerBench || 2);

    let maxCapacity = 0;
    let benchesNeeded = 0;

    if (studentsPerBench === 1) {
      benchesNeeded = studentsRecords.length;
      maxCapacity = totalBenches;
    } else {
      const groupSizes = [...subjectCodes].map(code => 
        studentsRecords.filter(s => s.subject_code === code).length
      );
      groupSizes.sort((a, b) => b - a);
      
      const largestGroup = groupSizes[0];
      const othersTotal = studentsRecords.length - largestGroup;

      if (largestGroup <= othersTotal) {
        maxCapacity = totalBenches * 2;
        benchesNeeded = Math.ceil(studentsRecords.length / 2);
      } else {
        const pairedSlots = othersTotal * 2;
        const soloSlots = largestGroup - othersTotal;
        maxCapacity = pairedSlots + soloSlots;
        benchesNeeded = othersTotal + soloSlots;
      }
    }

    if (totalBenches < benchesNeeded) {
      return res.status(400).json({ error: `Insufficient capacity: ${maxCapacity} slots for ${studentsRecords.length} students. Need ${benchesNeeded} benches but only ${totalBenches} selected.` });
    }

    // Step 9: Rules already parsed above

    // Step 10: Insert into allocation_sessions
    await db.query('BEGIN');
    let sessionResult;
    try {
      sessionResult = await db.query(
        `INSERT INTO allocation_sessions 
         (exam_date, time_from, time_to, rules_snapshot, total_students, total_rooms, status) 
         VALUES ($1, $2, $3, $4, $5, $6, 'draft') 
         RETURNING id`,
        [exam_date, time_from, time_to, JSON.stringify(parsedRules), studentsRecords.length, Object.keys(parsedSeats).length]
      );
      
      const sessionId = sessionResult.rows[0].id;

      // Step 11: Insert into session_rooms
      for (const room_no in parsedSeats) {
        const seats = parsedSeats[room_no];
        await db.query(
          `INSERT INTO session_rooms (session_id, room_no, selected_seats, capacity, exam_date, time_from, time_to) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [sessionId, room_no, JSON.stringify(seats), seats.length, exam_date, time_from, time_to]
        );
      }

      // Step 12: Insert into session_room_staff
      for (const teacher of teachersRecords) {
        await db.query(
          `INSERT INTO session_room_staff (session_id, room_no, teacher_name, teacher_id, exam_date, time_from, time_to) 
           VALUES ($1, NULL, $2, $3, $4, $5, $6)`,
          [sessionId, teacher.teacher_name, teacher.teacher_id, exam_date, time_from, time_to]
        );
      }
      
      await db.query('COMMIT');
      
      // Step 13 & 14: Return
      return res.status(200).json({ 
        session_id: sessionId, 
        total_students: studentsRecords.length, 
        total_rooms: Object.keys(parsedSeats).length, 
        total_capacity: maxCapacity,
        students: studentsRecords,
        teachers: teachersRecords
      });

    } catch (dbErr) {
      await db.query('ROLLBACK');
      throw dbErr;
    }

  } catch (err) {
    next(err);
  }
};

const runAllocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { students, teachers } = req.body;

    // Step 1: Fetch session
    const sessionRes = await db.query('SELECT * FROM allocation_sessions WHERE id = $1', [id]);
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ error: `Session ${id} not found` });
    }
    const session = sessionRes.rows[0];

    // Step 2: Fetch session_rooms
    const roomsRes = await db.query('SELECT room_no, selected_seats, capacity FROM session_rooms WHERE session_id = $1', [id]);
    const sessionRooms = roomsRes.rows;

    // Step 3: Get rules
    const rules = typeof session.rules_snapshot === 'string' ? JSON.parse(session.rules_snapshot) : session.rules_snapshot;

    // Step 4: Run engine
    let allocations, teacherAllocations;
    try {
      const result = allocate(students, teachers, sessionRooms, rules);
      allocations = result.studentAllocations;
      teacherAllocations = result.teacherAllocations;
    } catch (engineErr) {
      return res.status(422).json({ error: engineErr.message });
    }

    await db.query('BEGIN');
    try {
      // Step 5a: Delete previous allocation data for THIS session only
      await db.query('DELETE FROM seat_allocations WHERE session_id = $1', [id]);
      await db.query('DELETE FROM session_room_staff WHERE session_id = $1', [id]);

      // Step 5b: Insert fresh studentAllocations
      for (const alloc of allocations) {
        await db.query(
          `INSERT INTO seat_allocations 
           (session_id, room_no, roll_no, student_name, department, year, degree, subject_code, seat_label, bench_no, exam_date, time_from, time_to) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [id, alloc.room_no, alloc.roll_no, alloc.student_name, alloc.department, alloc.year, alloc.degree, alloc.subject_code, alloc.seat_label, alloc.bench_no, session.exam_date, session.time_from, session.time_to]
        );
      }

      // Step 5c: Insert fresh teacherAllocations
      for (const t of teacherAllocations) {
        await db.query(
          `INSERT INTO session_room_staff (session_id, room_no, teacher_name, teacher_id, exam_date, time_from, time_to)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [id, t.room_no, t.teacher_name, t.teacher_id, session.exam_date, session.time_from, session.time_to]
        );
      }

      // Step 6: Update allocation_sessions
      const usedRoomsCount = new Set(allocations.map(a => a.room_no)).size;
      await db.query(
        'UPDATE allocation_sessions SET total_students = $1, total_rooms = $2 WHERE id = $3',
        [allocations.length, usedRoomsCount, id]
      );

      await db.query('COMMIT');

      // Step 7: Return
      return res.status(200).json({ 
        allocated: allocations.length, 
        rooms_used: usedRoomsCount, 
        session_id: id 
      });

    } catch (dbErr) {
      await db.query('ROLLBACK');
      throw dbErr;
    }

  } catch (err) {
    next(err);
  }
};

const publishAllocation = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Step 1: Fetch session by id
    const sessionRes = await db.query('SELECT * FROM allocation_sessions WHERE id = $1', [id]);
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ error: `Session ${id} not found` });
    }
    const session = sessionRes.rows[0];

    // Step 2: If status already 'published'
    if (session.status === 'published') {
      return res.status(400).json({ error: "Already published" });
    }

    // Step 3: Verify seat_allocations exist
    const allocRes = await db.query('SELECT COUNT(*) FROM seat_allocations WHERE session_id = $1', [id]);
    if (parseInt(allocRes.rows[0].count) === 0) {
      return res.status(400).json({ error: "Run allocation before publishing" });
    }

    // Step 5: In a single transaction
    await db.query('BEGIN');
    try {
      // 5a - Check for any OTHER published session with same date+time
      const checkRes = await db.query(
        `SELECT id FROM allocation_sessions 
         WHERE exam_date = $1 AND time_from = $2 AND time_to = $3 
         AND status = 'published' AND id != $4`,
        [session.exam_date, session.time_from, session.time_to, id]
      );

      if (checkRes.rows.length > 0) {
        await db.query('ROLLBACK');
        return res.status(409).json({ error: "Another published allocation already exists for this slot" });
      }

      // 5b - Update this session to published
      await db.query(
        "UPDATE allocation_sessions SET status = 'published', published_at = NOW() WHERE id = $1",
        [id]
      );

      // 5c - Delete all OTHER draft sessions for same date+time slot
      await db.query(
        `DELETE FROM allocation_sessions 
         WHERE exam_date = $1 AND time_from = $2 AND time_to = $3 
         AND status = 'draft' AND id != $4`,
        [session.exam_date, session.time_from, session.time_to, id]
      );

      await db.query('COMMIT');
      
      const updatedRes = await db.query('SELECT published_at FROM allocation_sessions WHERE id=$1', [id]);
      
      return res.status(200).json({ 
        published: true, 
        published_at: updatedRes.rows[0].published_at, 
        session_id: id 
      });
    } catch (dbErr) {
      await db.query('ROLLBACK');
      throw dbErr;
    }
  } catch (err) {
    next(err);
  }
};

const listSessions = async (req, res, next) => {
  try {
    const { status } = req.query;
    let queryStr = `
      SELECT s.id, s.exam_date::text as exam_date, s.time_from, s.time_to, s.status, s.published_at, s.rules_snapshot, s.total_students, s.total_rooms, s.created_at,
        (SELECT COUNT(*) FROM seat_allocations sa WHERE sa.session_id = s.id) as allocation_count
      FROM allocation_sessions s
    `;
    if (status === 'published') {
      queryStr += ` WHERE s.status = 'published' ORDER BY s.published_at DESC`;
    } else {
      queryStr += ` ORDER BY s.created_at DESC`;
    }
    const result = await db.query(queryStr);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const getSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const sessionRes = await db.query('SELECT * FROM allocation_sessions WHERE id = $1', [id]);
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ error: `Session ${id} not found` });
    }

    const roomsRes = await db.query('SELECT * FROM session_rooms WHERE session_id = $1', [id]);
    const staffRes = await db.query('SELECT * FROM session_room_staff WHERE session_id = $1', [id]);

    res.json({
      session: sessionRes.rows[0],
      rooms: roomsRes.rows,
      staff: staffRes.rows
    });
  } catch (err) {
    next(err);
  }
};

const downloadRoomRange = async (req, res, next) => {
  try {
    const { id } = req.params;
    const csv = await generateRoomRangeCSV(id, db);
    res.header('Content-Type', 'text/csv');
    res.attachment('room_range.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

const downloadStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const csv = await generateStaffCSV(id, db);
    res.header('Content-Type', 'text/csv');
    res.attachment('staff.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

const downloadSeatMap = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { room_no } = req.query; // If roomNo provided
    const csv = await generateSeatMapCSV(id, db, room_no);
    res.header('Content-Type', 'text/csv');
    res.attachment('seat_map.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkSlot,
  createSession,
  runAllocation,
  publishAllocation,
  listSessions,
  getSession,
  downloadRoomRange,
  downloadStaff,
  downloadSeatMap
};
