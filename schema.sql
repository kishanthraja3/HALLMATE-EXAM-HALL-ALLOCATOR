-- Database Schema for Exam Hall Allocator Project
-- Target database name: "Examhall"

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    room_no VARCHAR(50) PRIMARY KEY,
    capacity INT DEFAULT 40
);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    roll_no TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    year TEXT NOT NULL,
    degree TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    teacher_id TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Allocation Sessions Table
CREATE TABLE IF NOT EXISTS allocation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_date DATE NOT NULL,
    time_from TIME NOT NULL,
    time_to TIME NOT NULL,
    rules_snapshot JSONB,
    total_students INT DEFAULT 0,
    total_rooms INT DEFAULT 0,
    status TEXT DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Session Rooms Table
CREATE TABLE IF NOT EXISTS session_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES allocation_sessions(id) ON DELETE CASCADE,
    room_no TEXT NOT NULL,
    selected_seats JSONB,
    capacity INT,
    exam_date DATE,
    time_from TIME,
    time_to TIME,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Session Room Staff Table
CREATE TABLE IF NOT EXISTS session_room_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES allocation_sessions(id) ON DELETE CASCADE,
    room_no TEXT,
    teacher_name TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    exam_date DATE,
    time_from TIME,
    time_to TIME,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Seat Allocations Table
CREATE TABLE IF NOT EXISTS seat_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES allocation_sessions(id) ON DELETE CASCADE,
    room_no TEXT NOT NULL,
    roll_no TEXT NOT NULL,
    student_name TEXT NOT NULL,
    department TEXT NOT NULL,
    year TEXT NOT NULL,
    degree TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    seat_label TEXT NOT NULL,
    bench_no INT NOT NULL,
    exam_date DATE,
    time_from TIME,
    time_to TIME,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Alteration Requests Table
CREATE TABLE IF NOT EXISTS alteration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES allocation_sessions(id) ON DELETE CASCADE,
    requesting_teacher_id TEXT NOT NULL,
    room_no TEXT NOT NULL,
    exam_date DATE NOT NULL,
    time_from TIME NOT NULL,
    time_to TIME NOT NULL,
    reason TEXT NOT NULL,
    suggested_alt_id TEXT,
    status TEXT DEFAULT 'pending',
    resolved_by TEXT,
    final_teacher_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
