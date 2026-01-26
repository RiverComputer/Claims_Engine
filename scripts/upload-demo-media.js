const { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } = require("fs");
const { basename, extname, join, resolve } = require("path");
const { randomUUID } = require("crypto");
const heicConvert = require("heic-convert");
const { createCanvas, loadImage } = require("canvas");

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".heic",
  ".heif",
]);

const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

function collectImages(dir, results = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      collectImages(fullPath, results);
    } else if (stats.isFile()) {
      const ext = extname(entry).toLowerCase();
      if (IMAGE_EXTENSIONS.has(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const pairs = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--project") {
      const project = args[i + 1];
      const dirFlag = args[i + 2];
      const dir = args[i + 3];
      if (!project || dirFlag !== "--dir" || !dir) {
        throw new Error("Usage: --project <name> --dir <path> (repeat)");
      }
      pairs.push({ project, dir });
      i += 3;
    }
  }
  if (!pairs.length) {
    throw new Error("No project/dir pairs provided.");
  }
  return pairs;
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function convertHeic(buffer) {
  return heicConvert({
    buffer,
    format: "JPEG",
    quality: 0.85,
  });
}

async function createThumbnail(buffer) {
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

async function main() {
  const { put } = await import("@vercel/blob");
  const pairs = parseArgs();
  const outputPath = resolve("prisma/seed/demo_media.json");
  const mediaMap = {};

  for (const { project, dir } of pairs) {
    const absDir = resolve(dir);
    const files = collectImages(absDir).sort();
    if (!files.length) {
      console.warn(`[demo-media] No images found for "${project}" in ${absDir}`);
      mediaMap[project] = [];
      continue;
    }

    console.log(`[demo-media] Uploading ${files.length} images for "${project}"...`);
    const entries = [];
    const prefix = `uploads/demo/${slugify(project)}`;
    for (const filePath of files) {
      const original = readFileSync(filePath);
      const ext = extname(filePath).toLowerCase();
      let buffer = original;
      let outExt = ext || ".jpg";
      let contentType = CONTENT_TYPES[ext] || "application/octet-stream";

      if (ext === ".heic" || ext === ".heif") {
        buffer = await convertHeic(original);
        outExt = ".jpg";
        contentType = "image/jpeg";
      }

      const fileId = randomUUID();
      const blob = await put(`${prefix}/${fileId}${outExt}`, buffer, {
        access: "public",
        contentType,
      });

      const thumbBuffer = await createThumbnail(buffer);
      const thumbBlob = await put(`${prefix}/${fileId}_thumb.jpg`, thumbBuffer, {
        access: "public",
        contentType: "image/jpeg",
      });

      entries.push({
        filename: basename(filePath),
        fileRef: blob.url,
        thumbnailRef: thumbBlob.url,
      });
    }

    mediaMap[project] = entries;
    console.log(`[demo-media] Finished "${project}" (${entries.length})`);
  }

  mkdirSync(join(outputPath, ".."), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(mediaMap, null, 2));
  console.log(`[demo-media] Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error("[demo-media] Failed:", error);
  process.exit(1);
});

