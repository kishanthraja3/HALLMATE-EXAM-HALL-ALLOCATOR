import os

app_path = r"c:\Users\kisha\Downloads\Projects\Exam Hall Allocator project\backend\src\controllers\sessionController.js"
with open(app_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update checkSlot and createSession for the new duplicate check logic
check_slot_old = """const checkSlot = async (req, res, next) => {
  try {
    const { exam_date, time_from, time_to } = req.body;
    const result = await db.query(
      'SELECT id FROM allocation_sessions WHERE exam_date=$1 AND time_from=$2 AND time_to=$3',
      [exam_date, time_from, time_to]
    );
    if (result.rows.length > 0) {
      return res.status(409).json({ error: "Allocation already exists for this slot", existing_id: result.rows[0].id });
    }
    return res.status(200).json({ available: true });
  } catch (err) {
    next(err);
  }
};"""

check_slot_new = """const checkSlot = async (req, res, next) => {
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
};"""
content = content.replace(check_slot_old, check_slot_new)

create_session_catch_old = """    } catch (dbErr) {
      await db.query('ROLLBACK');
      if (dbErr.code === '23505') {
        return res.status(409).json({ error: "Duplicate allocation detected. An allocation already exists for this slot." });
      }
      throw dbErr;
    }"""
create_session_catch_new = """    } catch (dbErr) {
      await db.query('ROLLBACK');
      throw dbErr;
    }"""
content = content.replace(create_session_catch_old, create_session_catch_new)

# 2. Update runAllocation
run_alloc_old = """    await db.query('BEGIN');
    try {
      // Step 6: Delete existing
      await db.query('DELETE FROM seat_allocations WHERE session_id = $1', [id]);
      await db.query('DELETE FROM session_room_staff WHERE session_id = $1', [id]);

      // Step 7: Insert results
      for (const alloc of allocations) {
        await db.query(
          `INSERT INTO seat_allocations 
           (session_id, room_no, roll_no, student_name, department, year, degree, subject_code, seat_label, bench_no) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [id, alloc.room_no, alloc.roll_no, alloc.student_name, alloc.department, alloc.year, alloc.degree, alloc.subject_code, alloc.seat_label, alloc.bench_no]
        );
      }

      for (const t of teacherAllocations) {
        await db.query(
          `INSERT INTO session_room_staff (session_id, room_no, teacher_name, teacher_id)
           VALUES ($1, $2, $3, $4)`,
          [id, t.room_no, t.teacher_name, t.teacher_id]
        );
      }

      // Step 8: Update counts
      const uniqueRooms = new Set(allocations.map(a => a.room_no)).size;
      await db.query(
        'UPDATE allocation_sessions SET total_students = $1, total_rooms = $2 WHERE id = $3',
        [allocations.length, uniqueRooms, id]
      );

      await db.query('COMMIT');

      // Step 9: Return
      return res.status(200).json({ 
        allocated: allocations.length, 
        rooms_used: uniqueRooms, 
        session_id: id 
      });

    } catch (dbErr) {
      await db.query('ROLLBACK');
      if (dbErr.code === '23505') {
        return res.status(409).json({ error: "Duplicate allocation detected: " + dbErr.detail });
      }
      throw dbErr;
    }"""

run_alloc_new = """    await db.query('BEGIN');
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
    }"""
content = content.replace(run_alloc_old, run_alloc_new)

# 3. Update publishAllocation
publish_old = """const publishAllocation = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Step 1: Verify session
    const sessionRes = await db.query('SELECT status FROM allocation_sessions WHERE id = $1', [id]);
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ error: `Session ${id} not found` });
    }
    if (sessionRes.rows[0].status === 'published') {
      return res.status(400).json({ error: "Already published" });
    }

    // Step 2: Verify seat_allocations
    const allocRes = await db.query('SELECT 1 FROM seat_allocations WHERE session_id = $1 LIMIT 1', [id]);
    if (allocRes.rows.length === 0) {
      return res.status(400).json({ error: "Run allocation before publishing" });
    }

    // Step 3: Update status
    await db.query("UPDATE allocation_sessions SET status='published', published_at=NOW() WHERE id=$1", [id]);

    const updatedRes = await db.query('SELECT published_at FROM allocation_sessions WHERE id=$1', [id]);

    // Step 4: Return
    return res.status(200).json({ 
      published: true, 
      published_at: updatedRes.rows[0].published_at, 
      session_id: id 
    });
  } catch (err) {
    next(err);
  }
};"""

publish_new = """const publishAllocation = async (req, res, next) => {
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
};"""
content = content.replace(publish_old, publish_new)

# 4. In createSession: Update session_rooms insert to include exam_date, time_from, time_to
session_rooms_old = """      // Step 11: Insert into session_rooms
      for (const room_no in parsedSeats) {
        const seats = parsedSeats[room_no];
        await db.query(
          `INSERT INTO session_rooms (session_id, room_no, selected_seats, capacity) 
           VALUES ($1, $2, $3, $4)`,
          [sessionId, room_no, JSON.stringify(seats), seats.length]
        );
      }"""

session_rooms_new = """      // Step 11: Insert into session_rooms
      for (const room_no in parsedSeats) {
        const seats = parsedSeats[room_no];
        await db.query(
          `INSERT INTO session_rooms (session_id, room_no, selected_seats, capacity, exam_date, time_from, time_to) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [sessionId, room_no, JSON.stringify(seats), seats.length, exam_date, time_from, time_to]
        );
      }"""
content = content.replace(session_rooms_old, session_rooms_new)

# In createSession: Update session_room_staff insert to include exam_date, time_from, time_to
staff_insert_old = """      // Step 12: Insert into session_room_staff
      for (const teacher of teachersRecords) {
        await db.query(
          `INSERT INTO session_room_staff (session_id, room_no, teacher_name, teacher_id) 
           VALUES ($1, NULL, $2, $3)`,
          [sessionId, teacher.teacher_name, teacher.teacher_id]
        );
      }"""

staff_insert_new = """      // Step 12: Insert into session_room_staff
      for (const teacher of teachersRecords) {
        await db.query(
          `INSERT INTO session_room_staff (session_id, room_no, teacher_name, teacher_id, exam_date, time_from, time_to) 
           VALUES ($1, NULL, $2, $3, $4, $5, $6)`,
          [sessionId, teacher.teacher_name, teacher.teacher_id, exam_date, time_from, time_to]
        );
      }"""
content = content.replace(staff_insert_old, staff_insert_new)


with open(app_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Backend Controller patched!")
