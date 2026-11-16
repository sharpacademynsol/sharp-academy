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

function runMigration() {
  const d1Files = findD1Files();
  if (d1Files.length === 0) {
    console.error('No SQLite database files found.');
    return;
  }

  for (const dbPath of d1Files) {
    console.log(`\n--- Migrating SQLite DB at: ${dbPath} ---`);
    const db = new DatabaseSync(dbPath);

    // 1. Create question_bank table
    db.exec(`
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
    `);
    console.log('✓ Created question_bank table and indexes (or already existed).');

    // 2. Check exam_questions columns
    const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='exam_questions'`).get();
    if (!tableExists) {
      console.log('Table exam_questions does not exist in this DB file, skipping.');
      continue;
    }
    const columns = db.prepare(`PRAGMA table_info(exam_questions)`).all();
    const colNames = columns.map(c => c.name);

    if (!colNames.includes('bank_question_id')) {
      db.exec(`ALTER TABLE exam_questions ADD COLUMN bank_question_id INTEGER REFERENCES question_bank(id) ON DELETE SET NULL;`);
      console.log('✓ Added bank_question_id to exam_questions.');
    } else {
      console.log('✓ bank_question_id column already exists in exam_questions.');
    }

    if (!colNames.includes('is_modified_from_source')) {
      db.exec(`ALTER TABLE exam_questions ADD COLUMN is_modified_from_source INTEGER NOT NULL DEFAULT 0;`);
      console.log('✓ Added is_modified_from_source to exam_questions.');
    } else {
      console.log('✓ is_modified_from_source column already exists in exam_questions.');
    }

    // 3. Migrate any existing exam_questions to question_bank if bank is empty
    const bankCount = db.prepare(`SELECT COUNT(*) as count FROM question_bank`).get();
    if (bankCount.count === 0) {
      console.log('Question bank is empty. Migrating existing exam_questions...');
      const existingExamQuestions = db.prepare(`
        SELECT eq.*, e.course_id 
        FROM exam_questions eq
        JOIN exams e ON eq.exam_id = e.id
        ORDER BY eq.id ASC
      `).all();

      const insertBankStmt = db.prepare(`
        INSERT INTO question_bank (
          course_id, topic, difficulty, question_text, question_type, 
          marks, options_json, correct_answer, explanation, tags, usage_count, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
      `);

      const updateEqStmt = db.prepare(`
        UPDATE exam_questions SET bank_question_id = ?, is_modified_from_source = 0 WHERE id = ?
      `);

      for (const eq of existingExamQuestions) {
        const topic = eq.question_type === 'non_verbal' ? 'Non-Verbal Intelligence' : 'General Concepts';
        const res = insertBankStmt.run(
          eq.course_id || 1,
          topic,
          'medium',
          eq.question_text,
          eq.question_type,
          eq.marks || 10,
          eq.options_json || '',
          eq.correct_answer || '',
          eq.explanation || '',
          eq.question_type
        );
        const bankId = Number(res.lastInsertRowid);
        updateEqStmt.run(bankId, eq.id);
      }
      console.log(`✓ Migrated ${existingExamQuestions.length} existing exam questions into question_bank.`);
    } else {
      console.log(`✓ question_bank already has ${bankCount.count} entries.`);
    }
  }

  console.log('\nMigration successfully completed on all detected databases!');
}

runMigration();
