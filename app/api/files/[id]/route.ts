import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { createCanvas, loadImage } from "canvas";

const UPLOADS_DIR = join(process.cwd(), "uploads");

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
  md: "text/markdown",
  json: "application/json",
  xml: "application/xml",
  csv: "text/csv",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const thumb = url.searchParams.get("thumb") === "1";
    const requestedWidth = parseInt(url.searchParams.get("w") || "0", 10);
    const requestedHeight = parseInt(url.searchParams.get("h") || "0", 10);

    // Find file by ID (scan uploads directory for files starting with the ID)
    const files = await readdir(UPLOADS_DIR);
    const file = files.find((f) => f.startsWith(id));

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const filepath = join(UPLOADS_DIR, file);

    if (!existsSync(filepath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Determine MIME type from extension
    const extension = file.split(".").pop()?.toLowerCase() || "";
    const contentType = MIME_TYPES[extension] || "application/octet-stream";

    const isImage = contentType.startsWith("image/");

    if (thumb && isImage) {
      try {
        const fileBuffer = await readFile(filepath);
        const image = await loadImage(fileBuffer);
        const maxWidth = requestedWidth > 0 ? requestedWidth : 400;
        const maxHeight = requestedHeight > 0 ? requestedHeight : 300;
        const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));

        const canvas = createCanvas(width, height);
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);

        const thumbBuffer = canvas.toBuffer("image/jpeg", { quality: 0.75 });
        return new NextResponse(thumbBuffer, {
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      } catch (error) {
        console.error("Error generating thumbnail:", error);
      }
    }

    // Read and return file
    const fileBuffer = await readFile(filepath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${file}"`,
      },
    });
  } catch (error: any) {
    console.error("Error retrieving file:", error);
    return NextResponse.json(
      { error: "Failed to retrieve file", details: error?.message },
      { status: 500 }
    );
  }
}

