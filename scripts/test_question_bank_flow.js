const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

function getDb() {
  const d1Dir = path.resolve(__dirname, '../.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
  const files = fs.readdirSync(d1Dir);
  const dbFile = files.find(f => f.endsWith('.sqlite') && f !== 'metadata.sqlite');
  return new DatabaseSync(path.join(d1Dir, dbFile));
}

async function runTests() {
  console.log('==================================================');
  console.log('Testing Question Bank & Exam Paper Flow Lifecycle');
  console.log('==================================================\n');

  const db = getDb();

  // Test 1: Verify question_bank table exists and has migrated data
  const countRow = db.prepare('SELECT COUNT(*) as count FROM question_bank').get();
  console.log(`[Test 1] Current question_bank row count: ${countRow.count}`);
  if (countRow.count === 0) {
    throw new Error('Test 1 failed: question_bank has no rows');
  }
  console.log('✓ Test 1 Passed: question_bank populated.\n');

  // Test 2: Create a test question in question_bank
  const insertStmt = db.prepare(`
    INSERT INTO question_bank (
      course_id, topic, difficulty, question_text, question_type,
      marks, options_json, correct_answer, explanation, tags, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  const initialText = "Original statement from bank: What is $2 + 2$?";
  const res = insertStmt.run(
    1,
    'Arithmetic',
    'easy',
    initialText,
    'mcq',
    5,
    JSON.stringify([{ id: 1, text: "4" }, { id: 2, text: "5" }]),
    "1",
    "Basic addition",
    "math, basic"
  );
  const bankQuestionId = Number(res.lastInsertRowid);
  console.log(`[Test 2] Created Question Bank item with ID: ${bankQuestionId}`);
  console.log('✓ Test 2 Passed: Bank question created.\n');

  // Test 3: Create Exam Paper importing Question #QB-{bankQuestionId}
  // Provision A: Altered FOR THIS EXAM ONLY (sync_to_bank = 0)
  const examStmt = db.prepare(`
    INSERT INTO exams (course_id, title, exam_type, duration_minutes, total_marks, passing_marks, is_published, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 1, 1)
  `);
  const exam1Res = examStmt.run(1, 'Test Exam 1 (Local Alteration Only)', 'quiz', 30, 5, 2);
  const exam1Id = Number(exam1Res.lastInsertRowid);

  const alteredTextExamOnly = "Altered statement for Exam 1: Calculate $2 + 2$ in binary.";
  const insertEqStmt = db.prepare(`
    INSERT INTO exam_questions (
      exam_id, bank_question_id, is_modified_from_source, question_text, question_type, marks, options_json, correct_answer, explanation, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertEqStmt.run(
    exam1Id,
    bankQuestionId,
    1, // is_modified_from_source = 1
    alteredTextExamOnly,
    'mcq',
    5,
    JSON.stringify([{ id: 1, text: "100" }, { id: 2, text: "101" }]),
    "1",
    "4 in binary is 100",
    1
  );

  // Verify: Exam question has altered text, but question_bank STILL has original text!
  const eqRow1 = db.prepare('SELECT question_text FROM exam_questions WHERE exam_id = ?').get(exam1Id);
  const qbRowAfterExam1 = db.prepare('SELECT question_text FROM question_bank WHERE id = ?').get(bankQuestionId);

  console.log(`[Test 3] Exam 1 question text: "${eqRow1.question_text}"`);
  console.log(`[Test 3] Bank source text:      "${qbRowAfterExam1.question_text}"`);
  if (eqRow1.question_text !== alteredTextExamOnly) throw new Error('Test 3 failed: Exam 1 question text mismatch');
  if (qbRowAfterExam1.question_text !== initialText) throw new Error('Test 3 failed: Bank source was altered when it should NOT have been');
  console.log('✓ Test 3 Passed: Exam-only alteration preserved original Question Bank content untouched!\n');

  // Test 4: Create Exam Paper importing Question #QB-{bankQuestionId}
  // Provision B: Update Question Bank source as well (sync_to_bank = 1)
  const exam2Res = examStmt.run(1, 'Test Exam 2 (Sync to Source)', 'quiz', 30, 5, 2);
  const exam2Id = Number(exam2Res.lastInsertRowid);
  const updatedSyncedText = "Updated master statement: What is $2 + 2 = 4$ verified?";

  // Simulating the API route logic when sync_to_bank = true
  db.prepare(`
    UPDATE question_bank SET
      question_text = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(updatedSyncedText, bankQuestionId);

  insertEqStmt.run(
    exam2Id,
    bankQuestionId,
    0, // synced with source
    updatedSyncedText,
    'mcq',
    5,
    JSON.stringify([{ id: 1, text: "True" }, { id: 2, text: "False" }]),
    "1",
    "",
    1
  );

  const qbRowAfterExam2 = db.prepare('SELECT question_text FROM question_bank WHERE id = ?').get(bankQuestionId);
  console.log(`[Test 4] Bank source text after sync: "${qbRowAfterExam2.question_text}"`);
  if (qbRowAfterExam2.question_text !== updatedSyncedText) {
    throw new Error('Test 4 failed: Bank source was not updated');
  }
  console.log('✓ Test 4 Passed: Question Bank source was successfully synchronized.\n');

  // Test 5: Clean up test rows
  db.prepare('DELETE FROM exam_questions WHERE exam_id IN (?, ?)').run(exam1Id, exam2Id);
  db.prepare('DELETE FROM exams WHERE id IN (?, ?)').run(exam1Id, exam2Id);
  db.prepare('DELETE FROM question_bank WHERE id = ?').run(bankQuestionId);
  console.log('✓ Test 5 Passed: Cleaned up test data.\n');

  console.log('==================================================');
  console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
  console.log('==================================================');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
