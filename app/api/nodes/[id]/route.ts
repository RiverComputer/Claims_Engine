import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { positionX, positionY, data, status } = body;

    const updateData: any = {};
    if (positionX !== undefined) updateData.positionX = parseFloat(positionX);
    if (positionY !== undefined) updateData.positionY = parseFloat(positionY);
    if (data !== undefined) updateData.data = JSON.stringify(data);
    if (status !== undefined) updateData.status = status;

    const node = await prisma.node.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(node);
  } catch (error: any) {
    console.error("Error updating node:", error);
    return NextResponse.json({ error: "Failed to update node" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.node.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting node:", error);
    return NextResponse.json({ error: "Failed to delete node" }, { status: 500 });
  }
}

