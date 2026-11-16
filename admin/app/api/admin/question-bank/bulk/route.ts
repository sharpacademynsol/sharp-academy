import { execute, query } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const { questions } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "No questions provided in bulk payload" }, { status: 400 });
    }

    let insertedCount = 0;
    const insertedIds: number[] = [];

    const CHUNK_SIZE = 50;
    for (let i = 0; i < questions.length; i += CHUNK_SIZE) {
      const chunk = questions.slice(i, i + CHUNK_SIZE).filter((q: any) => q.question_text);
      if (chunk.length === 0) continue;

      const placeholders: string[] = [];
      const params: any[] = [];

      for (const q of chunk) {
        const qType = q.question_type || "mcq";
        const courseId = Number(q.course_id) || 1;
        const topic = q.topic || "General";
        const difficulty = q.difficulty || "medium";
        const marks = Number(q.marks) || 10;
        const optionsJson = typeof q.options_json === "string" ? q.options_json : JSON.stringify(q.options_json || {});
        const correctAnswer = typeof q.correct_answer === "string" ? q.correct_answer : JSON.stringify(q.correct_answer || "");
        const explanation = q.explanation || "";
        const tags = q.tags || "";

        placeholders.push("(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)");
        params.push(
          courseId,
          topic,
          difficulty,
          q.question_text,
          qType,
          marks,
          optionsJson,
          correctAnswer,
          explanation,
          tags
        );
      }

      await execute(`
        INSERT INTO question_bank (
          course_id, topic, difficulty, question_text, question_type,
          marks, options_json, correct_answer, explanation, tags, usage_count, created_by
        ) VALUES ${placeholders.join(", ")}
      `, params);

      insertedCount += chunk.length;
    }

    return NextResponse.json({
      success: true,
      count: insertedCount,
      insertedIds
    });
  } catch (err: any) {
    console.error("[API Question Bank Bulk Import Error]", err);
    return NextResponse.json({ error: err.message || "Failed to bulk import questions" }, { status: 500 });
  }
}
