const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

function findD1Files() {
  const d1Dir = path.resolve(__dirname, '../.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
  const d1Files = [];
  if (fs.existsSync(d1Dir)) {
    const files = fs.readdirSync(d1Dir);
    for (const f of files) {
      if (f.endsWith('.sqlite') && f !== 'metadata.sqlite') {
        d1Files.push(path.join(d1Dir, f));
      }
    }
  }
  const rootLocal = path.resolve(__dirname, '../local.sqlite');
  if (fs.existsSync(rootLocal)) {
    d1Files.push(rootLocal);
  }
  return d1Files;
}

const defaultSlides = [
  {
    badge: 'Premier Entrance Test Preparation & Academic Coaching',
    title: 'Empowering Academic Ambitions &',
    highlight_text: 'Entrance Test Success',
    description: 'Specialized coaching for competitive college, university, and Cadet College admissions. Systematic concept mastery, daily intelligence (IQ) tests, computerized mock exams, and personalized interview mentoring.',
    features_json: JSON.stringify([
      { icon: '★', text: '98.6% Pass Rate', color: 'text-amber-400' },
      { icon: '✓', text: 'Computerized Mock Tests', color: 'text-blue-400' },
      { icon: '●', text: 'Master Faculty Mentorship', color: 'text-emerald-400' }
    ]),
    primary_cta_text: 'Explore Entrance Coaching',
    primary_cta_url: '/courses/cadet-college-admission-coaching',
    secondary_cta_text: 'Apply for Admission',
    secondary_cta_url: '/admissions',
    image_url: '/images/cadets-drill.jpg',
    tab_label: 'Entrance Prep',
    tab_title: 'Colleges & University Entry',
    sort_order: 0,
    is_active: 1
  },
  {
    badge: '100% Practical Workstations • Digital Skills Lab',
    title: 'Empowering Students with',
    highlight_text: 'In-Demand Digital Skills',
    description: 'State-of-the-art 50-workstation multimedia computing laboratory. Hands-on touch typing mastery (40+ WPM guaranteed), Microsoft Office productivity, web skills, and practical computer literacy.',
    features_json: JSON.stringify([
      { icon: '🖥️', text: '1:1 Dedicated PC Station', color: 'text-cyan-400' },
      { icon: '⚡', text: '40+ WPM Touch Typing', color: 'text-emerald-400' },
      { icon: '📜', text: 'Recognized Certification', color: 'text-amber-400' }
    ]),
    primary_cta_text: 'Explore Digital Skills Lab',
    primary_cta_url: '/courses/practical-computer-literacy',
    secondary_cta_text: 'Enroll for Fall 2026',
    secondary_cta_url: '/admissions',
    image_url: '/images/computer-literacy.jpg',
    tab_label: 'Digital Skills',
    tab_title: '100% Practical PC Lab',
    sort_order: 1,
    is_active: 1
  },
  {
    badge: 'Concept-First Curriculum • Grades 6–8, Matric & FSc',
    title: 'Rigorous Academic Coaching for',
    highlight_text: 'Peak Board Exam Results',
    description: 'Systematic concept-building in Mathematics, Sciences, English, and analytical problem-solving. Daily computerized practice quizzes and simulated exam engines to guarantee top board results.',
    features_json: JSON.stringify([
      { icon: '⏱️', text: 'CBT Simulated Exam Engine', color: 'text-blue-400' },
      { icon: '👨‍🏫', text: 'Master Subject Specialists', color: 'text-indigo-400' },
      { icon: '📊', text: 'Bi-Weekly Progress Reports', color: 'text-amber-400' }
    ]),
    primary_cta_text: 'View Academic Programs',
    primary_cta_url: '/courses',
    secondary_cta_text: 'Try Simulated Exam',
    secondary_cta_url: '/exam/1',
    image_url: '/images/cadets-classroom.jpg',
    tab_label: 'Academic Coaching',
    tab_title: 'Matric & FSc Board Prep',
    sort_order: 2,
    is_active: 1
  },
  {
    badge: 'Personality Grooming & Physical Fitness',
    title: 'Building Iron Discipline &',
    highlight_text: 'Interview Confidence',
    description: 'Holistic student development combining morning physical stamina conditioning, confidence workshops, English communication, and mock interview panels.',
    features_json: JSON.stringify([
      { icon: '🏃', text: 'Morning Fitness & Stamina', color: 'text-amber-400' },
      { icon: '🧠', text: 'IQ & Interview Readiness', color: 'text-cyan-400' },
      { icon: '🗣️', text: 'Communication Skills', color: 'text-emerald-400' }
    ]),
    primary_cta_text: 'View Drills & Campus Life',
    primary_cta_url: '/courses/cadet-college-admission-coaching',
    secondary_cta_text: 'Apply for Admission',
    secondary_cta_url: '/admissions',
    image_url: '/images/cadets-obstacle.jpg',
    tab_label: 'Campus Drills',
    tab_title: 'Stamina & Interview Prep',
    sort_order: 3,
    is_active: 1
  }
];

const defaultActivities = [
  {
    category_badge: 'Physical Stamina & Health',
    badge_color: 'amber',
    title: 'Morning Physical Fitness & Stamina Drills',
    description: 'Daily morning endurance runs, agility exercises, push-ups, and structured stamina routines to build discipline, mental sharpness, and test readiness.',
    tags_json: JSON.stringify(['Endurance Run', 'Agility Drill', 'Peak Stamina']),
    image_url: '/images/cadets-drill.jpg',
    link_text: 'View Fitness Routines',
    link_url: '/courses/cadet-college-admission-coaching',
    sort_order: 0,
    is_active: 1
  },
  {
    category_badge: 'Practical Tech Lab',
    badge_color: 'cyan',
    title: 'Hands-On PC Lab & Touch Typing',
    description: 'Individual desktop workstation per student. Daily typing speed tracking (aiming 40+ WPM), Windows OS, MS Word, Excel formulas, and PowerPoint design.',
    tags_json: JSON.stringify(['40+ WPM Typing', 'MS Office Suite', '1-to-1 Workstations']),
    image_url: '/images/computer-literacy.jpg',
    link_text: 'Explore Computer Lab',
    link_url: '/courses/practical-computer-literacy',
    sort_order: 1,
    is_active: 1
  },
  {
    category_badge: 'Entrance Academics',
    badge_color: 'emerald',
    title: 'Intelligence (IQ) & Academic Test Coaching',
    description: 'Specialized classroom sessions for Verbal & Non-Verbal IQ matrix patterns, mathematics shortcuts, English essay writing, science concepts, and past-paper drills.',
    tags_json: JSON.stringify(['Verbal/Non-Verbal IQ', 'Math Shortcuts', 'Past Papers']),
    image_url: '/images/cadets-classroom.jpg',
    link_text: 'View Academic Syllabus',
    link_url: '/courses/cadet-college-admission-coaching',
    sort_order: 2,
    is_active: 1
  },
  {
    category_badge: 'Personality Grooming',
    badge_color: 'amber',
    title: 'Interview Grooming & Confidence Building',
    description: 'Panel mock interviews, communication skills, confidence drills, and team coordination to ensure total readiness for competitive college and university selections.',
    tags_json: JSON.stringify(['Mock Interviews', 'Mental Toughness', 'Public Speaking']),
    image_url: '/images/cadets-obstacle.jpg',
    link_text: 'Register for Batch',
    link_url: '/admissions',
    sort_order: 3,
    is_active: 1
  }
];

function runMigration() {
  const d1Files = findD1Files();
  if (d1Files.length === 0) {
    console.error('No SQLite database files found.');
    return;
  }

  for (const dbPath of d1Files) {
    console.log(`\n--- Migrating SQLite DB at: ${dbPath} ---`);
    const db = new DatabaseSync(dbPath);

    // 1. Create homepage_hero_slides table
    db.exec(`
      CREATE TABLE IF NOT EXISTS homepage_hero_slides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        badge TEXT NOT NULL,
        title TEXT NOT NULL,
        highlight_text TEXT,
        description TEXT NOT NULL,
        features_json TEXT,
        primary_cta_text TEXT,
        primary_cta_url TEXT,
        secondary_cta_text TEXT,
        secondary_cta_url TEXT,
        image_url TEXT NOT NULL,
        tab_label TEXT NOT NULL,
        tab_title TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create homepage_activities table
    db.exec(`
      CREATE TABLE IF NOT EXISTS homepage_activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_badge TEXT NOT NULL,
        badge_color TEXT NOT NULL DEFAULT 'amber',
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        tags_json TEXT,
        image_url TEXT NOT NULL,
        link_text TEXT,
        link_url TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Create site_settings table if not exists and seed defaults
    db.exec(`
      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const settingsDefaults = [
      ['activities_badge', 'Real Academy Life & Methodology'],
      ['activities_title', 'Activities of Learning & Training in Action'],
      ['activities_description', 'Education at Sharp Academy extends far beyond passive memorization. We integrate physical fitness drills, 1-to-1 computer lab practice, and interactive academic problem solving.']
    ];

    for (const [key, val] of settingsDefaults) {
      db.prepare(`
        INSERT INTO site_settings (key, value, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO NOTHING
      `).run(key, val);
    }

    // 4. Seed hero slides if table empty
    const slideCount = db.prepare('SELECT COUNT(*) as count FROM homepage_hero_slides').get().count;
    if (slideCount === 0) {
      console.log('Seeding default hero slides...');
      const insertSlide = db.prepare(`
        INSERT INTO homepage_hero_slides (
          badge, title, highlight_text, description, features_json,
          primary_cta_text, primary_cta_url, secondary_cta_text, secondary_cta_url,
          image_url, tab_label, tab_title, sort_order, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const s of defaultSlides) {
        insertSlide.run(
          s.badge, s.title, s.highlight_text, s.description, s.features_json,
          s.primary_cta_text, s.primary_cta_url, s.secondary_cta_text, s.secondary_cta_url,
          s.image_url, s.tab_label, s.tab_title, s.sort_order, s.is_active
        );
      }
      console.log(`✓ Inserted ${defaultSlides.length} default hero slides.`);
    } else {
      console.log(`Hero slides table already has ${slideCount} slides.`);
    }

    // 5. Seed activities if table empty
    const actCount = db.prepare('SELECT COUNT(*) as count FROM homepage_activities').get().count;
    if (actCount === 0) {
      console.log('Seeding default activities...');
      const insertAct = db.prepare(`
        INSERT INTO homepage_activities (
          category_badge, badge_color, title, description, tags_json,
          image_url, link_text, link_url, sort_order, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const a of defaultActivities) {
        insertAct.run(
          a.category_badge, a.badge_color, a.title, a.description, a.tags_json,
          a.image_url, a.link_text, a.link_url, a.sort_order, a.is_active
        );
      }
      console.log(`✓ Inserted ${defaultActivities.length} default activities.`);
    } else {
      console.log(`Activities table already has ${actCount} activities.`);
    }

    console.log('Migration completed successfully.');
  }
}

runMigration();
