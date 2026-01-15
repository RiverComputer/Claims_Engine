/**
 * Import script for The Conference of Landstewards
 * Creates a project and evidence nodes from all assets in the directory
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { prisma } from "../lib/db/client";
import { EvidenceData } from "../lib/types/graph";
import { copyFile, readFile } from "fs/promises";
import { randomUUID } from "crypto";
import { generatePdfThumbnail, generateExcelThumbnail } from "../lib/utils/thumbnail-generator";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const RAW_DATA_DIR = path.join(process.cwd(), "..", "pilot-project", "raw-data", "Events  2", "Conference of Landstewards");

async function ensureUploadsDir() {
  try {
    await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
    console.log("✓ Uploads directory ready");
  } catch (error) {
    console.error("Error creating uploads directory:", error);
    throw error;
  }
}

async function copyFileToUploads(sourcePath: string, filename: string): Promise<{ fileRef: string; dataUrl?: string }> {
  const fileId = randomUUID();
  const ext = path.extname(filename);
  const destFilename = `${fileId}${ext}`;
  const destPath = path.join(UPLOADS_DIR, destFilename);

  try {
    await copyFile(sourcePath, destPath);
    console.log(`  ✓ Copied: ${filename} -> ${destFilename}`);
    const fileRef = `/api/files/${fileId}`;
    
    let dataUrl: string | undefined;
    
    // Check file type and generate appropriate thumbnail
    const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(filename);
    const isPdf = /\.pdf$/i.test(filename);
    const isExcel = /\.(xlsx|xls)$/i.test(filename);
    
    if (isImage) {
      // For images, create data URL directly
      try {
        const fileBuffer = await readFile(sourcePath);
        const mimeType = ext === '.png' ? 'image/png' :
                         ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                         ext === '.gif' ? 'image/gif' :
                         ext === '.webp' ? 'image/webp' : 'image/png';
        dataUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
      } catch (error) {
        console.warn(`  ⚠ Could not create data URL for ${filename}:`, error);
      }
    } else if (isPdf) {
      // For PDFs, generate thumbnail from first page
      try {
        dataUrl = await generatePdfThumbnail(sourcePath);
        if (dataUrl) {
          console.log(`  ✓ Generated PDF thumbnail for ${filename}`);
        }
      } catch (error) {
        console.warn(`  ⚠ Could not generate PDF thumbnail for ${filename}:`, error);
      }
    } else if (isExcel) {
      // For Excel files, generate thumbnail from first sheet
      try {
        dataUrl = await generateExcelThumbnail(sourcePath);
        if (dataUrl) {
          console.log(`  ✓ Generated Excel thumbnail for ${filename}`);
        }
      } catch (error) {
        console.warn(`  ⚠ Could not generate Excel thumbnail for ${filename}:`, error);
      }
    }
    
    return { fileRef, dataUrl };
  } catch (error) {
    console.error(`  ✗ Error copying ${filename}:`, error);
    throw error;
  }
}

async function createEvidenceNode(
  projectId: string,
  data: EvidenceData,
  position: { x: number; y: number }
): Promise<string> {
  const node = await prisma.node.create({
    data: {
      projectId,
      type: "evidence",
      positionX: position.x,
      positionY: position.y,
      data: JSON.stringify(data),
      status: "draft",
    },
  });
  return node.id;
}

async function getAllFiles(dir: string, baseDir: string = dir): Promise<Array<{ path: string; relativePath: string }>> {
  const files: Array<{ path: string; relativePath: string }> = [];
  
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);
      
      if (entry.isDirectory()) {
        // Recursively get files from subdirectories
        const subFiles = await getAllFiles(fullPath, baseDir);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        files.push({ path: fullPath, relativePath });
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return files;
}

function getFileType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) return "image";
  if ([".pdf"].includes(ext)) return "document";
  if ([".docx", ".doc"].includes(ext)) return "document";
  if ([".xlsx", ".xls"].includes(ext)) return "spreadsheet";
  return "file";
}

function generateTitleFromFilename(filename: string): string {
  // Remove extension and clean up the filename
  const name = path.basename(filename, path.extname(filename));
  // Replace underscores and hyphens with spaces, capitalize words
  return name
    .replace(/[_-]/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

async function main() {
  console.log("🚀 Starting import for The Conference of Landstewards\n");

  // Ensure uploads directory exists
  await ensureUploadsDir();

  // Check if project already exists
  let project = await prisma.project.findFirst({
    where: { title: "The Conference of Landstewards" },
  });

  if (project) {
    console.log("⚠️  Project already exists. Deleting existing nodes and edges...");
    // Delete all existing nodes and edges for this project
    await prisma.edge.deleteMany({ where: { projectId: project.id } });
    await prisma.node.deleteMany({ where: { projectId: project.id } });
    console.log("✓ Cleaned up existing data\n");
  } else {
    // Create project
    project = await prisma.project.create({
      data: {
        title: "The Conference of Landstewards",
        description: "Evidence and documentation from The Conference of Landstewards event",
        ownerUserId: "guest",
      },
    });
    console.log(`✓ Created project: ${project.id}\n`);
  }

  // Get all files from the directory
  console.log("📁 Scanning for files...");
  const allFiles = await getAllFiles(RAW_DATA_DIR);
  console.log(`✓ Found ${allFiles.length} files\n`);

  if (allFiles.length === 0) {
    console.log("⚠️  No files found. Exiting.");
    return;
  }

  // Create evidence nodes for each file
  console.log("📝 Creating evidence nodes...\n");
  const evidenceNodes: Array<{ id: string; title: string; fileType: string }> = [];
  
  // Layout nodes in a grid
  const nodesPerRow = 5;
  const nodeSpacing = 250;
  const startX = -500;
  const startY = -300;

  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const filename = path.basename(file.path);
    const fileType = getFileType(filename);
    
    console.log(`Processing [${i + 1}/${allFiles.length}]: ${filename}`);

    try {
      // Copy file to uploads directory
      const { fileRef, dataUrl } = await copyFileToUploads(file.path, filename);

      // Generate title from filename
      const title = generateTitleFromFilename(filename);

      // Create evidence data
      const evidenceData: EvidenceData = {
        title,
        content: dataUrl || `Evidence file: ${filename}`, // Use data URL for images, fallback to text
        shortDescription: `Documentation from The Conference of Landstewards: ${filename}`,
        fileRef,
        createdAt: new Date().toISOString(),
      };

      // Calculate position in grid
      const row = Math.floor(i / nodesPerRow);
      const col = i % nodesPerRow;
      const position = {
        x: startX + col * nodeSpacing,
        y: startY + row * nodeSpacing,
      };

      // Create node
      const nodeId = await createEvidenceNode(project.id, evidenceData, position);
      evidenceNodes.push({ id: nodeId, title, fileType });
      console.log(`  ✓ Created evidence node: ${title}\n`);
    } catch (error) {
      console.error(`  ✗ Error processing ${filename}:`, error);
      console.log("");
    }
  }

  console.log("\n✅ Import complete!");
  console.log(`   Project ID: ${project.id}`);
  console.log(`   Evidence nodes created: ${evidenceNodes.length}`);
  console.log(`\n   Access at: http://localhost:3000/projects/${project.id}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

