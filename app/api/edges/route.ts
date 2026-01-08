import "dotenv/config";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { isEdgeAllowed, getEdgeType } from "@/lib/graph/edge-rules";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, fromNodeId, toNodeId } = body;

    if (!projectId || !fromNodeId || !toNodeId) {
      return NextResponse.json(
        { error: "projectId, fromNodeId, and toNodeId are required" },
        { status: 400 }
      );
    }

    // Get node types
    const fromNode = await prisma.node.findUnique({ where: { id: fromNodeId } });
    const toNode = await prisma.node.findUnique({ where: { id: toNodeId } });

    if (!fromNode || !toNode) {
      return NextResponse.json({ error: "Nodes not found" }, { status: 404 });
    }

    // Validate edge is allowed
    if (!isEdgeAllowed(fromNode.type as any, toNode.type as any)) {
      return NextResponse.json(
        { error: `Cannot connect ${fromNode.type} to ${toNode.type}` },
        { status: 400 }
      );
    }

    // Check if edge already exists
    const existing = await prisma.edge.findFirst({
      where: {
        fromNodeId,
        toNodeId,
        type: getEdgeType(fromNode.type as any, toNode.type as any),
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const edge = await prisma.edge.create({
      data: {
        projectId,
        fromNodeId,
        toNodeId,
        type: getEdgeType(fromNode.type as any, toNode.type as any),
        locked: false,
      },
    });

    return NextResponse.json(edge, { status: 201 });
  } catch (error: any) {
    console.error("Error creating edge:", error);
    return NextResponse.json({ error: "Failed to create edge" }, { status: 500 });
  }
}

