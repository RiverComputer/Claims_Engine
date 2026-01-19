import "dotenv/config";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { randomUUID } from "crypto";
import { mkdirSync, writeFileSync, readdirSync, readFileSync, copyFileSync } from "fs";
import { join, extname, basename } from "path";
import { spawnSync } from "child_process";
import heicConvert from "heic-convert";

const UPLOADS_DIR = join(process.cwd(), "uploads");
const CACHE_ROOT = join(process.cwd(), ".cache", "imports");

function ensureDir(dirPath: string) {
  mkdirSync(dirPath, { recursive: true });
}

function normalizeDriveUrl(urlString: string) {
  try {
    const url = new URL(urlString);
    if (url.hostname.includes("drive.google.com")) {
      const match = url.pathname.match(/\/file\/d\/([^/]+)/);
      if (match?.[1]) {
        return `https://drive.google.com/uc?export=download&id=${match[1]}`;
      }
      const idParam = url.searchParams.get("id");
      if (idParam) {
        return `https://drive.google.com/uc?export=download&id=${idParam}`;
      }
    }
  } catch {
    // fall through
  }
  return urlString;
}

function findFilesRecursive(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFilesRecursive(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

function toTitle(filename: string) {
  return basename(filename, extname(filename))
    .replace(/[_-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

async function convertHeicToJpegBuffer(filePath: string) {
  const inputBuffer = readFileSync(filePath);
  return heicConvert({
    buffer: inputBuffer,
    format: "JPEG",
    quality: 0.85,
  }) as Promise<Buffer>;
}

async function downloadDriveZip(urlString: string): Promise<Buffer> {
  const initial = await fetch(urlString, {
    headers: {
      "User-Agent": "Mozilla/5.0 (ClaimsEngine Importer)",
    },
  });

  if (!initial.ok) {
    throw new Error(`Download failed with status ${initial.status}`);
  }

  const contentType = initial.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return Buffer.from(await initial.arrayBuffer());
  }

  const html = await initial.text();
  const cookie = initial.headers.get("set-cookie") || "";
  const confirmMatch = html.match(/confirm=([0-9A-Za-z-_]+)/);
  const confirmInput = html.match(/name="confirm"\s+value="([^"]+)"/);
  const uuidInput = html.match(/name="uuid"\s+value="([^"]+)"/);
  const idInput = html.match(/name="id"\s+value="([^"]+)"/);
  const exportInput = html.match(/name="export"\s+value="([^"]+)"/);
  const actionMatch = html.match(/<form[^>]+action="([^"]+)"/);
  const linkMatch =
    html.match(/href="(\/uc\?export=download[^"]+)"/) ||
    html.match(/href="(https:\/\/drive\.google\.com\/uc\?export=download[^"]+)"/);

  if (!confirmMatch?.[1] && !confirmInput?.[1] && !linkMatch?.[1] && !actionMatch?.[1]) {
    throw new Error("Drive download requires confirmation or is not a ZIP.");
  }

  let downloadUrl: string;
  if (linkMatch?.[1]) {
    downloadUrl = linkMatch[1].startsWith("http")
      ? linkMatch[1]
      : `https://drive.google.com${linkMatch[1]}`;
  } else if (actionMatch?.[1]) {
    const actionUrl = new URL(actionMatch[1]);
    if (idInput?.[1]) actionUrl.searchParams.set("id", idInput[1]);
    if (exportInput?.[1]) actionUrl.searchParams.set("export", exportInput[1]);
    if (confirmInput?.[1]) actionUrl.searchParams.set("confirm", confirmInput[1]);
    if (uuidInput?.[1]) actionUrl.searchParams.set("uuid", uuidInput[1]);
    downloadUrl = actionUrl.toString();
  } else {
    const confirmToken = confirmMatch?.[1];
    const url = new URL(urlString);
    const token = confirmInput?.[1] || confirmToken;
    const uuid = uuidInput?.[1];
    const id = idInput?.[1];
    if (token) {
      url.searchParams.set("confirm", token);
    }
    if (uuid) {
      url.searchParams.set("uuid", uuid);
    }
    if (id) {
      url.searchParams.set("id", id);
    }
    downloadUrl = url.toString();
  }

  const retry = await fetch(downloadUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (ClaimsEngine Importer)",
      ...(cookie ? { Cookie: cookie } : {}),
    },
  });

  if (!retry.ok) {
    throw new Error(`Download failed with status ${retry.status}`);
  }

  return Buffer.from(await retry.arrayBuffer());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, url, description } = body || {};

    if (!title || !url) {
      return NextResponse.json(
        { error: "title and url are required" },
        { status: 400 }
      );
    }

    ensureDir(UPLOADS_DIR);
    ensureDir(CACHE_ROOT);

    const project = await prisma.project.create({
      data: {
        title,
        description: description || "Imported from Drive",
        ownerUserId: "guest",
      },
    });

    const importId = randomUUID();
    const importDir = join(CACHE_ROOT, importId);
    const archivePath = join(importDir, "bundle.zip");
    const extractDir = join(importDir, "extracted");
    ensureDir(importDir);
    ensureDir(extractDir);

    const normalizedUrl = normalizeDriveUrl(url);
    const archiveBuffer = await downloadDriveZip(normalizedUrl);
    writeFileSync(archivePath, archiveBuffer);
    const unzipResult = spawnSync("unzip", ["-q", "-o", archivePath, "-d", extractDir], {
      stdio: "pipe",
    });
    if (unzipResult.status !== 0) {
      const stderr = unzipResult.stderr?.toString() || "";
      return NextResponse.json(
        { error: "Failed to unzip archive. Ensure the URL is a ZIP file.", details: stderr },
        { status: 400 }
      );
    }

    const allFiles = findFilesRecursive(extractDir);
    const imageFiles = allFiles.filter((file) =>
      /\.(png|jpg|jpeg|gif|webp|heic|heif)$/i.test(file)
    );

    if (imageFiles.length === 0) {
      return NextResponse.json(
        { error: "No image files found in the archive." },
        { status: 400 }
      );
    }

    const nodesPerRow = 5;
    const nodeSpacing = 250;
    const startX = -500;
    const startY = -300;

    for (let i = 0; i < imageFiles.length; i++) {
      const filePath = imageFiles[i];
      const ext = extname(filePath).toLowerCase();
      const fileId = randomUUID();
      const isHeic = ext === ".heic" || ext === ".heif";
      const destExt = isHeic ? ".jpg" : ext;
      const destFilename = `${fileId}${destExt}`;
      const destPath = join(UPLOADS_DIR, destFilename);

      if (isHeic) {
        const jpegBuffer = await convertHeicToJpegBuffer(filePath);
        writeFileSync(destPath, jpegBuffer);
      } else {
        copyFileSync(filePath, destPath);
      }

      const title = toTitle(filePath);

      const row = Math.floor(i / nodesPerRow);
      const col = i % nodesPerRow;
      const positionX = startX + col * nodeSpacing;
      const positionY = startY + row * nodeSpacing;

      const data = {
        title,
        content: `Evidence file: ${basename(filePath)}`,
        shortDescription: `Imported from Drive: ${basename(filePath)}`,
        fileRef: `/api/files/${fileId}`,
        createdAt: new Date().toISOString(),
      };

      await prisma.node.create({
        data: {
          projectId: project.id,
          type: "evidence",
          positionX,
          positionY,
          data: JSON.stringify(data),
          status: "draft",
        },
      });
    }

    return NextResponse.json({
      projectId: project.id,
      imported: imageFiles.length,
    });
  } catch (error: any) {
    console.error("Error importing project:", error);
    return NextResponse.json(
      { error: "Failed to import project", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

