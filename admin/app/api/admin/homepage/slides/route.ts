import { execute, query } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const slides = await query(
      "SELECT * FROM homepage_hero_slides ORDER BY sort_order ASC, id ASC"
    );
    return NextResponse.json({ success: true, slides });
  } catch (error: any) {
    console.error("[Slides GET Error]", error);
    return NextResponse.json({ error: error?.message || "Failed to load slides" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const {
      badge,
      title,
      highlight_text,
      description,
      features_json,
      primary_cta_text,
      primary_cta_url,
      secondary_cta_text,
      secondary_cta_url,
      image_url,
      tab_label,
      tab_title,
      sort_order = 0,
      is_active = 1
    } = body;

    if (!title || !description || !image_url) {
      return NextResponse.json({ error: "Title, description, and image URL are required" }, { status: 400 });
    }

    const res = await execute(
      `INSERT INTO homepage_hero_slides (
        badge, title, highlight_text, description, features_json,
        primary_cta_text, primary_cta_url, secondary_cta_text, secondary_cta_url,
        image_url, tab_label, tab_title, sort_order, is_active, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        badge || "Coaching & Skills",
        title,
        highlight_text || "",
        description,
        typeof features_json === "string" ? features_json : JSON.stringify(features_json || []),
        primary_cta_text || "Explore Programs",
        primary_cta_url || "/courses",
        secondary_cta_text || "Apply for Admission",
        secondary_cta_url || "/admissions",
        image_url,
        tab_label || "Academic Track",
        tab_title || "Overview",
        Number(sort_order) || 0,
        is_active ? 1 : 0
      ]
    );

    return NextResponse.json({ success: true, id: res.lastInsertRowid });
  } catch (error: any) {
    console.error("[Slides POST Error]", error);
    return NextResponse.json({ error: error?.message || "Failed to create slide" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const {
      id,
      badge,
      title,
      highlight_text,
      description,
      features_json,
      primary_cta_text,
      primary_cta_url,
      secondary_cta_text,
      secondary_cta_url,
      image_url,
      tab_label,
      tab_title,
      sort_order = 0,
      is_active = 1
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Slide ID is required" }, { status: 400 });
    }

    await execute(
      `UPDATE homepage_hero_slides SET 
        badge = ?, title = ?, highlight_text = ?, description = ?, features_json = ?,
        primary_cta_text = ?, primary_cta_url = ?, secondary_cta_text = ?, secondary_cta_url = ?,
        image_url = ?, tab_label = ?, tab_title = ?, sort_order = ?, is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        badge || "",
        title,
        highlight_text || "",
        description,
        typeof features_json === "string" ? features_json : JSON.stringify(features_json || []),
        primary_cta_text || "",
        primary_cta_url || "",
        secondary_cta_text || "",
        secondary_cta_url || "",
        image_url,
        tab_label || "",
        tab_title || "",
        Number(sort_order) || 0,
        is_active ? 1 : 0,
        id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Slides PUT Error]", error);
    return NextResponse.json({ error: error?.message || "Failed to update slide" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Slide ID is required" }, { status: 400 });
    }

    await execute("DELETE FROM homepage_hero_slides WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Slides DELETE Error]", error);
    return NextResponse.json({ error: error?.message || "Failed to delete slide" }, { status: 500 });
  }
}
