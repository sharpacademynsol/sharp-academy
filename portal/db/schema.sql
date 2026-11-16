-- =============================================================
-- Sharp Academy Cloudflare D1 Database Schema
-- Multi-role: Superadmin, Admin, Instructor, Student, Parent
-- =============================================================

PRAGMA foreign_keys = ON;

-- 1. Identity & Auth
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'instructor', 'student', 'parent')),
  avatar_url TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth TEXT,
  cnic_or_bform TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  address TEXT,
  city TEXT NOT NULL DEFAULT 'Lahore',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Academics: Categories, Courses & Curriculum
CREATE TABLE IF NOT EXISTS course_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  promo_video_url TEXT,
  level TEXT NOT NULL DEFAULT 'Beginner',
  duration_weeks INTEGER NOT NULL DEFAULT 12,
  regular_fee_pkr INTEGER NOT NULL,
  admission_fee_pkr INTEGER NOT NULL DEFAULT 0,
  discount_fee_pkr INTEGER,
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES course_categories(id)
);

CREATE INDEX IF NOT EXISTS idx_courses_category_active ON courses(category_id, is_active);

CREATE TABLE IF NOT EXISTS course_modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  lesson_type TEXT NOT NULL CHECK (lesson_type IN ('video', 'document', 'live_stream', 'quiz')),
  content_markdown TEXT,
  video_url TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  is_preview_allowed INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lesson_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  file_type TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- 3. Batches, Timetables & Schedules
CREATE TABLE IF NOT EXISTS batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  instructor_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  batch_code TEXT NOT NULL UNIQUE,
  mode TEXT NOT NULL CHECK (mode IN ('on_campus', 'online', 'hybrid')),
  max_capacity INTEGER NOT NULL DEFAULT 35,
  start_date TEXT NOT NULL,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'enrolling', 'active', 'completed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (instructor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS batch_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room_number TEXT,
  live_meeting_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
);

-- 4. Admissions, Enrollments & Progress
CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_no TEXT NOT NULL UNIQUE,
  student_id INTEGER NOT NULL,
  batch_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  total_fee_pkr INTEGER NOT NULL,
  discount_amount_pkr INTEGER NOT NULL DEFAULT 0,
  net_payable_pkr INTEGER NOT NULL,
  admin_remarks TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (batch_id) REFERENCES batches(id)
);

CREATE INDEX IF NOT EXISTS idx_registrations_batch ON registrations(batch_id, status);
CREATE INDEX IF NOT EXISTS idx_registrations_student ON registrations(student_id);

CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  class_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  remarks TEXT,
  marked_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches(id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (marked_by) REFERENCES users(id),
  UNIQUE(batch_id, student_id, class_date)
);

CREATE TABLE IF NOT EXISTS student_lesson_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  lesson_id INTEGER NOT NULL,
  is_completed INTEGER NOT NULL DEFAULT 0,
  watched_seconds INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (lesson_id) REFERENCES lessons(id),
  UNIQUE(student_id, lesson_id)
);

-- 5. Online Exams, Quizzes & Grading
CREATE TABLE IF NOT EXISTS exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  batch_id INTEGER,
  title TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('quiz', 'midterm', 'final', 'practice_mock')),
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  total_marks INTEGER NOT NULL DEFAULT 100,
  passing_marks INTEGER NOT NULL DEFAULT 50,
  starts_at TEXT,
  ends_at TEXT,
  is_published INTEGER NOT NULL DEFAULT 0,
  shuffle_questions INTEGER NOT NULL DEFAULT 1,
  omr_enabled INTEGER NOT NULL DEFAULT 0,
  omr_set_count INTEGER NOT NULL DEFAULT 4,
  omr_bubble_count INTEGER NOT NULL DEFAULT 5,
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (batch_id) REFERENCES batches(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS question_bank (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  topic TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  marks INTEGER NOT NULL DEFAULT 10,
  options_json TEXT,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  tags TEXT,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_qb_course_type ON question_bank(course_id, question_type);
CREATE INDEX IF NOT EXISTS idx_qb_difficulty ON question_bank(difficulty);

CREATE TABLE IF NOT EXISTS custom_shapes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  r2_key TEXT,
  mime_type TEXT,
  file_size INTEGER,
  category TEXT NOT NULL DEFAULT 'custom',
  tags TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL,
  bank_question_id INTEGER,
  is_modified_from_source INTEGER NOT NULL DEFAULT 0,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  marks INTEGER NOT NULL DEFAULT 1,
  options_json TEXT,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (bank_question_id) REFERENCES question_bank(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS exam_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at TEXT,
  score_obtained INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'evaluated')),
  feedback TEXT,
  evaluated_by INTEGER,
  FOREIGN KEY (exam_id) REFERENCES exams(id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (evaluated_by) REFERENCES users(id),
  UNIQUE(exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS student_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  student_answer TEXT,
  is_correct INTEGER,
  marks_awarded INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (submission_id) REFERENCES exam_submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES exam_questions(id)
);

-- 5a. Paper-Based Testing (PBT) OMR Sets & Candidate Allocation
CREATE TABLE IF NOT EXISTS exam_omr_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL,
  set_code TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  seed INTEGER NOT NULL,
  questions_order_json TEXT NOT NULL,
  options_map_json TEXT NOT NULL,
  answer_key_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  UNIQUE(exam_id, set_code)
);

CREATE TABLE IF NOT EXISTS student_omr_allocations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL,
  student_id INTEGER,
  registration_no TEXT,
  student_name TEXT,
  omr_set_id INTEGER NOT NULL,
  set_code TEXT NOT NULL,
  seat_number TEXT,
  barcode TEXT NOT NULL UNIQUE,
  is_scanned INTEGER NOT NULL DEFAULT 0,
  raw_answers_json TEXT,
  score_obtained INTEGER,
  scanned_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (omr_set_id) REFERENCES exam_omr_sets(id)
);

-- 6. Fees, Invoices & Financial Ledger
CREATE TABLE IF NOT EXISTS fee_invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_no TEXT NOT NULL UNIQUE,
  registration_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  amount_pkr INTEGER NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid', 'waived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES registrations(id),
  FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  amount_pkr INTEGER NOT NULL CHECK (amount_pkr > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'jazzcash', 'easypaisa', 'online_gateway')),
  transaction_ref TEXT,
  slip_attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'verified' CHECK (status IN ('pending_verification', 'verified', 'rejected')),
  received_by INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES fee_invoices(id),
  FOREIGN KEY (received_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payment_transactions(invoice_id, status);

CREATE TABLE IF NOT EXISTS system_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  details_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);


-- 7. System Site Settings & Bank Accounts
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_name TEXT NOT NULL,
  account_title TEXT NOT NULL,
  account_number TEXT NOT NULL,
  iban TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Custom Shape Assets for Non-Verbal Questions (Stored systematically in Cloudflare R2)
CREATE TABLE IF NOT EXISTS custom_shapes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  r2_key TEXT,
  mime_type TEXT,
  file_size INTEGER,
  category TEXT NOT NULL DEFAULT 'custom',
  tags TEXT,
  svg_content TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

