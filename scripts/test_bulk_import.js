const XLSX = require('../admin/node_modules/xlsx');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

function getDb() {
  const d1Dir = path.resolve(__dirname, '../.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
  const files = fs.readdirSync(d1Dir);
  const dbFile = files.find(f => f.endsWith('.sqlite') && f !== 'metadata.sqlite');
  return new DatabaseSync(path.join(d1Dir, dbFile));
}

async function testBulkImport() {
  console.log('==================================================');
  console.log('Testing Bulk Excel Template & Import Lifecycle');
  console.log('==================================================\n');

  const db = getDb();
  const courses = db.prepare('SELECT id, title, code FROM courses WHERE is_active = 1').all();
  console.log(`[Step 1] Found ${courses.length} active courses in DB.`);

  // Create mock Excel sheet for MCQ
  const headers = [
    "Course Code",
    "Topic",
    "Difficulty",
    "Marks",
    "Question Statement",
    "Option 1",
    "Option 2",
    "Option 3",
    "Option 4",
    "Correct Option (1-4)",
    "Explanation",
    "Tags"
  ];

  const sampleRows = [
    {
      "Course Code": courses[0]?.code || "MTH-101",
      "Topic": "Calculus Derivatives",
      "Difficulty": "medium",
      "Marks": 10,
      "Question Statement": "What is the derivative of $\\sin(x)$?",
      "Option 1": "$\\cos(x)$",
      "Option 2": "$-\\cos(x)$",
      "Option 3": "$\\tan(x)$",
      "Option 4": "$\\sec^2(x)$",
      "Correct Option (1-4)": "1",
      "Explanation": "d/dx(sin x) = cos x",
      "Tags": "calculus, trig"
    },
    {
      "Course Code": courses[0]?.code || "MTH-101",
      "Topic": "Calculus Integrals",
      "Difficulty": "easy",
      "Marks": 5,
      "Question Statement": "Evaluate $\\int e^x dx$.",
      "Option 1": "$e^x + C$",
      "Option 2": "$xe^x + C$",
      "Option 3": "$e^{2x} + C$",
      "Option 4": "$\\ln(x) + C$",
      "Correct Option (1-4)": "1",
      "Explanation": "The integral of e^x is e^x + C.",
      "Tags": "calculus, exponential"
    }
  ];

  // Write to buffer using XLSX
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
  XLSX.utils.book_append_sheet(wb, ws, "Questions Data");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  console.log(`[Step 2] Generated in-memory .xlsx workbook (${buffer.length} bytes).`);

  // Read back and parse
  const parsedWb = XLSX.read(buffer, { type: "buffer" });
  const parsedSheet = parsedWb.Sheets[parsedWb.SheetNames[0]];
  const parsedRows = XLSX.utils.sheet_to_json(parsedSheet);
  console.log(`[Step 3] Successfully read back ${parsedRows.length} rows from spreadsheet.`);

  if (parsedRows.length !== 2) {
    throw new Error(`Expected 2 rows, found ${parsedRows.length}`);
  }

  // Insert parsed rows into question_bank
  const insertStmt = db.prepare(`
    INSERT INTO question_bank (
      course_id, topic, difficulty, question_text, question_type,
      marks, options_json, correct_answer, explanation, tags, usage_count, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
  `);

  const insertedIds = [];
  for (const r of parsedRows) {
    const opts = JSON.stringify([
      { id: 1, text: r["Option 1"] },
      { id: 2, text: r["Option 2"] },
      { id: 3, text: r["Option 3"] },
      { id: 4, text: r["Option 4"] },
    ]);
    const res = insertStmt.run(
      courses[0]?.id || 1,
      r["Topic"],
      r["Difficulty"],
      r["Question Statement"],
      "mcq",
      Number(r["Marks"]),
      opts,
      String(r["Correct Option (1-4)"]),
      r["Explanation"],
      r["Tags"]
    );
    insertedIds.push(Number(res.lastInsertRowid));
  }

  console.log(`[Step 4] Inserted ${insertedIds.length} questions into Question Bank. IDs:`, insertedIds);

  // Verify questions exist in DB
  const check = db.prepare(`SELECT id, question_text, topic FROM question_bank WHERE id IN (${insertedIds.join(',')})`).all();
  console.log(`[Step 5] Verified records in DB:`, check);

  if (check.length !== 2) {
    throw new Error('Verification failed: inserted count mismatch');
  }

  // Cleanup test rows
  db.prepare(`DELETE FROM question_bank WHERE id IN (${insertedIds.join(',')})`).run();
  console.log(`[Step 6] Cleaned up test rows successfully.`);

  console.log('\n==================================================');
  console.log('BULK IMPORT VERIFICATION PASSED WITH 100% SUCCESS!');
  console.log('==================================================');
}

testBulkImport().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
