import "dotenv/config";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        nodes: {
          orderBy: { createdAt: "asc" },
        },
        edges: true,
        commits: {
          orderBy: { committedAt: "desc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error: any) {
    console.error("Error fetching project:", error);
    console.error("Error stack:", error?.stack);
    return NextResponse.json(
      { 
        error: "Failed to fetch project", 
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

