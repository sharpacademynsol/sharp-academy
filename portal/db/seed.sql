-- Initial Seed Data for Sharp Academy
INSERT OR IGNORE INTO users (id, email, phone, password_hash, full_name, role, city) VALUES 
(1, 'admin@sharpacademy.pk', '03001234567', 'admin_hash_placeholder', 'Principal / Superadmin', 'superadmin', 'Lahore'),
(2, 'instructor@sharpacademy.pk', '03009876543', 'instructor_hash', 'Prof. Tariq Mahmood', 'instructor', 'Lahore'),
(3, 'student@sharpacademy.pk', '03005556677', 'student_hash', 'Hamza Ali', 'student', 'Lahore');

INSERT OR IGNORE INTO course_categories (id, name, slug, description, sort_order) VALUES
(1, 'Computer Science & IT', 'computer-science-it', 'Full-stack development, cloud computing, and AI programming.', 1),
(2, 'Pre-Medical & Science', 'pre-medical-science', 'MDCAT preparation, Biology, Chemistry & Physics mastery.', 2),
(3, 'Commerce & Accounting', 'commerce-accounting', 'CA, ACCA, Economics and financial accounting.', 3);

INSERT OR IGNORE INTO courses (id, category_id, title, slug, code, summary, regular_fee_pkr, admission_fee_pkr, is_featured) VALUES
(1, 1, 'Full-Stack Web Engineering with Cloudflare & Hono', 'full-stack-web-engineering', 'CS-201', 'Master high-performance edge computing, React 19, TypeScript and serverless databases.', 35000, 3000, 1),
(2, 2, 'MDCAT Comprehensive Biology & Chemistry Crash Course', 'mdcat-crash-course', 'MED-101', 'Extensive past papers, daily concept drills, and full-length simulated mock exams.', 28000, 2500, 1),
(3, 3, 'Financial Accounting & Cost Management', 'financial-accounting', 'ACC-105', 'Core financial reporting, balance sheet auditing, and corporate bookkeeping principles.', 22000, 2000, 0);

INSERT OR IGNORE INTO batches (id, course_id, instructor_id, name, batch_code, mode, start_date, status) VALUES
(1, 1, 2, 'Evening Batch Alpha (Fall 2026)', 'FSW-2026-A', 'hybrid', '2026-11-01', 'enrolling'),
(2, 2, 2, 'Morning MDCAT Drill Batch', 'MDC-2026-M', 'on_campus', '2026-10-25', 'enrolling');

INSERT OR IGNORE INTO batch_schedules (batch_id, day_of_week, start_time, end_time, room_number, live_meeting_url) VALUES
(1, 'Monday', '18:00', '20:00', 'Lab 1', 'https://meet.google.com/abc-defg-hij'),
(1, 'Wednesday', '18:00', '20:00', 'Lab 1', 'https://meet.google.com/abc-defg-hij'),
(1, 'Friday', '18:00', '20:00', 'Lab 1', 'https://meet.google.com/abc-defg-hij'),
(2, 'Tuesday', '09:00', '12:00', 'Lecture Hall B', NULL),
(2, 'Thursday', '09:00', '12:00', 'Lecture Hall B', NULL);

INSERT OR IGNORE INTO exams (id, course_id, batch_id, title, exam_type, duration_minutes, total_marks, passing_marks, is_published, created_by) VALUES
(1, 1, 1, 'Web Engineering Midterm Evaluation', 'quiz', 30, 20, 10, 1, 1),
(2, 2, 2, 'Cadet & ISSB Non-Verbal Intelligence Assessment', 'quiz', 20, 10, 5, 1, 1);

