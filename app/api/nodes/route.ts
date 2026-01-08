import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { NodeType } from "@/lib/types/graph";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, type, positionX, positionY, data } = body;

    if (!projectId || !type || positionX === undefined || positionY === undefined || !data) {
      return NextResponse.json(
        { error: "projectId, type, positionX, positionY, and data are required" },
        { status: 400 }
      );
    }

    // Validate type
    if (!["evidence", "validation", "claim"].includes(type)) {
      return NextResponse.json({ error: "Invalid node type" }, { status: 400 });
    }

    const node = await prisma.node.create({
      data: {
        projectId,
        type: type as NodeType,
        positionX: parseFloat(positionX),
        positionY: parseFloat(positionY),
        data: JSON.stringify(data),
        status: "draft",
      },
    });

    return NextResponse.json(node, { status: 201 });
  } catch (error: any) {
    console.error("Error creating node:", error);
    return NextResponse.json({ error: "Failed to create node" }, { status: 500 });
  }
}

