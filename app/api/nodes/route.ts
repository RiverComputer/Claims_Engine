import "dotenv/config";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export const runtime = "nodejs";
import { NodeType } from "@/lib/types/graph";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, type, positionX, positionY, data, id } = body;
    const allowEmptyData = type === "shape" || type === "text";

    if (!projectId || !type || positionX === undefined || positionY === undefined || (!data && !allowEmptyData)) {
      return NextResponse.json(
        { error: "projectId, type, positionX, positionY, and data are required" },
        { status: 400 }
      );
    }

    // Validate type
    if (!["evidence", "validation", "claim", "claim_root", "shape", "text"].includes(type)) {
      return NextResponse.json({ error: "Invalid node type" }, { status: 400 });
    }

    // For root node, use the hardcoded ID; otherwise let Prisma generate a UUID
    const nodeData: any = {
      projectId,
      type: type as NodeType,
      positionX: parseFloat(positionX),
      positionY: parseFloat(positionY),
      data: JSON.stringify(data ?? {}),
      status: "draft",
    };

    // If a custom ID is provided (e.g., for root node), use it
    if (id) {
      nodeData.id = id;
    }

    const node = await prisma.node.create({
      data: nodeData,
    });

    return NextResponse.json(node, { status: 201 });
  } catch (error: any) {
    console.error("Error creating node:", error);
    console.error("Error stack:", error?.stack);
    return NextResponse.json(
      { 
        error: "Failed to create node",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

