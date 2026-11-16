# Sharp Academy

> **High-Performance Educational Portal, LMS & Examination System**  
> *Built on Cloudflare Workers, Hono JSX (SSR), Next.js 16 (React 19), Cloudflare D1 (SQLite), and Cloudflare R2.*

Sharp Academy is a modern, serverless educational platform designed to manage courses, batches, timetables, student admissions, digital classrooms, online exams, and institutional finance.

---

## 📂 Repository Structure

```text
sharp-academy/
├── portal/            # Public Website, Student LMS & Exam Engine (Hono + JSX SSR)
│   ├── src/           # Hono edge routes, layout, pages & components
│   ├── db/            # D1 SQLite schema (schema.sql) & seed data (seed.sql)
│   ├── wrangler.toml  # Cloudflare Worker bindings (DB, FILES, ASSETS)
│   └── build-css.mjs  # Standalone Tailwind CSS v4 compiler script
├── admin/             # Operations & Academy Backoffice (Next.js 16 + OpenNext)
│   ├── app/           # Next.js App Router (Dashboard, Courses, Batches, Exams, Finance)
│   ├── lib/           # D1 database client with retry logic (db.ts)
│   ├── wrangler.toml  # Cloudflare Worker config for OpenNext
│   └── cloudflare-dev-init.mjs # Shared local D1/R2 state connector
├── academydesign/     # Reusable design system, classroom UI & exam components
├── scripts/           # Local dev helpers and database maintenance scripts
├── PLAN.md            # Detailed architectural blueprint, schema & implementation plan
└── package.json       # Monorepo root scripts & dev orchestration
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v20+ or v22+
- **Wrangler CLI**: v4.82+ (`npm install -g wrangler`)

### 2. Install Dependencies
Run in the root folder:
```bash
npm run setup:local
```
*This installs dependencies for both `portal` and `admin`, compiles the Tailwind CSS, and prepares the local database.*

### 3. Initialize & Seed Local Database
Set up the shared local Cloudflare D1 database:
```bash
npm run db:local:migrate
npm run db:local:seed
```
*This executes `portal/db/schema.sql` and `portal/db/seed.sql` into `.wrangler/state/v3`, creating all tables, admin accounts, and demo courses.*

### 4. Run Development Servers
Open two terminal tabs:

**Terminal 1 — Portal (Public Site, LMS & Exams):**
```bash
npm run dev:portal
```
> Runs at **http://localhost:8787**

**Terminal 2 — Admin (Academy Backoffice):**
```bash
npm run dev:admin
```
> Runs at **http://localhost:3000**

---

## 🔑 Default Credentials (Local Seed)

| Role | Email | Password |
|---|---|---|
| **Superadmin / Principal** | `admin@sharpacademy.pk` | `admin123` |
| **Instructor** | `instructor@sharpacademy.pk` | `instructor123` |
| **Student** | `student@sharpacademy.pk` | `student123` |

---

## 🛠️ Key Monorepo Commands

| Command | Action |
|---|---|
| `npm run setup:local` | Installs dependencies across all packages |
| `npm run dev:portal` | Starts the Hono portal on port 8787 |
| `npm run dev:admin` | Starts the Next.js admin on port 3000 |
| `npm run db:local:migrate` | Runs `schema.sql` on local D1 SQLite |
| `npm run db:local:seed` | Inserts demo records into local D1 SQLite |
| `npm --prefix portal run build:css` | Compiles Tailwind CSS v4 for portal |

---

## ☁️ Cloudflare Account Setup (`asifslk2024@gmail.com`)

> **IMPORTANT:** This project must be deployed to the **`asifslk2024@gmail.com`** Cloudflare account, completely isolated from **`dev@corelogix.dev`**.

### 1. Check & Switch Cloudflare Login
Before running any remote Wrangler commands, verify which account is currently active:

```bash
# 1. Check current logged-in Cloudflare account
npx wrangler whoami

# 2. If it is logged into dev@corelogix.dev (or any other account), log out:
npx wrangler logout

# 3. Log into asifslk2024@gmail.com:
npx wrangler login
```
*A browser window will open. Sign in using **`asifslk2024@gmail.com`** and authorize Wrangler.*

### 2. Lock Deployments via `account_id` (Safety Lock)
To guarantee that deployments never accidentally touch another account:
1. Run `npx wrangler whoami` to copy your **Account ID** under `asifslk2024@gmail.com`.
2. In both `portal/wrangler.toml` and `admin/wrangler.toml`, uncomment and paste:
   ```toml
   account_id = "your_account_id_here"
   ```
Wrangler will reject any deployment attempt if the logged-in session does not match this Account ID.

---

## 🌐 Production Deployment to Cloudflare

### 1. Create Remote Cloudflare Resources
```bash
# 1. Create Cloudflare D1 Database
wrangler d1 create sharp-db

# 2. Create Cloudflare R2 Bucket
wrangler r2 bucket create sharp-materials
```

Update the resulting `database_id` in both `portal/wrangler.toml` and `admin/wrangler.toml`.

### 2. Apply Remote Migrations
```bash
wrangler d1 execute sharp-db --remote --file=./portal/db/schema.sql
wrangler d1 execute sharp-db --remote --file=./portal/db/seed.sql
```

### 3. Deploy Applications
```bash
# Deploy Portal (Hono Edge Worker)
npm --prefix portal run deploy

# Deploy Admin (Next.js via OpenNext)
npm --prefix admin run cf:deploy
```

---

## 📖 Complete Documentation
For the complete technical blueprint, architectural deep-dive, database diagrams, and the 12-week implementation schedule, see [PLAN.md](PLAN.md).
