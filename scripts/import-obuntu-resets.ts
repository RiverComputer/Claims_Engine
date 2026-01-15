/**
 * Import script to create Obuntu Resets project with 4 clear examples:
 * - 2 Information Gathering examples
 * - 2 Kinship Gathering examples
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { prisma } from "../lib/db/client";
import { EvidenceData, ValidationData, ClaimData } from "../lib/types/graph";
import { copyFile } from "fs/promises";
import { randomUUID } from "crypto";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const PILOT_PROJECT_DIR =
  process.env.PILOT_PROJECT_DIR || path.join(process.cwd(), "..", "pilot-project");
const RAW_DATA_DIR = path.join(PILOT_PROJECT_DIR, "raw-data");

// Only these 4 specific documents
const INFORMATION_GATHERING_FILES = [
  "Community Mapping activities September /Nalubaaga field data report.pdf",
  "Community Mapping activities September /Technical Mapping Report GEDA.docx.pdf",
];

const KINSHIP_GATHERING_FILES = [
  "Conference of Landstewards/The Conference of Landstewards-Report_.docx",
  "Community Mapping activities September /FGD+KII TRANSCRIPTS /BALINTUMA ZONE/FGD 1_ for Women Barintuma zone.docx",
];

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

async function createEvidenceNode(
  projectId: string,
  data: EvidenceData,
  position: { x: number; y: number }
) {
  return await prisma.node.create({
    data: {
      projectId,
      type: "evidence",
      positionX: position.x,
      positionY: position.y,
      data: JSON.stringify(data),
      status: "draft",
    },
  });
}

async function createValidationNode(
  projectId: string,
  data: ValidationData,
  position: { x: number; y: number }
) {
  return await prisma.node.create({
    data: {
      projectId,
      type: "validation",
      positionX: position.x,
      positionY: position.y,
      data: JSON.stringify(data),
      status: "draft",
    },
  });
}

async function createClaimNode(
  projectId: string,
  data: ClaimData,
  position: { x: number; y: number }
) {
  return await prisma.node.create({
    data: {
      projectId,
      type: "claim",
      positionX: position.x,
      positionY: position.y,
      data: JSON.stringify(data),
      status: "draft",
    },
  });
}

async function createEdge(projectId: string, fromNodeId: string, toNodeId: string, edgeType: string) {
  const existing = await prisma.edge.findFirst({
    where: { fromNodeId, toNodeId, type: edgeType },
  });
  if (existing) return existing;

  return await prisma.edge.create({
    data: { projectId, fromNodeId, toNodeId, type: edgeType, locked: false },
  });
}

async function main() {
  console.log("Importing 4 documents to Obuntu Resets project...\n");

  if (!fs.existsSync(RAW_DATA_DIR)) {
    console.error(`Raw data directory not found: ${RAW_DATA_DIR}`);
    process.exit(1);
  }

  // Get or create project
  let project = await prisma.project.findFirst({
    where: { title: "Obuntu Resets" },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        title: "Obuntu Resets",
        description: "4 clear examples: 2 Information Gathering + 2 Kinship Gathering",
        ownerUserId: "guest",
      },
    });
    console.log(`Created project: ${project.title}\n`);
  } else {
    console.log(`Using existing project: ${project.title}\n`);
  }

  const projectId = project.id;

  // Layout
  const EVIDENCE_X = 100;
  const VALIDATION_X = 500;
  const CLAIM_X = 900;
  const ROW_HEIGHT = 200;

  const informationEvidenceNodes: any[] = [];
  const kinshipEvidenceNodes: any[] = [];

  // Import 2 Information Gathering files
  console.log("Information Gathering (2 files):");
  let y = 100;
  for (const relPath of INFORMATION_GATHERING_FILES) {
    const filepath = path.join(RAW_DATA_DIR, relPath);
    if (!fs.existsSync(filepath)) {
      console.log(`  ⚠ Not found: ${relPath}`);
      continue;
    }

    const filename = path.basename(filepath);
    const fileRef = await copyFileToUploads(filepath);

    const evidenceData: EvidenceData = {
      title: filename.replace(/\.[^/.]+$/, ""),
      content: `Information gathering document: ${filename}`,
      shortDescription: `Field data and technical mapping: ${filename}`,
      activity: "Information Gathering",
      fileRef,
      createdAt: new Date().toISOString(),
    };

    const node = await createEvidenceNode(projectId, evidenceData, { x: EVIDENCE_X, y });
    informationEvidenceNodes.push(node);
    y += ROW_HEIGHT;
    console.log(`  ✓ ${filename}`);
  }

  // Import 2 Kinship Gathering files
  console.log("\nKinship Gathering (2 files):");
  y = 100;
  for (const relPath of KINSHIP_GATHERING_FILES) {
    const filepath = path.join(RAW_DATA_DIR, relPath);
    if (!fs.existsSync(filepath)) {
      console.log(`  ⚠ Not found: ${relPath}`);
      continue;
    }

    const filename = path.basename(filepath);
    const fileRef = await copyFileToUploads(filepath);

    const evidenceData: EvidenceData = {
      title: filename.replace(/\.[^/.]+$/, ""),
      content: `Community gathering document: ${filename}`,
      shortDescription: `Community convening: ${filename}`,
      activity: "Kinship Gathering",
      fileRef,
      createdAt: new Date().toISOString(),
    };

    const node = await createEvidenceNode(projectId, evidenceData, { x: EVIDENCE_X, y });
    kinshipEvidenceNodes.push(node);
    y += ROW_HEIGHT;
    console.log(`  ✓ ${filename}`);
  }

  // Create Validation for Kinship Gathering
  console.log("\nCreating Validation node...");
  const validationNode = await createValidationNode(
    projectId,
    {
      shortSummary: "Community members gathered to discuss wetland stewardship",
      validatorNames: ["Community Organizers"],
      validationType: "community-convening",
      evidenceCID: [],
      createdAt: new Date().toISOString(),
    },
    { x: VALIDATION_X, y: 150 }
  );

  // Link kinship evidence to validation
  for (const evidenceNode of kinshipEvidenceNodes) {
    await createEdge(projectId, evidenceNode.id, validationNode.id, "references");
  }
  console.log("  ✓ Validation created\n");

  // Create 2 Claim nodes
  console.log("Creating Claim nodes...");

  const infoClaim = await createClaimNode(
    projectId,
    {
      title: "Information Gathering: Environmental and Social Statistics",
      shortDescription: "Field data and technical mapping documentation",
      evidenceCID: [],
      validationCID: [],
      createdAt: new Date().toISOString(),
    },
    { x: CLAIM_X, y: 150 }
  );

  for (const evidenceNode of informationEvidenceNodes) {
    await createEdge(projectId, evidenceNode.id, infoClaim.id, "references");
  }
  console.log("  ✓ Information Gathering Claim");

  const kinshipClaim = await createClaimNode(
    projectId,
    {
      title: "Kinship Gathering: Community Convenings and Dialogues",
      shortDescription: "Community meetings and stakeholder engagement",
      evidenceCID: [],
      validationCID: [],
      createdAt: new Date().toISOString(),
    },
    { x: CLAIM_X, y: 350 }
  );

  for (const evidenceNode of kinshipEvidenceNodes) {
    await createEdge(projectId, evidenceNode.id, kinshipClaim.id, "references");
  }
  await createEdge(projectId, validationNode.id, kinshipClaim.id, "validates");
  console.log("  ✓ Kinship Gathering Claim\n");

  console.log("Done!");
  console.log(`\nView at: http://localhost:3000/projects/${projectId}`);
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
