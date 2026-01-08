import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.edge.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting edge:", error);
    return NextResponse.json({ error: "Failed to delete edge" }, { status: 500 });
  }
}

