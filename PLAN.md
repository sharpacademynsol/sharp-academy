# Sharp Academy — Comprehensive Architectural Blueprint & Engineering Master Plan

> **Enterprise Edge LMS, Educational Portal & Online Examination Platform**  
> *Stack: Cloudflare Workers, Hono JSX (SSR), Next.js 16 (React 19), OpenNext Cloudflare, Cloudflare D1 (SQLite), Cloudflare R2, Tailwind CSS v4*

---

## 1. Executive Summary & Purpose

> **Cloudflare Account Ownership:**  
> All production resources (DNS zones, D1 databases, R2 storage, Workers) for Sharp Academy are strictly provisioned under **`asifslk2024@gmail.com`** (fully isolated from `dev@corelogix.dev`).

**Sharp Academy** is an end-to-end educational institution web platform engineered for sub-10ms edge performance, zero server maintenance overhead, and instant mobile load times. 

It replicates and customizes the dual-system enterprise architecture established in the Kidstown codebase:
1. **Public & Student Engine (`portal/`):** A high-speed, zero-cold-start edge application built with **Hono v4** and **Hono JSX Server-Side Rendering (SSR)**. Handles public marketing, program listings, live batch timetables, admission forms, LMS video lecture player, downloadable notes, and an online exam taking engine.
2. **Operations & Administration Engine (`admin/`):** A comprehensive backoffice management application built with **Next.js 16 (App Router, React 19)** on Cloudflare via **@opennextjs/cloudflare**. Provides rich interactive controls for admissions, curriculum design, batch schedules, question bank management, auto-grading, and fee ledgers.
3. **Shared Persistence & Zero-Egress Storage:**
   - **Cloudflare D1:** Serverless distributed SQLite database storing the single source of truth across both portal and admin.
   - **Cloudflare R2:** S3-compatible blob storage with **zero egress bandwidth fees** for lecture videos, PDFs, past papers, and bank payment slips.
   - **Unified Local State:** Configured via `--persist-to=../.wrangler/state`, allowing both applications to operate on the same live SQLite database during local development.

---

## 2. Technology Stack Breakdown

| Layer | Technology | Role in Sharp Academy | Key Benefit |
|---|---|---|---|
| **Edge Compute Runtime** | **Cloudflare Workers** (`workerd`) | Serverless execution worldwide | 0ms cold start, sub-10ms response, zero servers to patch |
| **Portal Framework** | **Hono** (`v4.7.2`) + JSX SSR | Public portal, admissions, student LMS & quiz engine | ~15KB micro-framework, direct HTML streaming |
| **Admin Web App** | **Next.js 16** (React 19) | Academic administration, fee ledgers, scheduling matrix | React 19 Server Actions, Lucide iconography, dense dashboards |
| **Edge Next.js Adapter** | **@opennextjs/cloudflare** (`v1.19.1`) | Deploys Next.js directly on Cloudflare Workers | Serverless Next.js without container or Node VPS cost |
| **Relational Database** | **Cloudflare D1** (SQLite) | ACID database for all courses, admissions, exams, fees | Relational queries, edge replication, zero config |
| **Object Storage** | **Cloudflare R2** | Video files, PDF notes, student bank slips | S3 API compatibility with **$0 egress bandwidth fees** |
| **Styling** | **Tailwind CSS v4** | Consistent styling across portal and admin | Micro-bundle standalone compile via `@tailwindcss/node` |
| **Iconography** | **Lucide Icons** (`v1.8.0`) | Dashboard analytics, navigation, and badges | Clean, modern vector icons |
| **Client Scripting** | Vanilla JS (ES6+) | Exam timer countdown, cart/enrollment drawer | Zero React hydration overhead for mobile students |

---

## 3. General Engineering Instructions & Design Patterns

### 3.1 Shared Wrangler Local State Across Portal & Admin
Running two independent development servers (`portal` on port 8787 and `admin` on port 3000) requires a shared SQLite database file. This is achieved by binding both projects to:
```
.wrangler/state/v3/
```
- Portal runs: `wrangler dev --persist-to=../.wrangler/state`
- Admin uses: `cloudflare-dev-init.mjs` pointing `persist.path` to `../.wrangler/state/v3`.

### 3.2 High-Performance Edge Stream Proxy for Materials (`/cdn/*`)
Instead of exposing private R2 bucket URLs or incurring external CDN costs, the portal worker streams assets directly with long-lived immutable cache headers:
```typescript
app.get('/cdn/*', async (c) => {
  const key = c.req.path.replace(/^/cdn//, '');
  const object = await c.env.FILES.get(key);
  if (!object) return c.text('Not Found', 404);

  return c.body(object.body, 200, {
    'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'ETag': object.httpEtag
  });
});
```

