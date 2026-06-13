const { Parser } = require('json2csv');

const generateRoomRangeCSV = async (sessionId, db) => {
  const result = await db.query(`
    SELECT 
      sa.room_no,
      sa.year,
      sa.degree,
      sa.department,
      sa.subject_code,
      MIN(sa.roll_no) as reg_from,
      MAX(sa.roll_no) as reg_to,
      COUNT(*) as student_count
    FROM seat_allocations sa
    WHERE sa.session_id = $1
    GROUP BY sa.room_no, sa.year, sa.degree, sa.department, sa.subject_code
    ORDER BY sa.room_no, sa.department
  `, [sessionId]);

  const data = [];
  let currentRoom = null;
  let roomSNo = 0;
  let roomTotals = {};
  
  result.rows.forEach(row => {
    roomTotals[row.room_no] = (roomTotals[row.room_no] || 0) + parseInt(row.student_count, 10);
  });

  result.rows.forEach((row) => {
    let isFirstInRoom = false;
    if (row.room_no !== currentRoom) {
      currentRoom = row.room_no;
      roomSNo++;
      isFirstInRoom = true;
    }

    data.push({
      'S.No': isFirstInRoom ? roomSNo : '',
      'Year': row.year,
      'DEG': row.degree,
      'DEPT': row.department,
      'Subject Code': row.subject_code,
      'Register Nos': `${row.reg_from} - ${row.reg_to}`,
      'Count': row.student_count,
      'Total Count': isFirstInRoom ? roomTotals[row.room_no] : '',
      'Hall No': isFirstInRoom ? row.room_no : ''
    });
  });

  const fields = ['S.No', 'Year', 'DEG', 'DEPT', 'Subject Code', 'Register Nos', 'Count', 'Total Count', 'Hall No'];
  const parser = new Parser({ fields });
  return parser.parse(data);
};

const generateStaffCSV = async (sessionId, db) => {
  // Fetch used rooms in this session
  const roomsRes = await db.query(`
    SELECT DISTINCT room_no FROM seat_allocations 
    WHERE session_id = $1 ORDER BY room_no
  `, [sessionId]);
  
  // Fetch teachers for this session
  const staffRes = await db.query(`
    SELECT teacher_name FROM session_room_staff 
    WHERE session_id = $1 ORDER BY id
  `, [sessionId]);

  const rooms = roomsRes.rows.map(r => r.room_no);
  const teachers = staffRes.rows.map(r => r.teacher_name);

  const data = [];
  
  if (rooms.length === 0) {
    teachers.forEach((t) => data.push({ 'S.No': '', 'Room No': '', 'Staff List': t }));
  } else if (teachers.length === 0) {
    rooms.forEach((r, i) => data.push({ 'S.No': i + 1, 'Room No': r, 'Staff List': '' }));
  } else {
    // Distribute teachers into rooms evenly
    const baseCount = Math.floor(teachers.length / rooms.length);
    let remainder = teachers.length % rooms.length;
    
    let teacherIdx = 0;
    rooms.forEach((room_no, index) => {
      let roomSNo = index + 1;
      let countForThisRoom = baseCount + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
      
      if (countForThisRoom === 0) {
         data.push({
            'S.No': roomSNo,
            'Room No': room_no,
            'Staff List': ''
         });
      }

      for (let i = 0; i < countForThisRoom; i++) {
        if (teacherIdx < teachers.length) {
          data.push({
            'S.No': roomSNo,
            'Room No': room_no,
            'Staff List': teachers[teacherIdx]
          });
          teacherIdx++;
        }
      }
    });
  }

  const fields = ['S.No', 'Room No', 'Staff List'];
  const parser = new Parser({ fields });
  return parser.parse(data);
};

const generateSeatMapCSV = async (sessionId, db, roomNo) => {
  let query = `
    SELECT room_no, roll_no, student_name, seat_label
    FROM seat_allocations
    WHERE session_id = $1
  `;
  const params = [sessionId];

  if (roomNo) {
    query += ` AND room_no = $2`;
    params.push(roomNo);
  }
  
  // Sort by room_no, then extract the numeric part of the seat label to sort properly (e.g. A2 before A10)
  query += ` ORDER BY room_no, substring(seat_label from '^[A-Z]+'), cast(substring(seat_label from '[0-9]+$') as integer)`;

  const result = await db.query(query, params);

  const data = [];
  let currentRoom = null;
  let roomSNo = 0;

  result.rows.forEach((row) => {
    if (row.room_no !== currentRoom) {
      currentRoom = row.room_no;
      roomSNo++;
    }
    data.push({
      'S.No': roomSNo,
      'Room No': row.room_no,
      'Roll No': row.roll_no,
      'Seat No': row.seat_label
    });
  });

  const fields = ['S.No', 'Room No', 'Roll No', 'Seat No'];
  const parser = new Parser({ fields });
  return parser.parse(data);
};

module.exports = { generateRoomRangeCSV, generateStaffCSV, generateSeatMapCSV };
