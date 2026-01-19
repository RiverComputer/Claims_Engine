import { NextRequest, NextResponse } from "next/server";
import { storeFile } from "@/lib/storage/file-store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const stored = await storeFile({
      buffer,
      filename: file.name,
      contentType: file.type,
    });

    return NextResponse.json(
      {
        id: stored.id,
        filename: file.name,
        size: file.size,
        type: stored.contentType,
        url: stored.fileRef,
        thumbUrl: stored.thumbRef,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file", details: error?.message },
      { status: 500 }
    );
  }
}

