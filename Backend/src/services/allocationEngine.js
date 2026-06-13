function allocate(students, teachers, sessionRooms, rules) {
  // JOB 1 — STUDENT SEAT ALLOCATION

  // STEP 1 — GROUP BY SUBJECT CODE
  const subjectQueues = {};
  students.forEach(s => {
    if (!subjectQueues[s.subject_code]) subjectQueues[s.subject_code] = [];
    subjectQueues[s.subject_code].push(s);
  });
  const subjectKeys = Object.keys(subjectQueues);
  const uniqueSubjectCount = subjectKeys.length;

  // STEP 2 — DETERMINE STUDENTS PER BENCH
  let studentsPerBench;
  if (uniqueSubjectCount === 1) {
    studentsPerBench = 1;
  } else {
    studentsPerBench = rules.maxPerBench || 2;
  }

  // STEP 3 — DEPARTMENT MIXING
  if (rules.deptMixing === false) {
    subjectKeys.forEach(k => {
      subjectQueues[k].sort((a, b) => {
        const deptA = a.department || a.dept || '';
        const deptB = b.department || b.dept || '';
        return deptA.localeCompare(deptB);
      });
    });
  }

  // STEP 5 — PRE-FLIGHT CAPACITY CHECK
  const groupSizes = subjectKeys.map(k => subjectQueues[k].length);
  const largestGroup = Math.max(...groupSizes, 0);
  const othersTotal = students.length - largestGroup;

  let benchesNeeded;
  if (studentsPerBench === 1) {
    benchesNeeded = students.length;
  } else if (largestGroup <= othersTotal) {
    benchesNeeded = Math.ceil(students.length / 2);
  } else {
    benchesNeeded = othersTotal + (largestGroup - othersTotal);
  }

  let totalBenches = 0;
  sessionRooms.forEach(r => {
    let seats = r.selected_seats;
    if (typeof seats === 'string') {
      try { seats = JSON.parse(seats); } catch (e) { seats = []; }
      r.parsed_seats = seats;
    } else {
      r.parsed_seats = seats || [];
    }
    totalBenches += r.parsed_seats.length;
  });

  if (totalBenches < benchesNeeded) {
    throw new Error(`Insufficient capacity: need ${benchesNeeded} benches, only ${totalBenches} selected`);
  }

  // STEP 6 — ASSIGN STUDENTS TO BENCHES
  const studentAllocations = [];
  const benchOccupancy = {};

  for (const room of sessionRooms) {
    // Sort selected_seats: A1, A2, B1, B2...
    const sortedBenches = room.parsed_seats.slice().sort((a, b) => {
      const colA = a.match(/^[A-Z]+/)?.[0] || '';
      const colB = b.match(/^[A-Z]+/)?.[0] || '';
      if (colA !== colB) return colA.localeCompare(colB);
      const numA = parseInt(a.slice(colA.length)) || 0;
      const numB = parseInt(b.slice(colB.length)) || 0;
      return numA - numB;
    });

    let subjectKeyIndex = 0;

    for (const bench of sortedBenches) {
      if (studentAllocations.length >= students.length) break;

      const key = `${room.room_no}_${bench}`;

      if (studentsPerBench === 1) {
        let attempts = 0;
        let assigned = false;
        while (attempts < subjectKeys.length && !assigned) {
          const sKey = subjectKeys[subjectKeyIndex % subjectKeys.length];
          subjectKeyIndex++;
          if (subjectQueues[sKey] && subjectQueues[sKey].length > 0) {
            const student = subjectQueues[sKey].shift();
            studentAllocations.push({
              roll_no: student.roll_no,
              student_name: student.student_name || student.name,
              department: student.department || student.dept,
              year: student.year,
              degree: student.degree,
              subject_code: student.subject_code,
              room_no: room.room_no,
              seat_label: bench,
              bench_no: parseInt(bench.slice(1)) || 0
            });
            benchOccupancy[key] = (benchOccupancy[key] || 0) + 1;
            assigned = true;
          }
          attempts++;
        }
      } else if (studentsPerBench === 2) {
        // SLOT 1
        let attempts1 = 0;
        let student1 = null;
        let lastSubject = null;
        while (attempts1 < subjectKeys.length && !student1) {
          const sKey = subjectKeys[subjectKeyIndex % subjectKeys.length];
          if (subjectQueues[sKey] && subjectQueues[sKey].length > 0) {
            student1 = subjectQueues[sKey].shift();
            lastSubject = sKey;
            studentAllocations.push({
              roll_no: student1.roll_no,
              student_name: student1.student_name || student1.name,
              department: student1.department || student1.dept,
              year: student1.year,
              degree: student1.degree,
              subject_code: student1.subject_code,
              room_no: room.room_no,
              seat_label: bench,
              bench_no: parseInt(bench.slice(1)) || 0
            });
            benchOccupancy[key] = (benchOccupancy[key] || 0) + 1;
            subjectKeyIndex++;
          } else {
             subjectKeyIndex++;
          }
          attempts1++;
        }

        if (!student1) break;

        if (studentAllocations.length >= students.length) break;

        // SLOT 2
        let attempts2 = 0;
        let student2 = null;
        let idx2 = subjectKeyIndex;
        while (attempts2 < subjectKeys.length && !student2) {
          const sKey = subjectKeys[idx2 % subjectKeys.length];
          if (sKey !== lastSubject && subjectQueues[sKey] && subjectQueues[sKey].length > 0) {
            student2 = subjectQueues[sKey].shift();
            studentAllocations.push({
              roll_no: student2.roll_no,
              student_name: student2.student_name || student2.name,
              department: student2.department || student2.dept,
              year: student2.year,
              degree: student2.degree,
              subject_code: student2.subject_code,
              room_no: room.room_no,
              seat_label: bench,
              bench_no: parseInt(bench.slice(1)) || 0
            });
            benchOccupancy[key] = (benchOccupancy[key] || 0) + 1;
            subjectKeyIndex = idx2 + 1;
          } else {
             idx2++;
          }
          attempts2++;
        }
      }
    }
  }

  // JOB 2 — TEACHER ROOM ALLOCATION
  let teacherIndex = 0;
  const teacherAllocations = [];
  
  if (teachers && teachers.length > 0) {
    const usedRooms = [...new Set(studentAllocations.map(s => s.room_no))];
    
    for (const room_no of usedRooms) {
      if (teacherIndex < teachers.length || teachers.length > 0) {
        const teacher1 = teachers[teacherIndex % teachers.length];
        teacherAllocations.push({ room_no, teacher_name: teacher1.teacher_name, teacher_id: teacher1.teacher_id });
        teacherIndex++;
      }
      
      if (teacherIndex < teachers.length || teachers.length > 0) {
        const teacher2 = teachers[teacherIndex % teachers.length];
        teacherAllocations.push({ room_no, teacher_name: teacher2.teacher_name, teacher_id: teacher2.teacher_id });
        teacherIndex++;
      }
    }
  }

  return { studentAllocations, teacherAllocations };
}

module.exports = { allocate };
