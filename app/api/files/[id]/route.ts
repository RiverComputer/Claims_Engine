import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

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

