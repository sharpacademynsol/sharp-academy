import { execute, query } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const rows = await query("SELECT key, value FROM site_settings WHERE key LIKE 'activities_%'");
    const settings: Record<string, string> = {
      activities_badge: "Real Academy Life & Methodology",
      activities_title: "Activities of Learning & Training in Action",
      activities_description: "Education at Sharp Academy extends far beyond passive memorization. We integrate physical fitness drills, 1-to-1 computer lab practice, and interactive academic problem solving."
    };
    rows.forEach((r: any) => {
      settings[r.key] = r.value;
    });
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("[Settings GET Error]", error);
    return NextResponse.json({ error: error?.message || "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const allowedKeys = ["activities_badge", "activities_title", "activities_description"];

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        await execute(
          `INSERT INTO site_settings (key, value, updated_at) 
           VALUES (?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
          [key, String(body[key]), String(body[key])]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Settings POST Error]", error);
    return NextResponse.json({ error: error?.message || "Failed to save settings" }, { status: 500 });
  }
}
