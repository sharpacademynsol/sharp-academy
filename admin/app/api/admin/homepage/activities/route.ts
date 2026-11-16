import { execute, query } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const activities = await query(
      "SELECT * FROM homepage_activities ORDER BY sort_order ASC, id ASC"
    );
    return NextResponse.json({ success: true, activities });
  } catch (error: any) {
    console.error("[Activities GET Error]", error);
    return NextResponse.json({ error: error?.message || "Failed to load activities" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const {
      category_badge,
      badge_color = "amber",
      title,
      description,
      tags_json,
      image_url,
      link_text,
      link_url,
      sort_order = 0,
      is_active = 1
    } = body;

    if (!title || !description || !image_url) {
      return NextResponse.json({ error: "Title, description, and image URL are required" }, { status: 400 });
    }

    const res = await execute(
      `INSERT INTO homepage_activities (
        category_badge, badge_color, title, description, tags_json,
        image_url, link_text, link_url, sort_order, is_active, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        category_badge || "Academy Life",
        badge_color || "amber",
        title,
        description,
        typeof tags_json === "string" ? tags_json : JSON.stringify(tags_json || []),
        image_url,
        link_text || "Explore Activity",
        link_url || "/courses",
        Number(sort_order) || 0,
        is_active ? 1 : 0
      ]
    );

    return NextResponse.json({ success: true, id: res.lastInsertRowid });
  } catch (error: any) {
    console.error("[Activities POST Error]", error);
    return NextResponse.json({ error: error?.message || "Failed to create activity" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const {
      id,
      category_badge,
      badge_color = "amber",
      title,
      description,
      tags_json,
      image_url,
      link_text,
      link_url,
      sort_order = 0,
      is_active = 1
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Activity ID is required" }, { status: 400 });
    }

    await execute(
      `UPDATE homepage_activities SET 
        category_badge = ?, badge_color = ?, title = ?, description = ?, tags_json = ?,
        image_url = ?, link_text = ?, link_url = ?, sort_order = ?, is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        category_badge || "Academy Life",
        badge_color || "amber",
        title,
        description,
        typeof tags_json === "string" ? tags_json : JSON.stringify(tags_json || []),
        image_url,
        link_text || "",
        link_url || "",
        Number(sort_order) || 0,
        is_active ? 1 : 0,
        id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Activities PUT Error]", error);
    return NextResponse.json({ error: error?.message || "Failed to update activity" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Activity ID is required" }, { status: 400 });
    }

    await execute("DELETE FROM homepage_activities WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Activities DELETE Error]", error);
    return NextResponse.json({ error: error?.message || "Failed to delete activity" }, { status: 500 });
  }
}