INSERT OR IGNORE INTO exam_questions (id, exam_id, question_text, question_type, marks, options_json, correct_answer, explanation, sort_order) VALUES
(1, 1, 'Which runtime powers Cloudflare Workers at the edge?', 'mcq', 5, '[{"id":1,"text":"Node.js V8 Engine"},{"id":2,"text":"workerd (V8 Isolate runtime)"},{"id":3,"text":"Deno core"},{"id":4,"text":"Bun native"}]', '2', 'Cloudflare Workers execute within the open-source workerd V8 isolate runtime.', 1),
(2, 1, 'What is the primary benefit of Cloudflare R2 over AWS S3?', 'mcq', 5, '[{"id":1,"text":"Zero egress bandwidth fees"},{"id":2,"text":"Faster CPU"},{"id":3,"text":"Automatic audio transcription"},{"id":4,"text":"Built-in relational SQL"}]', '1', 'Cloudflare R2 provides S3-compatible storage with zero egress bandwidth charges.', 2),
(3, 2, 'Look at the pattern sequence below. Which figure should logically replace the question mark (?) in the series? / پیٹرن کے تسلسل کو دیکھ کر درست شکل کا انتخاب کریں:', 'non_verbal', 10, '{"sub_type":"series","problem_images":["data:image/svg+xml;utf8,<svg xmlns=''http://www.w3.org/2000/svg'' width=''100'' height=''100'' viewBox=''0 0 100 100''><rect width=''100'' height=''100'' rx=''14'' fill=''%23f8fafc'' stroke=''%23cbd5e1'' stroke-width=''2''/><g transform=''rotate(0 50 50)''><path d=''M50 20 L50 80 M50 20 L35 35 M50 20 L65 35'' stroke=''%232563eb'' stroke-width=''6'' stroke-linecap=''round'' stroke-linejoin=''round''/></g></svg>","data:image/svg+xml;utf8,<svg xmlns=''http://www.w3.org/2000/svg'' width=''100'' height=''100'' viewBox=''0 0 100 100''><rect width=''100'' height=''100'' rx=''14'' fill=''%23f8fafc'' stroke=''%23cbd5e1'' stroke-width=''2''/><g transform=''rotate(45 50 50)''><path d=''M50 20 L50 80 M50 20 L35 35 M50 20 L65 35'' stroke=''%232563eb'' stroke-width=''6'' stroke-linecap=''round'' stroke-linejoin=''round''/></g></svg>","data:image/svg+xml;utf8,<svg xmlns=''http://www.w3.org/2000/svg'' width=''100'' height=''100'' viewBox=''0 0 100 100''><rect width=''100'' height=''100'' rx=''14'' fill=''%23f8fafc'' stroke=''%23cbd5e1'' stroke-width=''2''/><g transform=''rotate(90 50 50)''><path d=''M50 20 L50 80 M50 20 L35 35 M50 20 L65 35'' stroke=''%232563eb'' stroke-width=''6'' stroke-linecap=''round'' stroke-linejoin=''round''/></g></svg>"],"options":[{"id":"1","label":"A","image_url":"data:image/svg+xml;utf8,<svg xmlns=''http://www.w3.org/2000/svg'' width=''100'' height=''100'' viewBox=''0 0 100 100''><rect width=''100'' height=''100'' rx=''14'' fill=''%23f8fafc'' stroke=''%23cbd5e1'' stroke-width=''2''/><g transform=''rotate(135 50 50)''><path d=''M50 20 L50 80 M50 20 L35 35 M50 20 L65 35'' stroke=''%23059669'' stroke-width=''6'' stroke-linecap=''round'' stroke-linejoin=''round''/></g></svg>","text":"135° Rotation (Next)"},{"id":"2","label":"B","image_url":"data:image/svg+xml;utf8,<svg xmlns=''http://www.w3.org/2000/svg'' width=''100'' height=''100'' viewBox=''0 0 100 100''><rect width=''100'' height=''100'' rx=''14'' fill=''%23f8fafc'' stroke=''%23cbd5e1'' stroke-width=''2''/><g transform=''rotate(180 50 50)''><path d=''M50 20 L50 80 M50 20 L35 35 M50 20 L65 35'' stroke=''%233b82f6'' stroke-width=''6'' stroke-linecap=''round'' stroke-linejoin=''round''/></g></svg>","text":"180° Downwards"},{"id":"3","label":"C","image_url":"data:image/svg+xml;utf8,<svg xmlns=''http://www.w3.org/2000/svg'' width=''100'' height=''100'' viewBox=''0 0 100 100''><rect width=''100'' height=''100'' rx=''14'' fill=''%23f8fafc'' stroke=''%23cbd5e1'' stroke-width=''2''/><g transform=''rotate(270 50 50)''><path d=''M50 20 L50 80 M50 20 L35 35 M50 20 L65 35'' stroke=''%233b82f6'' stroke-width=''6'' stroke-linecap=''round'' stroke-linejoin=''round''/></g></svg>","text":"270° Leftwards"},{"id":"4","label":"D","image_url":"data:image/svg+xml;utf8,<svg xmlns=''http://www.w3.org/2000/svg'' width=''100'' height=''100'' viewBox=''0 0 100 100''><rect width=''100'' height=''100'' rx=''14'' fill=''%23f8fafc'' stroke=''%23cbd5e1'' stroke-width=''2''/><g transform=''rotate(315 50 50)''><path d=''M50 20 L50 80 M50 20 L35 35 M50 20 L65 35'' stroke=''%233b82f6'' stroke-width=''6'' stroke-linecap=''round'' stroke-linejoin=''round''/></g></svg>","text":"315° Up-Left"}],"matrix_grid":"2x2"}', '1', 'Each figure rotates 45° clockwise. Figure 1 is at 0°, Figure 2 is at 45°, and Figure 3 is at 90°. The next logical shape must be rotated 135°, which corresponds to Option A.', 1);


