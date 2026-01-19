import { randomUUID } from "crypto";
import { join, extname } from "path";
import { mkdirSync, writeFileSync } from "fs";
import { createCanvas, loadImage } from "canvas";
import heicConvert from "heic-convert";
import { put, list } from "@vercel/blob";

const UPLOADS_DIR = join(process.cwd(), "uploads");
const BLOB_ENABLED = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif"]);

function ensureUploadsDir() {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

async function convertHeicToJpeg(buffer: Buffer) {
  return heicConvert({
    buffer,
    format: "JPEG",
    quality: 0.85,
  }) as Promise<Buffer>;
}

async function createThumbnail(buffer: Buffer) {
  const image = await loadImage(buffer);
  const maxWidth = 400;
  const maxHeight = 300;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, width, height);
  return canvas.toBuffer("image/jpeg", { quality: 0.75 });
}

function guessContentType(filename: string, fallback: string) {
  const ext = extname(filename).toLowerCase();
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".heic": "image/heic",
    ".heif": "image/heif",
    ".pdf": "application/pdf",
  };
  return map[ext] || fallback || "application/octet-stream";
}

export async function storeFile({
  buffer,
  filename,
  contentType,
  id,
}: {
  buffer: Buffer;
  filename: string;
  contentType?: string;
  id?: string;
}) {
  const fileId = id || randomUUID();
  let ext = extname(filename) || "";
  let dataBuffer = buffer;
  let resolvedContentType = contentType || guessContentType(filename, contentType || "");

  if (ext && IMAGE_EXTENSIONS.has(ext.toLowerCase()) && (ext === ".heic" || ext === ".heif")) {
    dataBuffer = await convertHeicToJpeg(buffer);
    ext = ".jpg";
    resolvedContentType = "image/jpeg";
  }

  let fileRef: string;
  let thumbRef: string | undefined;

  if (BLOB_ENABLED) {
    const blob = await put(`uploads/${fileId}${ext}`, dataBuffer, {
      access: "public",
      contentType: resolvedContentType,
    });
    fileRef = blob.url;

    if (resolvedContentType.startsWith("image/")) {
      const thumbBuffer = await createThumbnail(dataBuffer);
      const thumbBlob = await put(`uploads/${fileId}_thumb.jpg`, thumbBuffer, {
        access: "public",
        contentType: "image/jpeg",
      });
      thumbRef = thumbBlob.url;
    }
  } else {
    ensureUploadsDir();
    const localPath = join(UPLOADS_DIR, `${fileId}${ext}`);
    writeFileSync(localPath, dataBuffer);
    fileRef = `/api/files/${fileId}`;
    if (resolvedContentType.startsWith("image/")) {
      thumbRef = `/api/files/${fileId}?thumb=1`;
    }
  }

  return {
    id: fileId,
    fileRef,
    thumbRef,
    contentType: resolvedContentType,
  };
}

export async function resolveBlobUrlById(id: string, thumb: boolean = false) {
  if (!BLOB_ENABLED) return null;
  const prefix = thumb ? `uploads/${id}_thumb` : `uploads/${id}`;
  const result = await list({ prefix, limit: 1 });
  return result.blobs?.[0]?.url || null;
}

