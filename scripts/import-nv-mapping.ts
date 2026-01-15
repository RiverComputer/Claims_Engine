/**
 * Import script for Nalubaaga Valley Community Mapping Initiative
 * Creates a claim graph: Main Claim -> Validation Nodes -> Evidence Nodes
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { prisma } from "../lib/db/client";
import { EvidenceData, ValidationData, ClaimData } from "../lib/types/graph";
import { copyFile, readFile } from "fs/promises";
import { randomUUID } from "crypto";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const PILOT_PROJECT_DIR =
  process.env.PILOT_PROJECT_DIR || path.join(process.cwd(), "..", "pilot-project");
const RAW_DATA_DIR = path.join(PILOT_PROJECT_DIR, "raw-data", "NV_Mapping_Example");

// Define validation subclaims and their associated evidence files
const VALIDATION_STRUCTURE = [
  {
    validationTitle: "Community Mapping Workshop Conducted",
    validationSummary: "A participatory community mapping workshop was organized and conducted, including tool demonstrations and tutorials for community members",
    validationType: "workshop-convening",
    validatorNames: ["Community Organizers", "Mapping Facilitators"],
    evidenceFiles: [
      "Community_Mapping_Exercise.png",
      "Mapping_Tool_Tutorial.png",
      "Mapping_Tool_Demonstration.png",
    ],
  },
  {
    validationTitle: "Biodiversity Survey Completed",
    validationSummary: "Community members participated in documenting biodiversity within the wetland area",
    validationType: "technical-survey",
    validatorNames: ["Community Members", "Field Coordinators"],
    evidenceFiles: ["NV_Biodiversity_Survey.png"],
  },
  {
    validationTitle: "Land Use Survey Completed",
    validationSummary: "Survey documenting current land use patterns in the Nalubaaga Valley wetland area",
    validationType: "technical-survey",
    validatorNames: ["Community Members", "Field Coordinators"],
    evidenceFiles: ["NV_Landuse_Survey.png"],
  },
  {
    validationTitle: "Land Cover Survey Completed",
    validationSummary: "Survey documenting land cover types and vegetation in the wetland area",
    validationType: "technical-survey",
    validatorNames: ["Community Members", "Field Coordinators"],
    evidenceFiles: ["NV_Lancover_Survey.png"],
  },
  {
    validationTitle: "Threats Assessment Survey Completed",
    validationSummary: "Community assessment of threats and challenges facing the wetland ecosystem",
    validationType: "community-assessment",
    validatorNames: ["Community Members"],
    evidenceFiles: ["NV_Theats_Survey.png"],
  },
  {
    validationTitle: "Restoration Desires Survey Completed",
    validationSummary: "Community survey documenting desired restoration and conservation interventions",
    validationType: "community-assessment",
    validatorNames: ["Community Members"],
    evidenceFiles: ["NV_Restoration_Desires_Survey.png"],
  },
  {
    validationTitle: "Beneficiary Gender Analysis Completed",
    validationSummary: "Gender-disaggregated analysis of wetland beneficiaries and participants",
    validationType: "social-analysis",
    validatorNames: ["Community Researchers"],
    evidenceFiles: ["NV_Beneficiary_Gender_Survey.png"],
  },
  {
    validationTitle: "Mapping Participants Documented",
    validationSummary: "Documentation of community members who participated in the mapping initiative",
    validationType: "participant-documentation",
    validatorNames: ["Workshop Facilitators"],
    evidenceFiles: ["NV_Mapping_Participants.png"],
  },
  {
    validationTitle: "Community Maps Created",
    validationSummary: "Final community-generated maps of the Nalubaaga Valley wetland area, including draft and final versions",
    validationType: "map-production",
    validatorNames: ["Community Mappers", "Cartographic Support"],
    evidenceFiles: [
      "Final_Nalubaaga_Valley_Community_Map.jpg",
      "NV_Valley_Community_Map_draft.jpg",
    ],
  },
  {
    validationTitle: "Wetlands Assessment Completed",
    validationSummary: "Comprehensive assessment of wetland conditions and characteristics",
    validationType: "technical-assessment",
    validatorNames: ["Field Assessors", "Community Members"],
    evidenceFiles: ["Wetlands_Assessment.png"],
  },
];

async function ensureUploadsDir() {
  try {
    await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

async function copyFileToUploads(sourcePath: string): Promise<{ fileRef: string; dataUrl?: string }> {
  await ensureUploadsDir();
  
  const filename = path.basename(sourcePath);
  const extension = path.extname(filename);
  const uniqueId = randomUUID();
  const destFilename = `${uniqueId}${extension}`;
  const destPath = path.join(UPLOADS_DIR, destFilename);
  
  await copyFile(sourcePath, destPath);
  
  const fileRef = `/api/files/${uniqueId}`;
  
  // If it's an image, also create a data URL for thumbnail
  const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(filename);
  let dataUrl: string | undefined;
  
  if (isImage) {
    try {
      const fileBuffer = await readFile(sourcePath);
      const mimeType = extension === '.png' ? 'image/png' :
                       extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' :
                       extension === '.gif' ? 'image/gif' :
                       extension === '.webp' ? 'image/webp' : 'image/png';
      dataUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    } catch (error) {
      console.warn(`Could not create data URL for ${filename}:`, error);
    }
  }
  
  return { fileRef, dataUrl };
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
  // Check if edge already exists
  const existing = await prisma.edge.findFirst({
    where: {
      fromNodeId,
      toNodeId,
      type: edgeType,
    },
  });

  if (existing) {
    return existing;
  }

  return await prisma.edge.create({
    data: {
      projectId,
      fromNodeId,
      toNodeId,
      type: edgeType,
      locked: false,
    },
  });
}

async function main() {
  console.log("Importing Nalubaaga Valley Community Mapping Initiative...\n");

  if (!fs.existsSync(RAW_DATA_DIR)) {
    console.error(`Raw data directory not found: ${RAW_DATA_DIR}`);
    process.exit(1);
  }

  // Create or get project
  let project = await prisma.project.findFirst({
    where: { title: "Nalubaaga Valley Community Mapping" },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        title: "Nalubaaga Valley Community Mapping",
        description: "Community mapping initiative for wetland stewardship - evidence, validation, and claims graph",
        ownerUserId: "guest",
      },
    });
    console.log(`Created project: ${project.title}\n`);
  } else {
    console.log(`Using existing project: ${project.title}`);
    console.log("Cleaning up existing nodes and edges...\n");
    
    // Delete all existing edges first (foreign key constraint)
    await prisma.edge.deleteMany({
      where: { projectId: project.id },
    });
    
    // Delete all existing nodes
    await prisma.node.deleteMany({
      where: { projectId: project.id },
    });
    
    console.log("Existing nodes and edges removed.\n");
  }

  const projectId = project.id;

  // Define which evidence files are relevant to which validations
  // This allows multiple validations to reference the same evidence
  const evidenceToValidations: Record<string, string[]> = {
    "Community_Mapping_Exercise.png": ["Community Mapping Workshop Conducted", "Mapping Participants Documented"],
    "Mapping_Tool_Tutorial.png": ["Community Mapping Workshop Conducted"],
    "Mapping_Tool_Demonstration.png": ["Community Mapping Workshop Conducted"],
    "NV_Biodiversity_Survey.png": ["Biodiversity Survey Completed", "Wetlands Assessment Completed"],
    "NV_Landuse_Survey.png": ["Land Use Survey Completed", "Wetlands Assessment Completed"],
    "NV_Lancover_Survey.png": ["Land Cover Survey Completed", "Wetlands Assessment Completed"],
    "NV_Theats_Survey.png": ["Threats Assessment Survey Completed", "Wetlands Assessment Completed"],
    "NV_Restoration_Desires_Survey.png": ["Restoration Desires Survey Completed", "Wetlands Assessment Completed"],
    "NV_Beneficiary_Gender_Survey.png": ["Beneficiary Gender Analysis Completed", "Mapping Participants Documented"],
    "NV_Mapping_Participants.png": ["Mapping Participants Documented", "Community Mapping Workshop Conducted"],
    "Final_Nalubaaga_Valley_Community_Map.jpg": ["Community Maps Created", "Land Use Survey Completed", "Land Cover Survey Completed", "Wetlands Assessment Completed"],
    "NV_Valley_Community_Map_draft.jpg": ["Community Maps Created", "Land Use Survey Completed", "Land Cover Survey Completed", "Wetlands Assessment Completed"],
    "Wetlands_Assessment.png": ["Wetlands Assessment Completed", "Biodiversity Survey Completed", "Land Use Survey Completed", "Land Cover Survey Completed", "Threats Assessment Survey Completed", "Restoration Desires Survey Completed"],
  };

  // Layout configuration - Vertical flow with horizontal evidence line
  const EVIDENCE_Y = 100; // All evidence on same horizontal line
  const EVIDENCE_SPACING = 250; // Horizontal spacing between evidence nodes
  const VALIDATION_Y = 400; // Validations below evidence
  const VALIDATION_SPACING = 300; // Horizontal spacing between validation nodes
  const CLAIM_Y = 700; // Claim at bottom, centered

  // Step 1: Create all unique evidence nodes first in a horizontal line
  console.log("Step 1: Creating evidence nodes in horizontal line...\n");
  const evidenceNodeMap = new Map<string, any>(); // filename -> node
  const allEvidenceFiles = new Set<string>();
  
  // Collect all unique evidence files
  for (const validation of VALIDATION_STRUCTURE) {
    for (const file of validation.evidenceFiles) {
      allEvidenceFiles.add(file);
    }
  }
  
  // Also add files from evidenceToValidations that might not be in VALIDATION_STRUCTURE
  for (const file of Object.keys(evidenceToValidations)) {
    allEvidenceFiles.add(file);
  }

  const sortedEvidenceFiles = Array.from(allEvidenceFiles).sort();
  const startEvidenceX = 200; // Start position for evidence line

  let currentEvidenceX = startEvidenceX;
  for (const evidenceFile of sortedEvidenceFiles) {
    const filepath = path.join(RAW_DATA_DIR, evidenceFile);
    
    if (!fs.existsSync(filepath)) {
      console.log(`  ⚠ Evidence file not found: ${evidenceFile}`);
      continue;
    }

    const filename = path.basename(evidenceFile);
    const { fileRef, dataUrl } = await copyFileToUploads(filepath);
    
    // Extract meaningful title from filename
    const title = filename
      .replace(/\.(png|jpg|jpeg)$/i, "")
      .replace(/_/g, " ")
      .replace(/NV\s*/g, "")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    const evidenceData: EvidenceData = {
      title: title,
      content: dataUrl || `Evidence file: ${filename}`, // Use data URL for thumbnails
      shortDescription: `Evidence file: ${filename}`,
      activity: "Community Mapping",
      fileRef,
      createdAt: new Date().toISOString(),
    };

    const evidenceNode = await createEvidenceNode(projectId, evidenceData, {
      x: currentEvidenceX,
      y: EVIDENCE_Y,
    });

    evidenceNodeMap.set(evidenceFile, evidenceNode);
    currentEvidenceX += EVIDENCE_SPACING;
    console.log(`  ✓ Evidence: ${filename}`);
  }
  console.log();

  // Step 2: Skip validation nodes - user will create them manually for comparison
  console.log("Step 2: Skipping validation nodes (to be created manually for comparison)...\n");
  const validationNodes: any[] = [];

  // Create main claim node at bottom, centered horizontally
  console.log("Creating main claim...");
  const mainClaimData: ClaimData = {
    title: "Community Mapping Initiative Undertaken",
    shortDescription: "A comprehensive community mapping initiative was undertaken for the Nalubaaga Valley wetlands, involving participatory workshops, multiple technical surveys, community assessments, and the production of community-generated maps documenting biodiversity, land use, land cover, threats, restoration desires, and beneficiary characteristics.",
    evidenceCID: [],
    validationCID: [],
    createdAt: new Date().toISOString(),
  };

  // Center the claim horizontally based on evidence nodes
  const totalEvidenceWidth = sortedEvidenceFiles.length * EVIDENCE_SPACING;
  const claimX = startEvidenceX + (sortedEvidenceFiles.length - 1) * EVIDENCE_SPACING / 2;

  const mainClaimNode = await createClaimNode(projectId, mainClaimData, {
    x: claimX,
    y: CLAIM_Y,
  });

  // No validation nodes to link - user will create them manually
  console.log("  ✓ Main Claim created (no validation nodes - to be added manually)\n");

  console.log(`  ✓ Main Claim: ${mainClaimData.title}\n`);

  // Count total evidence nodes
  const totalEvidenceNodes = await prisma.node.count({
    where: {
      projectId,
      type: "evidence",
    },
  });

  console.log("Import complete!");
  console.log(`\nProject ID: ${projectId}`);
  console.log(`View at: http://localhost:3000/projects/${projectId}`);
  console.log("\nSummary:");
  console.log(`  - Main Claim: 1`);
  console.log(`  - Validation Nodes: ${validationNodes.length}`);
  console.log(`  - Evidence Nodes: ${totalEvidenceNodes}`);
  console.log(`  - Total Nodes: ${1 + validationNodes.length + totalEvidenceNodes}`);
}

main()
  .catch((error) => {
    console.error("Import failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

