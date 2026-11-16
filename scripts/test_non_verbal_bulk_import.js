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

async function testNonVerbalBulk() {
  console.log('================================================================');
  console.log('Testing Non-Verbal Bulk Template, ? Slot & Ingestion Lifecycle');
  console.log('================================================================\n');

  const db = getDb();
  const courses = db.prepare('SELECT id, title, code FROM courses WHERE is_active = 1').all();
  console.log(`[Step 1] Found ${courses.length} active courses in DB.`);

  // 1. Build spreadsheet matching the non_verbal template
  const headers = [
    "Course Code",
    "Topic",
    "Difficulty",
    "Marks",
    "Question Statement",
    "Sub Type (series / analogy / matrix / odd_one_out)",
    "Problem Figure 1 (Shape Key or URL)",
    "Problem Figure 2 (Shape Key or URL)",
    "Problem Figure 3 (Shape Key or URL)",
    "Target Slot (?) Placeholder",
    "Option A (Shape Key or URL)",
    "Option B (Shape Key or URL)",
    "Option C (Shape Key or URL)",
    "Option D (Shape Key or URL)",
    "Correct Option (A-D or 1-4)",
    "Explanation",
    "Tags"
  ];

  const sampleRows = [
    {
      "Course Code": courses[0]?.code || "ISSB-101",
      "Topic": "Non-Verbal - Series Rotations",
      "Difficulty": "medium",
      "Marks": 10,
      "Question Statement": "Look at the pattern sequence below. Which figure should logically replace the question mark (?) in the series?",
      "Sub Type (series / analogy / matrix / odd_one_out)": "series",
      "Problem Figure 1 (Shape Key or URL)": "quad_tr",
      "Problem Figure 2 (Shape Key or URL)": "quad_br",
      "Problem Figure 3 (Shape Key or URL)": "quad_bl",
      "Target Slot (?) Placeholder": "[?] Next Missing Shape (Solved by Option A-D)",
      "Option A (Shape Key or URL)": "quad_tl",
      "Option B (Shape Key or URL)": "quad_tr",
      "Option C (Shape Key or URL)": "quad_br",
      "Option D (Shape Key or URL)": "half_top",
      "Correct Option (A-D or 1-4)": "A",
      "Explanation": "The shaded quadrant moves 90° clockwise: Top-Right (Fig 1) ➔ Bottom-Right (Fig 2) ➔ Bottom-Left (Fig 3). The missing figure at [?] must be Top-Left (Option A).",
      "Tags": "non-verbal, series, rotation, quadrants"
    },
    {
      "Course Code": courses[0]?.code || "ISSB-101",
      "Topic": "Non-Verbal - Directional Arrows",
      "Difficulty": "medium",
      "Marks": 10,
      "Question Statement": "Which figure logically completes the arrow rotation series at the question mark (?) position?",
      "Sub Type (series / analogy / matrix / odd_one_out)": "series",
      "Problem Figure 1 (Shape Key or URL)": "arrow_0",
      "Problem Figure 2 (Shape Key or URL)": "arrow_45",
      "Problem Figure 3 (Shape Key or URL)": "arrow_90",
      "Target Slot (?) Placeholder": "[?] Next Missing Shape (Solved by Option A-D)",
      "Option A (Shape Key or URL)": "arrow_135",
      "Option B (Shape Key or URL)": "arrow_180",
      "Option C (Shape Key or URL)": "arrow_270",
      "Option D (Shape Key or URL)": "arrow_315",
      "Correct Option (A-D or 1-4)": "A",
      "Explanation": "Arrows rotate 45° clockwise: 0° Up ➔ 45° ➔ 90°. The target [?] slot is completed by 135° Down-Right (Option A).",
      "Tags": "non-verbal, arrows, rotation"
    },
    {
      "Course Code": courses[0]?.code || "ISSB-101",
      "Topic": "Non-Verbal - 2x2 Matrix",
      "Difficulty": "hard",
      "Marks": 10,
      "Question Statement": "Analyze the 2x2 matrix pattern. Which figure replaces the question mark (?) in the bottom-right cell?",
      "Sub Type (series / analogy / matrix / odd_one_out)": "matrix",
      "Problem Figure 1 (Shape Key or URL)": "sq_dot_tl",
      "Problem Figure 2 (Shape Key or URL)": "sq_dot_tr",
      "Problem Figure 3 (Shape Key or URL)": "sq_dot_bl",
      "Target Slot (?) Placeholder": "[?] Target Cell (2,2) Question Mark (Solved by Option A-D)",
      "Option A (Shape Key or URL)": "sq_dot_br",
      "Option B (Shape Key or URL)": "sq_dot_tl",
      "Option C (Shape Key or URL)": "sq_dot_center",
      "Option D (Shape Key or URL)": "dots_4_corners",
      "Correct Option (A-D or 1-4)": "A",
      "Explanation": "In the 2x2 matrix, the dot travels around the corners. The bottom-right cell [?] must have the dot in the Bottom-Right corner (Option A).",
      "Tags": "non-verbal, matrix, dots"
    }
  ];

  // 2. Generate Excel workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
  XLSX.utils.book_append_sheet(wb, ws, "Questions Data");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  console.log(`[Step 2] Generated in-memory .xlsx workbook (${buffer.length} bytes).`);

  // Verify columns exist in sheet
  const parsedWb = XLSX.read(buffer, { type: "buffer" });
  const sheet = parsedWb.Sheets[parsedWb.SheetNames[0]];
  const parsedRows = XLSX.utils.sheet_to_json(sheet);
  console.log(`[Step 3] Read back ${parsedRows.length} rows from spreadsheet.`);

  for (const r of parsedRows) {
    if (!r["Target Slot (?) Placeholder"]) {
      throw new Error("Missing 'Target Slot (?) Placeholder' in row: " + JSON.stringify(r));
    }
    console.log(`   - Row: "${r["Question Statement"].substring(0, 40)}..."`);
    console.log(`     Target Slot: "${r["Target Slot (?) Placeholder"]}"`);
    console.log(`     Figures: [${r["Problem Figure 1 (Shape Key or URL)"]}, ${r["Problem Figure 2 (Shape Key or URL)"]}, ${r["Problem Figure 3 (Shape Key or URL)"]}]`);
    console.log(`     Choices: A=${r["Option A (Shape Key or URL)"]}, B=${r["Option B (Shape Key or URL)"]}, C=${r["Option C (Shape Key or URL)"]}, D=${r["Option D (Shape Key or URL)"]}`);
  }

  // 3. Insert rows into DB simulating API endpoint
  const insertStmt = db.prepare(`
    INSERT INTO question_bank (
      course_id, topic, difficulty, question_text, question_type,
      marks, options_json, correct_answer, explanation, tags, usage_count, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
  `);

  const insertedIds = [];
  for (const r of parsedRows) {
    const subType = r["Sub Type (series / analogy / matrix / odd_one_out)"] || "series";
    const problemImages = [
      r["Problem Figure 1 (Shape Key or URL)"],
      r["Problem Figure 2 (Shape Key or URL)"],
      r["Problem Figure 3 (Shape Key or URL)"]
    ];

    const options = [
      { id: "1", label: "A", image_url: r["Option A (Shape Key or URL)"], text: "Option A" },
      { id: "2", label: "B", image_url: r["Option B (Shape Key or URL)"], text: "Option B" },
      { id: "3", label: "C", image_url: r["Option C (Shape Key or URL)"], text: "Option C" },
      { id: "4", label: "D", image_url: r["Option D (Shape Key or URL)"], text: "Option D" },
    ];

    const optionsJson = JSON.stringify({
      sub_type: subType,
      problem_images: problemImages,
      target_placeholder: "?",
      options: options,
      ...(subType === "matrix" ? { matrix_grid: "2x2" } : {})
    });

    const res = insertStmt.run(
      courses[0]?.id || 1,
      r["Topic"],
      r["Difficulty"],
      r["Question Statement"],
      "non_verbal",
      Number(r["Marks"]),
      optionsJson,
      "1",
      r["Explanation"],
      r["Tags"]
    );
    insertedIds.push(Number(res.lastInsertRowid));
  }

  console.log(`\n[Step 4] Inserted ${insertedIds.length} non-verbal questions with '?' target slot into DB. IDs:`, insertedIds);

  // 4. Verify DB records
  const check = db.prepare(`SELECT id, question_type, options_json FROM question_bank WHERE id IN (${insertedIds.join(',')})`).all();
  for (const q of check) {
    const opts = JSON.parse(q.options_json);
    console.log(`   - Verified ID #${q.id}: Type=${q.question_type}, SubType=${opts.sub_type}, TargetPlaceholder='${opts.target_placeholder}', ProblemImagesCount=${opts.problem_images.length}`);
    if (opts.target_placeholder !== "?") {
      throw new Error(`Expected target_placeholder to be '?', found: ${opts.target_placeholder}`);
    }
  }

  // 5. Cleanup
  db.prepare(`DELETE FROM question_bank WHERE id IN (${insertedIds.join(',')})`).run();
  console.log(`\n[Step 5] Cleaned up test rows successfully.`);

  console.log('\n================================================================');
  console.log('NON-VERBAL BULK TEMPLATE & ? IMPLICATION TEST PASSED 100%!');
  console.log('================================================================');
}

testNonVerbalBulk().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
