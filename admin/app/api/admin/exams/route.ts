import { execute, query } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const { course_id, title, exam_type, duration, total_marks, pass_marks, questions } = body;

    if (!title || !course_id) {
      return NextResponse.json({ error: "Title and Course are required" }, { status: 400 });
    }

    // 1. Insert Exam Header (Validate against SQLite check constraint)
    const validExamTypes = ['quiz', 'midterm', 'final', 'practice_mock'];
    const safeExamType = validExamTypes.includes(exam_type) ? exam_type : "quiz";

    const examRes = await execute(`
      INSERT INTO exams (course_id, title, exam_type, duration_minutes, total_marks, passing_marks, is_published, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 1, 1)
    `, [course_id, title, safeExamType, duration || 45, total_marks || 100, pass_marks || 50]);

    let examId = examRes.lastInsertRowid;

    // Fallback if lastInsertRowid is not returned
    if (!examId) {
      const latest = await query<{ id: number }>("SELECT id FROM exams ORDER BY id DESC LIMIT 1");
      examId = latest[0]?.id;
    }

    if (!examId) {
      return NextResponse.json({ error: "Failed to create exam record" }, { status: 500 });
    }

    // 2. Insert Questions (Supporting All 8 Question Types)
    if (Array.isArray(questions)) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.text) continue;

        const qType = q.type || "mcq";
        let optionsJson = "";
        let correctAnswer = "";

        if (qType === "mcq") {
          optionsJson = JSON.stringify([
            { id: 1, text: q.opt1 || "" },
            { id: 2, text: q.opt2 || "" },
            { id: 3, text: q.opt3 || "" },
            { id: 4, text: q.opt4 || "" },
          ]);
          correctAnswer = String(q.correct || "1");
        } else if (qType === "multi_select") {
          optionsJson = JSON.stringify([
            { id: 1, text: q.opt1 || "" },
            { id: 2, text: q.opt2 || "" },
            { id: 3, text: q.opt3 || "" },
            { id: 4, text: q.opt4 || "" },
          ]);
          correctAnswer = JSON.stringify(q.correct_multi || ["1"]);
        } else if (qType === "true_false") {
          optionsJson = JSON.stringify([
            { id: "true", text: "True" },
            { id: "false", text: "False" }
          ]);
          correctAnswer = String(q.correct_tf || "true");
        } else if (qType === "fill_blank") {
          const alts = q.blank_alternatives 
            ? q.blank_alternatives.split("|").map((s: string) => s.trim()).filter(Boolean) 
            : [];
          if (q.blank_answer && !alts.includes(q.blank_answer.trim())) {
            alts.unshift(q.blank_answer.trim());
          }
          optionsJson = JSON.stringify({
            accepted: alts.length > 0 ? alts : [q.blank_answer || ""],
            case_sensitive: !!q.blank_case_sensitive,
            placeholder: q.blank_placeholder || "Type your answer here..."
          });
          correctAnswer = String(q.blank_answer || "");
        } else if (qType === "column_mapping") {
          const pairs = Array.isArray(q.matching_pairs) ? q.matching_pairs : [];
          optionsJson = JSON.stringify({
            left: pairs.map((p: any, pIdx: number) => ({ id: `L${pIdx + 1}`, text: p.left || "" })),
            right: pairs.map((p: any, pIdx: number) => ({ id: `R${pIdx + 1}`, text: p.right || "" }))
          });
          const pairMap: Record<string, string> = {};
          pairs.forEach((_: any, pIdx: number) => {
            pairMap[`L${pIdx + 1}`] = `R${pIdx + 1}`;
          });
          correctAnswer = JSON.stringify(pairMap);
        } else if (qType === "numerical") {
          optionsJson = JSON.stringify({
            exact: Number(q.num_exact) || 0,
            tolerance: Number(q.num_tolerance) || 0,
            unit: q.num_unit || ""
          });
          correctAnswer = `${q.num_exact || "0"}${q.num_unit ? " " + q.num_unit : ""}`;
        } else if (qType === "short_answer") {
          optionsJson = JSON.stringify({
            keywords: q.short_keywords ? q.short_keywords.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
            model_answer: q.short_model_answer || ""
          });
          correctAnswer = String(q.short_model_answer || "");
        } else if (qType === "long_answer") {
          optionsJson = JSON.stringify({
            min_words: Number(q.long_min_words) || 50,
            rubric: q.long_rubric || "",
            model_answer: q.long_model_answer || ""
          });
          correctAnswer = String(q.long_model_answer || "");
        } else if (qType === "non_verbal") {
          optionsJson = JSON.stringify({
            sub_type: q.nv_sub_type || "series",
            problem_images: Array.isArray(q.nv_problem_images) ? q.nv_problem_images : [],
            matrix_grid: q.nv_matrix_grid || "2x2",
            options: (q.nv_options || []).map((opt: any, oIdx: number) => ({
              id: String(opt.id || oIdx + 1),
              label: opt.label || String.fromCharCode(65 + oIdx),
              image_url: opt.image_url || "",
              text: opt.text || ""
            }))
          });
          correctAnswer = String(q.nv_correct || "1");
        } else if (qType === "verbal_reasoning") {
          optionsJson = JSON.stringify({
            sub_type: q.vr_sub_type || "analogy",
            pair1_left: q.vr_pair1_left || "",
            pair1_right: q.vr_pair1_right || "",
            pair2_left: q.vr_pair2_left || "",
            relationship_type: q.vr_relationship_type || "",
            series_type: q.vr_series_type || "number",
            series_tokens: Array.isArray(q.vr_series_tokens) ? q.vr_series_tokens : [],
            rule_hint: q.vr_rule_hint || "",
            words: Array.isArray(q.vr_words) ? q.vr_words : [],
            group_category: q.vr_group_category || "",
            odd_index: q.vr_odd_index,
            source_word: q.vr_source_word || "",
            coded_word: q.vr_coded_word || "",
            target_word: q.vr_target_word || "",
            coding_rule: q.vr_coding_rule || "",
            premise: q.vr_premise || "",
            clues: Array.isArray(q.vr_clues) ? q.vr_clues : [],
            question_prompt: q.vr_question_prompt || "",
            target_placeholder: "?",
            options: (q.vr_options || []).map((opt: any, oIdx: number) => ({
              id: String(opt.id || oIdx + 1),
              label: opt.label || String.fromCharCode(65 + oIdx),
              text: opt.text || ""
            }))
          });
          correctAnswer = String(q.vr_correct || "1");
        }

        // Determine Question Bank synchronization
        let finalBankQuestionId: number | null = q.bank_question_id ? Number(q.bank_question_id) : null;
        let isModified = q.is_modified_from_source ? 1 : 0;

        // Provision 1: If requested to update source Question Bank
        if (finalBankQuestionId && q.sync_to_bank) {
          await execute(`
            UPDATE question_bank SET
              question_text = ?,
              question_type = ?,
              marks = ?,
              options_json = ?,
              correct_answer = ?,
              explanation = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [q.text, qType, q.marks || 10, optionsJson, correctAnswer, q.explanation || "", finalBankQuestionId]);
          isModified = 0; // Synced with source!
        }

        // Provision 2: If requested to save newly authored question to Question Bank
        if (!finalBankQuestionId && q.save_to_bank) {
          const bankRes = await execute(`
            INSERT INTO question_bank (
              course_id, topic, difficulty, question_text, question_type,
              marks, options_json, correct_answer, explanation, tags, usage_count, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
          `, [
            course_id,
            q.topic || "General",
            q.difficulty || "medium",
            q.text,
            qType,
            q.marks || 10,
            optionsJson,
            correctAnswer,
            q.explanation || "",
            q.tags || qType
          ]);

          finalBankQuestionId = bankRes.lastInsertRowid ?? null;
          if (!finalBankQuestionId) {
            const latest = await query<{ id: number }>("SELECT id FROM question_bank ORDER BY id DESC LIMIT 1");
            finalBankQuestionId = latest[0]?.id ?? null;
          }
        }

        // Update usage count on the bank question if linked
        if (finalBankQuestionId) {
          await execute(`UPDATE question_bank SET usage_count = usage_count + 1 WHERE id = ?`, [finalBankQuestionId]);
        }

        await execute(`
          INSERT INTO exam_questions (
            exam_id, bank_question_id, is_modified_from_source, 
            question_text, question_type, marks, options_json, correct_answer, explanation, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          examId, 
          finalBankQuestionId, 
          isModified, 
          q.text, 
          qType, 
          q.marks || 10, 
          optionsJson, 
          correctAnswer, 
          q.explanation || "", 
          i + 1
        ]);
      }
    }

    return NextResponse.json({ success: true, examId });
  } catch (err: any) {
    console.error("[API Create Exam Error]", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
