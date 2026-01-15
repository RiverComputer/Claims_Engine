import "dotenv/config";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { findDocuments } from "@/lib/ontology/document-parser";
import { classifyDocument, getClaimTypeDisplayName, ClaimType } from "@/lib/ontology/claim-classifier";
import { EvidenceData, ValidationData, ClaimData } from "@/lib/types/graph";
import * as fs from "fs";
import * as path from "path";
import { copyFile } from "fs/promises";
import { randomUUID } from "crypto";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

async function ensureUploadsDir() {
  try {
    await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

async function copyFileToUploads(sourcePath: string): Promise<string> {
  await ensureUploadsDir();
  const filename = path.basename(sourcePath);
  const extension = path.extname(filename);
  const uniqueId = randomUUID();
  const destFilename = `${uniqueId}${extension}`;
  const destPath = path.join(UPLOADS_DIR, destFilename);
  await copyFile(sourcePath, destPath);
  return `/api/files/${uniqueId}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { sourcePath, claimTypeFilter } = body;

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Default to pilot-project/raw-data if not provided
    const dataDir = sourcePath || path.join(process.cwd(), "..", "pilot-project", "raw-data");

    if (!fs.existsSync(dataDir)) {
      return NextResponse.json(
        { error: `Source directory not found: ${dataDir}` },
        { status: 400 }
      );
    }

    // Find documents
    const documents = await findDocuments(dataDir, {
      recursive: true,
      excludePatterns: ["Photos", "photos", "Recordings", "recordings"],
    });

    // Filter by claim type if specified
    let filteredDocs = documents;
    if (claimTypeFilter) {
      filteredDocs = documents.filter((doc) => {
        const classification = classifyDocument(doc.filename, doc.relativePath, doc.content);
        return classification.claimType === claimTypeFilter;
      });
    }

    // Group by claim type
    const documentsByClaimType = new Map<ClaimType, typeof documents>();
    documentsByClaimType.set("information-gathering", []);
    documentsByClaimType.set("kinship-gathering", []);
    documentsByClaimType.set("governance-gathering", []);
    documentsByClaimType.set("intervention", []);

    for (const doc of filteredDocs) {
      const classification = classifyDocument(doc.filename, doc.relativePath, doc.content);
      const docs = documentsByClaimType.get(classification.claimType) || [];
      docs.push(doc);
      documentsByClaimType.set(classification.claimType, docs);
    }

    // Create nodes
    const createdNodes: any[] = [];
    const createdEdges: any[] = [];
    const errors: string[] = [];

    const EVIDENCE_X = 100;
    const ROW_HEIGHT = 150;
    let currentY = 100;

    // Create Evidence nodes
    for (const [claimType, docs] of documentsByClaimType.entries()) {
      for (const doc of docs) {
        try {
          const fileRef = await copyFileToUploads(doc.filepath);

          const evidenceData: EvidenceData = {
            title: doc.filename.replace(/\.[^/.]+$/, ""),
            content: doc.content || "",
            shortDescription: doc.relativePath,
            activity: getClaimTypeDisplayName(claimType),
            fileRef,
            createdAt: new Date().toISOString(),
          };

          const node = await prisma.node.create({
            data: {
              projectId,
              type: "evidence",
              positionX: EVIDENCE_X,
              positionY: currentY,
              data: JSON.stringify(evidenceData),
              status: "draft",
            },
          });

          createdNodes.push(node);
          currentY += ROW_HEIGHT;
        } catch (error: any) {
          errors.push(`Error processing ${doc.filename}: ${error.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        documentsProcessed: filteredDocs.length,
        nodesCreated: createdNodes.length,
        edgesCreated: createdEdges.length,
        errors: errors.length,
      },
      nodes: createdNodes,
      errors: errors.slice(0, 10), // Limit error output
    });
  } catch (error: any) {
    console.error("Error importing documents:", error);
    return NextResponse.json(
      { error: "Failed to import documents", details: error?.message },
      { status: 500 }
    );
  }
}

