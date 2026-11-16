import { execute, query } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("course_id");
    const qType = searchParams.get("type");
    const subType = searchParams.get("sub_type");
    const difficulty = searchParams.get("difficulty");
    const search = searchParams.get("search");
    const limitParam = searchParams.get("limit");
    const limit = limitParam === "all" ? 100000 : Math.min(Number(limitParam) || 100, 100000);
    const offset = Number(searchParams.get("offset")) || 0;

    const conditions: string[] = [];
    const params: any[] = [];

    if (courseId && courseId !== "all") {
      conditions.push("qb.course_id = ?");
      params.push(Number(courseId));
    }

    if (qType && qType !== "all") {
      conditions.push("qb.question_type = ?");
      params.push(qType);
    }

    if (subType && subType !== "all") {
      conditions.push("(qb.options_json LIKE ? OR qb.options_json LIKE ?)");
      params.push(`%"sub_type":"${subType}"%`, `%"sub_type": "${subType}"%`);
    }

    if (difficulty && difficulty !== "all") {
      conditions.push("qb.difficulty = ?");
      params.push(difficulty);
    }

    if (search && search.trim()) {
      conditions.push("(qb.question_text LIKE ? OR qb.topic LIKE ? OR qb.tags LIKE ?)");
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRows = await query<{ total: number }>(`
      SELECT COUNT(*) as total 
      FROM question_bank qb
      ${whereClause}
    `, params);
    const total = countRows[0]?.total || 0;

    const questions = await query(`
      SELECT 
        qb.*,
        c.title as course_title,
        c.code as course_code
      FROM question_bank qb
      LEFT JOIN courses c ON qb.course_id = c.id
      ${whereClause}
      ORDER BY qb.id DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return NextResponse.json({
      success: true,
      total,
      limit,
      offset,
      questions
    });
  } catch (err: any) {
    console.error("[API Question Bank GET Error]", err);
    return NextResponse.json({ error: err.message || "Failed to fetch question bank" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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

    if (!question_text || !question_type) {
      return NextResponse.json({ error: "question_text and question_type are required" }, { status: 400 });
    }

    const optionsStr = typeof options_json === "string" ? options_json : JSON.stringify(options_json || {});
    const correctStr = typeof correct_answer === "string" ? correct_answer : JSON.stringify(correct_answer || "");

    const res = await execute(`
      INSERT INTO question_bank (
        course_id, topic, difficulty, question_text, question_type,
        marks, options_json, correct_answer, explanation, tags, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      Number(course_id) || 1,
      topic || "General",
      difficulty || "medium",
      question_text,
      question_type,
      Number(marks) || 10,
      optionsStr,
      correctStr,
      explanation || "",
      tags || ""
    ]);

    let id = res.lastInsertRowid;
    if (!id) {
      const latest = await query<{ id: number }>("SELECT id FROM question_bank ORDER BY id DESC LIMIT 1");
      id = latest[0]?.id;
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("[API Question Bank POST Error]", err);
    return NextResponse.json({ error: err.message || "Failed to create question in bank" }, { status: 500 });
  }
}
