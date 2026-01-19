import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { MockAdapter } from "@/lib/commit/mock";
import { validateCommit } from "@/lib/graph/commit-gating";
import { GraphNode, GraphEdge } from "@/lib/types/graph";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nodeId, projectId } = body;

    if (!nodeId || !projectId) {
      return NextResponse.json(
        { error: "nodeId and projectId are required" },
        { status: 400 }
      );
    }

    // Get node and related edges
    const node = await prisma.node.findUnique({
      where: { id: nodeId },
      include: {
        edgesFrom: true,
        edgesTo: true,
      },
    });

    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    if (node.status === "committed") {
      return NextResponse.json({ error: "Node is already committed" }, { status: 400 });
    }

    // Parse node data
    const nodeData = JSON.parse(node.data);

    // For Validation and Claim nodes, populate CID arrays from connected edges
    if (node.type === "validation") {
      const evidenceEdges = node.edgesTo.filter((e: any) => e.type === "references");
      const evidenceNodes = await Promise.all(
        evidenceEdges.map((e: any) => prisma.node.findUnique({ where: { id: e.fromNodeId } }))
      );
      const connectedEvidence = evidenceNodes
        .map((n: any) => n?.cid)
        .filter((cid): cid is string => cid !== null && cid !== undefined);
      
      nodeData.evidenceCID = [...new Set([...(nodeData.evidenceCID || []), ...connectedEvidence])];
    }

    if (node.type === "claim") {
      const evidenceEdges = node.edgesTo.filter((e: any) => e.type === "includes");
      const evidenceNodes = await Promise.all(
        evidenceEdges.map((e: any) => prisma.node.findUnique({ where: { id: e.fromNodeId } }))
      );
      const connectedEvidence = evidenceNodes
        .map((n: any) => n?.cid)
        .filter((cid): cid is string => cid !== null && cid !== undefined);

      const validationEdges = node.edgesTo.filter((e: any) => e.type === "validates");
      const validationNodes = await Promise.all(
        validationEdges.map((e: any) => prisma.node.findUnique({ where: { id: e.fromNodeId } }))
      );
      const connectedValidation = validationNodes
        .map((n: any) => n?.cid)
        .filter((cid): cid is string => cid !== null && cid !== undefined);

      nodeData.evidenceCID = [...new Set([...(nodeData.evidenceCID || []), ...connectedEvidence])];
      nodeData.validationCID = [...new Set([...(nodeData.validationCID || []), ...connectedValidation])];
    }

    // Convert to GraphNode format
    const graphNode: GraphNode = {
      id: node.id,
      type: node.type as any,
      status: node.status as any,
      position: { x: node.positionX, y: node.positionY },
      data: nodeData,
      cid: node.cid || undefined,
      attestationUID: node.attestationUID || undefined,
    };

    // Convert edges
    const allEdges = [...node.edgesFrom, ...node.edgesTo];
    const graphEdges: GraphEdge[] = allEdges.map((e) => ({
      id: e.id,
      source: e.fromNodeId,
      target: e.toNodeId,
      type: e.type,
      locked: e.locked,
    }));

    // Validate commit
    const validation = validateCommit(graphNode, graphEdges);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Commit validation failed", errors: validation.errors },
        { status: 400 }
      );
    }

    // Commit via adapter (use updated nodeData with populated CIDs)
    const adapter = new MockAdapter();
    const result = await adapter.commit(graphNode, nodeData);

    // Update node
    const updatedNode = await prisma.node.update({
      where: { id: nodeId },
      data: {
        status: "committed",
        cid: result.cid,
        attestationUID: result.attestationUID,
      },
    });

    // Lock connected edges
    await prisma.edge.updateMany({
      where: {
        OR: [{ fromNodeId: nodeId }, { toNodeId: nodeId }],
      },
      data: { locked: true },
    });

    // Update node data with populated CIDs
    await prisma.node.update({
      where: { id: nodeId },
      data: { data: JSON.stringify(nodeData) },
    });

    // Create commit record
    const commit = await prisma.commit.create({
      data: {
        projectId,
        nodeId,
        adapterType: "mock",
        cid: result.cid,
        attestationUID: result.attestationUID,
        payload: JSON.stringify(nodeData),
        metadata: JSON.stringify(result.metadata || {}),
      },
    });

    return NextResponse.json({
      node: updatedNode,
      commit,
      cid: result.cid,
      attestationUID: result.attestationUID,
    });
  } catch (error: any) {
    console.error("Error committing node:", error);
    return NextResponse.json({ error: error.message || "Failed to commit node" }, { status: 500 });
  }
}

