import "dotenv/config";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const lite = url.searchParams.get("lite") === "1";

    const project = lite
      ? await prisma.project.findUnique({
          where: { id },
          select: {
            id: true,
            title: true,
            description: true,
            ownerUserId: true,
            createdAt: true,
            updatedAt: true,
            nodes: {
              orderBy: { createdAt: "asc" },
            },
            edges: true,
          },
        })
      : await prisma.project.findUnique({
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

    if (lite) {
      const liteNodes = project.nodes.map((node) => {
        let parsedData: any = {};
        try {
          parsedData = JSON.parse(node.data);
        } catch {
          parsedData = {};
        }

        const liteData = {
          title: parsedData.title,
          shortSummary: parsedData.shortSummary,
          shortDescription: parsedData.shortDescription,
          validatorNames: parsedData.validatorNames,
          validationType: parsedData.validationType,
          evidenceCID: parsedData.evidenceCID,
          validationCID: parsedData.validationCID,
          fileRef: parsedData.fileRef,
          _lite: true,
        };

        return {
          ...node,
          data: JSON.stringify(liteData),
        };
      });

      return NextResponse.json({ ...project, nodes: liteNodes });
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

