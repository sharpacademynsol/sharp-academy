import { getR2 } from "@/lib/db";
import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path || [];
    const key = pathSegments.join("/");

    // 1. Try Cloudflare R2 if available
    try {
      const r2 = await getR2();
      if (r2 && typeof r2.get === "function") {
        const object = await r2.get(key);
        if (object) {
          const contentType = object.httpMetadata?.contentType || "application/octet-stream";
          const arrayBuffer = await object.arrayBuffer();
          return new NextResponse(arrayBuffer, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=31536000, immutable",
              "ETag": object.httpEtag || ""
            }
          });
        }
      }
    } catch {
      // Fall through to local storage
    }

    // 2. Direct local storage fallback (e.g. for /cdn/shapes/custom/filename.svg -> public/uploads/shapes/filename.svg)
    const filename = pathSegments[pathSegments.length - 1];
    if (filename) {
      const localFile = path.resolve(process.cwd(), "public", "uploads", "shapes", filename);
      if (fs.existsSync(localFile)) {
        const fileBuffer = fs.readFileSync(localFile);
        const ext = path.extname(filename).toLowerCase().replace(".", "");
        const mimeType =
          ext === "svg"
            ? "image/svg+xml"
            : ext === "png"
            ? "image/png"
            : ext === "jpg" || ext === "jpeg"
            ? "image/jpeg"
            : ext === "webp"
            ? "image/webp"
            : "application/octet-stream";

        return new NextResponse(fileBuffer, {
          headers: {
            "Content-Type": mimeType,
            "Cache-Control": "public, max-age=31536000, immutable"
          }
        });
      }
    }

    return new NextResponse("File not found in CDN / R2 storage", { status: 404 });
  } catch (error: any) {
    console.error("[CDN Route Error]", error);
    return new NextResponse("Error reading file", { status: 500 });
  }
}
