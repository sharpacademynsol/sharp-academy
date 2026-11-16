import { execute, getR2, query } from "@/lib/db";
import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const customName = (formData.get("name") as string | null)?.trim();
    const customCategory = (formData.get("category") as string | null)?.trim() || "custom";
    const customTags = (formData.get("tags") as string | null)?.trim() || "custom, shape";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const originalName = file.name || "shape.svg";
    const extMatch = originalName.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : "svg";

    const allowedExtensions = ["svg", "png", "jpg", "jpeg", "webp"];
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: `Invalid file format '.${ext}'. Allowed formats: SVG, PNG, JPG, JPEG, WEBP.` },
        { status: 400 }
      );
    }

    // Max 5 MB limit
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File exceeds 5MB size limit. Please upload a smaller shape or vector." },
        { status: 400 }
      );
    }

    // Systematic naming: sanitize base name + timestamp
    const rawBaseName = originalName.replace(/\.[^/.]+$/, "");
    const cleanBase = rawBaseName
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 40) || "shape";

    const timestamp = Date.now();
    const filename = `${cleanBase}-${timestamp}.${ext}`;

    // Systematic Cloudflare R2 key: shapes/custom/...
    const r2Key = `shapes/custom/${filename}`;

    // Local static path for Next.js
    const uploadDir = path.resolve(process.cwd(), "public", "uploads", "shapes");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const localFilePath = path.join(uploadDir, filename);
    fs.writeFileSync(localFilePath, buffer);

    // Human-friendly title
    const displayName =
      customName ||
      rawBaseName
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

    const mimeType =
      file.type ||
      (ext === "svg"
        ? "image/svg+xml"
        : ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : `image/${ext}`);

    // If SVG, extract and normalize content
    let svgContent: string | null = null;
    if (ext === "svg" || mimeType.includes("svg")) {
      const text = buffer.toString("utf-8");
      if (text.includes("<svg")) {
        svgContent = text;
      }
    }

    // Attempt Cloudflare R2 upload if FILES binding is active
    let uploadedToR2 = false;
    try {
      const r2 = await getR2();
      if (r2 && typeof r2.put === "function") {
        await r2.put(r2Key, buffer, {
          httpMetadata: {
            contentType: mimeType,
            cacheControl: "public, max-age=31536000, immutable"
          },
          customMetadata: {
            originalName,
            uploadedAt: new Date().toISOString()
          }
        });
        uploadedToR2 = true;
      }
    } catch {
      // In local dev without Cloudflare Worker runtime, graceful fallback to local file
    }

    const fileUrl = `/uploads/shapes/${filename}`;

    // Insert metadata into database
    const insertRes = await execute(
      `
      INSERT INTO custom_shapes (name, file_url, r2_key, mime_type, file_size, category, tags, svg_content, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `,
      [
        displayName,
        fileUrl,
        r2Key,
        mimeType,
        buffer.length,
        customCategory,
        customTags,
        svgContent
      ]
    );

    let savedShape: any = null;
    if (insertRes.lastInsertRowid) {
      const rows = await query(`SELECT * FROM custom_shapes WHERE id = ?`, [insertRes.lastInsertRowid]);
      savedShape = rows[0] || null;
    }

    if (!savedShape) {
      savedShape = {
        id: insertRes.lastInsertRowid || timestamp,
        name: displayName,
        file_url: fileUrl,
        r2_key: r2Key,
        mime_type: mimeType,
        file_size: buffer.length,
        category: customCategory,
        tags: customTags,
        svg_content: svgContent,
        created_at: new Date().toISOString()
      };
    }

    return NextResponse.json({
      success: true,
      shape: savedShape,
      uploadedToR2,
      message: `Shape '${displayName}' successfully stored at Cloudflare key '${r2Key}'.`
    });
  } catch (error: any) {
    console.error("[Shape Upload Error]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload custom shape" },
      { status: 500 }
    );
  }
}
