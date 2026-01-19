import "dotenv/config";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { isEdgeAllowed, getEdgeType } from "@/lib/graph/edge-rules";
import { ROOT_NODE_ID } from "@/lib/graph/root-node";

export const runtime = "nodejs";

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
    // Special handling for root node: if ID is ROOT_NODE_ID but not found, look up by type
    let fromNode = await prisma.node.findUnique({ where: { id: fromNodeId } });
    let toNode = await prisma.node.findUnique({ where: { id: toNodeId } });

    // If root node not found by ID, try to find it by type
    if (!fromNode && fromNodeId === ROOT_NODE_ID) {
      const rootNode = await prisma.node.findFirst({
        where: { projectId, type: "claim_root" },
      });
      if (rootNode) {
        console.log(`[API] Found root node by type with ID: ${rootNode.id}, using it for fromNode`);
        fromNode = rootNode;
        // Update the fromNodeId to use the actual database ID
        // We'll need to use this for the edge creation
      }
    }

    if (!toNode && toNodeId === ROOT_NODE_ID) {
      const rootNode = await prisma.node.findFirst({
        where: { projectId, type: "claim_root" },
      });
      if (rootNode) {
        console.log(`[API] Found root node by type with ID: ${rootNode.id}, using it for toNode`);
        toNode = rootNode;
        // Update the toNodeId to use the actual database ID
      }
    }

    if (!fromNode || !toNode) {
      const missingNodes = [];
      if (!fromNode) missingNodes.push(`fromNode (${fromNodeId})`);
      if (!toNode) missingNodes.push(`toNode (${toNodeId})`);
      console.error(`[API] Nodes not found: ${missingNodes.join(", ")}`);
      console.error(`[API] Project ID: ${projectId}`);
      
      // Check if nodes exist with different IDs (for debugging)
      const allNodes = await prisma.node.findMany({ where: { projectId } });
      console.error(`[API] Total nodes in project: ${allNodes.length}`);
      console.error(`[API] Node IDs in project:`, allNodes.map((n: any) => ({ id: n.id, type: n.type })));
      
      return NextResponse.json({ 
        error: "Nodes not found",
        details: `Missing: ${missingNodes.join(", ")}`,
        fromNodeId,
        toNodeId,
      }, { status: 404 });
    }

    // Use the actual database IDs for edge creation
    const actualFromNodeId = fromNode.id;
    const actualToNodeId = toNode.id;

    // Validate edge is allowed
    if (!isEdgeAllowed(fromNode.type as any, toNode.type as any)) {
      return NextResponse.json(
        { error: `Cannot connect ${fromNode.type} to ${toNode.type}` },
        { status: 400 }
      );
    }

    // Check if edge already exists (using actual database IDs)
    const existing = await prisma.edge.findFirst({
      where: {
        fromNodeId: actualFromNodeId,
        toNodeId: actualToNodeId,
        type: getEdgeType(fromNode.type as any, toNode.type as any),
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const edge = await prisma.edge.create({
      data: {
        projectId,
        fromNodeId: actualFromNodeId, // Use actual database ID
        toNodeId: actualToNodeId, // Use actual database ID
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

