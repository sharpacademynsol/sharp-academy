import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
import { 
  generateOmrSets, 
  allocateCandidatesToSets, 
  OmrCandidate, 
  OmrSet 
} from "@/lib/omrEngine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const examId = Number(id);

    const examRows = await query(`
      SELECT e.*, c.title as course_title, c.code as course_code
      FROM exams e
      JOIN courses c ON e.course_id = c.id
      WHERE e.id = ?
    `, [examId]);

    const exam = examRows[0];
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const rawQuestions = await query(`
      SELECT * FROM exam_questions
      WHERE exam_id = ?
      ORDER BY sort_order ASC
    `, [examId]);

    // Fetch existing sets
    const existingSets = await query(`
      SELECT * FROM exam_omr_sets
      WHERE exam_id = ?
      ORDER BY set_number ASC
    `, [examId]);

    // Fetch existing allocations
    const existingAllocations = await query(`
      SELECT * FROM student_omr_allocations
      WHERE exam_id = ?
      ORDER BY id ASC
    `, [examId]);

    let sets: OmrSet[] = [];
    if (existingSets && existingSets.length > 0) {
      // Reconstitute sets from DB
      sets = existingSets.map(s => {
        let qOrder: number[] = [];
        let ansKey: Record<number, string> = {};
        try { qOrder = JSON.parse(s.questions_order_json); } catch {}
        try { ansKey = JSON.parse(s.answer_key_json); } catch {}

        // Map order to question objects
        const questionsMap = new Map(rawQuestions.map((q: any) => [q.id, q]));
        const setQuestions = qOrder.map((qId, idx) => {
          const rawQ = questionsMap.get(qId);
          return {
            id: qId,
            original_number: rawQ?.sort_order || idx + 1,
            set_number: idx + 1,
            question_text: rawQ?.question_text || "",
            question_type: rawQ?.question_type || "mcq",
            marks: rawQ?.marks || 1,
            explanation: rawQ?.explanation || "",
            options: rawQ?.options_json ? (typeof rawQ.options_json === "string" ? JSON.parse(rawQ.options_json) : rawQ.options_json) : [],
            correct_answer_raw: rawQ?.correct_answer || "",
            correct_letter: ansKey[idx + 1] || "A",
            metadata: rawQ?.options_json ? (typeof rawQ.options_json === "string" ? JSON.parse(rawQ.options_json) : rawQ.options_json) : {}
          };
        });

        return {
          id: s.id,
          exam_id: examId,
          set_code: s.set_code,
          set_number: s.set_number,
          seed: s.seed,
          questions: setQuestions as any,
          answer_key: ansKey,
          questions_order: qOrder
        };
      });
    } else {
      // Generate default 4 sets (SET-A, SET-B, SET-C, SET-D) on the fly
      sets = generateOmrSets(examId, rawQuestions, 4, true);
    }

    // Fetch enrolled students for this course/batch to assist auto-allocation
    const enrolledStudents = await query(`
      SELECT DISTINCT u.id as student_id, u.full_name as student_name, u.email, r.registration_no, r.id as registration_id
      FROM registrations r
      JOIN users u ON r.student_id = u.id
      JOIN batches b ON r.batch_id = b.id
      WHERE b.course_id = ? AND r.status = 'approved'
      ORDER BY r.registration_no ASC, u.full_name ASC
    `, [exam.course_id]);

    return NextResponse.json({
      success: true,
      exam,
      sets,
      allocations: existingAllocations || [],
      enrolledStudents: enrolledStudents || [],
      questionCount: rawQuestions.length
    });
  } catch (err: any) {
    console.error("[OMR API GET Error]", err);
    return NextResponse.json({ error: err.message || "Failed to fetch OMR data" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const examId = Number(id);
    const body = (await req.json()) as any;

    const setCount = Math.max(1, Math.min(Number(body.setCount) || 4, 26));
    const shuffleOptions = body.shuffleOptions !== false;
    const candidateScope = body.candidateScope || "enrolled"; // "enrolled" | "custom_count" | "custom_list"
    const customCount = Number(body.customCount) || 50;

    const examRows = await query(`
      SELECT e.*, c.title as course_title, c.code as course_code
      FROM exams e
      JOIN courses c ON e.course_id = c.id
      WHERE e.id = ?
    `, [examId]);

    const exam = examRows[0];
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const rawQuestions = await query(`
      SELECT * FROM exam_questions
      WHERE exam_id = ?
      ORDER BY sort_order ASC
    `, [examId]);

    if (!rawQuestions || rawQuestions.length === 0) {
      return NextResponse.json({ error: "Exam has no questions to generate OMR sets." }, { status: 400 });
    }

    // 1. Generate K deterministic Sets
    const generatedSets = generateOmrSets(examId, rawQuestions, setCount, shuffleOptions);

    // 2. Prepare Candidates List
    let candidatesList: OmrCandidate[] = [];

    if (candidateScope === "enrolled") {
      const enrolled = await query(`
        SELECT DISTINCT u.id as student_id, u.full_name as student_name, r.registration_no
        FROM registrations r
        JOIN users u ON r.student_id = u.id
        JOIN batches b ON r.batch_id = b.id
        WHERE b.course_id = ? AND r.status = 'approved'
        ORDER BY r.registration_no ASC, u.full_name ASC
      `, [exam.course_id]);

      if (enrolled && enrolled.length > 0) {
        candidatesList = enrolled.map((s, idx) => ({
          student_id: s.student_id,
          registration_no: s.registration_no,
          student_name: s.student_name,
          roll_number: s.registration_no || `ROLL-${String(idx + 1).padStart(3, "0")}`,
          seat_number: String(idx + 1).padStart(3, "0")
        }));
      }
    }

    // If candidateScope is custom_count or no enrolled students found, create generic candidates
    if (candidatesList.length === 0) {
      const total = candidateScope === "custom_count" ? customCount : 50;
      for (let i = 1; i <= total; i++) {
        candidatesList.push({
          student_name: `Candidate ${i}`,
          roll_number: `ROLL-${String(i).padStart(3, "0")}`,
          seat_number: String(i).padStart(3, "0")
        });
      }
    }

    // 3. Clear existing sets and allocations
    await execute("DELETE FROM student_omr_allocations WHERE exam_id = ?", [examId]);
    await execute("DELETE FROM exam_omr_sets WHERE exam_id = ?", [examId]);

    // 4. Save new Sets into DB
    const savedSetsWithIds: OmrSet[] = [];
    for (const s of generatedSets) {
      const res = await execute(`
        INSERT INTO exam_omr_sets (
          exam_id, set_code, set_number, seed,
          questions_order_json, options_map_json, answer_key_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        examId,
        s.set_code,
        s.set_number,
        s.seed,
        JSON.stringify(s.questions_order),
        JSON.stringify({}),
        JSON.stringify(s.answer_key)
      ]);

      savedSetsWithIds.push({
        ...s,
        id: res.lastInsertRowid
      });
    }

    // 5. Allocate candidates round-robin
    const allocations = allocateCandidatesToSets(examId, candidatesList, savedSetsWithIds);

    // 6. Save allocations into DB
    for (const a of allocations) {
      await execute(`
        INSERT INTO student_omr_allocations (
          exam_id, student_id, registration_no, student_name,
          omr_set_id, set_code, seat_number, barcode
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        examId,
        a.student_id || null,
        a.registration_no || a.roll_number || null,
        a.student_name,
        a.omr_set_id || savedSetsWithIds[0]?.id || 1,
        a.set_code,
        a.seat_number,
        a.barcode
      ]);
    }

    // 7. Update exams table
    await execute(`
      UPDATE exams 
      SET omr_enabled = 1, omr_set_count = ?, omr_bubble_count = 5 
      WHERE id = ?
    `, [setCount, examId]);

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${setCount} OMR Sets and allocated ${allocations.length} candidates.`,
      sets: savedSetsWithIds,
      allocations
    });
  } catch (err: any) {
    console.error("[OMR API POST Error]", err);
    return NextResponse.json({ error: err.message || "Failed to generate OMR pack" }, { status: 500 });
  }
}
