import { execute, query } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await query(`
      SELECT qb.*, c.title as course_title, c.code as course_code
      FROM question_bank qb
      LEFT JOIN courses c ON qb.course_id = c.id
      WHERE qb.id = ?
    `, [Number(id)]);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, question: rows[0] });
  } catch (err: any) {
    console.error("[API Question Bank Detail Error]", err);
    return NextResponse.json({ error: err.message || "Failed to fetch question" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as any;
    const {
      course_id,
      topic,
      difficulty,
      question_text,
      question_type,
      marks,
      options_json,
      correct_answer,
      explanation,
      tags
    } = body;

    const optionsStr = typeof options_json === "string" ? options_json : JSON.stringify(options_json || {});
    const correctStr = typeof correct_answer === "string" ? correct_answer : JSON.stringify(correct_answer || "");

    await execute(`
      UPDATE question_bank SET
        course_id = COALESCE(?, course_id),
        topic = COALESCE(?, topic),
        difficulty = COALESCE(?, difficulty),
        question_text = COALESCE(?, question_text),
        question_type = COALESCE(?, question_type),
        marks = COALESCE(?, marks),
        options_json = COALESCE(?, options_json),
        correct_answer = COALESCE(?, correct_answer),
        explanation = COALESCE(?, explanation),
        tags = COALESCE(?, tags),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      course_id !== undefined ? Number(course_id) : null,
      topic !== undefined ? topic : null,
      difficulty !== undefined ? difficulty : null,
      question_text !== undefined ? question_text : null,
      question_type !== undefined ? question_type : null,
      marks !== undefined ? Number(marks) : null,
      optionsStr,
      correctStr,
      explanation !== undefined ? explanation : null,
      tags !== undefined ? tags : null,
      Number(id)
    ]);

    return NextResponse.json({ success: true, id: Number(id) });
  } catch (err: any) {
    console.error("[API Question Bank PUT Error]", err);
    return NextResponse.json({ error: err.message || "Failed to update question in bank" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await execute(`DELETE FROM question_bank WHERE id = ?`, [Number(id)]);
    return NextResponse.json({ success: true, message: "Question deleted from bank" });
  } catch (err: any) {
    console.error("[API Question Bank DELETE Error]", err);
    return NextResponse.json({ error: err.message || "Failed to delete question from bank" }, { status: 500 });
  }
}