-- LMS Modules
INSERT OR IGNORE INTO course_modules (id, course_id, title, summary, sort_order) VALUES
(1, 1, 'Module 1: Edge Compute & Cloudflare Fundamentals', 'Master V8 isolates, serverless edge runtimes, and the Hono framework.', 1),
(2, 1, 'Module 2: Cloudflare D1 (SQLite) & Relational Modeling', 'Schema design, indexes, transactions, and edge replication.', 2),
(3, 1, 'Module 3: Object Storage & Production Deployment', 'Zero-egress asset delivery with Cloudflare R2 and OpenNext.', 3);

-- LMS Lessons
INSERT OR IGNORE INTO lessons (id, module_id, title, slug, lesson_type, content_markdown, video_url, duration_minutes, is_preview_allowed, sort_order) VALUES
(1, 1, 'Lesson 1: Introduction to V8 Isolates vs Containers', 'intro-v8-isolates', 'video', '### Overview
Understand how Cloudflare Workers achieve sub-10ms response times without traditional cold starts.

### Key Takeaways
- V8 Isolates vs Docker Containers
- Edge compute vs Origin VPS
- Workerd runtime mechanics', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 35, 1, 1),
(2, 1, 'Lesson 2: Fast Edge Routing with Hono & JSX SSR', 'routing-with-hono', 'video', '### Overview
Learn how Hono provides ultra-lightweight routing and direct Server-Side Rendering (SSR) with zero React hydration overhead.', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 45, 0, 2),
(3, 2, 'Lesson 3: D1 Database Setup & Foreign Key Constraints', 'd1-setup-constraints', 'document', '### Overview
Best practices for SQLite at the edge. How to enforce foreign keys, write indexed lookups, and handle SQLite concurrency locks.', NULL, 30, 0, 1),
(4, 3, 'Lesson 4: Cloudflare R2 Integration & Zero-Egress Streaming', 'r2-integration-streaming', 'video', '### Overview
Streaming course materials, videos, and PDFs directly from Cloudflare R2 object storage with immutable edge caching.', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 40, 0, 1);

-- Lesson Attachments (PDFs / Slides)
INSERT OR IGNORE INTO lesson_attachments (id, lesson_id, title, file_url, file_size_bytes, file_type) VALUES
(1, 1, 'Lecture 01 Slides - Architecture & Isolates.pdf', '/cdn/materials/lecture-01-slides.pdf', 2450000, 'application/pdf'),
(2, 2, 'Hono Edge Cheatsheet & Code Samples.pdf', '/cdn/materials/hono-cheatsheet.pdf', 1250000, 'application/pdf'),
(3, 3, 'D1 SQL Best Practices & Schema Guide.pdf', '/cdn/materials/d1-schema-guide.pdf', 850000, 'application/pdf');

-- Student Enrollment (Hamza Ali enrolled in Batch 1)
INSERT OR IGNORE INTO registrations (id, registration_no, student_id, batch_id, status, total_fee_pkr, net_payable_pkr) VALUES
(1, 'REG-2026-0001', 3, 1, 'approved', 35000, 35000);

-- Initial Lesson Progress (Lesson 1 completed)
INSERT OR IGNORE INTO student_lesson_progress (id, student_id, lesson_id, is_completed, watched_seconds, completed_at) VALUES
(1, 3, 1, 1, 2100, CURRENT_TIMESTAMP);


-- Default Site Settings
INSERT OR REPLACE INTO site_settings (key, value) VALUES
('academy_name', 'Sharp Academy'),
('tagline', 'Empowering Minds, Shaping Futures at the Edge'),
('contact_phone', '0300-1234567'),
('contact_email', 'info@sharpacademy.pk'),
('address', 'Main Campus, Gulberg III, Lahore, Pakistan'),
('current_term', 'Fall 2026 Session');

-- Default Bank Accounts
INSERT OR IGNORE INTO bank_accounts (id, bank_name, account_title, account_number, iban, is_active) VALUES
(1, 'Meezan Bank Limited', 'Sharp Academy PK', '02010108920192', 'PK45MEZN0002010108920192', 1),
(2, 'JazzCash / EasyPaisa', 'Sharp Academy Admissions', '03001234567', NULL, 1);

-- Default Student Avatar for Hamza Ali
UPDATE users SET avatar_url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' WHERE id = 3;
