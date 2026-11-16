import { getR2 } from "@/lib/db";
import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string | null)?.trim() || "general";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const originalName = file.name || "image.jpg";
    const extMatch = originalName.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";

    const allowedExtensions = ["svg", "png", "jpg", "jpeg", "webp"];
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: `Invalid file format '.${ext}'. Allowed: PNG, JPG, JPEG, WEBP, SVG.` },
        { status: 400 }
      );
    }

    // Max 10MB limit
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File exceeds 10MB size limit. Please upload a smaller image." },
        { status: 400 }
      );
    }

    const cleanBase = originalName
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 40) || "photo";

    const timestamp = Date.now();
    const filename = `${cleanBase}-${timestamp}.${ext}`;
    const relativeUrl = `/uploads/homepage/${filename}`;

    // Save to admin/public/uploads/homepage/
    const adminUploadDir = path.resolve(process.cwd(), "public", "uploads", "homepage");
    if (!fs.existsSync(adminUploadDir)) {
      fs.mkdirSync(adminUploadDir, { recursive: true });
    }
    fs.writeFileSync(path.join(adminUploadDir, filename), buffer);

    // Also mirror to portal/public/uploads/homepage/ so local dev portal has immediate access!
    try {
      const portalUploadDir = path.resolve(process.cwd(), "..", "portal", "public", "uploads", "homepage");
      if (!fs.existsSync(portalUploadDir)) {
        fs.mkdirSync(portalUploadDir, { recursive: true });
      }
      fs.writeFileSync(path.join(portalUploadDir, filename), buffer);
    } catch (e) {
      console.warn("[Portal Image Mirror Notice]:", e);
    }

    // Optional R2 sync
    try {
      const r2 = await getR2();
      if (r2 && typeof r2.put === "function") {
        await r2.put(`homepage/${filename}`, buffer, {
          httpMetadata: {
            contentType: file.type || `image/${ext}`
          }
        });
      }
    } catch {}

    return NextResponse.json({
      success: true,
      url: relativeUrl,
      filename,
      size: buffer.length
    });
  } catch (error: any) {
    console.error("[Homepage Upload Error]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const adminUploadDir = path.resolve(process.cwd(), "public", "uploads", "homepage");
    if (!fs.existsSync(adminUploadDir)) {
      return NextResponse.json({ success: true, files: [] });
    }
    const entries = fs.readdirSync(adminUploadDir)
      .filter((f) => /\.(jpe?g|png|webp|svg)$/i.test(f))
      .map((filename) => {
        try {
          const stats = fs.statSync(path.join(adminUploadDir, filename));
          return {
            filename,
            url: `/uploads/homepage/${filename}`,
            mtime: stats.mtimeMs,
            size: stats.size
          };
        } catch {
          return {
            filename,
            url: `/uploads/homepage/${filename}`,
            mtime: 0,
            size: 0
          };
        }
      })
      .sort((a, b) => b.mtime - a.mtime);

    return NextResponse.json({
      success: true,
      files: entries.map((e) => e.url)
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message, files: [] }, { status: 500 });
  }
}

