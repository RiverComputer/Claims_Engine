import "dotenv/config";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Root-link edges are virtual and don't exist in the database
    if (id?.startsWith("root-link-")) {
      return NextResponse.json({ success: true, message: "Root-link edge is virtual, no deletion needed" });
    }
    
    await prisma.edge.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting edge:", error);
    // If edge doesn't exist, that's okay (might be a root-link or already deleted)
    if (error.code === "P2025") {
      return NextResponse.json({ success: true, message: "Edge not found (may be virtual or already deleted)" });
    }
    return NextResponse.json({ error: "Failed to delete edge" }, { status: 500 });
  }
}

