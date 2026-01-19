import "dotenv/config";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { ROOT_NODE_ID } from "@/lib/graph/root-node";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const thumbnailOnly = url.searchParams.get("thumbnail") === "1";
    
    // Special handling for root node: if not found by ID, try to find by type
    let node = await prisma.node.findUnique({ where: { id } });
    
    if (!node && id === ROOT_NODE_ID) {
      // Try to find root node by type (in case it has a UUID)
      const rootNode = await prisma.node.findFirst({
        where: { type: "claim_root" },
      });
      if (rootNode) {
        node = rootNode;
      }
    }
    
    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    if (thumbnailOnly) {
      let thumbnail: string | null = null;
      try {
        const parsedData = JSON.parse(node.data);
        if (typeof parsedData.content === "string" && parsedData.content.startsWith("data:image")) {
          thumbnail = parsedData.content;
        }
      } catch {
        thumbnail = null;
      }
      return NextResponse.json({ thumbnail });
    }
    
    return NextResponse.json(node);
  } catch (error: any) {
    console.error("Error fetching node:", error);
    return NextResponse.json({ error: "Failed to fetch node" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { positionX, positionY, data, status } = body;

    const updateData: any = {};
    if (positionX !== undefined) {
      updateData.positionX = parseFloat(positionX);
      console.log(`[API] Updating node ${id} positionX to ${updateData.positionX}`);
    }
    if (positionY !== undefined) {
      updateData.positionY = parseFloat(positionY);
      console.log(`[API] Updating node ${id} positionY to ${updateData.positionY}`);
    }
    if (data !== undefined) {
      // Ensure data is a plain object, not already a string
      const dataToStore = typeof data === "string" ? data : JSON.stringify(data);
      updateData.data = dataToStore;
      console.log(`[API] Updating node ${id} data (stringified):`, dataToStore.substring(0, 200));
    }
    if (status !== undefined) updateData.status = status;

    console.log(`[API] Updating node ${id} with updateData keys:`, Object.keys(updateData));

    // Special handling for root node: if not found by ID, try to find by type
    let node = await prisma.node.findUnique({ where: { id } });
    
    if (!node && id === ROOT_NODE_ID) {
      // Try to find root node by type (in case it has a UUID)
      const rootNode = await prisma.node.findFirst({
        where: { type: "claim_root" },
      });
      if (rootNode) {
        // Update using the actual database ID
        node = await prisma.node.update({
          where: { id: rootNode.id },
          data: updateData,
        });
      } else {
        return NextResponse.json({ error: "Node not found" }, { status: 404 });
      }
    } else if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    } else {
      // Normal update
      node = await prisma.node.update({
        where: { id },
        data: updateData,
      });
    }

    console.log(`[API] Node ${id} updated successfully. DB now has positionX: ${node.positionX}, positionY: ${node.positionY}`);

    return NextResponse.json(node);
  } catch (error: any) {
    console.error("Error updating node:", error);
    console.error("Error stack:", error?.stack);
    return NextResponse.json(
      { 
        error: "Failed to update node",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
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