### 3.3 Handling D1 Concurrency (`SQLITE_BUSY`)
Because SQLite serializes concurrent write transactions, `admin/lib/db.ts` implements `withD1Retry()` with exponential backoff to handle transient locks during peak batch updates.

---

## 4. Sharp Academy Functional Scope

### 4.1 Public Portal & Admissions (`portal/`)
- **Program Catalog:** Categorized courses (Computer Science, Pre-Medical, Commerce, Languages) with filter tags, instructor credits, and syllabus summaries.
- **Detailed Course Landing Pages:** Video overview, prerequisite checklist, weekly curriculum outline, and fee breakdown.
- **Batch Schedules & Timetables:** Comprehensive class timetable filtering by day (Mon-Sun), shift (Morning/Evening), mode (On-Campus/Online), and room number.
- **Student Registration & Admission Form:** Online admission workflow collecting student biodata, guardian contact, CNIC/B-Form, batch preference, and educational background.
- **Payment Slip Upload:** Direct student upload of bank transfer receipts or JazzCash/EasyPaisa transaction IDs to Cloudflare R2.

### 4.2 Learning Management System (LMS)
- **Student Classroom:** Structured hierarchy of Course -> Modules -> Lessons.
- **Multi-Format Lessons:** Video lectures (Cloudflare Stream, YouTube, Vimeo), markdown study guides, and downloadable PDF past papers.
- **Progress Tracking:** Automated lesson completion marking and course progress bar.
- **Daily Attendance Marking:** Instructors mark daily roll call (*Present, Absent, Late, Excused*).

### 4.3 Online Examination & Quiz Engine
- **Live Countdown Timer:** Enforced exam duration with automatic form submission when time expires.
- **Question Engine:** MCQs, True/False, and Short Answer questions with randomized question order.
- **Instant Auto-Grading:** Objective MCQs scored immediately upon submission.
- **Answer Key & Explanations:** Detailed solution reviews highlighting correct answers and reasoning.
- **Student Academic Transcript:** Historical exam record with percentage scores and pass/fail badges.

### 4.4 Tuition Fees & Financial Ledger
- **Automated Vouchers:** System generates unique invoice numbers (e.g., `INV-2026-1001`).
- **Payment Verification:** Multi-status invoice tracking: *Unpaid, Pending Verification, Verified, Waived*.
- **Cash Counter & Bank Reconciliation:** Receipts for cash at desk, bank deposits, and mobile wallets.

### 4.5 Backoffice Administration Dashboard (`admin/`)
- `/admin/dashboard`: Admissions overview, active student count, monthly fee collection, and upcoming classes.
- `/admin/courses`: Course builder, chapter organizer, and lesson editor.
- `/admin/batches`: Class scheduler, room assignment, instructor mapping, and capacity manager.
- `/admin/students`: Student directory, roll number assignments, and academic records.
- `/admin/registrations`: Admission pipeline (Pending, Approved, Fee Awaited, Enrolled).
- `/admin/exams`: Question bank, quiz creator, and grading dashboard.
- `/admin/finance`: Fee invoices, payment reconciliation, and audit logs.
- `/admin/staff`: Instructor directories and role permission management.
- `/admin/settings`: Academy contact details, bank accounts, and announcements.

---

## 5. Complete D1 Database Schema

The database schema is fully defined in `portal/db/schema.sql` and contains:
1. `users` (Roles: superadmin, admin, instructor, student, parent) & `sessions`
2. `course_categories`, `courses`, `course_modules`, `lessons`, `lesson_attachments`
3. `batches`, `batch_schedules`, `registrations`
4. `attendance`, `student_lesson_progress`
5. `exams`, `exam_questions`, `exam_submissions`, `student_answers`
6. `fee_invoices`, `payment_transactions`, `system_audit_logs`

---

## 6. Implementation Plan & Milestones

```
Phase 1 (Week 1-2): Foundation & Monorepo Setup
├── Run local D1 migration & seed demo data
└── Connect shared Wrangler state between portal and admin

Phase 2 (Week 3-4): Public Portal & Course Catalog
├── Hono JSX layouts with Tailwind v4 styling
└── Interactive schedule matrix & course details

Phase 3 (Week 5-6): Admission & Invoicing Pipeline
├── Student admission registration workflow
└── Voucher generation & R2 payment slip upload

Phase 4 (Week 7-8): LMS & Classroom
├── Video lecture player & lesson progress tracker
└── Instructor digital attendance register

Phase 5 (Week 9-10): Examination & Quiz Engine
├── Admin question bank & exam builder
└── Timed exam taker with auto-grading

Phase 6 (Week 11-12): Production Launch on Cloudflare
├── Provision remote Cloudflare D1 & R2
└── Deploy to sharpacademy.pk & admin.sharpacademy.pk
```
