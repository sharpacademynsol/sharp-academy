import { execute, getR2, query } from "@/lib/db";
import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const shapes = await query(
      `SELECT * FROM custom_shapes ORDER BY id DESC`
    );

    return NextResponse.json({
      success: true,
      shapes: shapes || []
    });
  } catch (error: any) {
    console.error("[Shapes GET Error]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve custom shapes" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Shape ID is required" }, { status: 400 });
    }

    const rows = await query(`SELECT * FROM custom_shapes WHERE id = ?`, [Number(id)]);
    const shape = rows[0];

    if (!shape) {
      return NextResponse.json({ error: "Shape not found" }, { status: 404 });
    }

    // Try deleting from local disk
    if (shape.file_url) {
      const filename = path.basename(shape.file_url);
      const localPath = path.resolve(process.cwd(), "public", "uploads", "shapes", filename);
      if (fs.existsSync(localPath)) {
        try {
          fs.unlinkSync(localPath);
        } catch (e) {
          console.warn("[Local File Delete Notice]:", e);
        }
      }
    }

    // Try deleting from Cloudflare R2 if binding available
    if (shape.r2_key) {
      try {
        const r2 = await getR2();
        if (r2 && typeof r2.delete === "function") {
          await r2.delete(shape.r2_key);
        }
      } catch {
        // Fallback gracefully
      }
    }

    // Delete record from DB
    await execute(`DELETE FROM custom_shapes WHERE id = ?`, [Number(id)]);

    return NextResponse.json({
      success: true,
      message: `Shape '${shape.name}' deleted successfully.`
    });
  } catch (error: any) {
    console.error("[Shapes DELETE Error]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete custom shape" },
      { status: 500 }
    );
  }
}
