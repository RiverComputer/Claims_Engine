import "dotenv/config";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    console.error("Error stack:", error?.stack);
    return NextResponse.json(
      { 
        error: "Failed to fetch projects", 
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, ownerUserId = "guest" } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        ownerUserId,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error("Error creating project:", error);
    console.error("Error stack:", error?.stack);
    return NextResponse.json(
      { 
        error: "Failed to create project", 
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
